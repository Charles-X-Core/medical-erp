import { useState, useRef, useEffect } from 'react';
import { Clock, User, FileText, AlertTriangle } from 'lucide-react';

const ESTADO_LABELS = {
  solicitada: 'Solicitada', pendiente: 'Pendiente', programada: 'Programada',
  confirmada: 'Confirmada', asistio: 'Asistio', completada: 'Completada',
  cancelada: 'Cancelada', reprogramada: 'Reprogramada', no_show: 'No Asistio',
};

const ESTADO_COLORS = {
  solicitada: '#F59E0B', pendiente: '#3B82F6', programada: '#06B6D4',
  confirmada: '#22C55E', asistio: '#F59E0B', completada: '#6B7D95',
  cancelada: '#EF4444', reprogramada: '#A78BFA', no_show: '#EF4444',
};

const PRIORIDAD_LABELS = { URGENTE: 'Urgente', NORMAL: 'Normal', BAJA: 'Baja' };

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function formatFechaDisplay(fechaStr) {
  if (!fechaStr) return '';
  const [y, m, d] = fechaStr.split('-').map(Number);
  return `${d} de ${MESES[m - 1]}`;
}

function formatTimeRange(hora, duracionMinutos) {
  if (!hora) return '';
  const start = hora.substring(0, 5);
  const [h, m] = hora.split(':').map(Number);
  const endMin = h * 60 + m + (duracionMinutos || 30);
  const endH = Math.floor(endMin / 60);
  const endM = endMin % 60;
  return `${start} - ${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

export default function CitaPopover({ cita, children }) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);
  const containerRef = useRef(null);

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(true), 400);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(false), 150);
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  if (!cita) return children;

  return (
    <div
      ref={containerRef}
      className="cita-popover-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ position: 'relative' }}
    >
      {children}
      {visible && (
        <div className="cita-popover cita-popover--visible">
          <div className="cita-popover__header">
            <span className="cita-popover__name">{cita.pacienteNombre}</span>
            <span
              className="cita-popover__estado"
              style={{ color: ESTADO_COLORS[cita.estado], backgroundColor: `${ESTADO_COLORS[cita.estado]}18` }}
            >
              {ESTADO_LABELS[cita.estado] || cita.estado}
            </span>
          </div>
          <div className="cita-popover__details">
            <div className="cita-popover__row">
              <Clock size={13} />
              <span>{formatFechaDisplay(cita.fecha)} &middot; {formatTimeRange(cita.hora, cita.duracionMinutos)}</span>
            </div>
            {cita.tipoCitaNombre && (
              <div className="cita-popover__row">
                <FileText size={13} />
                <span>{cita.tipoCitaNombre}{cita.duracionMinutos ? ` · ${cita.duracionMinutos} min` : ''}</span>
              </div>
            )}
            {cita.prioridad && (
              <div className="cita-popover__row">
                <AlertTriangle size={13} />
                <span>{PRIORIDAD_LABELS[cita.prioridad] || cita.prioridad}</span>
              </div>
            )}
            {cita.motivo && (
              <div className="cita-popover__row cita-popover__row--muted">
                <User size={13} />
                <span>{cita.motivo}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
