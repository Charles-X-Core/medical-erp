import { Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PasoContacto({ formData, onChange }) {
  const { t } = useTranslation('patients');
  return (
    <div className="wizard-step">
      <div className="wizard-step__header">
        <Phone size={24} />
        <h3>{t('contacto')}</h3>
        <p>{t('informacion_contacto_emergencia')}</p>
      </div>
      <div className="wizard-step__form-grid">
        <div className="wizard-step__field">
          <label>{t('telefono')}</label>
          <input name="telefono" value={formData.telefono || ''} onChange={onChange} />
        </div>
        <div className="wizard-step__field">
          <label>{t('email')}</label>
          <input type="email" name="email" value={formData.email || ''} onChange={onChange} />
        </div>
        <div className="wizard-step__field wizard-step__field--full">
          <label>{t('street')}</label>
          <input name="direccionLinea1" value={formData.direccionLinea1 || ''} onChange={onChange} placeholder={t('street_placeholder')} />
        </div>
        <div className="wizard-step__field">
          <label>{t('city')}</label>
          <input name="ciudad" value={formData.ciudad || ''} onChange={onChange} placeholder={t('city_placeholder')} />
        </div>
        <div className="wizard-step__field">
          <label>{t('state')}</label>
          <input name="estadoProvincia" value={formData.estadoProvincia || ''} onChange={onChange} placeholder={t('state_placeholder')} />
        </div>
        <div className="wizard-step__field">
          <label>{t('zip_code')}</label>
          <input name="codigoPostal" value={formData.codigoPostal || ''} onChange={onChange} placeholder={t('zip_placeholder')} />
        </div>
        <div className="wizard-step__field">
          <label>{t('country')}</label>
          <input name="direccionPais" value={formData.direccionPais || 'US'} onChange={onChange} placeholder="US" />
        </div>
        <div className="wizard-step__field wizard-step__field--separator"><hr /></div>
        <div className="wizard-step__field">
          <label>{t('contacto_emergencia')}</label>
          <input name="contactoEmergencia" value={formData.contactoEmergencia || ''} onChange={onChange} />
        </div>
        <div className="wizard-step__field">
          <label>{t('telefono_emergencia')}</label>
          <input name="telefonoEmergencia" value={formData.telefonoEmergencia || ''} onChange={onChange} />
        </div>
        <div className="wizard-step__field">
          <label>{t('parentesco')}</label>
          <input name="parentescoEmergencia" value={formData.parentescoEmergencia || ''} onChange={onChange} />
        </div>
        <div className="wizard-step__field">
          <label>{t('acompanante')}</label>
          <input name="nombreAcompanante" value={formData.nombreAcompanante || ''} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
