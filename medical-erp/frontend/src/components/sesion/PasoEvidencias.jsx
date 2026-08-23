import { useRef } from 'react';
import { Camera, Upload, X, Image, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const TIPOS_EVIDENCIA_KEYS = [
  { value: 'foto_inicio', labelKey: 'foto_antes' },
  { value: 'foto_fin', labelKey: 'foto_despues' },
  { value: 'imagen clinica', labelKey: 'imagen_clinica' },
  { value: 'otro', labelKey: 'otro' },
];

const TIPOS_EVIDENCIA_FALLBACK = [
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
  const { t } = useTranslation('clinical');
  const { t: tP } = useTranslation('patients');
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
      alert(t('archivos_rechazados') + '\n' + errors.join('\n'));
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

  const tiposEvidencia = TIPOS_EVIDENCIA_KEYS.map((item, i) => ({
    value: item.value,
    label: t(item.labelKey, { ns: 'clinical', defaultValue: TIPOS_EVIDENCIA_FALLBACK[i].label }),
  }));

  return (
    <div className="wizard-step">
      <h2 className="wizard-step__title">
        <Camera size={20} />
        {tP('evidencias_fotograficas')}
      </h2>

      <div
        className="wizard-upload-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={40} />
        <h3>{t('arrastre_fotos')}</h3>
        <p>{t('formato_max_archivo')}</p>
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
                  <img src={ev.preview} alt={`${tP('evidencia')} ${index + 1}`} />
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
                  {tiposEvidencia.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
                <input
                  className="wizard-input"
                  value={ev.descripcion}
                  onChange={(e) => updateEvidencia(index, 'descripcion', e.target.value)}
                  placeholder={tP('descripcion_opcional')}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {evidencias.length === 0 && (
        <div className="wizard-empty">
          <Camera size={32} />
          <p>{tP('sin_evidencias')}</p>
        </div>
      )}
    </div>
  );
}
