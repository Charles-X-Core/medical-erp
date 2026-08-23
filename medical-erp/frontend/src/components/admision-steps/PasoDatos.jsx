import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PasoDatos({ formData, onChange }) {
  const { t } = useTranslation('patients');
  return (
    <div className="wizard-step">
      <div className="wizard-step__header">
        <Heart size={24} />
        <h3>{t('datos_personales')}</h3>
        <p>{t('informacion_personal_demografica')}</p>
      </div>
      <div className="wizard-step__form-grid">
        <div className="wizard-step__field">
          <label>{t('fecha_nacimiento')}</label>
          <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento || ''} onChange={onChange} />
        </div>
        <div className="wizard-step__field">
          <label>{t('sexo')}</label>
          <select name="sexo" value={formData.sexo || ''} onChange={onChange}>
            <option value="">{t('seleccionar')}</option>
            <option value="MASCULINO">{t('masculino')}</option>
            <option value="FEMENINO">{t('femenino')}</option>
          </select>
        </div>
        <div className="wizard-step__field">
          <label>{t('estado_civil')}</label>
          <select name="estadoCivil" value={formData.estadoCivil || ''} onChange={onChange}>
            <option value="">{t('seleccionar')}</option>
            <option value="SOLTERO">{t('soltero')}</option>
            <option value="CASADO">{t('casado')}</option>
            <option value="DIVORCIADO">{t('divorciado')}</option>
            <option value="VIUDO">{t('viudo')}</option>
          </select>
        </div>
        <div className="wizard-step__field">
          <label>{t('ocupacion')}</label>
          <input name="ocupacion" value={formData.ocupacion || ''} onChange={onChange} />
        </div>
        <div className="wizard-step__field">
          <label>{t('grado_instruccion')}</label>
          <select name="gradoInstruccion" value={formData.gradoInstruccion || ''} onChange={onChange}>
            <option value="">{t('seleccionar')}</option>
            <option value="Primaria">{t('primaria')}</option>
            <option value="Secundaria">{t('secundaria')}</option>
            <option value="Tecnico">{t('tecnico')}</option>
            <option value="Universitario">{t('universitario')}</option>
            <option value="Postgrado">{t('postgrado')}</option>
          </select>
        </div>
        <div className="wizard-step__field">
          <label>{t('lugar_nacimiento')}</label>
          <input name="lugarNacimiento" value={formData.lugarNacimiento || ''} onChange={onChange} />
        </div>
        <div className="wizard-step__field">
          <label>{t('lugar_procedencia')}</label>
          <input name="lugarProcedencia" value={formData.lugarProcedencia || ''} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}
