import { useNavigate } from 'react-router-dom';
import { CalendarCheck, Clock, ChevronRight, Inbox, AlertTriangle } from 'lucide-react';
import { getCitaEstado, formatNombre, formatHora } from '../../utils/citaEstados';
import { getAppointmentStatus, getTimeBadgeLabel } from '../../utils/citaTimeUtils';

export default function CitasHoyList({ citas, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="panel panel--skeleton">
        <div className="panel__loader" />
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel__header">
        <h3 className="panel__title">
          <CalendarCheck size={18} />
          Citas de hoy
        </h3>
        <span className="panel__count">{citas.length}</span>
      </div>

      {citas.length === 0 ? (
        <div className="panel__empty">
          <Inbox size={32} />
          <p>No hay citas para hoy</p>
        </div>
      ) : (
        <ul className="citas-hoy">
          {citas.map((cita) => {
            const estado = getCitaEstado(cita.estado);
            const timeStatus = getAppointmentStatus(cita);
            const isTooEarly = timeStatus === 'too_early';
            const timeBadge = getTimeBadgeLabel(cita);

            return (
              <li
                key={cita.id}
                className={`citas-hoy__item ${isTooEarly ? 'citas-hoy__item--too-early' : ''}`}
              >
                <div className="citas-hoy__time">
                  <Clock size={14} />
                  {formatHora(cita.hora)}
                </div>
                <div className="citas-hoy__info">
                  <span className="citas-hoy__name">{formatNombre(cita.pacienteNombre)}</span>
                  <span className="citas-hoy__motivo">
                    {cita.usuarioNombre && <span>{cita.usuarioNombre} · </span>}
                    {cita.tipoCitaNombre || cita.motivo || 'Consulta'}
                  </span>
                </div>
                {isTooEarly ? (
                  <span className="citas-hoy__early-badge">
                    <AlertTriangle size={12} /> {timeBadge}
                  </span>
                ) : (
                  <span className={`chip chip--${estado.tone}`}>{estado.label}</span>
                )}
                <button
                  className="citas-hoy__open"
                  title={isTooEarly ? `Cita a las ${formatHora(cita.hora)}` : 'Abrir cliente'}
                  onClick={() => navigate(`/pacientes/${cita.pacienteId}/workspace`)}
                >
                  <ChevronRight size={18} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
