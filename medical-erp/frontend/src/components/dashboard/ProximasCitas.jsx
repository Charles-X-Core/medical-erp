import { useNavigate } from 'react-router-dom';
import { CalendarClock, Clock, ChevronRight, Inbox, AlertTriangle } from 'lucide-react';
import { getCitaEstado, formatNombre, formatHora } from '../../utils/citaEstados';
import { getAppointmentStatus, getTimeBadgeLabel } from '../../utils/citaTimeUtils';

export default function ProximasCitas({ citas, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return <div className="panel panel--skeleton"><div className="panel__loader" /></div>;
  }

  return (
    <div className="panel">
      <div className="panel__header">
        <h3 className="panel__title">
          <CalendarClock size={18} />
          Proximas citas
        </h3>
        <span className="panel__count">{citas.length}</span>
      </div>

      {citas.length === 0 ? (
        <div className="panel__empty">
          <Inbox size={32} />
          <p>Sin citas proximas</p>
        </div>
      ) : (
        <ul className="proximas-list">
          {citas.map((cita) => {
            const estado = getCitaEstado(cita.estado);
            const timeStatus = getAppointmentStatus(cita);
            const isTooEarly = timeStatus === 'too_early';
            const timeBadge = getTimeBadgeLabel(cita);

            return (
              <li
                key={cita.id}
                className={`proximas-list__item ${isTooEarly ? 'proximas-list__item--too-early' : ''}`}
              >
                <div className="proximas-list__time">
                  <Clock size={14} />
                  {formatHora(cita.hora)}
                </div>
                <div className="proximas-list__info">
                  <span className="proximas-list__name">{formatNombre(cita.pacienteNombre)}</span>
                  <span className="proximas-list__motivo">
                    {cita.usuarioNombre && <span>{cita.usuarioNombre} · </span>}
                    {cita.tipoCitaNombre || cita.motivo || 'Consulta'}
                  </span>
                </div>
                {isTooEarly ? (
                  <span className="proximas-list__early-badge">
                    <AlertTriangle size={12} /> {timeBadge}
                  </span>
                ) : (
                  <span className={`chip chip--${estado.tone}`}>{estado.label}</span>
                )}
                <button
                  className="proximas-list__open"
                  title={isTooEarly ? `Cita a las ${formatHora(cita.hora)}` : 'Abrir cliente'}
                  onClick={() => navigate(`/pacientes/${cita.pacienteId}/workspace`)}
                >
                  <ChevronRight size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
