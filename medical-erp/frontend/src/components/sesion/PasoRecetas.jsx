import { useState } from 'react';
import { Pill, Plus, X, FileText, Lightbulb } from 'lucide-react';

const TEMPLATES = [
  {
    nombre: 'Analgésico',
    medicamentos: [
      { nombre: 'Ibuprofeno', dosis: '400mg', frecuencia: 'Cada 8 horas', duracion: '5 días' },
    ],
    indicaciones: 'Tomar después de las comidas. No exceder la dosis recomendada.',
  },
  {
    nombre: 'Antibiótico',
    medicamentos: [
      { nombre: 'Amoxicilina', dosis: '500mg', frecuencia: 'Cada 8 horas', duracion: '7 días' },
    ],
    indicaciones: 'Completar el tratamiento completo aunque mejore.',
  },
  {
    nombre: 'Dolor Intenso',
    medicamentos: [
      { nombre: 'Naproxeno', dosis: '500mg', frecuencia: 'Cada 12 horas', duracion: '3 días' },
      { nombre: 'Paracetamol', dosis: '500mg', frecuencia: 'Cada 6 horas', duracion: '5 días' },
    ],
    indicaciones: 'Tomar con alimentos. Alternar medicamentos.',
  },
];

export default function PasoRecetas({ formData, updateFormData }) {
  const { recetas } = formData;
  const [showTemplates, setShowTemplates] = useState(false);

  const addNewReceta = () => {
    updateFormData('recetas', [
      ...recetas,
      {
        medicamentos: [{ nombre: '', dosis: '', frecuencia: '', duracion: '' }],
        indicaciones: '',
        observaciones: '',
      },
    ]);
  };

  const applyTemplate = (template) => {
    updateFormData('recetas', [
      ...recetas,
      {
        medicamentos: template.medicamentos.map((m) => ({ ...m })),
        indicaciones: template.indicaciones,
        observaciones: '',
      },
    ]);
    setShowTemplates(false);
  };

  const updateReceta = (index, field, value) => {
    const updated = [...recetas];
    updated[index] = { ...updated[index], [field]: value };
    updateFormData('recetas', updated);
  };

  const removeReceta = (index) => {
    updateFormData('recetas', recetas.filter((_, i) => i !== index));
  };

  const addMedicamento = (recetaIndex) => {
    const updated = [...recetas];
    updated[recetaIndex].medicamentos = [
      ...updated[recetaIndex].medicamentos,
      { nombre: '', dosis: '', frecuencia: '', duracion: '' },
    ];
    updateFormData('recetas', updated);
  };

  const updateMedicamento = (recetaIndex, medIndex, field, value) => {
    const updated = [...recetas];
    updated[recetaIndex].medicamentos[medIndex] = {
      ...updated[recetaIndex].medicamentos[medIndex],
      [field]: value,
    };
    updateFormData('recetas', updated);
  };

  const removeMedicamento = (recetaIndex, medIndex) => {
    const updated = [...recetas];
    updated[recetaIndex].medicamentos = updated[recetaIndex].medicamentos.filter(
      (_, i) => i !== medIndex
    );
    updateFormData('recetas', updated);
  };

  return (
    <div className="wizard-step">
      <h2 className="wizard-step__title">
        <Pill size={20} />
        Recetas Médicas
      </h2>

      <div className="wizard-actions">
        <button className="wizard-btn wizard-btn--primary" onClick={addNewReceta}>
          <Plus size={16} />
          Nueva Receta
        </button>
        <button
          className="wizard-btn wizard-btn--secondary"
          onClick={() => setShowTemplates(!showTemplates)}
        >
          <Lightbulb size={16} />
          Templates
        </button>
      </div>

      {showTemplates && (
        <div className="wizard-card wizard-card--highlight">
          <h3 className="wizard-card__subtitle">Templates Rápidos</h3>
          <div className="wizard-chips">
            {TEMPLATES.map((t) => (
              <button key={t.nombre} className="wizard-chip" onClick={() => applyTemplate(t)}>
                {t.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      {recetas.map((receta, recetaIndex) => (
        <div key={recetaIndex} className="wizard-card">
          <div className="wizard-card__header">
            <h3 className="wizard-card__subtitle">
              <FileText size={16} />
              Receta {recetaIndex + 1}
            </h3>
            <button className="wizard-btn-icon" onClick={() => removeReceta(recetaIndex)}>
              <X size={16} />
            </button>
          </div>

          <div className="wizard-meds">
            {receta.medicamentos.map((med, medIndex) => (
              <div key={medIndex} className="wizard-med-row">
                <div className="wizard-grid wizard-grid--4">
                  <div className="wizard-field">
                    <label>Medicamento</label>
                    <input
                      className="wizard-input"
                      value={med.nombre}
                      onChange={(e) => updateMedicamento(recetaIndex, medIndex, 'nombre', e.target.value)}
                      placeholder="Nombre"
                    />
                  </div>
                  <div className="wizard-field">
                    <label>Dosis</label>
                    <input
                      className="wizard-input"
                      value={med.dosis}
                      onChange={(e) => updateMedicamento(recetaIndex, medIndex, 'dosis', e.target.value)}
                      placeholder="Ej: 500mg"
                    />
                  </div>
                  <div className="wizard-field">
                    <label>Frecuencia</label>
                    <input
                      className="wizard-input"
                      value={med.frecuencia}
                      onChange={(e) => updateMedicamento(recetaIndex, medIndex, 'frecuencia', e.target.value)}
                      placeholder="Ej: Cada 8h"
                    />
                  </div>
                  <div className="wizard-field">
                    <label>Duración</label>
                    <input
                      className="wizard-input"
                      value={med.duracion}
                      onChange={(e) => updateMedicamento(recetaIndex, medIndex, 'duracion', e.target.value)}
                      placeholder="Ej: 7 días"
                    />
                  </div>
                </div>
                {receta.medicamentos.length > 1 && (
                  <button
                    className="wizard-btn-icon wizard-btn-icon--danger"
                    onClick={() => removeMedicamento(recetaIndex, medIndex)}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            <button className="wizard-btn wizard-btn--text" onClick={() => addMedicamento(recetaIndex)}>
              <Plus size={14} />
              Agregar medicamento
            </button>
          </div>

          <div className="wizard-field">
            <label>Indicaciones</label>
            <textarea
              className="wizard-textarea"
              rows={2}
              value={receta.indicaciones}
              onChange={(e) => updateReceta(recetaIndex, 'indicaciones', e.target.value)}
              placeholder="Indicaciones especiales para el paciente"
            />
          </div>

          <div className="wizard-field">
            <label>Observaciones</label>
            <textarea
              className="wizard-textarea"
              rows={2}
              value={receta.observaciones}
              onChange={(e) => updateReceta(recetaIndex, 'observaciones', e.target.value)}
              placeholder="Notas adicionales (opcional)"
            />
          </div>
        </div>
      ))}

      {recetas.length === 0 && (
        <div className="wizard-empty">
          <Pill size={32} />
          <p>No se han agregado recetas</p>
        </div>
      )}
    </div>
  );
}
