import { useContext, createContext } from 'react';
import { useTranslation } from 'react-i18next';

export const DragCitaCtx = createContext(null);

const ESTADO_COLORS = {
  solicitada: '#F59E0B', pendiente: '#3B82F6', programada: '#06B6D4',
  confirmada: '#22C55E', asistio: '#F59E0B', en_atencion: '#16A34A',
  completada: '#6B7D95', cancelada: '#EF4444', reprogramada: '#A78BFA', no_show: '#EF4444',
};

const ESTADO_BGS = {
  solicitada: 'rgba(245,158,11,0.12)', pendiente: 'rgba(59,130,246,0.12)',
  programada: 'rgba(6,182,212,0.12)', confirmada: 'rgba(34,197,94,0.12)',
  asistio: 'rgba(245,158,11,0.12)', en_atencion: 'rgba(22,163,74,0.18)',
  completada: 'rgba(107,125,149,0.12)', cancelada: 'rgba(239,68,68,0.08)',
  reprogramada: 'rgba(167,139,250,0.12)', no_show: 'rgba(239,68,68,0.08)',
};

function formatTime(timeStr) {
  if (!timeStr) return '';
  return timeStr.substring(0, 5);
}

export default function CitaBlock({ cita, hour, pxPerMin = 2, slotDuracion = 30, col = 0, numCols = 1, onClick, onResize }) {
  const drag = useContext(DragCitaCtx);
  const { t } = useTranslation('agenda');
  const [h, m] = (cita.hora || '00:00').split(':').map(Number);
  const startMin = h * 60 + m;
  const offsetMin = startMin - hour * 60;
  const duracion = cita.duracionMinutos || slotDuracion;

  const topPx = (offsetMin / slotDuracion) * (slotDuracion * pxPerMin);
  const heightPx = Math.min((duracion / slotDuracion) * (slotDuracion * pxPerMin) - 2, 240);

  const leftPercent = (col / numCols) * 100;
  const widthPercent = (1 / numCols) * 100;

  const showDetails = duracion >= 20;
  const showType = duracion >= 30;

  const handleResizeStart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const startY = e.clientY;
    const startDuracion = duracion;
    const pxPerMinute = pxPerMin;

    const handleMouseMove = (moveEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const deltaMinutos = Math.round(deltaY / pxPerMinute / 5) * 5;
      const nuevaDuracion = Math.max(15, startDuracion + deltaMinutos);
      onResize?.(cita, nuevaDuracion);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const dragStyle = drag?.dragStyle || {};
  const dragZIndex = drag?.zIndex ?? 1;
  const dragOpacity = drag?.isDragging ? 0.5 : 1;
  const hasDrag = !!drag?.listeners && Object.keys(drag.listeners).length > 0;

  return (
    <div
      ref={drag?.setNodeRef}
      {...(drag?.listeners || {})}
      {...(drag?.attributes || {})}
      className="agenda-week__cita"
      style={{
        top: `${topPx}px`,
        height: `${Math.max(heightPx, 18)}px`,
        left: `${leftPercent}%`,
        width: `calc(${widthPercent}% - 4px)`,
        backgroundColor: ESTADO_BGS[cita.estado] || 'rgba(59,130,246,0.12)',
        borderLeft: `3px solid ${ESTADO_COLORS[cita.estado] || '#3B82F6'}`,
        opacity: dragOpacity,
        cursor: hasDrag ? 'grab' : 'pointer',
        zIndex: dragZIndex,
        ...dragStyle,
      }}
      onClick={() => onClick?.(cita)}
    >
      {showDetails && <span className="agenda-week__cita-time">{formatTime(cita.hora)}</span>}
      <span className="agenda-week__cita-name">{cita.pacienteNombre}</span>
      {showType && cita.tipoCitaNombre && (
        <span className="agenda-week__cita-type">{cita.tipoCitaNombre}</span>
      )}
      {duracion >= 20 && (
        <div
          className="agenda-week__cita-resize"
          onMouseDown={handleResizeStart}
          title={t('arrastrar_duracion')}
        />
      )}
    </div>
  );
}
