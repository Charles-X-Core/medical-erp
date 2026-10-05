import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, Send, CheckCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import SignaturePad from 'signature_pad';
import { zonaIANA } from '../utils/zonaHoraria';

export default function FirmaPage() {
  const { t } = useTranslation('contracts');
  const [searchParams] = useSearchParams();
  const pacienteId = searchParams.get('pacienteId');
  const token = searchParams.get('token');

  const canvasRef = useRef(null);
  const signaturePadRef = useRef(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);

    const pad = new SignaturePad(canvas, {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      penColor: '#1A2332',
      minWidth: 0.5,
      maxWidth: 2.5,
      velocityFilterWeight: 0.7,
    });
    signaturePadRef.current = pad;

    pad.addEventListener('beginStroke', () => setHasSignature(true));
  }, []);

  const clearCanvas = () => {
    signaturePadRef.current?.clear();
    setHasSignature(false);
  };

  const handleSign = async () => {
    if (!hasSignature || !pacienteId) return;
    setSending(true);
    setError('');

    try {
      const canvas = canvasRef.current;
      const firmaBase64 = canvas.toDataURL('image/png');

      const res = await fetch(`/api/v1/consentimientos/templates/1/firmar?pacienteId=${pacienteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firmaImagen: firmaBase64,
          ipAddress: 'web',
          userAgent: navigator.userAgent,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.message || t('errorFirmar'));
      }

      setSent(true);
    } catch (err) {
      setError(err.message || t('errorFirmaEnvio'));
    } finally {
      setSending(false);
    }
  };

  if (!pacienteId) {
    return (
      <div className="firma-page">
        <div className="firma-page__card">
          <AlertTriangle size={48} />
          <h2>{t('enlace_invalido')}</h2>
          <p>{t('noClienteEncontrado')}</p>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="firma-page">
        <div className="firma-page__card firma-page__card--success">
          <CheckCircle size={64} />
          <h2>{t('firmaRegistrada')}</h2>
          <p>{t('firma_exito_text')}</p>
          <span className="firma-page__timestamp">{new Date().toLocaleString('es-PE', { timeZone: zonaIANA() })}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="firma-page">
      <div className="firma-page__card">
        <FileText size={40} className="firma-page__icon" />
        <h2>{t('documentoAdmision')}</h2>
        <p>{t('documento_instruccion')}</p>

        {error && (
          <div className="firma-page__error">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <div className="firma-page__canvas-wrapper">
          <canvas
            ref={canvasRef}
            className="firma-page__canvas"
          />
          <span className="firma-page__canvas-label">{t('firme_aqui')}</span>
        </div>

        <div className="firma-page__actions">
          <button className="firma-page__btn-clear" onClick={clearCanvas}>
            <RotateCcw size={16} /> {t('limpiarFirma')}
          </button>
          <button
            className="firma-page__btn-sign"
            onClick={handleSign}
            disabled={!hasSignature || sending}
          >
            <Send size={16} /> {sending ? t('enviando') : t('confirmarFirmaBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
