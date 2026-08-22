import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronRight, ShieldCheck } from 'lucide-react';
import { formatNombre } from '../../utils/citaEstados';

const SEVERIDAD_TONE = {
  ERROR: 'danger',
  WARNING: 'warning',
  INFO: 'info',
};

export default function AlertasPanel({ alertas, loading }) {
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');

  const TIPO_ALERTA_LABELS = {
    LIMITE_ALCANZADO: t('alert_limit_reached'),
    PENDIENTE_INICIO: t('alert_pending_start'),
    SESION_VENCIDA: t('alert_session_expired'),
  };

  if (loading) {
    return <div className="panel panel--skeleton"><div className="panel__loader" /></div>;
  }

  return (
    <div className="panel">
      <div className="panel__header">
        <h3 className="panel__title">
          <AlertTriangle size={18} />
          {t('panel_alerts_title')}
        </h3>
        <span className="panel__count">{alertas.length}</span>
      </div>

      {alertas.length === 0 ? (
        <div className="panel__empty">
          <ShieldCheck size={32} />
          <p>{t('panel_no_alerts')}</p>
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
                  title={t('open_client')}
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
