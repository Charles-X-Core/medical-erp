import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, Send, CheckCircle, AlertTriangle, RotateCcw } from 'lucide-react';

export default function FirmaPage() {
  const [searchParams] = useSearchParams();
  const pacienteId = searchParams.get('pacienteId');
  const token = searchParams.get('token');

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = '#1A2332';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  }, []);

  const draw = useCallback((e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSignature(true);
  }, [isDrawing]);

  const stopDraw = useCallback(() => { setIsDrawing(false); }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
        throw new Error(data?.message || 'Error al firmar');
      }

      setSent(true);
    } catch (err) {
      setError(err.message || 'Error al enviar la firma');
    } finally {
      setSending(false);
    }
  };

  if (!pacienteId) {
    return (
      <div className="firma-page">
        <div className="firma-page__card">
          <AlertTriangle size={48} />
          <h2>Enlace invalido</h2>
          <p>No se encontro el paciente asociado a este enlace.</p>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="firma-page">
        <div className="firma-page__card firma-page__card--success">
          <CheckCircle size={64} />
          <h2>Firma registrada</h2>
          <p>Su firma ha sido registrada exitosamente. El documento ha sido generado y almacenado de forma segura.</p>
          <span className="firma-page__timestamp">{new Date().toLocaleString('es-PE')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="firma-page">
      <div className="firma-page__card">
        <FileText size={40} className="firma-page__icon" />
        <h2>Documento de Admision</h2>
        <p>Por favor firme en el recuadro a continuacion para confirmar su registro.</p>

        {error && (
          <div className="firma-page__error">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <div className="firma-page__canvas-wrapper">
          <canvas
            ref={canvasRef}
            className="firma-page__canvas"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
          <span className="firma-page__canvas-label">Firme aqui</span>
        </div>

        <div className="firma-page__actions">
          <button className="firma-page__btn-clear" onClick={clearCanvas}>
            <RotateCcw size={16} /> Limpiar
          </button>
          <button
            className="firma-page__btn-sign"
            onClick={handleSign}
            disabled={!hasSignature || sending}
          >
            <Send size={16} /> {sending ? 'Enviando...' : 'Confirmar Firma'}
          </button>
        </div>
      </div>
    </div>
  );
}
