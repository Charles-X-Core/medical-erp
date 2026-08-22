import { useNavigate } from 'react-router-dom';
import { CalendarClock, Clock, ChevronRight, Inbox } from 'lucide-react';
import { getCitaEstado, formatNombre, formatHora } from '../../utils/citaEstados';

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
          Próximas citas
        </h3>
        <span className="panel__count">{citas.length}</span>
      </div>

      {citas.length === 0 ? (
        <div className="panel__empty">
          <Inbox size={32} />
          <p>Sin citas próximas</p>
        </div>
      ) : (
        <ul className="proximas-list">
          {citas.map((cita) => {
            const estado = getCitaEstado(cita.estado);
            return (
              <li key={cita.id} className="proximas-list__item">
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
                <span className={`chip chip--${estado.tone}`}>{estado.label}</span>
                <button
                  className="proximas-list__open"
                  title="Abrir cliente"
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
