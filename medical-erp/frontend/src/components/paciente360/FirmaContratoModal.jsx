import { useTranslation } from 'react-i18next';
import { Send, CheckCircle, Shield, Tablet, Eye, Loader, AlertCircle, X, Mail } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { contratoPwaService } from '../../services/contratoPwaService';
import HtmlDocViewer from '../common/HtmlDocViewer';

const POLL_INTERVAL = 3000;

export default function FirmaContratoModal({ open, onClose, pacienteId, pacienteNombre, onSigned }) {
  const { t } = useTranslation(['patients', 'contracts']);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [token, setToken] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [polling, setPolling] = useState(false);
  const [pollingError, setPollingError] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [alreadySigned, setAlreadySigned] = useState(false);
  const pollingRef = useRef(null);
  const pollErrorsRef = useRef(0);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open || !pacienteId) return;

    let cancelled = false;
    setLoading(true);
    setAlreadySigned(false);
    setPreviewHtml('');
    setPolling(false);
    setPollingError('');
    setToken('');
    setSessionId(null);
    if (pollingRef.current) clearInterval(pollingRef.current);

    Promise.all([
      contratoPwaService.getPreview(pacienteId, 'CONTRATO_MEMBRESIA'),
      contratoPwaService.checkFirmado(pacienteId).catch(() => ({ data: { status: 'NO_FIRMADO' } }))
    ]).then(([previewRes, checkRes]) => {
      if (cancelled) return;
      const pv = previewRes.data || previewRes;
      const ck = checkRes.data || checkRes;

      if (pv.htmlContent) setPreviewHtml(pv.htmlContent);

      if (ck.status === 'FIRMADO') {
        setAlreadySigned(true);
        setSessionId(ck.sessionId);
      }
    }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [open, pacienteId]);

  const handleEnviarTablet = async () => {
    setSending(true);
    setPollingError('');
    try {
      const res = await contratoPwaService.enviar(pacienteId, 'CONTRATO_MEMBRESIA');
      const d = res.data || res;
      setToken(d.token);
      setSessionId(d.sessionId);
      setAlreadySigned(false);
      setPolling(true);

      pollingRef.current = setInterval(async () => {
        try {
          const statusRes = await contratoPwaService.getStatus(d.token);
          const st = statusRes.data || statusRes;
          pollErrorsRef.current = 0;
          setPollingError('');
          if (st.status === 'FIRMADO') {
            clearInterval(pollingRef.current);
            setPolling(false);
            setSessionId(st.sessionId);
            setAlreadySigned(true);
            onSigned?.();
          }
        } catch {
          pollErrorsRef.current += 1;
          if (pollErrorsRef.current >= 3) {
            clearInterval(pollingRef.current);
            setPolling(false);
            setPollingError(t('firma_error_conexion'));
          }
        }
      }, POLL_INTERVAL);
    } catch {
      setPollingError(t('firma_error_envio'));
    } finally {
      setSending(false);
    }
  };

  const handleVerPDF = () => {
    if (sessionId) {
      window.open(`/api/v1/contrato-pwa/${sessionId}/pdf`, '_blank');
    }
  };

  const handleEnviarEmail = async () => {
    if (!sessionId) return;
    setEmailSending(true);
    try {
      await contratoPwaService.enviarEmail(sessionId);
      setEmailSent(true);
    } catch {
      // silent
    } finally {
      setEmailSending(false);
    }
  };

  const handleClose = () => {
    if (polling) return;
    onClose?.();
  };

  if (!open) return null;

  const viewerOverlay = polling ? (
    <>
      <Loader size={24} className="html-doc-viewer__spin" />
      <span>{t('firma_esperando')}</span>
      <div className="html-doc-viewer__waiting">
        <div className="html-doc-viewer__waiting-dot" />
        <div className="html-doc-viewer__waiting-dot" />
        <div className="html-doc-viewer__waiting-dot" />
      </div>
    </>
  ) : null;

  const viewerActions = !alreadySigned && !polling ? (
    <button className="wizard-step__btn-firma" onClick={handleEnviarTablet} disabled={sending}>
      <Tablet size={18} /> {sending ? t('firma_enviando') : t('firma_enviar_tablet')}
    </button>
  ) : null;

  const viewerFooter = alreadySigned ? (
    <div className="wizard-step__contrato-firma-enviado">
      <CheckCircle size={20} className="wizard-step__firma-check" />
      <span>{t('firma_exito')}</span>
      {sessionId && (
        <>
          <button className="wizard-step__btn-pdf" onClick={handleVerPDF}>
            <Eye size={16} /> {t('firma_ver_pdf')}
          </button>
          <button
            className="wizard-step__btn-pdf"
            onClick={handleEnviarEmail}
            disabled={emailSending || emailSent}
            style={{ marginLeft: '8px' }}
          >
            <Mail size={16} /> {emailSent ? t('firma_email_sent') : emailSending ? t('firma_enviando') : t('firma_enviar_email')}
          </button>
        </>
      )}
    </div>
  ) : pollingError && !polling ? (
    <div className="wizard-step__contrato-firma-pendiente" style={{ color: '#dc2626' }}>
      <p><AlertCircle size={16} /> {pollingError}</p>
      <button className="wizard-step__btn-firma" onClick={handleEnviarTablet}>
        <Tablet size={18} /> {t('firma_reenviar')}
      </button>
    </div>
  ) : null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" style={{ maxWidth: '900px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <div className="modal__title">
            <Shield size={20} />
            <div>
              <span>{t('contract_title')}</span>
              <span className="firma-contrato-modal__patient">{pacienteNombre}</span>
            </div>
          </div>
          <button className="modal__close" onClick={handleClose} disabled={polling}>
            <X size={18} />
          </button>
        </div>

        <div className="modal__body">
          {loading && (
            <div className="firma-contrato-modal__loading">
              <Loader size={20} className="wizard-step__spin" />
              <span>{t('contract_loading')}</span>
            </div>
          )}

          {!loading && previewHtml && (
            <HtmlDocViewer
              title={t('contract_preview')}
              htmlContent={previewHtml}
              badge={alreadySigned ? t('firmado', { ns: 'patients' }) : null}
              maxHeight="700px"
              overlay={viewerOverlay}
              actions={viewerActions}
              footer={viewerFooter}
            />
          )}

          {!loading && !previewHtml && (
            <div className="firma-contrato-modal__loading">
              <AlertCircle size={20} />
              <span>{t('contract_error_load')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
