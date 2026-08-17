import { useState, useRef, useCallback, useEffect } from 'react';
import { contratoPwaService } from '../services/contratoPwaService';
import { FileText, Send, CheckCircle, AlertTriangle, RotateCcw, LogOut, Clock } from 'lucide-react';

const POLL_INTERVAL = 3000;

export default function ContratoPWA() {
  const [step, setStep] = useState('login');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  // Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Kiosco
  const [pacienteNombre, setPacienteNombre] = useState('');
  const [htmlContent, setHtmlContent] = useState('');

  // Firma
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Canvas setup
  useEffect(() => {
    if (step !== 'firma') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = '#1A2332';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [step]);

  // Polling for pending contracts (kiosco mode)
  useEffect(() => {
    if (step !== 'kiosco') return;
    let active = true;

    const poll = async () => {
      try {
        const data = await contratoPwaService.getSiguiente();
        if (!active) return;
        if (data.status === 'PENDIENTE' && data.token) {
          setToken(data.token);
          setPacienteNombre(data.pacienteNombre);
          loadContract(data.token);
        }
      } catch {
        if (active) setError('Error de conexion. Reintentando...');
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => { active = false; clearInterval(interval); };
  }, [step]);

  const loadContract = async (t) => {
    try {
      const data = await contratoPwaService.render(t);
      if (data.status === 'FIRMADO') {
        setStep('already-signed');
        return;
      }
      if (data.htmlContent) {
        setHtmlContent(data.htmlContent);
        setPacienteNombre(data.pacienteNombre);
        setStep('contrato');
      }
    } catch {
      setError('Error al cargar el contrato');
      setStep('kiosco');
    }
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.message || 'Credenciales incorrectas');
      const loginData = json.data;
      localStorage.setItem('token', loginData.token || '');
      localStorage.setItem('refreshToken', loginData.refreshToken || '');
      localStorage.setItem('user', JSON.stringify(loginData.user || {}));
      setStep('kiosco');
    } catch (err) {
      setError(err.message);
    }
  };

  // Canvas drawing
  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = useCallback((e) => {
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  }, []);

  const draw = useCallback((e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSignature(true);
  }, [isDrawing]);

  const stopDraw = useCallback(() => setIsDrawing(false), []);

  const clearCanvas = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasSignature(false);
  };

  // Sign handler
  const handleSign = async () => {
    if (!hasSignature || !token) return;
    setSending(true);
    setError('');
    try {
      const firmaBase64 = canvasRef.current.toDataURL('image/png');
      const data = await contratoPwaService.firmar(token, firmaBase64);
      setStep('exito');
      setTimeout(() => {
        setStep('kiosco');
        setToken('');
        setPacienteNombre('');
        setHtmlContent('');
        setHasSignature(false);
      }, 4000);
    } catch (err) {
      setError(err.message || 'Error al firmar');
    } finally {
      setSending(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setStep('login');
  };

  // --- RENDER ---

  if (step === 'login') {
    return (
      <div className="contrato-pwa">
        <div className="contrato-pwa__login">
          <div className="contrato-pwa__login-header">
            <FileText size={48} className="contrato-pwa__icon" />
            <h1>OHNow Contrato</h1>
            <p>Kiosco de Firma</p>
          </div>

          <form onSubmit={handleLogin} className="contrato-pwa__login-form">
            {error && (
              <div className="contrato-pwa__error">
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            <div className="contrato-pwa__field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="contrato-pwa__field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="contrato-pwa__btn-primary">
              <Send size={18} /> Iniciar kiosco
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'kiosco') {
    return (
      <div className="contrato-pwa">
        <div className="contrato-pwa__kiosco">
          <div className="contrato-pwa__kiosco-header">
            <FileText size={40} className="contrato-pwa__icon" />
            <h2>Esperando contrato...</h2>
            <p>El contrato aparecera automaticamente cuando la enfermera lo envie</p>
          </div>
          <div className="contrato-pwa__kiosco-spinner">
            <div className="contrato-pwa__spinner" />
          </div>
          {error && (
            <div className="contrato-pwa__error">
              <AlertTriangle size={16} /> {error}
            </div>
          )}
          <button className="contrato-pwa__btn-logout" onClick={handleLogout}>
            <LogOut size={16} /> Cerrar sesion
          </button>
        </div>
      </div>
    );
  }

  if (step === 'contrato') {
    return (
      <div className="contrato-pwa contrato-pwa--signed">
        <div className="contrato-pwa__contrato">
          <div className="contrato-pwa__contrato-header">
            <div className="contrato-pwa__contrato-paciente">
              <FileText size={24} />
              <div>
                <h3>Contrato de Membresia</h3>
                <span>{pacienteNombre}</span>
              </div>
            </div>
          </div>

          <div
            className="contrato-pwa__contrato-body"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          <div className="contrato-pwa__contrato-firma">
            <h4>Firma del paciente</h4>

            <div className="contrato-pwa__canvas-wrapper">
              <canvas
                ref={canvasRef}
                className="contrato-pwa__canvas"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
              />
              {!hasSignature && (
                <span className="contrato-pwa__canvas-label">Firme aqui</span>
              )}
            </div>

            {error && (
              <div className="contrato-pwa__error">
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            <div className="contrato-pwa__contrato-actions">
              <button className="contrato-pwa__btn-clear" onClick={clearCanvas} disabled={sending}>
                <RotateCcw size={16} /> Limpiar
              </button>
              <button
                className="contrato-pwa__btn-sign"
                onClick={handleSign}
                disabled={!hasSignature || sending}
              >
                <Send size={16} /> {sending ? 'Firmando...' : 'Confirmar firma'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'exito') {
    return (
      <div className="contrato-pwa">
        <div className="contrato-pwa__exito">
          <CheckCircle size={80} className="contrato-pwa__exito-icon" />
          <h2>Firma completada</h2>
          <p>El contrato ha sido firmado y guardado exitosamente.</p>
          <span className="contrato-pwa__exito-time">
            <Clock size={14} /> {new Date().toLocaleString('es-PE')}
          </span>
        </div>
      </div>
    );
  }

  if (step === 'already-signed') {
    return (
      <div className="contrato-pwa">
        <div className="contrato-pwa__exito">
          <CheckCircle size={80} className="contrato-pwa__exito-icon" />
          <h2>Este contrato ya fue firmado</h2>
          <p>El paciente ya ha completado la firma de este contrato.</p>
          <button className="contrato-pwa__btn-primary" onClick={() => setStep('kiosco')}>
            Volver al kiosco
          </button>
        </div>
      </div>
    );
  }

  return null;
}
