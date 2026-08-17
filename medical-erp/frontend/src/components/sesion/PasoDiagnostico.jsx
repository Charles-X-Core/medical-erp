import { useState } from 'react';
import { HeartPulse, Plus, X, Stethoscope, FileCheck } from 'lucide-react';

export default function PasoDiagnostico({ formData, updateFormData }) {
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
        Diagnóstico
      </h2>

      {/* Signos Vitales */}
      <div className="wizard-card">
        <h3 className="wizard-card__subtitle">
          <HeartPulse size={16} />
          Signos Vitales
        </h3>
        <div className="wizard-grid wizard-grid--4">
          <div className="wizard-field">
            <label>Presión Arterial</label>
            <input
              className="wizard-input"
              value={diagnostico.signosVitales.presionArterial}
              onChange={(e) => updateSignosVitales('presionArterial', e.target.value)}
              placeholder="120/80"
            />
          </div>
          <div className="wizard-field">
            <label>Pulso (lpm)</label>
            <input
              className="wizard-input"
              type="number"
              value={diagnostico.signosVitales.pulso}
              onChange={(e) => updateSignosVitales('pulso', e.target.value)}
              placeholder="72"
            />
          </div>
          <div className="wizard-field">
            <label>Temperatura (°C)</label>
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
            <label>Peso (kg)</label>
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
            <label>Talla (cm)</label>
            <input
              className="wizard-input"
              type="number"
              value={diagnostico.signosVitales.talla}
              onChange={(e) => updateSignosVitales('talla', e.target.value)}
              placeholder="170"
            />
          </div>
          <div className="wizard-field">
            <label>Saturación O₂ (%)</label>
            <input
              className="wizard-input"
              type="number"
              value={diagnostico.signosVitales.saturacionO2}
              onChange={(e) => updateSignosVitales('saturacionO2', e.target.value)}
              placeholder="98"
            />
          </div>
          <div className="wizard-field">
            <label>Freq. Respiratoria</label>
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
        <h3 className="wizard-card__subtitle">Examen Clínico</h3>
        <div className="wizard-grid wizard-grid--1">
          <div className="wizard-field">
            <label>Examen Físico General</label>
            <textarea
              className="wizard-textarea"
              rows={3}
              value={diagnostico.examenClinicoGeneral}
              onChange={(e) => updateFormData('diagnostico', { examenClinicoGeneral: e.target.value })}
              placeholder="Describa los hallazgos del examen físico"
            />
          </div>
        </div>
      </div>

      {/* Diagnósticos - Texto libre */}
      <div className="wizard-card">
        <h3 className="wizard-card__subtitle">Diagnóstico</h3>

        <div className="wizard-field">
          <textarea
            className="wizard-textarea"
            rows={4}
            value={diagnostico.diagnosticoTexto}
            onChange={(e) => updateFormData('diagnostico', { diagnosticoTexto: e.target.value })}
            placeholder="Escriba el diagnóstico (uno por línea)"
          />
        </div>
      </div>

      {/* Consentimiento */}
      <div className="wizard-card">
        <h3 className="wizard-card__subtitle">
          <FileCheck size={16} />
          Consentimiento
        </h3>
        <label className="wizard-checkbox">
          <input
            type="checkbox"
            checked={diagnostico.consentimientoInformado}
            onChange={(e) => updateFormData('diagnostico', { consentimientoInformado: e.target.checked })}
          />
          <span>Consentimiento informado firmado</span>
        </label>
      </div>
    </div>
  );
}
