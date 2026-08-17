import { Trash2, Plus } from 'lucide-react';

export default function DiagnosticoForm({ diagnosticos = [], onChange }) {
  const handleAdd = () => {
    onChange([...diagnosticos, { codigo: '', descripcion: '', principal: false }]);
  };

  const handleChange = (index, field, value) => {
    const updated = diagnosticos.map((d, i) => (i === index ? { ...d, [field]: value } : d));
    onChange(updated);
  };

  const handleRemove = (index) => {
    onChange(diagnosticos.filter((_, i) => i !== index));
  };

  return (
    <div className="form-section">
      <div className="form-section__header">
        <h3 className="form-section__title">Diagnósticos</h3>
        <button type="button" className="btn btn--secondary btn--sm" onClick={handleAdd}>
          <Plus size={16} /> Agregar diagnóstico
        </button>
      </div>

      {diagnosticos.length === 0 && <p className="form-section__empty">No hay diagnósticos registrados</p>}

      {diagnosticos.map((diag, index) => (
        <div key={index} className="form-row form-row--bordered">
          <div className="form-field form-field--small">
            <label className="form-label">Código (CIE-10)</label>
            <input
              type="text"
              className="form-input"
              value={diag.codigo || ''}
              onChange={(e) => handleChange(index, 'codigo', e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Descripción</label>
            <input
              type="text"
              className="form-input"
              value={diag.descripcion || ''}
              onChange={(e) => handleChange(index, 'descripcion', e.target.value)}
            />
          </div>

          <div className="form-field form-field--checkbox">
            <label className="form-label">Principal</label>
            <input
              type="checkbox"
              checked={diag.principal || false}
              onChange={(e) => handleChange(index, 'principal', e.target.checked)}
            />
          </div>

          <button type="button" className="btn btn--icon btn--danger" onClick={() => handleRemove(index)}>
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
