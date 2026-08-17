import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';

export default function PacienteSeguros({ config, seguros = [], onChange }) {
  const tipos = config?.insuranceTypes || [];

  if (!config?.insurance) return null;

  const handleAdd = () => {
    onChange([
      ...seguros,
      { tipoSeguro: tipos[0] || 'PRINCIPAL', provider: '', policyNumber: '', groupNumber: '', fechaInicio: '', fechaFin: '', activo: true },
    ]);
  };

  const handleChange = (index, field, value) => {
    const updated = seguros.map((seg, i) => (i === index ? { ...seg, [field]: value } : seg));
    onChange(updated);
  };

  const handleRemove = (index) => {
    onChange(seguros.filter((_, i) => i !== index));
  };

  return (
    <div className="form-section">
      <div className="form-section__header">
        <h3 className="form-section__title">Seguros Médicos</h3>
        <button type="button" className="btn btn--secondary btn--sm" onClick={handleAdd}>
          <Plus size={16} /> Agregar seguro
        </button>
      </div>

      {seguros.length === 0 && <p className="form-section__empty">No hay seguros registrados</p>}

      {seguros.map((seg, index) => (
        <div key={index} className="form-row form-row--bordered">
          <div className="form-field form-field--small">
            <label className="form-label">Tipo</label>
            <select
              className="form-select"
              value={seg.tipoSeguro || ''}
              onChange={(e) => handleChange(index, 'tipoSeguro', e.target.value)}
            >
              {tipos.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Provider</label>
            <input
              type="text"
              className="form-input"
              value={seg.provider || ''}
              onChange={(e) => handleChange(index, 'provider', e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Policy #</label>
            <input
              type="text"
              className="form-input"
              value={seg.policyNumber || ''}
              onChange={(e) => handleChange(index, 'policyNumber', e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Group #</label>
            <input
              type="text"
              className="form-input"
              value={seg.groupNumber || ''}
              onChange={(e) => handleChange(index, 'groupNumber', e.target.value)}
            />
          </div>

          <div className="form-field form-field--small">
            <label className="form-label">Inicio</label>
            <input
              type="date"
              className="form-input"
              value={seg.fechaInicio || ''}
              onChange={(e) => handleChange(index, 'fechaInicio', e.target.value)}
            />
          </div>

          <div className="form-field form-field--small">
            <label className="form-label">Fin</label>
            <input
              type="date"
              className="form-input"
              value={seg.fechaFin || ''}
              onChange={(e) => handleChange(index, 'fechaFin', e.target.value)}
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
