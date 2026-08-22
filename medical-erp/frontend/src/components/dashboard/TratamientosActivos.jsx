import { useNavigate } from 'react-router-dom';
import { Activity, ChevronRight, Inbox } from 'lucide-react';
import { formatNombre } from '../../utils/citaEstados';

const TIPO_TRATAMIENTO_LABELS = {
  EN_CURSO: 'En curso',
  PROGRAMADO: 'Programado',
  PENDIENTE: 'Pendiente de inicio',
  PAUSADO: 'Pausado',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
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
        {realizadas}/{planeadas} sesiones
      </span>
    </div>
  );
}

export default function TratamientosActivos({ tratamientos, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return <div className="panel panel--skeleton"><div className="panel__loader" /></div>;
  }

  return (
    <div className="panel">
      <div className="panel__header">
        <h3 className="panel__title">
          <Activity size={18} />
          Tratamientos activos
        </h3>
        <span className="panel__count">{tratamientos.length}</span>
      </div>

      {tratamientos.length === 0 ? (
        <div className="panel__empty">
          <Inbox size={32} />
          <p>No hay tratamientos activos</p>
        </div>
      ) : (
        <div className="tratamientos-grid">
          {tratamientos.map((t) => {
            const estadoLabel = TIPO_TRATAMIENTO_LABELS[t.estado] || t.estado;
            return (
              <div key={t.id} className="tratamiento-card">
                <div className="tratamiento-card__top">
                  <div className="tratamiento-card__name">
                    {formatNombre(t.pacienteNombre)}
                    <span className="tratamiento-card__tipo">{t.tipoTratamiento}</span>
                  </div>
                  <button
                    className="tratamiento-card__open"
                    title="Abrir cliente"
                    onClick={() => navigate(`/pacientes/${t.pacienteId}/workspace`)}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
                <span className="chip chip--info">{estadoLabel}</span>
                <ProgressBar realizadas={t.sesionesRealizadas} planeadas={t.sesionesPlaneadas} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
