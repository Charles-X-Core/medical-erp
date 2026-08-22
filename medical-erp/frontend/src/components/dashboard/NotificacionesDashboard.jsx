import { useState, useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import notificacionService from '../../services/notificacionService';

function formatTime(fecha) {
  if (!fecha) return '';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ============================================
// NotificacionesDashboard — Badge + list for dashboard
// Shows unread notification count and latest 5
// ============================================

export default function NotificacionesDashboard() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [conteo, setConteo] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [noLeidas, conteoRes] = await Promise.all([
        notificacionService.getNoLeidas(),
        notificacionService.getConteo(),
      ]);
      if (noLeidas?.success) setNotificaciones((noLeidas.data || []).slice(0, 5));
      if (conteoRes?.success) setConteo(conteoRes.data?.noLeidas || 0);
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    await notificacionService.marcarTodasLeidas();
    setConteo(0);
    setNotificaciones([]);
  };

  return (
    <div className="dashboard-notif">
      <div className="dashboard-notif__header">
        <h3 className="dashboard-notif__title">
          <Bell size={14} /> Notificaciones
          {conteo > 0 && <span className="dashboard-notif__badge">{conteo}</span>}
        </h3>
        {conteo > 0 && (
          <button className="dashboard-notif__mark-all" onClick={handleMarkAllRead}>
            <CheckCheck size={12} /> Marcar leídas
          </button>
        )}
      </div>

      <div className="dashboard-notif__list">
        {loading ? (
          <div className="dashboard-notif__empty">Cargando...</div>
        ) : notificaciones.length === 0 ? (
          <div className="dashboard-notif__empty">
            {conteo === 0 ? 'Sin notificaciones nuevas' : `${conteo} sin leer`}
          </div>
        ) : (
          notificaciones.map((n) => (
            <div key={n.id} className="dashboard-notif__item">
              <div className="dashboard-notif__dot" />
              <div className="dashboard-notif__item-content">
                <span className="dashboard-notif__item-title">{n.titulo}</span>
                <span className="dashboard-notif__item-msg">{n.mensaje}</span>
                <span className="dashboard-notif__item-time">{formatTime(n.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
