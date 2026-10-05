import { Calendar, Send, Eye, Home, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatNombre } from '../../utils/fullName';

export default function PanelAccionesPostAdmision({ paciente, onAgendarCita, onEnviarContrato, onVerPaciente, onVolver }) {
  const { t } = useTranslation('patients');
  const { t: tCommon } = useTranslation('common');
  const fullName = formatNombre(paciente);

  return (
    <div className="post-admision">
      <div className="post-admision__header">
        <CheckCircle size={32} className="post-admision__check" />
        <h2>{t('admision_completada')}</h2>
        <p className="post-admision__patient">{fullName}</p>
        <span className="post-admision__id">{paciente.licenciaConducir || t('sin_id')}</span>
      </div>

      <p className="post-admision__question">{t('que_desea_hacer')}</p>

      <div className="post-admision__grid">
        <button className="post-admision__card" onClick={onAgendarCita}>
          <div className="post-admision__card-icon post-admision__card-icon--blue">
            <Calendar size={28} />
          </div>
          <span className="post-admision__card-label">{t('agendar_cita')}</span>
          <span className="post-admision__card-desc">{t('ver_disponibilidad_programar')}</span>
        </button>

        <button className="post-admision__card" onClick={onEnviarContrato}>
          <div className="post-admision__card-icon post-admision__card-icon--purple">
            <Send size={28} />
          </div>
          <span className="post-admision__card-label">{t('enviar_contrato')}</span>
          <span className="post-admision__card-desc">{t('enviar_enlace_firma_cliente')}</span>
        </button>

        <button className="post-admision__card" onClick={onVerPaciente}>
          <div className="post-admision__card-icon post-admision__card-icon--orange">
            <Eye size={28} />
          </div>
          <span className="post-admision__card-label">{t('ver_cliente')}</span>
          <span className="post-admision__card-desc">{t('abrir_centro_cliente')}</span>
        </button>
      </div>

      <button className="post-admision__btn-back" onClick={onVolver}>
        <Home size={18} /> {tCommon('volver_lista')}
      </button>
    </div>
  );
}
