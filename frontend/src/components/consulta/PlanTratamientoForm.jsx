import { Trash2, Plus } from 'lucide-react';

export default function PlanTratamientoForm({ value = {}, onChange }) {
  const medicamentos = value?.medicamentos || [];
  const indicaciones = value?.indicaciones || '';

  const handleAddMedicamento = () => {
    onChange({
      ...value,
      medicamentos: [...medicamentos, { nombre: '', dosis: '', frecuencia: '', duracion: '' }],
    });
  };

  const handleMedChange = (index, field, val) => {
    const updated = medicamentos.map((m, i) => (i === index ? { ...m, [field]: val } : m));
    onChange({ ...value, medicamentos: updated });
  };

  const handleRemoveMedicamento = (index) => {
    onChange({ ...value, medicamentos: medicamentos.filter((_, i) => i !== index) });
  };

  return (
    <div className="form-section">
      <div className="form-section__header">
        <h3 className="form-section__title">Plan de Tratamiento</h3>
        <button type="button" className="btn btn--secondary btn--sm" onClick={handleAddMedicamento}>
          <Plus size={16} /> Agregar medicamento
        </button>
      </div>

      {medicamentos.length === 0 && <p className="form-section__empty">No hay medicamentos registrados</p>}

      {medicamentos.map((med, index) => (
        <div key={index} className="form-row form-row--bordered">
          <div className="form-field">
            <label className="form-label">Medicamento</label>
            <input
              type="text"
              className="form-input"
              value={med.nombre || ''}
              onChange={(e) => handleMedChange(index, 'nombre', e.target.value)}
            />
          </div>
          <div className="form-field form-field--small">
            <label className="form-label">Dosis</label>
            <input
              type="text"
              className="form-input"
              value={med.dosis || ''}
              onChange={(e) => handleMedChange(index, 'dosis', e.target.value)}
            />
          </div>
          <div className="form-field form-field--small">
            <label className="form-label">Frecuencia</label>
            <input
              type="text"
              className="form-input"
              value={med.frecuencia || ''}
              onChange={(e) => handleMedChange(index, 'frecuencia', e.target.value)}
            />
          </div>
          <div className="form-field form-field--small">
            <label className="form-label">Duración</label>
            <input
              type="text"
              className="form-input"
              value={med.duracion || ''}
              onChange={(e) => handleMedChange(index, 'duracion', e.target.value)}
            />
          </div>
          <button type="button" className="btn btn--icon btn--danger" onClick={() => handleRemoveMedicamento(index)}>
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      <div className="form-field">
        <label className="form-label">Indicaciones generales</label>
        <textarea
          className="form-textarea"
          rows={3}
          value={indicaciones}
          onChange={(e) => onChange({ ...value, indicaciones: e.target.value })}
        />
      </div>
    </div>
  );
}
