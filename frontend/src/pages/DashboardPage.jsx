import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  CalendarDays,
  Users,
  Clock,
  FileText,
  Activity,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

const API_BASE = ''; // Vite proxy handles /api -> localhost:8080

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [citasHoy, setCitasHoy] = useState([]);
  const [citasProximas, setCitasProximas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const [hoyRes, proxRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/citas/hoy`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          }),
          fetch(`${API_BASE}/api/v1/citas/proximas`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          }),
        ]);

        const hoyData = await hoyRes.json();
        const proxData = await proxRes.json();

        if (hoyData.success) setCitasHoy(hoyData.data || []);
        if (proxData.success) setCitasProximas(proxData.data || []);
      } catch (err) {
        setError('Error al cargar citas');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [token]);

  const citasPendientes = citasHoy.filter((c) => c.estado !== 'completada' && c.estado !== 'cancelada');
  const citaActual = citasPendientes[0] || null;
  const stats = {
    totalHoy: citasHoy.length,
    pendientes: citasPendientes.length,
    completadas: citasHoy.filter((c) => c.estado === 'completada').length,
    proximas: citasProximas.length,
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__welcome">
        <h2 className="dashboard-page__title">
          Bienvenido, {user?.nombre || 'Doctor'}
        </h2>
        <p className="dashboard-page__date">
          {new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Stats */}
      <div className="dashboard-page__stats">
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--primary">
            <CalendarDays size={20} />
          </div>
          <div className="stat-card__info">
            <span className="stat-card__value">{stats.totalHoy}</span>
            <span className="stat-card__label">Citas hoy</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--warning">
            <Clock size={20} />
          </div>
          <div className="stat-card__info">
            <span className="stat-card__value">{stats.pendientes}</span>
            <span className="stat-card__label">Pendientes</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--success">
            <Activity size={20} />
          </div>
          <div className="stat-card__info">
            <span className="stat-card__value">{stats.completadas}</span>
            <span className="stat-card__label">Completadas</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--info">
            <Users size={20} />
          </div>
          <div className="stat-card__info">
            <span className="stat-card__value">{stats.proximas}</span>
            <span className="stat-card__label">Próximas</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="dashboard-page__error">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Main content grid */}
      <div className="dashboard-page__grid">
        {/* Cita Actual */}
        <div className="dashboard-page__panel">
          <h3 className="dashboard-page__panel-title">
            <Clock size={18} />
            Cita Actual
          </h3>
          {citaActual ? (
            <div className="cita-actual">
              <div className="cita-actual__header">
                <span className="cita-actual__hora">
                  {citaActual.horaInicio?.substring(0, 5) || '--:--'}
                </span>
                <span className={`cita-actual__estado cita-actual__estado--${citaActual.estado}`}>
                  {citaActual.estado}
                </span>
              </div>
              <div className="cita-actual__paciente">
                <Users size={16} />
                <strong>{citaActual.paciente?.nombreCompleto || 'Paciente'}</strong>
              </div>
              <div className="cita-actual__detalle">
                {citaActual.motivo || 'Sin motivo registrado'}
              </div>
              <div className="cita-actual__actions">
                <button className="btn btn--primary btn--sm">
                  <FileText size={14} /> Ver Historia
                </button>
                <button className="btn btn--secondary btn--sm">
                  Iniciar Consulta
                </button>
              </div>
            </div>
          ) : (
            <div className="dashboard-page__empty">
              <CalendarDays size={32} />
              <p>No hay citas pendientes en este momento</p>
            </div>
          )}
        </div>

        {/* Citas de Hoy */}
        <div className="dashboard-page__panel">
          <h3 className="dashboard-page__panel-title">
            <CalendarDays size={18} />
            Citas de Hoy
          </h3>
          {loading ? (
            <div className="dashboard-page__loading">
              <span className="spinner" />
            </div>
          ) : citasHoy.length > 0 ? (
            <div className="cita-list">
              {citasHoy.map((cita) => (
                <div key={cita.id} className={`cita-card cita-card--${cita.estado}`}>
                  <div className="cita-card__time">
                    {cita.horaInicio?.substring(0, 5) || '--:--'}
                  </div>
                  <div className="cita-card__body">
                    <span className="cita-card__patient">
                      {cita.paciente?.nombreCompleto || 'Paciente'}
                    </span>
                    <span className="cita-card__type">{cita.tipo?.nombre || ''}</span>
                  </div>
                  <ChevronRight size={16} className="cita-card__arrow" />
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-page__empty">
              <CalendarDays size={32} />
              <p>No hay citas programadas para hoy</p>
            </div>
          )}
        </div>

        {/* Próximas Citas */}
        <div className="dashboard-page__panel dashboard-page__panel--wide">
          <h3 className="dashboard-page__panel-title">
            <Clock size={18} />
            Próximas Citas
          </h3>
          {loading ? (
            <div className="dashboard-page__loading">
              <span className="spinner" />
            </div>
          ) : citasProximas.length > 0 ? (
            <div className="cita-list cita-list--horizontal">
              {citasProximas.slice(0, 5).map((cita) => (
                <div key={cita.id} className={`cita-card cita-card--${cita.estado}`}>
                  <div className="cita-card__date">
                    <span className="cita-card__day">
                      {cita.fecha ? new Date(cita.fecha).getDate() : '--'}
                    </span>
                    <span className="cita-card__month">
                      {cita.fecha
                        ? new Date(cita.fecha).toLocaleDateString('es-ES', { month: 'short' })
                        : ''}
                    </span>
                  </div>
                  <div className="cita-card__body">
                    <span className="cita-card__patient">
                      {cita.paciente?.nombreCompleto || 'Paciente'}
                    </span>
                    <span className="cita-card__type">{cita.tipo?.nombre || ''}</span>
                  </div>
                  <span className="cita-card__time">
                    {cita.horaInicio?.substring(0, 5)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-page__empty">
              <Clock size={32} />
              <p>No hay citas próximas programadas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
