import { useState, useRef, useEffect } from 'react';
import { Clock, User, FileText, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const ESTADO_LABELS = {
  solicitada: 'Solicitada', pendiente: 'Pendiente', programada: 'Programada',
  confirmada: 'Confirmada', asistio: 'Asistio', en_atencion: 'En Atencion',
  completada: 'Completada', cancelada: 'Cancelada', reprogramada: 'Reprogramada',
  no_show: 'No Asistio',
};

const ESTADO_COLORS = {
  solicitada: '#F59E0B', pendiente: '#3B82F6', programada: '#06B6D4',
  confirmada: '#22C55E', asistio: '#F59E0B', en_atencion: '#16A34A',
  completada: '#6B7D95', cancelada: '#EF4444', reprogramada: '#A78BFA', no_show: '#EF4444',
};

const PRIORIDAD_CONFIG = {
  URGENTE: { label: 'Urgente', icon: AlertCircle, color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  ALTA: { label: 'Alta', icon: AlertTriangle, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  NORMAL: { label: 'Normal', icon: Info, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  BAJA: { label: 'Baja', icon: Info, color: '#6B7D95', bg: 'rgba(107,125,149,0.1)' },
};

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

export default function CitaPopover({ cita, children, col = 0, numCols = 1 }) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ side: 'right', vertical: 'top' });
  const timeoutRef = useRef(null);
  const containerRef = useRef(null);

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;

      let side = 'right';
      if (col >= Math.ceil(numCols / 2)) {
        side = 'left';
      } else if (rect.right + 300 > viewportW) {
        side = 'left';
      }

      let vertical = 'top';
      if (rect.top + 200 > viewportH) {
        vertical = 'bottom';
      }

      setPosition({ side, vertical });
    }
    timeoutRef.current = setTimeout(() => setVisible(true), 300);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(false), 100);
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  if (!cita) return children;

  const prioridad = PRIORIDAD_CONFIG[cita.prioridad] || PRIORIDAD_CONFIG.NORMAL;
  const PrioridadIcon = prioridad.icon;

  const popoverStyle = {};
  if (position.side === 'left') {
    popoverStyle.right = 'calc(100% + 8px)';
    popoverStyle.left = 'auto';
  }
  if (position.vertical === 'bottom') {
    popoverStyle.bottom = '0';
    popoverStyle.top = 'auto';
  }

  return (
    <div
      ref={containerRef}
      className={`cita-popover-wrapper ${visible ? 'cita-popover-wrapper--active' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ position: 'relative' }}
    >
      {children}
      {visible && (
        <div
          className={`cita-popover cita-popover--visible cita-popover--${position.side}`}
          style={popoverStyle}
        >
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
            {cita.prioridad && cita.prioridad !== 'NORMAL' && (
              <div className="cita-popover__row" style={{ color: prioridad.color }}>
                <PrioridadIcon size={13} />
                <span style={{ fontWeight: 600 }}>{prioridad.label}</span>
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
