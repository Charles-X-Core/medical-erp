import { Activity, Clock, AlertCircle, Brain } from 'lucide-react';

const MOTIVOS_RAPIDOS = [
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
  const { enfermedad } = formData;

  const handleMotivoRapido = (motivo) => {
    updateFormData('enfermedad', { motivo });
  };

  return (
    <div className="wizard-step">
      <h2 className="wizard-step__title">
        <Activity size={20} />
        Enfermedad / Motivo de Consulta
      </h2>

      <div className="wizard-card">
        <h3 className="wizard-card__subtitle">Motivos Rápidos</h3>
        <div className="wizard-chips">
          {MOTIVOS_RAPIDOS.map((m) => (
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
            <label>Motivo de Consulta *</label>
            <input
              className="wizard-input"
              value={enfermedad.motivo}
              onChange={(e) => updateFormData('enfermedad', { motivo: e.target.value })}
              placeholder="Describa el motivo de la consulta"
            />
          </div>

          <div className="wizard-field">
            <label><Clock size={14} /> Tiempo de Enfermedad</label>
            <input
              className="wizard-input"
              value={enfermedad.tiempoEnfermedad}
              onChange={(e) => updateFormData('enfermedad', { tiempoEnfermedad: e.target.value })}
              placeholder="Ej: 3 días, 2 semanas, 1 mes"
            />
          </div>

          <div className="wizard-field">
            <label><AlertCircle size={14} /> Signos y Síntomas</label>
            <textarea
              className="wizard-textarea"
              rows={3}
              value={enfermedad.signosSintomas}
              onChange={(e) => updateFormData('enfermedad', { signosSintomas: e.target.value })}
              placeholder="Describa los signos y síntomas principales"
            />
          </div>

          <div className="wizard-field">
            <label><Brain size={14} /> Relato Cronológico</label>
            <textarea
              className="wizard-textarea"
              rows={4}
              value={enfermedad.relatoCronologico}
              onChange={(e) => updateFormData('enfermedad', { relatoCronologico: e.target.value })}
              placeholder="Describa la evolución cronológica de la enfermedad"
            />
          </div>

          <div className="wizard-grid wizard-grid--2">
            <div className="wizard-field">
              <label>Medicamentos Actuales</label>
              <textarea
                className="wizard-textarea"
                rows={2}
                value={enfermedad.medicamentosActuales}
                onChange={(e) => updateFormData('enfermedad', { medicamentosActuales: e.target.value })}
                placeholder="Lista de medicamentos que toma actualmente"
              />
            </div>
            <div className="wizard-field">
              <label>Alergias</label>
              <textarea
                className="wizard-textarea"
                rows={2}
                value={enfermedad.alergias}
                onChange={(e) => updateFormData('enfermedad', { alergias: e.target.value })}
                placeholder="Alergias conocidas"
              />
            </div>
          </div>

          <div className="wizard-field">
            <label>Funciones Biológicas</label>
            <textarea
              className="wizard-textarea"
              rows={3}
              value={enfermedad.funcionesBiologicas}
              onChange={(e) => updateFormData('enfermedad', { funcionesBiologicas: e.target.value })}
              placeholder="Sueño, apetito, evacuaciones, diuresis, sed, actividad sexual"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
