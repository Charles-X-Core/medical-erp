import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { UserRound, Clock, ArrowRight, ListChecks, Stethoscope, AlertTriangle } from 'lucide-react';
import { formatNombre, formatHora, getCitaEstado } from '../../utils/citaEstados';
import { getAppointmentStatus, getTimeBadgeLabel } from '../../utils/citaTimeUtils';

export default function ProximoPaciente({ cita, hero, loading }) {
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');

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

  const estado = getCitaEstado(cita.estado);
  const isEnAtencion = cita.estado === 'en_atencion';
  const isCompletada = cita.estado === 'completada';
  const timeStatus = getAppointmentStatus(cita);
  const isTooEarly = timeStatus === 'too_early';
  const timeBadge = getTimeBadgeLabel(cita);

  return (
    <div className={`proximo-paciente proximo-paciente--${cita.prioridad === 'URGENTE' ? 'urgente' : 'normal'}`}>
      <div className="proximo-paciente__badge">
        {cita.prioridad === 'URGENTE' ? t('proximo_prioridad_urgente') : t('proximo_siguiente_cola')}
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
            {cita.duracionMinutos && <span> · {cita.duracionMinutos}min</span>}
          </span>
          {cita.usuarioNombre && (
            <span>
              <Stethoscope size={12} /> {cita.usuarioNombre}
            </span>
          )}
          <span>{cita.tipoCitaNombre || cita.motivo || t('consulta')}</span>
        </div>
        <div className="proximo-paciente__estado">
          <span className={`chip chip--${estado.tone}`}>{estado.label}</span>
          {timeBadge && !isCompletada && (
            <span className={`proximo-paciente__time-badge proximo-paciente__time-badge--${timeStatus}`}>
              {timeBadge}
            </span>
          )}
        </div>
      </div>

      {!isCompletada && !isEnAtencion && isTooEarly && (
        <div className="proximo-paciente__action-blocked">
          <AlertTriangle size={16} />
          <span>{t('time_not_yet')}</span>
          <button className="btn btn--ghost btn--sm" onClick={() => navigate('/agenda')}>
            {t('proximo_cambiar_horario')}
          </button>
        </div>
      )}

      {!isCompletada && (isEnAtencion || !isTooEarly) && (
        <button
          className="btn btn--primary"
          onClick={() => navigate(`/pacientes/${cita.pacienteId}/workspace`)}
        >
          {isEnAtencion ? t('proximo_ver_atencion') : t('proximo_iniciar_atencion')}
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}
