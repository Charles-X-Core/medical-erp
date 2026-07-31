import { Trash2, Plus } from 'lucide-react';

export default function PacienteConsentimientos({ config, consentimientos = [], onChange }) {
  const tipos = config?.consent?.types || [];

  if (!config?.consent?.required) return null;

  const handleAdd = () => {
    onChange([
      ...consentimientos,
      { tipo: tipos[0]?.code || '', aceptado: false, fecha: '', version: 'v1.0' },
    ]);
  };

  const handleChange = (index, field, value) => {
    const updated = consentimientos.map((c, i) => (i === index ? { ...c, [field]: value } : c));
    onChange(updated);
  };

  const handleRemove = (index) => {
    onChange(consentimientos.filter((_, i) => i !== index));
  };

  return (
    <div className="form-section">
      <div className="form-section__header">
        <h3 className="form-section__title">Consentimientos</h3>
        <button type="button" className="btn btn--secondary btn--sm" onClick={handleAdd}>
          <Plus size={16} /> Agregar consentimiento
        </button>
      </div>

      {consentimientos.length === 0 && <p className="form-section__empty">No hay consentimientos registrados</p>}

      {consentimientos.map((cons, index) => (
        <div key={index} className="form-row form-row--bordered">
          <div className="form-field form-field--medium">
            <label className="form-label">Tipo</label>
            <select
              className="form-select"
              value={cons.tipo || ''}
              onChange={(e) => handleChange(index, 'tipo', e.target.value)}
            >
              {tipos.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field form-field--checkbox">
            <label className="form-label">Aceptado</label>
            <input
              type="checkbox"
              checked={cons.aceptado || false}
              onChange={(e) => handleChange(index, 'aceptado', e.target.checked)}
            />
          </div>

          <div className="form-field form-field--small">
            <label className="form-label">Fecha</label>
            <input
              type="date"
              className="form-input"
              value={cons.fecha || ''}
              onChange={(e) => handleChange(index, 'fecha', e.target.value)}
            />
          </div>

          <div className="form-field form-field--small">
            <label className="form-label">Versión</label>
            <input
              type="text"
              className="form-input"
              value={cons.version || ''}
              onChange={(e) => handleChange(index, 'version', e.target.value)}
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
