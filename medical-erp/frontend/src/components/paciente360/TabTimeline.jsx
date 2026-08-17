import { useState, useEffect, useMemo } from 'react';
import {
  Clock, Calendar, Activity, Shield, Pill, FileText, Stethoscope,
} from 'lucide-react';
import { consultasService } from '../../services/consultasService';
import { tratamientoService } from '../../services/tratamientoService';
import { pacienteConsentimientoService } from '../../services/pacienteSubServices';
import agendaService from '../../services/agendaService';
import { recetaService } from '../../services/recetaService';

const EVENT_CONFIG = {
  consulta: { icon: Calendar, color: 'consulta', label: 'Consulta' },
  tratamiento: { icon: Activity, color: 'tratamiento', label: 'Tratamiento' },
  consentimiento: { icon: Shield, color: 'consentimiento', label: 'Consentimiento' },
  cita: { icon: Clock, color: 'cita', label: 'Cita' },
  receta: { icon: Pill, color: 'receta', label: 'Receta' },
};

function formatFecha(fecha) {
  if (!fecha) return '';
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatFechaCorta(fecha) {
  if (!fecha) return '';
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function getRelativeTime(fecha) {
  if (!fecha) return '';
  const now = new Date();
  const date = new Date(fecha);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMin < 1) return 'Ahora mismo';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHrs < 24) return `Hace ${diffHrs}h`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffWeeks < 4) return `Hace ${diffWeeks} sem`;
  if (diffMonths < 12) return `Hace ${diffMonths} mes${diffMonths > 1 ? 'es' : ''}`;
  return formatFechaCorta(fecha);
}

function getDateGroup(fecha) {
  if (!fecha) return 'Sin fecha';
  const now = new Date();
  const date = new Date(fecha);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  if (date >= today) return 'Hoy';
  if (date >= yesterday) return 'Ayer';
  if (date >= weekAgo) return 'Esta semana';
  if (date >= monthAgo) return 'Este mes';
  return 'Anteriores';
}

const GROUP_ORDER = ['Hoy', 'Ayer', 'Esta semana', 'Este mes', 'Anteriores', 'Sin fecha'];

function getConsultaDetail(c) {
  const parts = [];
  if (c.motivo) parts.push(c.motivo);
  if (c.diagnosticoLista?.length) {
    const diags = c.diagnosticoLista.map((d) => d.descripcion || d).join(', ');
    parts.push(`DX: ${diags}`);
  }
  return parts.join(' · ') || 'Consulta registrada';
}

function getTratamientoDetail(t) {
  const parts = [];
  if (t.procedimientoRealizado) parts.push(t.procedimientoRealizado);
  if (t.costoTotal > 0) parts.push(`$${t.costoTotal.toFixed(2)}`);
  if (t.estado) parts.push(t.estado.replace('_', ' ').toLowerCase());
  return parts.join(' · ') || 'Tratamiento registrado';
}

function getTratamientoBadge(estado) {
  const map = {
    REALIZADO: { label: 'Realizado', variant: 'active' },
    PLANIFICADO: { label: 'Planificado', variant: 'pending' },
    EN_CURSO: { label: 'En curso', variant: 'active' },
    FINALIZADO: { label: 'Finalizado', variant: 'active' },
    CANCELADO: { label: 'Cancelado', variant: 'muted' },
    PAUSADO: { label: 'Pausado', variant: 'pending' },
  };
  return map[estado] || { label: estado?.replace('_', ' ') || '', variant: 'pending' };
}

function getCitaBadge(estado) {
  const map = {
    pendiente: { label: 'Pendiente', variant: 'pending' },
    confirmada: { label: 'Confirmada', variant: 'active' },
    asistio: { label: 'Asistió', variant: 'active' },
    completada: { label: 'Completada', variant: 'active' },
    cancelada: { label: 'Cancelada', variant: 'muted' },
  };
  return map[estado] || { label: estado || '', variant: 'pending' };
}

