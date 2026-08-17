import { useState, useEffect } from 'react';
import { Loader2, Calendar, Activity, CheckCircle, Clock, TrendingUp, AlertTriangle, Play, Pause, XCircle, FileText } from 'lucide-react';
import { tratamientoService } from '../../services/tratamientoService';

const EVENT_CONFIG = {
  CREACION: { icon: Play, color: '#3B82F6', label: 'Tratamiento creado' },
  CAMBIO_ESTADO: { icon: Activity, color: '#8B5CF6', label: 'Cambio de estado' },
  CAMBIO_SESIONES_PLANEADAS: { icon: TrendingUp, color: '#F59E0B', label: 'Sesiones actualizadas' },
  AMPLIACION_PLAN: { icon: TrendingUp, color: '#F59E0B', label: 'Plan ampliado' },
  REGISTRO_SESION: { icon: CheckCircle, color: '#22C55E', label: 'Sesión completada' },
  OBSERVACION_CLINICA: { icon: FileText, color: '#3B82F6', label: 'Observación clínica' },
  CAMBIO_OBJETIVO: { icon: Target, color: '#F59E0B', label: 'Objetivo actualizado' },
  default: { icon: Clock, color: '#94A3B8', label: 'Evento' },
};

const ESTADO_CONFIG = {
  PENDIENTE: { label: 'Pendiente', color: '#F59E0B', bg: '#FFFBEB' },
  PROGRAMADO: { label: 'Programado', color: '#3B82F6', bg: '#EFF6FF' },
  EN_CURSO: { label: 'En Curso', color: '#22C55E', bg: '#F0FDF4' },
  PAUSADO: { label: 'Pausado', color: '#F59E0B', bg: '#FFFBEB' },
  FINALIZADO: { label: 'Finalizado', color: '#6B7D95', bg: '#E2E8F0' },
  CANCELADO: { label: 'Cancelado', color: '#EF4444', bg: '#FEF2F2' },
};

function Target(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className} style={props.style}>
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export default function TratamientoTimeline({ tratamientoId }) {
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
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getEventConfig = (evento) => {
    return EVENT_CONFIG[evento.tipoCambio] || EVENT_CONFIG.default;
  };

  const getEventLabel = (evento) => {
    const config = getEventConfig(evento);
    if (evento.tipoCambio === 'CAMBIO_ESTADO') {
      return `${evento.valorAnterior || '?'} → ${evento.valorNuevo || '?'}`;
    }
    if (evento.tipoCambio === 'CAMBIO_SESIONES_PLANEADAS') {
      return `${evento.valorAnterior || '?'} → ${evento.valorNuevo || '?'} sesiones`;
    }
    if (evento.campoModificado) {
      return `${evento.campoModificado}: ${evento.valorNuevo || ''}`;
    }
    return config.label;
  };

  if (loading) {
    return (
      <div className="tratamiento-timeline">
        <div className="tratamiento-timeline__loading">
          <Loader2 size={16} className="spinner" />
          <span>Cargando historial...</span>
        </div>
      </div>
    );
  }

  if (eventos.length === 0) {
    return (
      <div className="tratamiento-timeline">
        <div className="tratamiento-timeline__empty">
          <Clock size={16} />
          <span>Sin eventos registrados</span>
        </div>
      </div>
    );
  }

  return (
    <div className="tratamiento-timeline">
      <div className="tratamiento-timeline__header">
        <Activity size={14} />
        <span>Seguimiento del Tratamiento ({eventos.length})</span>
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
                    por {evento.usuarioNombre}
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
