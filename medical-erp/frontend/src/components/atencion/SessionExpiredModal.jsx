import { useState, useEffect, useRef } from 'react';
import { X, Clock, AlertTriangle, CheckCircle, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import agendaService from '../../services/agendaService';
import { horaMostrar, horaMostrarMin } from '../../utils/zonaHoraria';

export default function SessionExpiredModal({ open, cita, onFinalized, onExtended, onDismiss }) {
  const { t } = useTranslation('clinical');
  const overlayRef = useRef(null);
  const [action, setAction] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => { if (e.key === 'Escape') onDismiss(); };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, onDismiss]);

  if (!open || !cita) return null;

  const duracion = cita.duracionMinutos || 30;
  const horaInicio = (horaMostrar(cita.hora, cita.fecha) || '').substring(0, 5) || '??:??';
  const [h, m] = String(cita.hora || '').split(':').map(Number);
  const finMin = (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0) + duracion;
  const horaFin = horaMostrarMin(finMin, cita.fecha);

  const handleFinalize = async () => {
    setAction('finalizing');
    try {
      await agendaService.completarCita(cita.id);
      setMsg('');
      onFinalized();
    } catch (err) {
      setMsg(err.message || 'Error');
      setAction(null);
    }
  };

  const handleExtend = async () => {
    setAction('extending');
    try {
      const res = await agendaService.extenderSesion(cita.id, 15);
      const nuevaDuracion = res.data?.citaExtendida?.duracionMinutos;
      setMsg('');
      onExtended(nuevaDuracion);
    } catch (err) {
      setMsg(err.message || 'Error');
      setAction(null);
    }
  };

  return (
    <div className="onboarding-modal" ref={overlayRef} onClick={(e) => { if (e.target === overlayRef.current) onDismiss(); }}>
      <div className="onboarding-modal__box">
        <button className="onboarding-modal__close" onClick={onDismiss}>
          <X size={18} />
        </button>

        <div className="onboarding-modal__icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
          <AlertTriangle size={40} />
        </div>

        <h3 className="onboarding-modal__title">{t('session_expired_title')}</h3>
        <p className="onboarding-modal__subtitle">{t('session_expired_message')}</p>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 14, color: '#64748b' }}>
          <Clock size={14} />
          <span>{horaInicio} — {horaFin} · {duracion} min</span>
        </div>

        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20, textAlign: 'center' }}>{t('session_expired_options')}</p>

        {msg && <div style={{ background: '#FEF2F2', color: '#DC2626', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{msg}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            className="onboarding-modal__btn onboarding-modal__btn--save"
            onClick={handleFinalize}
            disabled={!!action}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <CheckCircle size={16} />
            {action === 'finalizing' ? '...' : t('finalize_session')}
          </button>
          <button
            className="onboarding-modal__btn onboarding-modal__btn--save"
            onClick={handleExtend}
            disabled={!!action}
            style={{ width: '100%', justifyContent: 'center', background: '#F59E0B' }}
          >
            <Plus size={16} />
            {action === 'extending' ? '...' : t('extend_session')}
          </button>
          <button
            className="onboarding-modal__btn onboarding-modal__btn--skip"
            onClick={onDismiss}
            disabled={!!action}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {t('close', { ns: 'common' })}
          </button>
        </div>
      </div>
    </div>
  );
}