export default function TabTimeline({ pacienteId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState(
    new Set(['consulta', 'tratamiento', 'consentimiento', 'cita', 'receta'])
  );

  useEffect(() => { loadTimeline(); }, [pacienteId]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const [consultasRes, tratamientosRes, consentRes, citasRes, recetasRes] =
        await Promise.allSettled([
          pacienteId ? consultasService.getByPaciente(pacienteId) : Promise.resolve({ success: false }),
          pacienteId ? tratamientoService.listByPaciente(pacienteId) : Promise.resolve({ success: false }),
          pacienteId ? pacienteConsentimientoService.list(pacienteId) : Promise.resolve({ success: false }),
          pacienteId ? agendaService.getCitasPorPaciente(pacienteId) : Promise.resolve({ success: false }),
          pacienteId ? recetaService.listByPaciente(pacienteId) : Promise.resolve({ success: false }),
        ]);

      const all = [];

      // ── Consultas ──
      if (consultasRes.status === 'fulfilled' && consultasRes.value?.data) {
        const list = Array.isArray(consultasRes.value.data)
          ? consultasRes.value.data
          : consultasRes.value.data?.content || [];
        list.forEach((c) => {
          all.push({
            id: `consulta-${c.id}`,
            type: 'consulta',
            fecha: c.fecha || c.createdAt,
            label: 'Consulta',
            detail: getConsultaDetail(c),
            badge: null,
          });
        });
      }

      // ── Tratamientos ──
      if (tratamientosRes.status === 'fulfilled' && tratamientosRes.value?.data) {
        const list = Array.isArray(tratamientosRes.value.data)
          ? tratamientosRes.value.data
          : [];
        list.forEach((t) => {
          const badge = getTratamientoBadge(t.estado);
          all.push({
            id: `tratamiento-${t.id}`,
            type: 'tratamiento',
            fecha: t.createdAt,
            label: 'Tratamiento',
            detail: getTratamientoDetail(t),
            badge,
          });
        });
      }

      // ── Consentimientos ──
      if (consentRes.status === 'fulfilled' && consentRes.value?.data) {
        const list = Array.isArray(consentRes.value.data)
          ? consentRes.value.data
          : [];
        list.forEach((c) => {
          all.push({
            id: `consent-${c.id}`,
            type: 'consentimiento',
            fecha: c.fecha || c.createdAt,
            label: `Consentimiento: ${c.tipo || 'Trámite'}`,
            detail: c.aceptado ? 'Aceptado' : 'Pendiente de aceptación',
            badge: {
              label: c.aceptado ? 'Aceptado' : 'Pendiente',
              variant: c.aceptado ? 'active' : 'pending',
            },
          });
        });
      }

      // ── Citas ──
      if (citasRes.status === 'fulfilled' && citasRes.value?.data) {
        const list = Array.isArray(citasRes.value.data)
          ? citasRes.value.data
          : [];
        list.forEach((c) => {
          const badge = getCitaBadge(c.estado);
          const parts = [];
          if (c.tipoCitaNombre) parts.push(c.tipoCitaNombre);
          if (c.motivo) parts.push(c.motivo);
          if (c.usuarioNombre) parts.push(`Dr(a). ${c.usuarioNombre}`);
          all.push({
            id: `cita-${c.id}`,
            type: 'cita',
            fecha: c.fechaHora || c.createdAt,
            label: 'Cita',
            detail: parts.join(' · ') || 'Cita registrada',
            badge,
          });
        });
      }

      // ── Recetas ──
      if (recetasRes.status === 'fulfilled' && recetasRes.value?.data) {
        const list = Array.isArray(recetasRes.value.data)
          ? recetasRes.value.data
          : [];
        list.forEach((r) => {
          all.push({
            id: `receta-${r.id}`,
            type: 'receta',
            fecha: r.createdAt,
            label: 'Receta',
            detail: r.medicamentos || r.indicaciones || 'Receta emitida',
            badge: null,
          });
        });
      }

      all.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
      setEvents(all);
    } catch (err) {
      console.error('Error loading timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (type) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const filteredEvents = useMemo(
    () => events.filter((e) => activeFilters.has(e.type)),
    [events, activeFilters]
  );

  const groupedEvents = useMemo(() => {
    const groups = {};
    filteredEvents.forEach((event) => {
      const group = getDateGroup(event.fecha);
      if (!groups[group]) groups[group] = [];
      groups[group].push(event);
    });
    return GROUP_ORDER
      .filter((g) => groups[g]?.length)
      .map((g) => ({ label: g, events: groups[g] }));
  }, [filteredEvents]);

  const typeCounts = useMemo(() => {
    const counts = {};
    Object.keys(EVENT_CONFIG).forEach((k) => { counts[k] = 0; });
    events.forEach((e) => { if (counts[e.type] !== undefined) counts[e.type]++; });
    return counts;
  }, [events]);

  if (loading) {
    return (
      <div className="tl__loading">
        <Clock size={20} className="spinner" />
        Cargando línea de tiempo...
      </div>
    );
  }

  return (
    <div className="tl">
      {/* ── Filter Chips ── */}
      <div className="tl__filters">
        {Object.entries(EVENT_CONFIG).map(([type, cfg]) => {
          const Icon = cfg.icon;
          const count = typeCounts[type] || 0;
          return (
            <button
              key={type}
              className={`tl__chip ${activeFilters.has(type) ? 'tl__chip--active' : ''}`}
              onClick={() => toggleFilter(type)}
            >
              <Icon size={14} />
              {cfg.label}
              <span className="tl__chip-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Timeline ── */}
      {filteredEvents.length === 0 ? (
        <div className="tl__empty">
          <Clock size={48} />
          <p>No hay eventos en la línea de tiempo</p>
        </div>
      ) : (
        <div className="tl__groups">
          {groupedEvents.map((group) => (
            <div key={group.label} className="tl__group">
              <div className="tl__group-label">
                {group.label}
                <span className="tl__group-count">({group.events.length})</span>
              </div>

              <div className="tl__events">
                {group.events.map((event, idx) => {
                  const cfg = EVENT_CONFIG[event.type] || EVENT_CONFIG.consulta;
                  const Icon = cfg.icon;
                  return (
                    <div key={event.id} className="tl__event">
                      <div className="tl__line">
                        <div className={`tl__dot tl__dot--${cfg.color} ${idx === 0 ? 'tl__dot--first' : ''}`} />
                        <div className="tl__connector" />
                      </div>

                      <div className="tl__card">
                        <div className="tl__card-header">
                          <div className={`tl__card-icon tl__card-icon--${cfg.color}`}>
                            <Icon size={16} />
                          </div>
                          <span className="tl__card-label">{event.label}</span>
                          {event.badge && (
                            <span className={`tl__card-badge tl__card-badge--${event.badge.variant}`}>
                              {event.badge.label}
                            </span>
                          )}
                          <span className={`tl__card-badge tl__card-badge--${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <div className="tl__card-date">{getRelativeTime(event.fecha)}</div>
                        {event.detail && (
                          <div className="tl__card-detail">{event.detail}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
