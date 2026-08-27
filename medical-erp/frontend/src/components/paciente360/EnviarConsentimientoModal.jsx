import { useState } from 'react';
import { X, Send, Mail, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/apiClient';

export default function EnviarConsentimientoModal({ open, consentimiento, paciente, onClose }) {
  const { t } = useTranslation('patients');
  const { t: tCommon } = useTranslation('common');
  const [asunto, setAsunto] = useState(`Consentimiento - ${consentimiento?.tipo || 'Documento'} - ${paciente?.nombres || ''}`);
  const [mensaje, setMensaje] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  if (!open || !consentimiento) return null;

  const handleSend = async () => {
    setSending(true);
    setError('');
    try {
      await apiClient(`/api/v1/pacientes/${paciente?.id}/consentimientos/${consentimiento.id}/enviar-email`, {
        method: 'POST',
        body: JSON.stringify({ asunto, mensaje }),
      });
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
          <h3><Mail size={18} /> {t('enviar_consentimiento')}</h3>
          <button className="enviar-evidencia-modal__close" onClick={onClose}><X size={18} /></button>
        </div>

        {sent ? (
          <div className="enviar-evidencia-modal__success">
            <CheckCircle size={40} style={{ color: '#22C55E' }} />
            <h4>{t('consentimiento_enviado')}</h4>
            <p>{t('consentimiento_enviado_exito')}</p>
          </div>
        ) : (
          <div className="enviar-evidencia-modal__body">
            <div className="enviar-evidencia-modal__preview">
              <FileText size={20} />
              <div>
                <span className="enviar-evidencia-modal__preview-name">{consentimiento.tipo || consentimiento.templateNombre}</span>
                <span className="enviar-evidencia-modal__preview-desc">{consentimiento.estado || '—'}</span>
              </div>
            </div>

            <div className="enviar-evidencia-modal__field">
              <label>{t('para')}</label>
              <input type="email" value={paciente?.email || ''} disabled className="enviar-evidencia-modal__input" />
            </div>

            <div className="enviar-evidencia-modal__field">
              <label>{t('asunto')}</label>
              <input type="text" value={asunto} onChange={e => setAsunto(e.target.value)} className="enviar-evidencia-modal__input" />
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
