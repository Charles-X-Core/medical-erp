import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, User, FileText, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { rangoHoras } from '../../utils/zonaHoraria';

const ESTADO_KEYS = {
  solicitada: 'estado_solicitada', pendiente: 'estado_pendiente', programada: 'estado_programada',
  confirmada: 'estado_confirmada', asistio: 'estado_asistio', en_atencion: 'estado_en_atencion',
  completada: 'estado_completada', cancelada: 'estado_cancelada', reprogramada: 'estado_reprogramada',
  no_show: 'estado_no_show',
};

const ESTADO_COLORS = {
  solicitada: '#F59E0B', pendiente: '#3B82F6', programada: '#06B6D4',
  confirmada: '#22C55E', asistio: '#F59E0B', en_atencion: '#16A34A',
  completada: '#6B7D95', cancelada: '#EF4444', reprogramada: '#A78BFA', no_show: '#EF4444',
};

const PRIORIDAD_KEYS = {
  URGENTE: 'urgente', ALTA: 'alta', NORMAL: 'normal', BAJA: 'baja',
};

const PRIORIDAD_ICONS = {
  URGENTE: AlertCircle, ALTA: AlertTriangle, NORMAL: Info, BAJA: Info,
};

const PRIORIDAD_COLORS = {
  URGENTE: '#EF4444', ALTA: '#F59E0B', NORMAL: '#3B82F6', BAJA: '#6B7D95',
};

const PRIORIDAD_BG = {
  URGENTE: 'rgba(239,68,68,0.1)', ALTA: 'rgba(245,158,11,0.1)', NORMAL: 'rgba(59,130,246,0.1)', BAJA: 'rgba(107,125,149,0.1)',
};

const MONTH_KEYS = ['month_enero', 'month_febrero', 'month_marzo', 'month_abril', 'month_mayo', 'month_junio', 'month_julio', 'month_agosto', 'month_septiembre', 'month_octubre', 'month_noviembre', 'month_diciembre'];

function formatFechaDisplay(fechaStr, t) {
  if (!fechaStr) return '';
  const [y, m, d] = fechaStr.split('-').map(Number);
  return `${d} de ${t(MONTH_KEYS[m - 1], { ns: 'agenda' })}`;
}

function formatTimeRange(hora, duracionMinutos, fecha) {
  return rangoHoras(hora, duracionMinutos || 30, fecha);
}

export default function CitaPopover({ cita, children, col = 0, numCols = 1 }) {
  const { t } = useTranslation('dashboard');
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

  const prioridadKey = PRIORIDAD_KEYS[cita.prioridad] || 'normal';
  const PrioridadIcon = PRIORIDAD_ICONS[cita.prioridad] || Info;
  const prioridadColor = PRIORIDAD_COLORS[cita.prioridad] || '#3B82F6';

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
              {t(ESTADO_KEYS[cita.estado] || 'estado_programada')}
            </span>
          </div>
          <div className="cita-popover__details">
            <div className="cita-popover__row">
              <Clock size={13} />
              <span>{formatFechaDisplay(cita.fecha, t)} &middot; {formatTimeRange(cita.hora, cita.duracionMinutos, cita.fecha)}</span>
            </div>
            {cita.tipoCitaNombre && (
              <div className="cita-popover__row">
                <FileText size={13} />
                <span>{cita.tipoCitaNombre}{cita.duracionMinutos ? ` · ${cita.duracionMinutos} min` : ''}</span>
              </div>
            )}
            {cita.prioridad && cita.prioridad !== 'NORMAL' && (
              <div className="cita-popover__row" style={{ color: prioridadColor }}>
                <PrioridadIcon size={13} />
                <span style={{ fontWeight: 600 }}>{t(prioridadKey)}</span>
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
