import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronRight, ShieldCheck } from 'lucide-react';
import { formatNombre } from '../../utils/citaEstados';

const SEVERIDAD_TONE = {
  ERROR: 'danger',
  WARNING: 'warning',
  INFO: 'info',
};

const TIPO_ALERTA_LABELS = {
  LIMITE_ALCANZADO: 'Límite de sesiones alcanzado',
  PENDIENTE_INICIO: 'Pendiente de inicio',
  SESION_VENCIDA: 'Sesión vencida',
};

export default function AlertasPanel({ alertas, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return <div className="panel panel--skeleton"><div className="panel__loader" /></div>;
  }

  return (
    <div className="panel">
      <div className="panel__header">
        <h3 className="panel__title">
          <AlertTriangle size={18} />
          Alertas clínicas
        </h3>
        <span className="panel__count">{alertas.length}</span>
      </div>

      {alertas.length === 0 ? (
        <div className="panel__empty">
          <ShieldCheck size={32} />
          <p>Sin alertas pendientes</p>
        </div>
      ) : (
        <ul className="alertas-list">
          {alertas.map((alerta, i) => {
            const tone = SEVERIDAD_TONE[alerta.severidad] || 'info';
            return (
              <li key={`${alerta.tratamientoId}-${i}`} className={`alerta alerta--${tone}`}>
                <div className="alerta__body">
                  <span className="alerta__tipo">
                    {TIPO_ALERTA_LABELS[alerta.tipoAlerta] || alerta.tipoAlerta}
                  </span>
                  <p className="alerta__mensaje">{alerta.mensaje}</p>
                  {alerta.accionSugerida && (
                    <p className="alerta__accion">{alerta.accionSugerida}</p>
                  )}
                  <span className="alerta__paciente">{formatNombre(alerta.pacienteNombre)}</span>
                </div>
                <button
                  className="alerta__open"
                  title="Abrir cliente"
                  onClick={() => navigate(`/pacientes/${alerta.pacienteId}/workspace`)}
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
