import { Ruler, Weight, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PasoMediciones({ mediciones, onChange }) {
  const { t } = useTranslation('patients');
  const peso = parseFloat(mediciones.peso) || 0;
  const estatura = parseFloat(mediciones.estatura) || 0;
  const imc = peso && estatura ? (peso / ((estatura / 100) ** 2)).toFixed(1) : '';
  const imcLabel = imc
    ? (imc < 18.5 ? t('bajo_peso') : imc < 25 ? t('normal') : imc < 30 ? t('sobrepeso') : t('obesidad'))
    : '';

  return (
    <div className="wizard-step">
      <div className="wizard-step__header">
        <Ruler size={24} />
        <h3>{t('mediciones_fisicas')}</h3>
        <p>{t('registro_medidas_basicas')}</p>
      </div>
      <div className="wizard-step__mediciones">
        <div className="wizard-step__med-card">
          <div className="wizard-step__med-icon"><Weight size={32} /></div>
          <label>{t('peso_kg')}</label>
          <input
            type="number"
            name="peso"
            value={mediciones.peso || ''}
            onChange={onChange}
            step="0.1"
            min="0"
            max="300"
            placeholder="0.0"
          />
        </div>
        <div className="wizard-step__med-card">
          <div className="wizard-step__med-icon"><Ruler size={32} /></div>
          <label>{t('estatura_cm')}</label>
          <input
            type="number"
            name="estatura"
            value={mediciones.estatura || ''}
            onChange={onChange}
            step="1"
            min="0"
            max="250"
            placeholder="0"
          />
        </div>
        <div className="wizard-step__med-card wizard-step__med-card--result">
          <div className="wizard-step__med-icon"><Activity size={32} /></div>
          <label>{t('imc')}</label>
          <span className="wizard-step__imc-value">{imc || '--'}</span>
          {imcLabel && (
            <span className={`wizard-step__imc-label ${imcLabel === t('normal') ? 'wizard-step__imc-label--ok' : 'wizard-step__imc-label--warn'}`}>
              {imcLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
