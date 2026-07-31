import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';

export default function PacienteDocumentos({ config, documentos = [], onChange }) {
  const tipos = config?.documentTypes || [];

  const handleAdd = () => {
    const defaultType = config?.defaultDocType || tipos[0]?.code || '';
    onChange([
      ...documentos,
      { tipoDocumento: defaultType, numeroDocumento: '', paisEmision: '', fechaVencimiento: '', esPrincipal: false },
    ]);
  };

  const handleChange = (index, field, value) => {
    const updated = documentos.map((doc, i) => {
      if (i !== index) return doc;
      return { ...doc, [field]: value };
    });
    onChange(updated);
  };

  const handleRemove = (index) => {
    onChange(documentos.filter((_, i) => i !== index));
  };

  const getTipoConfig = (code) => tipos.find((t) => t.code === code) || {};

  return (
    <div className="form-section">
      <div className="form-section__header">
        <h3 className="form-section__title">Documentos de Identidad</h3>
        <button type="button" className="btn btn--secondary btn--sm" onClick={handleAdd}>
          <Plus size={16} /> Agregar documento
        </button>
      </div>

      {documentos.length === 0 && (
        <p className="form-section__empty">No hay documentos registrados</p>
      )}

      {documentos.map((doc, index) => {
        const tipoConfig = getTipoConfig(doc.tipoDocumento);
        return (
          <div key={index} className="form-row form-row--bordered">
            <div className="form-field form-field--small">
              <label className="form-label">Tipo</label>
              <select
                className="form-select"
                value={doc.tipoDocumento || ''}
                onChange={(e) => handleChange(index, 'tipoDocumento', e.target.value)}
              >
                {tipos.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Número</label>
              <input
                type="text"
                className="form-input"
                placeholder={tipoConfig.placeholder || ''}
                maxLength={tipoConfig.maxLength || 50}
                value={doc.numeroDocumento || ''}
                onChange={(e) => handleChange(index, 'numeroDocumento', e.target.value)}
              />
            </div>

            <div className="form-field form-field--small">
              <label className="form-label">País emisión</label>
              <input
                type="text"
                className="form-input"
                maxLength={2}
                value={doc.paisEmision || ''}
                onChange={(e) => handleChange(index, 'paisEmision', e.target.value.toUpperCase())}
              />
            </div>

            <div className="form-field form-field--small">
              <label className="form-label">Vencimiento</label>
              <input
                type="date"
                className="form-input"
                value={doc.fechaVencimiento || ''}
                onChange={(e) => handleChange(index, 'fechaVencimiento', e.target.value)}
              />
            </div>

            <div className="form-field form-field--checkbox">
              <label className="form-label">Principal</label>
              <input
                type="checkbox"
                checked={doc.esPrincipal || false}
                onChange={(e) => handleChange(index, 'esPrincipal', e.target.checked)}
              />
            </div>

            <button type="button" className="btn btn--icon btn--danger" onClick={() => handleRemove(index)}>
              <Trash2 size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
