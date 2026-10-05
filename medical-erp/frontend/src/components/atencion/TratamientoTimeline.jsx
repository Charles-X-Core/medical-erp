import { useState, useEffect } from 'react';
import { Loader2, Calendar, Activity, CheckCircle, Clock, TrendingUp, AlertTriangle, Play, Pause, XCircle, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { tratamientoService } from '../../services/tratamientoService';
import { parseLADateTime } from '../../utils/laTimezone';
import { zonaIANA } from '../../utils/zonaHoraria';

const EVENT_CONFIG = {
  CREACION: { icon: Play, color: '#3B82F6' },
  CAMBIO_ESTADO: { icon: Activity, color: '#8B5CF6' },
  CAMBIO_SESIONES_PLANEADAS: { icon: TrendingUp, color: '#F59E0B' },
  AMPLIACION_PLAN: { icon: TrendingUp, color: '#F59E0B' },
  REGISTRO_SESION: { icon: CheckCircle, color: '#22C55E' },
  OBSERVACION_CLINICA: { icon: FileText, color: '#3B82F6' },
  CAMBIO_OBJETIVO: { icon: Target, color: '#F59E0B' },
  default: { icon: Clock, color: '#94A3B8' },
};

const ESTADO_CONFIG = {
  PENDIENTE: { color: '#F59E0B', bg: '#FFFBEB' },
  PROGRAMADO: { color: '#3B82F6', bg: '#EFF6FF' },
  EN_CURSO: { color: '#22C55E', bg: '#F0FDF4' },
  PAUSADO: { color: '#F59E0B', bg: '#FFFBEB' },
  FINALIZADO: { color: '#6B7D95', bg: '#E2E8F0' },
  CANCELADO: { color: '#EF4444', bg: '#FEF2F2' },
};

function Target(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className} style={props.style}>
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export default function TratamientoTimeline({ tratamientoId }) {
  const { t } = useTranslation('patients');
  const { t: tDashboard } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');

  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tratamientoId) return;
    loadHistorial();
  }, [tratamientoId]);

  const loadHistorial = async () => {
    setLoading(true);
    try {
      const [clinicoRes, adminRes] = await Promise.all([
        tratamientoService.getHistorialClinico(tratamientoId).catch(() => ({ success: false })),
        tratamientoService.getHistorialAdministrativo(tratamientoId).catch(() => ({ success: false })),
      ]);

      const clinico = (clinicoRes?.success ? clinicoRes.data : []).map(e => ({
        ...e,
        source: 'clinico',
        tipoCambio: e.tipoCambio,
      }));

      const admin = (adminRes?.success ? adminRes.data : []).map(e => ({
        ...e,
        source: 'admin',
        tipoCambio: e.tipoCambio,
      }));

      const merged = [...clinico, ...admin]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setEventos(merged);
    } catch (err) {
      console.error('Error loading historial:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = parseLADateTime(dateStr);
    if (!d) return dateStr;
    return d.toLocaleString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: zonaIANA() });
  };

  const getEventConfig = (evento) => {
    return EVENT_CONFIG[evento.tipoCambio] || EVENT_CONFIG.default;
  };

  const getEventLabel = (evento) => {
    if (evento.tipoCambio === 'CREACION') return t('evento_tratamiento_creado');
    if (evento.tipoCambio === 'CAMBIO_ESTADO') return `${evento.valorAnterior || '?'} → ${evento.valorNuevo || '?'}`;
    if (evento.tipoCambio === 'CAMBIO_SESIONES_PLANEADAS') return `${evento.valorAnterior || '?'} → ${evento.valorNuevo || '?'} ${t('sesiones_label')}`;
    if (evento.tipoCambio === 'AMPLIACION_PLAN') return t('evento_plan_ampliado');
    if (evento.tipoCambio === 'REGISTRO_SESION') return t('evento_sesion_completada');
    if (evento.tipoCambio === 'OBSERVACION_CLINICA') return t('evento_observacion_clinica');
    if (evento.tipoCambio === 'CAMBIO_OBJETIVO') return t('evento_objetivo_actualizado');
    if (evento.campoModificado) {
      return `${evento.campoModificado}: ${evento.valorNuevo || ''}`;
    }
    return t('evento_default');
  };

  if (loading) {
    return (
      <div className="tratamiento-timeline">
        <div className="tratamiento-timeline__loading">
          <Loader2 size={16} className="spinner" />
          <span>{t('cargando_historial')}</span>
        </div>
      </div>
    );
  }

  if (eventos.length === 0) {
    return (
      <div className="tratamiento-timeline">
        <div className="tratamiento-timeline__empty">
          <Clock size={16} />
          <span>{t('sin_eventos_registrados')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="tratamiento-timeline">
      <div className="tratamiento-timeline__header">
        <Activity size={14} />
        <span>{t('seguimiento_tratamiento', { count: eventos.length })}</span>
      </div>
      <div className="tratamiento-timeline__list">
        {eventos.map((evento, i) => {
          const config = getEventConfig(evento);
          const Icon = config.icon;
          return (
            <div key={evento.id} className="tratamiento-timeline__event">
              <div className="tratamiento-timeline__line">
                <div
                  className="tratamiento-timeline__dot"
                  style={{ background: config.color }}
                />
                {i < eventos.length - 1 && <div className="tratamiento-timeline__connector" />}
              </div>
              <div className="tratamiento-timeline__content">
                <span className="tratamiento-timeline__date">
                  {formatDate(evento.createdAt)}
                </span>
                <div className="tratamiento-timeline__header-row">
                  <Icon size={14} style={{ color: config.color }} />
                  <span className="tratamiento-timeline__label">
                    {getEventLabel(evento)}
                  </span>
                </div>
                {evento.motivo && (
                  <span className="tratamiento-timeline__detail">
                    {evento.motivo}
                  </span>
                )}
                {evento.usuarioNombre && (
                  <span className="tratamiento-timeline__user">
                    {tCommon('por')} {evento.usuarioNombre}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
