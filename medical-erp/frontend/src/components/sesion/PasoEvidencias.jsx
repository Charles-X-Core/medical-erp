import { useRef } from 'react';
import { Camera, Upload, X, Image, AlertTriangle } from 'lucide-react';

const TIPOS_EVIDENCIA = [
  { value: 'foto_inicio', label: 'Foto Antes' },
  { value: 'foto_fin', label: 'Foto Después' },
  { value: 'imagen clinica', label: 'Imagen Clínica' },
  { value: 'otro', label: 'Otro' },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function validateFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `${file.name}: tipo no permitido (solo JPG, PNG, GIF, WebP)`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `${file.name}: excede 10MB (${(file.size / 1024 / 1024).toFixed(1)}MB)`;
  }
  return null;
}

export default function PasoEvidencias({ formData, updateFormData }) {
  const fileInputRef = useRef(null);
  const { evidencias } = formData;

  const handleFiles = (files) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const errors = [];
    const valid = [];

    for (const file of imageFiles) {
      const err = validateFile(file);
      if (err) {
        errors.push(err);
      } else {
        valid.push(file);
      }
    }

    if (errors.length > 0) {
      alert('Archivos rechazados:\n' + errors.join('\n'));
    }

    if (valid.length > 0) {
      const newEvidencias = valid.map((file) => ({
        file,
        tipo: 'otro',
        descripcion: '',
        preview: URL.createObjectURL(file),
      }));
      updateFormData('evidencias', [...evidencias, ...newEvidencias]);
    }
  };

  const handleFileSelect = (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const updateEvidencia = (index, field, value) => {
    const updated = [...evidencias];
    updated[index] = { ...updated[index], [field]: value };
    updateFormData('evidencias', updated);
  };

  const removeEvidencia = (index) => {
    if (evidencias[index]?.preview) {
      URL.revokeObjectURL(evidencias[index].preview);
    }
    updateFormData('evidencias', evidencias.filter((_, i) => i !== index));
  };

  return (
    <div className="wizard-step">
      <h2 className="wizard-step__title">
        <Camera size={20} />
        Evidencias Fotográficas
      </h2>

      <div
        className="wizard-upload-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={40} />
        <h3>Arrastre fotos aquí o haga clic para seleccionar</h3>
        <p>JPG, PNG, GIF, WebP — Máx. 10MB por archivo</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {evidencias.length > 0 && (
        <div className="wizard-evidence-grid">
          {evidencias.map((ev, index) => (
            <div key={index} className="wizard-evidence-card">
              <div className="wizard-evidence-card__preview">
                {ev.preview ? (
                  <img src={ev.preview} alt={`Evidencia ${index + 1}`} />
                ) : (
                  <Image size={32} />
                )}
                <button
                  className="wizard-evidence-card__remove"
                  onClick={() => removeEvidencia(index)}
                >
                  <X size={16} />
                </button>
              </div>
              <div className="wizard-evidence-card__fields">
                <select
                  className="wizard-select"
                  value={ev.tipo}
                  onChange={(e) => updateEvidencia(index, 'tipo', e.target.value)}
                >
                  {TIPOS_EVIDENCIA.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <input
                  className="wizard-input"
                  value={ev.descripcion}
                  onChange={(e) => updateEvidencia(index, 'descripcion', e.target.value)}
                  placeholder="Descripción (opcional)"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {evidencias.length === 0 && (
        <div className="wizard-empty">
          <Camera size={32} />
          <p>No se han agregado evidencias fotográficas</p>
        </div>
      )}
    </div>
  );
}
