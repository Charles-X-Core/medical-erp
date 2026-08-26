import { Send, CheckCircle, Shield, Tablet, Eye, Loader, AlertCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { contratoPwaService } from '../../services/contratoPwaService';
import HtmlDocViewer from '../common/HtmlDocViewer';

const POLL_INTERVAL = 3000;

export default function PasoContrato({ pacienteId, pacienteNombre, membresias, onMembresiasChange, contratoFirmado, onContratoFirmado }) {
  const { t } = useTranslation('patients');
  const { t: tContract } = useTranslation('contracts');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [token, setToken] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [polling, setPolling] = useState(false);
  const [pollingError, setPollingError] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [alreadySigned, setAlreadySigned] = useState(false);
  const pollingRef = useRef(null);
  const pollErrorsRef = useRef(0);

  const yaTieneMembresia = membresias.length > 0;
  const membresiaActiva = membresias.find(m => m.estado === 'activa');

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  useEffect(() => {
    if (!pacienteId) return;

    let cancelled = false;
    setLoading(true);
    setAlreadySigned(false);
    setPreviewHtml('');

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
        onContratoFirmado(true, ck.sessionId);
      }
    }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [pacienteId]);

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
            onContratoFirmado(true, st.sessionId);
          }
        } catch {
          pollErrorsRef.current += 1;
          if (pollErrorsRef.current >= 3) {
            clearInterval(pollingRef.current);
            setPolling(false);
            setPollingError(tContract('error_conexion_servidor'));
          }
        }
      }, POLL_INTERVAL);
    } catch {
      // handle error
    } finally {
      setSending(false);
    }
  };

  const handleVerPDF = () => {
    if (sessionId) {
      window.open(`/api/v1/contrato-pwa/${sessionId}/pdf`, '_blank');
    }
  };

  const viewerOverlay = polling ? (
    <>
      <Loader size={24} className="html-doc-viewer__spin" />
      <span>{tContract('esperando_firma_tablet')}</span>
      <div className="html-doc-viewer__waiting">
        <div className="html-doc-viewer__waiting-dot" />
        <div className="html-doc-viewer__waiting-dot" />
        <div className="html-doc-viewer__waiting-dot" />
      </div>
    </>
  ) : null;

  const viewerActions = !alreadySigned && !polling ? (
    <button className="wizard-step__btn-firma" onClick={handleEnviarTablet} disabled={sending}>
      <Tablet size={18} /> {sending ? tContract('enviando') : tContract('enviar_tablet_firma')}
    </button>
  ) : null;

  const viewerFooter = alreadySigned ? (
    <div className="wizard-step__contrato-firma-enviado">
      <CheckCircle size={20} className="wizard-step__firma-check" />
      <span>{tContract('contrato_firmado_exito')}</span>
      {sessionId && (
        <button className="wizard-step__btn-pdf" onClick={handleVerPDF}>
          <Eye size={16} /> {tContract('ver_pdf_firmado')}
        </button>
      )}
    </div>
  ) : pollingError && !polling ? (
    <div className="wizard-step__contrato-firma-pendiente" style={{ color: '#dc2626' }}>
      <p><AlertCircle size={16} /> {pollingError}</p>
      <button className="wizard-step__btn-firma" onClick={handleEnviarTablet}>
        <Tablet size={18} /> {tContract('reenviar_tablet')}
      </button>
    </div>
  ) : null;

  return (
    <div className="wizard-step">
      <div className="wizard-step__header">
        <Shield size={24} />
        <h3>{tContract('contrato_membresia')}</h3>
        <p>{tContract('optimal_health_now')}</p>
      </div>

      {yaTieneMembresia && membresiaActiva && (
        <div className="wizard-step__contrato-estado">
          <Shield size={20} />
          <div className="wizard-step__contrato-estado-info">
            <span className="wizard-step__contrato-estado-tipo">{tContract('membresia_vitalicia')}</span>
            <span className="wizard-step__contrato-estado-detalle">
              {tContract('inicio')}: {membresiaActiva.fechaInicio} · {tContract('costo')}: $10.00
            </span>
          </div>
          <CheckCircle size={18} className="wizard-step__contrato-estado-check" />
        </div>
      )}

      {loading && (
        <div className="wizard-step__preview-loading">
          <Loader size={20} className="wizard-step__spin" />
          <span>{tContract('cargando_contrato')}</span>
        </div>
      )}

      {!loading && previewHtml && (
        <HtmlDocViewer
          title={tContract('contrato_membresia_ohm')}
          htmlContent={previewHtml}
          badge={alreadySigned ? tContract('firmado') : null}
          maxHeight="520px"
          overlay={viewerOverlay}
          actions={viewerActions}
          footer={viewerFooter}
        />
      )}

      {!loading && !previewHtml && (
        <div className="wizard-step__preview-loading">
          <AlertCircle size={20} />
          <span>{tContract('contract_error_load')}</span>
        </div>
      )}
    </div>
  );
}
