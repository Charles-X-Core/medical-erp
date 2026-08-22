import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Activity, ChevronRight, Inbox } from 'lucide-react';
import { formatNombre } from '../../utils/citaEstados';

export default function TratamientosActivos({ tratamientos, loading }) {
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');

  const TIPO_TRATAMIENTO_LABELS = {
    EN_CURSO: t('panel_status_en_curso'),
    PROGRAMADO: t('panel_status_programado'),
    PENDIENTE: t('panel_status_pendiente'),
    PAUSADO: t('panel_status_pausado'),
    FINALIZADO: t('panel_status_finalizado'),
    CANCELADO: t('panel_status_cancelado'),
  };

  function ProgressBar({ realizadas, planeadas }) {
    const pct =
      planeadas > 0 ? Math.min(Math.round((realizadas / planeadas) * 100), 100) : 0;
    return (
      <div className="tratamiento-card__progress">
        <div className="tratamiento-card__progress-track">
          <div className="tratamiento-card__progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span>
          {t('panel_sessions', { done: realizadas, total: planeadas })}
        </span>
      </div>
    );
  }

  if (loading) {
    return <div className="panel panel--skeleton"><div className="panel__loader" /></div>;
  }

  return (
    <div className="panel">
      <div className="panel__header">
        <h3 className="panel__title">
          <Activity size={18} />
          {t('section_active_treatments')}
        </h3>
        <span className="panel__count">{tratamientos.length}</span>
      </div>

      {tratamientos.length === 0 ? (
        <div className="panel__empty">
          <Inbox size={32} />
          <p>{t('panel_no_active_treatments')}</p>
        </div>
      ) : (
        <div className="tratamientos-grid">
          {tratamientos.map((trat) => {
            const estadoLabel = TIPO_TRATAMIENTO_LABELS[trat.estado] || trat.estado;
            return (
              <div key={trat.id} className="tratamiento-card">
                <div className="tratamiento-card__top">
                  <div className="tratamiento-card__name">
                    {formatNombre(trat.pacienteNombre)}
                    <span className="tratamiento-card__tipo">{trat.tipoTratamiento}</span>
                  </div>
                  <button
                    className="tratamiento-card__open"
                    title={t('open_client')}
                    onClick={() => navigate(`/pacientes/${trat.pacienteId}/workspace`)}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
                <span className="chip chip--info">{estadoLabel}</span>
                <ProgressBar realizadas={trat.sesionesRealizadas} planeadas={trat.sesionesPlaneadas} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
