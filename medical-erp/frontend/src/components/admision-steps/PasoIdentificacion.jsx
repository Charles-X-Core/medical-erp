import { FileText, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PasoIdentificacion({ formData, onChange }) {
  const { t } = useTranslation('patients');
  return (
    <div className="wizard-step">
      <div className="wizard-step__header">
        <User size={24} />
        <h3>{t('identificacion_cliente')}</h3>
        <p>{t('datos_basicos_identificacion')}</p>
      </div>
      <div className="wizard-step__form-grid">
        <div className="wizard-step__field">
          <label>{t('id')}</label>
          <input
            name="licenciaConducir"
            value={formData.licenciaConducir || ''}
            onChange={onChange}
            placeholder={t('numero_documento')}
            required
          />
        </div>
        <div className="wizard-step__field">
          <label>{t('apellido_paterno')}</label>
          <input name="apellidoPaterno" value={formData.apellidoPaterno || ''} onChange={onChange} required />
        </div>
        <div className="wizard-step__field">
          <label>{t('apellido_materno')}</label>
          <input name="apellidoMaterno" value={formData.apellidoMaterno || ''} onChange={onChange} />
        </div>
        <div className="wizard-step__field wizard-step__field--full">
          <label>{t('nombres')}</label>
          <input name="nombres" value={formData.nombres || ''} onChange={onChange} required />
        </div>
      </div>
    </div>
  );
}
