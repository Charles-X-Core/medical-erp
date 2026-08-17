import { useState, useEffect, useCallback, useRef } from 'react';
import { ClipboardList, RefreshCw, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import agendaService from '../../services/agendaService';
import SolicitudCard from './SolicitudCard';

export default function SolicitudesPanel({ role }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [pos, setPos] = useState({ x: null, y: null });
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const panelRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await agendaService.getSolicitadasPendientes();
      if (res.success) setSolicitudes(res.data || []);
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load]);

  const handleConfirm = (id) => {
    setSolicitudes((prev) => prev.filter((s) => s.id !== id));
  };

  const handleReject = (id) => {
    setSolicitudes((prev) => prev.filter((s) => s.id !== id));
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return;
    dragging.current = true;
    const rect = panelRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    panelRef.current.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e) => {
      if (!dragging.current) return;
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;
      setPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      dragging.current = false;
      document.body.style.userSelect = '';
      if (panelRef.current) panelRef.current.style.cursor = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const isEnfermera = role === 'ENFERMERA';

  const style = {};
  if (pos.x !== null) style.left = `${pos.x}px`;
  if (pos.y !== null) style.top = `${pos.y}px`;

  return (
    <div
      ref={panelRef}
      className={`solicitudes-panel ${collapsed ? 'solicitudes-panel--collapsed' : ''}`}
      style={style}
    >
      <div
        className="solicitudes-panel__header"
        onMouseDown={handleMouseDown}
      >
        <div className="solicitudes-panel__title">
          <GripVertical size={14} className="solicitudes-panel__grip" />
          <ClipboardList size={16} />
          <span>{isEnfermera ? 'Solicitudes' : 'Mis Solicitudes'}</span>
          {solicitudes.length > 0 && (
            <span className="solicitudes-panel__badge">{solicitudes.length}</span>
          )}
        </div>
        <div className="solicitudes-panel__actions">
          <button className="solicitudes-panel__refresh" onClick={load} title="Actualizar">
            <RefreshCw size={14} />
          </button>
          <button
            className="solicitudes-panel__toggle"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expandir' : 'Minimizar'}
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="solicitudes-panel__list">
          {loading ? (
            <div className="solicitudes-panel__empty">Cargando...</div>
          ) : solicitudes.length === 0 ? (
            <div className="solicitudes-panel__empty">
              {isEnfermera ? 'Sin solicitudes pendientes' : 'No hay solicitudes activas'}
            </div>
          ) : (
            solicitudes.map((s) => (
              <SolicitudCard
                key={s.id}
                solicitud={s}
                onConfirm={handleConfirm}
                onReject={handleReject}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
