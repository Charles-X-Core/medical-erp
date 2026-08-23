import { useState } from 'react';
import { HeartPulse, Plus, X, Stethoscope, FileCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PasoDiagnostico({ formData, updateFormData }) {
  const { t } = useTranslation('clinical');
  const { t: tP } = useTranslation('patients');
  const { diagnostico } = formData;
  const [nuevoDiagnostico, setNuevoDiagnostico] = useState('');

  const addDiagnostico = () => {
    const texto = nuevoDiagnostico.trim();
    if (!texto) return;
    const separator = diagnostico.diagnosticoTexto ? '\n' : '';
    updateFormData('diagnostico', {
      diagnosticoTexto: diagnostico.diagnosticoTexto + separator + texto,
    });
    setNuevoDiagnostico('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDiagnostico();
    }
  };

  const updateSignosVitales = (field, value) => {
    updateFormData('diagnostico', {
      signosVitales: { ...diagnostico.signosVitales, [field]: value },
    });
  };

  return (
    <div className="wizard-step">
      <h2 className="wizard-step__title">
        <Stethoscope size={20} />
        {t('diagnostico')}
      </h2>

      {/* Signos Vitales */}
      <div className="wizard-card">
        <h3 className="wizard-card__subtitle">
          <HeartPulse size={16} />
          {t('signos_vitales_label')}
        </h3>
        <div className="wizard-grid wizard-grid--4">
          <div className="wizard-field">
            <label>{t('presion_arterial')}</label>
            <input
              className="wizard-input"
              value={diagnostico.signosVitales.presionArterial}
              onChange={(e) => updateSignosVitales('presionArterial', e.target.value)}
              placeholder="120/80"
            />
          </div>
          <div className="wizard-field">
            <label>{t('pulso_lpm')}</label>
            <input
              className="wizard-input"
              type="number"
              value={diagnostico.signosVitales.pulso}
              onChange={(e) => updateSignosVitales('pulso', e.target.value)}
              placeholder="72"
            />
          </div>
          <div className="wizard-field">
            <label>{t('temperatura_c')}</label>
            <input
              className="wizard-input"
              type="number"
              step="0.1"
              value={diagnostico.signosVitales.temperatura}
              onChange={(e) => updateSignosVitales('temperatura', e.target.value)}
              placeholder="36.5"
            />
          </div>
          <div className="wizard-field">
            <label>{t('peso_kg')}</label>
            <input
              className="wizard-input"
              type="number"
              step="0.1"
              value={diagnostico.signosVitales.peso}
              onChange={(e) => updateSignosVitales('peso', e.target.value)}
              placeholder="70"
            />
          </div>
          <div className="wizard-field">
            <label>{tP('estatura_cm')}</label>
            <input
              className="wizard-input"
              type="number"
              value={diagnostico.signosVitales.talla}
              onChange={(e) => updateSignosVitales('talla', e.target.value)}
              placeholder="170"
            />
          </div>
          <div className="wizard-field">
            <label>{t('saturacion_o2')}</label>
            <input
              className="wizard-input"
              type="number"
              value={diagnostico.signosVitales.saturacionO2}
              onChange={(e) => updateSignosVitales('saturacionO2', e.target.value)}
              placeholder="98"
            />
          </div>
          <div className="wizard-field">
            <label>{t('frecuencia_resp')}</label>
            <input
              className="wizard-input"
              type="number"
              value={diagnostico.signosVitales.frecuenciaRespiratoria}
              onChange={(e) => updateSignosVitales('frecuenciaRespiratoria', e.target.value)}
              placeholder="16"
            />
          </div>
        </div>
      </div>

      {/* Examen */}
      <div className="wizard-card">
        <h3 className="wizard-card__subtitle">{tP('examen_fisico')}</h3>
        <div className="wizard-grid wizard-grid--1">
          <div className="wizard-field">
            <label>{tP('examen_fisico')}</label>
            <textarea
              className="wizard-textarea"
              rows={3}
              value={diagnostico.examenClinicoGeneral}
              onChange={(e) => updateFormData('diagnostico', { examenClinicoGeneral: e.target.value })}
              placeholder={t('examen_fisico_placeholder')}
            />
          </div>
        </div>
      </div>

      {/* Diagnósticos - Texto libre */}
      <div className="wizard-card">
        <h3 className="wizard-card__subtitle">{tP('diagnostico')}</h3>

        <div className="wizard-field">
          <textarea
            className="wizard-textarea"
            rows={4}
            value={diagnostico.diagnosticoTexto}
            onChange={(e) => updateFormData('diagnostico', { diagnosticoTexto: e.target.value })}
            placeholder={tP('diagnostico_placeholder')}
          />
        </div>
      </div>

      {/* Consentimiento */}
      <div className="wizard-card">
        <h3 className="wizard-card__subtitle">
          <FileCheck size={16} />
          {t('consentimiento')}
        </h3>
        <label className="wizard-checkbox">
          <input
            type="checkbox"
            checked={diagnostico.consentimientoInformado}
            onChange={(e) => updateFormData('diagnostico', { consentimientoInformado: e.target.checked })}
          />
          <span>{t('consentimiento_firmado')}</span>
        </label>
      </div>
    </div>
  );
}
