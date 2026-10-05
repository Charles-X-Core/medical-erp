import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight, Clock, AlertTriangle } from 'lucide-react';
import { getAppointmentStatus } from '../../utils/citaTimeUtils';
import { horaMostrar } from '../../utils/zonaHoraria';

function formatNombre(nombre) {
  if (!nombre) return 'Client';
  return nombre;
}

function formatHora(hora, fecha) {
  if (!hora) return '--:--';
  return horaMostrar(hora, fecha).substring(0, 5);
}

export default function ColaPacientes({ citas = [], loading = false }) {
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');

  const getEstadoLabel = (estado) => {
    const labels = {
      pendiente: t('estado_pendiente'),
      programada: t('estado_programada'),
      confirmada: t('estado_confirmada'),
      asistio: t('estado_asistio'),
      llegada: t('estado_llegada'),
      en_atencion: t('estado_en_atencion'),
    };
    return labels[estado] || estado;
  };

  function getEstadoTone(estado) {
    const tones = {
      pendiente: 'neutral',
      programada: 'info',
      confirmada: 'info',
      asistio: 'success',
      llegada: 'success',
      en_atencion: 'active',
    };
    return tones[estado] || 'neutral';
  }

  if (loading) {
    return (
      <div className="dashboard-cola">
        <div className="dashboard-cola__header">
          <h3 className="dashboard-cola__title"><Users size={14} /> {t('panel_queue_title')}</h3>
        </div>
        <div className="dashboard-cola__loading">{t('panel_queue_loading')}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-cola">
      <div className="dashboard-cola__header">
        <h3 className="dashboard-cola__title">
          <Users size={14} /> {t('panel_queue_title')}
          {citas.length > 0 && <span className="dashboard-cola__badge">{citas.length}</span>}
        </h3>
      </div>

      <div className="dashboard-cola__list">
        {citas.length === 0 ? (
          <div className="dashboard-cola__empty">
            <Users size={24} />
            <p>{t('panel_queue_no_clients')}</p>
          </div>
        ) : (
          citas.map((cita) => {
            const timeStatus = getAppointmentStatus(cita);
            const isTooEarly = timeStatus === 'too_early';

            return (
              <button
                key={cita.id}
                className={`dashboard-cola__item ${isTooEarly ? 'dashboard-cola__item--too-early' : ''}`}
                onClick={() => !isTooEarly && cita.pacienteId && navigate(`/pacientes/${cita.pacienteId}/workspace`)}
              >
                <div className="dashboard-cola__item-time">
                  <Clock size={14} />
                  <span>{formatHora(cita.hora, cita.fecha)}</span>
                </div>
                <div className="dashboard-cola__item-info">
                  <span className="dashboard-cola__item-name">{formatNombre(cita.pacienteNombre)}</span>
                  <span className="dashboard-cola__item-detail">
                    {cita.usuarioNombre && <span>{cita.usuarioNombre} · </span>}
                    {cita.tipoCitaNombre || cita.motivo || t('consulta')}
                  </span>
                </div>
                {isTooEarly ? (
                  <span className="dashboard-cola__item-early">
                    <AlertTriangle size={12} /> {t('time_not_yet')}
                  </span>
                ) : (
                  <>
                    <span className={`dashboard-cola__item-estado dashboard-cola__item-estado--${getEstadoTone(cita.estado)}`}>
                      {getEstadoLabel(cita.estado)}
                    </span>
                    <ChevronRight size={14} className="dashboard-cola__item-arrow" />
                  </>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
