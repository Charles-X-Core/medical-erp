import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Clock, Calendar, Activity, Shield, Pill, FileText, Stethoscope,
} from 'lucide-react';
import { consultasService } from '../../services/consultasService';
import { tratamientoService } from '../../services/tratamientoService';
import { pacienteConsentimientoService } from '../../services/pacienteSubServices';
import agendaService from '../../services/agendaService';
import { recetaService } from '../../services/recetaService';

function formatFecha(fecha) {
  if (!fecha) return '';
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatFechaCorta(fecha) {
  if (! fecha) return '';
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function TabTimeline({ pacienteId }) {
  const { t } = useTranslation('patients');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState(
    new Set(['consulta', 'tratamiento', 'consentimiento', 'cita', 'receta'])
  );

  const EVENT_CONFIG = useMemo(() => ({
    consulta: { icon: Calendar, color: 'consulta', label: t('consultas') },
    tratamiento: { icon: Activity, color: 'tratamiento', label: t('tratamiento') },
    consentimiento: { icon: Shield, color: 'consentimiento', label: t('consentimientos') },
    cita: { icon: Clock, color: 'cita', label: t('buscar_cita') },
    receta: { icon: Pill, color: 'receta', label: t('recetas_medicas') },
  }), [t]);

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

    if (diffMin < 1) return t('ahora_mismo', { ns: 'patients' });
    if (diffMin < 60) return `${t('hace', { ns: 'patients' })} ${diffMin} min`;
    if (diffHrs < 24) return `${t('hace', { ns: 'patients' })} ${diffHrs}h`;
    if (diffDays === 1) return t('ayer');
    if (diffDays < 7) return `${t('hace', { ns: 'patients' })} ${diffDays} ${t('dias', { ns: 'patients' })}`;
    if (diffWeeks < 4) return `${t('hace', { ns: 'patients' })} ${diffWeeks} ${t('semanas', { ns: 'patients' })}`;
    if (diffMonths < 12) return `${t('hace', { ns: 'patients' })} ${diffMonths} ${t('meses', { ns: 'patients' })}`;
    return formatFechaCorta(fecha);
  }

  function getDateGroup(fecha) {
    if (!fecha) return t('sin_fecha');
    const now = new Date();
    const date = new Date(fecha);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    if (date >= today) return t('hoy');
    if (date >= yesterday) return t('ayer');
    if (date >= weekAgo) return t('esta_semana');
    if (date >= monthAgo) return t('este_mes');
    return t('anteriores');
  }

  const GROUP_ORDER = useMemo(() => [
    t('hoy'), t('ayer'), t('esta_semana'), t('este_mes'), t('anteriores'), t('sin_fecha')
  ], [t]);

  function getConsultaDetail(c) {
    const parts = [];
    if (c.motivo) parts.push(c.motivo);
    if (c.diagnosticoLista?.length) {
      const diags = c.diagnosticoLista.map((d) => d.descripcion || d).join(', ');
      parts.push(`DX: ${diags}`);
    }
    return parts.join(' · ') || t('consulta_registrada');
  }

  function getTratamientoDetail(t) {
    const parts = [];
    if (t.procedimientoRealizado) parts.push(t.procedimientoRealizado);
    if (t.costoTotal > 0) parts.push(`$${t.costoTotal.toFixed(2)}`);
    if (t.estado) parts.push(t.estado.replace('_', ' ').toLowerCase());
    return parts.join(' · ') || t('tratamiento_creado');
  }

  function getTratamientoBadge(estado) {
    const map = {
      REALIZADO: { label: t('sesion_completada'), variant: 'active' },
      PLANIFICADO: { label: t('plan_ampliado'), variant: 'pending' },
      EN_CURSO: { label: t('active', { ns: 'common' }), variant: 'active' },
      FINALIZADO: { label: t('finalizado', { ns: 'patients' }), variant: 'active' },
      CANCELADO: { label: t('cancelled', { ns: 'common' }), variant: 'muted' },
      PAUSADO: { label: t('pausado', { ns: 'patients' }), variant: 'pending' },
    };
    return map[estado] || { label: estado?.replace('_', ' ') || '', variant: 'pending' };
  }

  function getCitaBadge(estado) {
    const map = {
      pendiente: { label: t('pending', { ns: 'common' }), variant: 'pending' },
      confirmada: { label: t('confirmada', { ns: 'patients' }), variant: 'active' },
      asistio: { label: t('asistio', { ns: 'patients' }), variant: 'active' },
      completada: { label: t('completed', { ns: 'common' }), variant: 'active' },
      cancelada: { label: t('cancelled', { ns: 'common' }), variant: 'muted' },
    };
    return map[estado] || { label: estado || '', variant: 'pending' };
  }

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

      if (consultasRes.status === 'fulfilled' && consultasRes.value?.data) {
        const list = Array.isArray(consultasRes.value.data)
          ? consultasRes.value.data
          : consultasRes.value.data?.content || [];
        list.forEach((c) => {
          all.push({
            id: `consulta-${c.id}`,
            type: 'consulta',
            fecha: c.fecha || c.createdAt,
            label: t('consultas'),
            detail: getConsultaDetail(c),
            badge: null,
          });
        });
      }

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
            label: t('tratamiento'),
            detail: getTratamientoDetail(t),
            badge,
          });
        });
      }

      if (consentRes.status === 'fulfilled' && consentRes.value?.data) {
        const list = Array.isArray(consentRes.value.data)
          ? consentRes.value.data
          : [];
        list.forEach((c) => {
          all.push({
            id: `consent-${c.id}`,
            type: 'consentimiento',
            fecha: c.fecha || c.createdAt,
            label: `${t('consentimientos')}: ${c.tipo || 'Trámite'}`,
            detail: c.aceptado ? t('aceptado_label') : t('pendiente_aceptacion'),
            badge: {
              label: c.aceptado ? t('aceptado_label') : t('pending', { ns: 'common' }),
              variant: c.aceptado ? 'active' : 'pending',
            },
          });
        });
      }

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
            label: t('buscar_cita'),
            detail: parts.join(' · ') || t('consulta_registrada'),
            badge,
          });
        });
      }

      if (recetasRes.status === 'fulfilled' && recetasRes.value?.data) {
        const list = Array.isArray(recetasRes.value.data)
          ? recetasRes.value.data
          : [];
        list.forEach((r) => {
          all.push({
            id: `receta-${r.id}`,
            type: 'receta',
            fecha: r.createdAt,
            label: t('recetas_medicas'),
            detail: r.medicamentos || r.indicaciones || t('indicaciones'),
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
  }, [filteredEvents, GROUP_ORDER]);

  const typeCounts = useMemo(() => {
    const counts = {};
    Object.keys(EVENT_CONFIG).forEach((k) => { counts[k] = 0; });
    events.forEach((e) => { if (counts[e.type] !== undefined) counts[e.type]++; });
    return counts;
  }, [events, EVENT_CONFIG]);

  if (loading) {
    return (
      <div className="tl__loading">
        <Clock size={20} className="spinner" />
        {t('cargando_linea')}
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
          <p>{t('sin_eventos_linea')}</p>
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
