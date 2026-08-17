import { useNavigate } from 'react-router-dom';
import { UserRound, Clock, ArrowRight, ListChecks } from 'lucide-react';
import { formatNombre, formatHora } from '../../utils/citaEstados';

export default function ProximoPaciente({ cita, hero, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return <div className="proximo-paciente proximo-paciente--skeleton" />;
  }

  if (!cita) {
    return (
      <div className="proximo-paciente proximo-paciente--empty">
        <div className="proximo-paciente__empty-icon">
          <ListChecks size={32} />
        </div>
        <div className="proximo-paciente__empty-text">
          <h3>{hero.emptyTitle}</h3>
          <p>{hero.emptySubtitle}</p>
        </div>
        <button className="btn btn--secondary" onClick={() => navigate(hero.ctaRoute)}>
          <Clock size={16} />
          {hero.ctaLabel}
        </button>
      </div>
    );
  }

  return (
    <div className={`proximo-paciente proximo-paciente--${cita.prioridad === 'URGENTE' ? 'urgente' : 'normal'}`}>
      <div className="proximo-paciente__badge">
        {cita.prioridad === 'URGENTE' ? 'Prioridad urgente' : 'Siguiente en cola'}
      </div>

      <div className="proximo-paciente__avatar">
        <UserRound size={40} />
      </div>

      <div className="proximo-paciente__info">
        <h3>{formatNombre(cita.pacienteNombre)}</h3>
        <div className="proximo-paciente__meta">
          <span>
            <Clock size={14} />
            {formatHora(cita.hora)}
          </span>
          <span>{cita.tipoCitaNombre || cita.motivo || 'Consulta'}</span>
        </div>
      </div>

      <button
        className="btn btn--primary"
        onClick={() => navigate(`/pacientes/${cita.pacienteId}/workspace`)}
      >
        Iniciar atención
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
