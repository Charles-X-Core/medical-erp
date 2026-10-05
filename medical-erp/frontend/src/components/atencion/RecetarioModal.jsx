import { useState } from 'react';
import { X, Plus, Trash2, Send, FileText, Loader2, CheckCircle, Pill } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { recetaService } from '../../services/recetaService';
import { toLocalDateTime } from '../../utils/laTimezone';

export default function RecetarioModal({ open, onClose, paciente, tratamientoId, sesionId, clinicaId, onSaved }) {
  const { t } = useTranslation('patients');
  const { t: tCommon } = useTranslation('common');
  const [medicamentos, setMedicamentos] = useState([{ medicamento: '', dosis: '', frecuencia: '', duracion: '', indicaciones: '' }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedRecetas, setSavedRecetas] = useState([]);
  const [sendingEmail, setSendingEmail] = useState(null);

  if (!open) return null;

  const handleChange = (index, field, value) => {
    setMedicamentos((prev) => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const handleAdd = () => {
    setMedicamentos((prev) => [...prev, { medicamento: '', dosis: '', frecuencia: '', duracion: '', indicaciones: '' }]);
  };

  const handleRemove = (index) => {
    if (medicamentos.length <= 1) return;
    setMedicamentos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const validMeds = medicamentos.filter((m) => m.medicamento.trim());
    if (validMeds.length === 0) return;

    setSaving(true);
    setError('');
    try {
      const results = [];
      for (const med of validMeds) {
        const res = await recetaService.create({
          clinicaId,
          pacienteId: paciente?.id,
          tratamientoId,
          sesionId,
          fecha: toLocalDateTime(),
          ...med,
        });
        if (res?.success) results.push(res.data);
      }
      setSavedRecetas(results);
      if (results.length > 0) onSaved?.(results);
    } catch (err) {
      setError(err.message || tCommon('error_saving'));
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = async (recetaId) => {
    setSendingEmail(recetaId);
    try {
      await recetaService.enviarPorEmail(
        recetaId,
        `Medical Prescription - ${paciente?.nombres || ''} ${paciente?.apellidoPaterno || ''}`,
        ''
      );
      setTimeout(() => setSendingEmail(null), 2000);
    } catch (err) {
      console.error('Error sending email:', err);
      setSendingEmail(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="recetario-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="recetario-modal__header">
          <div className="recetario-modal__header-left">
            <div className="recetario-modal__header-icon"><Pill size={20} /></div>
            <div>
              <h3 className="recetario-modal__title">{t('recetario')}</h3>
              <span className="recetario-modal__subtitle">
                {paciente?.nombres} {paciente?.apellidoPaterno}
              </span>
            </div>
          </div>
          <button className="recetario-modal__close" onClick={onClose}><X size={18} /></button>
        </div>

        {savedRecetas.length > 0 ? (
          /* ─── Saved View ─── */
          <div className="recetario-modal__saved">
            <div className="recetario-modal__saved-icon">
              <CheckCircle size={48} />
            </div>
            <h4>{t('recetas_guardadas', { count: savedRecetas.length })}</h4>
            <div className="recetario-modal__saved-list">
              {savedRecetas.map((r) => (
                <div key={r.id} className="recetario-modal__saved-item">
                  <div className="recetario-modal__saved-info">
                    <span className="recetario-modal__saved-name">{r.medicamento}</span>
                    <span className="recetario-modal__saved-meta">{r.dosis} {r.frecuencia ? `· ${r.frecuencia}` : ''} {r.duracion ? `· ${r.duracion}` : ''}</span>
                  </div>
                  <div className="recetario-modal__saved-actions">
                    <a className="btn btn--ghost btn--sm" href={recetaService.getPdfUrl(r.id)} target="_blank" rel="noopener noreferrer">
                      <FileText size={14} /> PDF
                    </a>
                    <button className="btn btn--ghost btn--sm" onClick={() => handleSendEmail(r.id)} disabled={sendingEmail === r.id}>
                      {sendingEmail === r.id ? <Loader2 size={14} className="spinner" /> : <Send size={14} />} {t('enviar')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn--secondary recetario-modal__close-btn" onClick={onClose}>{tCommon('cerrar')}</button>
          </div>
        ) : (
          /* ─── Form View ─── */
          <div className="recetario-modal__body">
            <div className="recetario-modal__meds">
              {medicamentos.map((med, index) => (
                <div key={index} className="recetario-med">
                  <div className="recetario-med__header">
                    <span className="recetario-med__num">{index + 1}</span>
                    {medicamentos.length > 1 && (
                      <button className="recetario-med__remove" onClick={() => handleRemove(index)}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Medication name — full width */}
                  <div className="recetario-med__row recetario-med__row--full">
                    <label className="recetario-med__label">{t('medicamento')} *</label>
                    <input type="text" className="recetario-med__input"
                      placeholder={t('nombre_medicamento')}
                      value={med.medicamento} onChange={(e) => handleChange(index, 'medicamento', e.target.value)} />
                  </div>

                  {/* Dosage / Frequency / Duration — 3 columns */}
                  <div className="recetario-med__row recetario-med__row--triple">
                    <div className="recetario-med__field">
                      <label className="recetario-med__label">{t('dosis')}</label>
                      <input type="text" className="recetario-med__input"
                        placeholder={t('dosis_placeholder')}
                        value={med.dosis} onChange={(e) => handleChange(index, 'dosis', e.target.value)} />
                    </div>
                    <div className="recetario-med__field">
                      <label className="recetario-med__label">{t('frecuencia')}</label>
                      <input type="text" className="recetario-med__input"
                        placeholder={t('frecuencia_placeholder')}
                        value={med.frecuencia} onChange={(e) => handleChange(index, 'frecuencia', e.target.value)} />
                    </div>
                    <div className="recetario-med__field">
                      <label className="recetario-med__label">{t('duracion')}</label>
                      <input type="text" className="recetario-med__input"
                        placeholder={t('duracion_placeholder')}
                        value={med.duracion} onChange={(e) => handleChange(index, 'duracion', e.target.value)} />
                    </div>
                  </div>

                  {/* Instructions — full width */}
                  <div className="recetario-med__row recetario-med__row--full">
                    <label className="recetario-med__label">{t('indicaciones')}</label>
                    <textarea className="recetario-med__textarea" rows={2}
                      placeholder={t('indicaciones_placeholder')}
                      value={med.indicaciones} onChange={(e) => handleChange(index, 'indicaciones', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>

            <button className="btn btn--ghost recetario-modal__add" onClick={handleAdd}>
              <Plus size={16} /> {t('agregar_medicamento')}
            </button>

            {error && <div className="recetario-modal__error">{error}</div>}

            <div className="recetario-modal__footer">
              <button className="btn btn--secondary" onClick={onClose}>{tCommon('cancelar')}</button>
              <button className="btn btn--primary" onClick={handleSave}
                disabled={saving || !medicamentos.some((m) => m.medicamento.trim())}>
                {saving ? <><Loader2 size={16} className="spinner" /> {tCommon('guardando')}</> : <><Pill size={16} /> {t('guardar_recetas')}</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
