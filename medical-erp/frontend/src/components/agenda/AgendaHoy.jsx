import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, Users, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../services/apiClient';

export default function AgendaHoy() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCitas();
  }, []);

  const loadCitas = async () => {
    try {
      setLoading(true);
      const data = await apiClient('/api/v1/citas/hoy');
      if (data.success) {
        setCitas(data.data || []);
      }
    } catch (err) {
      setError('Error al cargar agenda');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCita = (cita) => {
    const pacienteId = cita.paciente?.id;
    if (pacienteId) {
      navigate(`/atencion/${pacienteId}`);
    }
  };

  const getCitaEstadoClass = (estado) => {
    const classes = {
      programada: 'agenda-card--programada',
      confirmada: 'agenda-card--confirmada',
      en_atencion: 'agenda-card--en-atencion',
      completada: 'agenda-card--completada',
      cancelada: 'agenda-card--cancelada',
    };
    return classes[estado] || 'agenda-card--programada';
  };

  if (loading) {
    return (
      <div className="agenda-page">
        <div className="agenda-page__loading">
          <Loader2 size={32} className="spinner" />
          <p>Cargando agenda del día...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="agenda-page">
      <div className="agenda-page__header">
        <div className="agenda-page__title-area">
          <CalendarDays size={24} />
          <div>
            <h1 className="agenda-page__title">Agenda del Día</h1>
            <p className="agenda-page__date">
              {new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div className="agenda-page__stats">
          <span className="agenda-page__stat">
            <Users size={16} />
            {citas.length} citas
          </span>
          <span className="agenda-page__stat agenda-page__stat--pending">
            <Clock size={16} />
            {citas.filter((c) => c.estado !== 'completada' && c.estado !== 'cancelada').length} pendientes
          </span>
        </div>
      </div>

      {error && <div className="agenda-page__error">{error}</div>}

      <div className="agenda-page__timeline">
        {citas.length > 0 ? (
          citas.map((cita) => {
            const paciente = cita.paciente;
            const fullName = paciente
              ? `${paciente.apellidoPaterno || ''} ${paciente.apellidoMaterno || ''}, ${paciente.nombres || ''}`
              : 'Cliente';

            return (
              <button
                key={cita.id}
                className={`agenda-card ${getCitaEstadoClass(cita.estado)}`}
                onClick={() => handleSelectCita(cita)}
              >
                <div className="agenda-card__time">
                  <span className="agenda-card__hora">
                    {cita.hora?.substring(0, 5) || '--:--'}
                  </span>
                  <span className={`agenda-card__estado agenda-card__estado--${cita.estado}`}>
                    {cita.estado?.replace('_', ' ')}
                  </span>
                </div>
                <div className="agenda-card__body">
                  <span className="agenda-card__patient">{fullName}</span>
                  <span className="agenda-card__type">{cita.tipo?.nombre || ''}</span>
                  {cita.motivo && (
                    <span className="agenda-card__motivo">{cita.motivo}</span>
                  )}
                </div>
                <ChevronRight size={16} className="agenda-card__arrow" />
              </button>
            );
          })
        ) : (
          <div className="agenda-page__empty">
            <CalendarDays size={48} />
            <h3>No hay citas programadas para hoy</h3>
            <p>La agenda del día está libre.</p>
          </div>
        )}
      </div>
    </div>
  );
}
