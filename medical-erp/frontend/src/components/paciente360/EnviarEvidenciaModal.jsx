import { useState } from 'react';
import { X, Send, Mail, FileImage, CheckCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { evidenciaService } from '../../services/evidenciaService';

export default function EnviarEvidenciaModal({ open, evidencia, paciente, onClose }) {
  const { t } = useTranslation('patients');
  const { t: tCommon } = useTranslation('common');
  const [asunto, setAsunto] = useState(`Evidencia clínica - ${paciente?.nombres || ''}`);
  const [mensaje, setMensaje] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  if (!open || !evidencia) return null;

  const handleSend = async () => {
    setSending(true);
    setError('');
    try {
      await evidenciaService.sendToPatient(evidencia.id, asunto, mensaje);
      setSent(true);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err.message || t('error_enviar_evidencia'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content enviar-evidencia-modal" onClick={e => e.stopPropagation()}>
        <div className="enviar-evidencia-modal__header">
          <h3><Mail size={18} /> {t('enviar_evidencia_paciente')}</h3>
          <button className="enviar-evidencia-modal__close" onClick={onClose}><X size={18} /></button>
        </div>

        {sent ? (
          <div className="enviar-evidencia-modal__success">
            <CheckCircle size={40} style={{ color: '#22C55E' }} />
            <h4>{t('evidencia_enviada')}</h4>
            <p>{t('evidencia_enviada_exito')}</p>
          </div>
        ) : (
          <div className="enviar-evidencia-modal__body">
            <div className="enviar-evidencia-modal__preview">
              <FileImage size={20} />
              <div>
                <span className="enviar-evidencia-modal__preview-name">{evidencia.archivoNombre}</span>
                <span className="enviar-evidencia-modal__preview-desc">{evidencia.descripcion || ''}</span>
              </div>
            </div>

            <div className="enviar-evidencia-modal__field">
              <label>{t('para')}</label>
              <input
                type="email"
                value={paciente?.email || ''}
                disabled
                className="enviar-evidencia-modal__input"
              />
            </div>

            <div className="enviar-evidencia-modal__field">
              <label>{t('asunto')}</label>
              <input
                type="text"
                value={asunto}
                onChange={e => setAsunto(e.target.value)}
                className="enviar-evidencia-modal__input"
              />
            </div>

            <div className="enviar-evidencia-modal__field">
              <label>{t('mensaje_opcional')}</label>
              <textarea
                value={mensaje}
                onChange={e => setMensaje(e.target.value)}
                className="enviar-evidencia-modal__textarea"
                placeholder={t('escribir_mensaje_paciente')}
                rows={4}
              />
            </div>

            {error && <div className="enviar-evidencia-modal__error">{error}</div>}

            <div className="enviar-evidencia-modal__actions">
              <button className="btn btn--ghost" onClick={onClose}>{tCommon('cancelar')}</button>
              <button className="btn btn--primary" onClick={handleSend} disabled={sending || !asunto.trim()}>
                {sending ? <><Loader2 size={16} className="spinner" /> {t('enviando')}</> : <><Send size={16} /> {t('enviar')}</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
