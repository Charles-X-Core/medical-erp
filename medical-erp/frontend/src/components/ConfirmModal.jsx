import { useEffect, useRef } from 'react';
import { X, AlertTriangle, UserCheck, UserX } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ConfirmModal({ open, title, message, onConfirm, onCancel, variant = 'danger' }) {
  const { t } = useTranslation('common');
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onCancel]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const Icon = variant === 'activate' ? UserCheck : UserX;
  const iconClass = variant === 'activate' ? 'confirm-modal__icon--activate' : 'confirm-modal__icon--danger';
  const confirmClass = variant === 'activate' ? 'confirm-modal__btn--activate' : 'confirm-modal__btn--danger';

  return (
    <div className="confirm-modal" ref={overlayRef} onClick={(e) => { if (e.target === overlayRef.current) onCancel(); }}>
      <div className="confirm-modal__box">
        <button className="confirm-modal__close" onClick={onCancel}>
          <X size={18} />
        </button>
        <div className={`confirm-modal__icon ${iconClass}`}>
          <Icon size={40} />
        </div>
        <h3 className="confirm-modal__title">{title}</h3>
        <p className="confirm-modal__message">{message}</p>
        <div className="confirm-modal__actions">
          <button className="confirm-modal__btn confirm-modal__btn--cancel" onClick={onCancel}>
            {t('cancelar', 'Cancelar')}
          </button>
          <button className={`confirm-modal__btn ${confirmClass}`} onClick={onConfirm}>
            {variant === 'activate' ? t('activar', 'Activar') : t('desactivar', 'Desactivar')}
          </button>
        </div>
      </div>
    </div>
  );
}
