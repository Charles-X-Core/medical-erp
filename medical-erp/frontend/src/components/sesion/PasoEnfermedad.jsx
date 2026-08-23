import { Activity, Clock, AlertCircle, Brain } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MOTIVOS_RAPIDOS_KEYS = [
  'consulta_general',
  'dolor',
  'control_rutina',
  'terapia_regenerativa',
  'medicina_estetica',
  'tratamiento_hormonal',
  'vitaminoterapia',
  'seguimiento',
  'emergencia',
];

const MOTIVOS_RAPIDOS_FALLBACK = [
  'Consulta general',
  'Dolor',
  'Control de rutina',
  'Terapia regenerativa',
  'Medicina estética',
  'Tratamiento hormonal',
  'Vitaminoterapia',
  'Seguimiento',
  'Emergencia',
];

export default function PasoEnfermedad({ formData, updateFormData }) {
  const { t } = useTranslation('clinical');
  const { t: tP } = useTranslation('patients');
  const { enfermedad } = formData;

  const handleMotivoRapido = (motivo) => {
    updateFormData('enfermedad', { motivo });
  };

  const motivosRapidos = MOTIVOS_RAPIDOS_KEYS.map((key, i) => t(key, { ns: 'clinical', defaultValue: MOTIVOS_RAPIDOS_FALLBACK[i] }));

  return (
    <div className="wizard-step">
      <h2 className="wizard-step__title">
        <Activity size={20} />
        {tP('enfermedad_motivo')}
      </h2>

      <div className="wizard-card">
        <h3 className="wizard-card__subtitle">{tP('motivos_rapidos')}</h3>
        <div className="wizard-chips">
          {motivosRapidos.map((m) => (
            <button
              key={m}
              className={`wizard-chip ${enfermedad.motivo === m ? 'wizard-chip--active' : ''}`}
              onClick={() => handleMotivoRapido(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="wizard-card">
        <div className="wizard-grid wizard-grid--1">
          <div className="wizard-field">
            <label>{tP('motivo_consulta')} *</label>
            <input
              className="wizard-input"
              value={enfermedad.motivo}
              onChange={(e) => updateFormData('enfermedad', { motivo: e.target.value })}
              placeholder={tP('motivo_consulta_placeholder')}
            />
          </div>

          <div className="wizard-field">
            <label><Clock size={14} /> {tP('tiempo_enfermedad')}</label>
            <input
              className="wizard-input"
              value={enfermedad.tiempoEnfermedad}
              onChange={(e) => updateFormData('enfermedad', { tiempoEnfermedad: e.target.value })}
              placeholder={t('tiempo_enfermedad_placeholder')}
            />
          </div>

          <div className="wizard-field">
            <label><AlertCircle size={14} /> {tP('signos_sintomas')}</label>
            <textarea
              className="wizard-textarea"
              rows={3}
              value={enfermedad.signosSintomas}
              onChange={(e) => updateFormData('enfermedad', { signosSintomas: e.target.value })}
              placeholder={tP('signos_sintomas_placeholder')}
            />
          </div>

          <div className="wizard-field">
            <label><Brain size={14} /> {tP('relato_cronologico')}</label>
            <textarea
              className="wizard-textarea"
              rows={4}
              value={enfermedad.relatoCronologico}
              onChange={(e) => updateFormData('enfermedad', { relatoCronologico: e.target.value })}
              placeholder={tP('relato_cronologico_placeholder')}
            />
          </div>

          <div className="wizard-grid wizard-grid--2">
            <div className="wizard-field">
              <label>{tP('medicamentos_actuales_label')}</label>
              <textarea
                className="wizard-textarea"
                rows={2}
                value={enfermedad.medicamentosActuales}
                onChange={(e) => updateFormData('enfermedad', { medicamentosActuales: e.target.value })}
                placeholder={tP('medicamentos_actuales_label')}
              />
            </div>
            <div className="wizard-field">
              <label>{tP('alergias_label')}</label>
              <textarea
                className="wizard-textarea"
                rows={2}
                value={enfermedad.alergias}
                onChange={(e) => updateFormData('enfermedad', { alergias: e.target.value })}
                placeholder={tP('alergias_placeholder')}
              />
            </div>
          </div>

          <div className="wizard-field">
            <label>{tP('funciones_biologicas')}</label>
            <textarea
              className="wizard-textarea"
              rows={3}
              value={enfermedad.funcionesBiologicas}
              onChange={(e) => updateFormData('enfermedad', { funcionesBiologicas: e.target.value })}
              placeholder={t('actividad_placeholder')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
