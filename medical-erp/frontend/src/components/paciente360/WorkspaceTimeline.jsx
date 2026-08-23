import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { consultasService } from '../../services/consultasService';
import { tratamientoService } from '../../services/tratamientoService';
import { pacienteConsentimientoService } from '../../services/pacienteSubServices';
import agendaService from '../../services/agendaService';
import { recetaService } from '../../services/recetaService';

function formatFecha(fecha) {
  if (!fecha) return '';
  return new Date(fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function WorkspaceTimeline({ pacienteId }) {
  const { t } = useTranslation('patients');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  function getRelativeTime(fecha) {
    if (!fecha) return '';
    const now = new Date();
    const date = new Date(fecha);
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return t('ahora', { ns: 'patients' });
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHrs < 24) return `${diffHrs}h`;
    if (diffDays === 1) return t('ayer');
    if (diffDays < 7) return `${diffDays}d`;
    return formatFecha(fecha);
  }

  useEffect(() => {
    loadTimeline();
  }, [pacienteId]);

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

      const allEvents = [];

      if (consultasRes.status === 'fulfilled' && consultasRes.value?.data) {
        const consultas = Array.isArray(consultasRes.value.data)
          ? consultasRes.value.data
          : consultasRes.value.data?.content || [];
        consultas.forEach((c) => {
          allEvents.push({
            id: `consulta-${c.id}`,
            type: 'consulta',
            fecha: c.fecha || c.createdAt,
            label: t('consultas'),
            detail: c.motivo || '',
          });
        });
      }

      if (tratamientosRes.status === 'fulfilled' && tratamientosRes.value?.data) {
        const tratamientos = Array.isArray(tratamientosRes.value.data)
          ? tratamientosRes.value.data
          : [];
        tratamientos.forEach((t) => {
          allEvents.push({
            id: `tratamiento-${t.id}`,
            type: 'tratamiento',
            fecha: t.createdAt,
            label: t('tratamiento'),
            detail: t.procedimientoRealizado || '',
          });
        });
      }

      if (consentRes.status === 'fulfilled' && consentRes.value?.data) {
        const consentimientos = Array.isArray(consentRes.value.data)
          ? consentRes.value.data
          : [];
        consentimientos.forEach((c) => {
          allEvents.push({
            id: `consent-${c.id}`,
            type: 'consentimiento',
            fecha: c.fecha || c.createdAt,
            label: `${t('consentimientos')}: ${c.tipo || 'Trámite'}`,
            detail: c.aceptado ? t('aceptado_label') : t('pendiente_aceptacion'),
          });
        });
      }

      if (citasRes.status === 'fulfilled' && citasRes.value?.data) {
        const citas = Array.isArray(citasRes.value.data)
          ? citasRes.value.data
          : [];
        citas.forEach((c) => {
          const parts = [];
          if (c.tipoCitaNombre) parts.push(c.tipoCitaNombre);
          if (c.motivo) parts.push(c.motivo);
          if (c.usuarioNombre) parts.push(`Dr(a). ${c.usuarioNombre}`);
          allEvents.push({
            id: `cita-${c.id}`,
            type: 'cita',
            fecha: c.fechaHora || c.createdAt,
            label: t('buscar_cita'),
            detail: parts.join(' · ') || t('consulta_registrada'),
          });
        });
      }

      if (recetasRes.status === 'fulfilled' && recetasRes.value?.data) {
        const recetas = Array.isArray(recetasRes.value.data)
          ? recetasRes.value.data
          : [];
        recetas.forEach((r) => {
          allEvents.push({
            id: `receta-${r.id}`,
            type: 'receta',
            fecha: r.createdAt,
            label: t('recetas_medicas'),
            detail: r.medicamentos || r.indicaciones || t('indicaciones'),
          });
        });
      }

      allEvents.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
      setEvents(allEvents.slice(0, 10));
    } catch (err) {
      console.error('Error loading timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workspace__timeline">
      <div className="workspace-timeline">
        <h3 className="workspace-timeline__title">{t('linea_tiempo')}</h3>

        {loading ? (
          <div className="workspace-timeline__empty">
            <Clock size={16} className="spinner" />
            <span>{t('loading', { ns: 'common' })}</span>
          </div>
        ) : events.length === 0 ? (
          <div className="workspace-timeline__empty">{t('sin_eventos')}</div>
        ) : (
          <>
            <div className="workspace-timeline__list">
              {events.map((event, idx) => (
                <div key={event.id} className="workspace-timeline__item">
                  <div
                    className={`workspace-timeline__dot workspace-timeline__dot--${event.type} ${idx === 0 ? 'workspace-timeline__dot--first' : ''}`}
                  />
                  <div className="workspace-timeline__info">
                    <div className="workspace-timeline__row">
                      <span className="workspace-timeline__label">{event.label}</span>
                      <span className="workspace-timeline__time">{getRelativeTime(event.fecha)}</span>
                    </div>
                    {event.detail && (
                      <span className="workspace-timeline__detail">{event.detail}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              className="workspace-timeline__link"
              onClick={() => navigate(`/pacientes/${pacienteId}/detalle`, { state: { tab: 'timeline' } })}
            >
              {t('ver_linea_completa')}
              <ArrowRight size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
