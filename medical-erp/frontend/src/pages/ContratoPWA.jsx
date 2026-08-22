import { useState, useRef, useEffect, useCallback } from 'react';
import { contratoPwaService } from '../services/contratoPwaService';
import HtmlDocViewer from '../components/common/HtmlDocViewer';
import { FileText, Send, CheckCircle, AlertTriangle, RotateCcw, LogOut, Clock, Download, X, Smartphone, ChevronDown } from 'lucide-react';

const POLL_INTERVAL = 3000;

function detectPlatform() {
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

function getInstallInstructions(platform) {
  switch (platform) {
    case 'android':
      return { text: 'Toca los 3 puntos y selecciona "Instalar app"', icon: '⋮' };
    case 'ios':
      return { text: 'Toca el boton de compartir y selecciona "Anadir a pantalla de inicio"', icon: '⬆' };
    default:
      return { text: 'Haz clic en el icono de instalacion en la barra de direccion', icon: '⬇' };
  }
}

export default function ContratoPWA() {
  const [step, setStep] = useState('login');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  // PWA install
  const deferredPrompt = useRef(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const platform = useRef(detectPlatform());

  // Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Kiosco
  const [pacienteNombre, setPacienteNombre] = useState('');
  const [htmlContent, setHtmlContent] = useState('');

  // Viewer ref
  const viewerRef = useRef(null);

  // Signature state — driven by HtmlDocViewer callback
  const [hasSignature, setHasSignature] = useState(false);

  // Cooldown post-firma
  const signedCooldownUntil = useRef(0);
  const lastSignedToken = useRef('');

  // PWA install prompt
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
      return;
    }
    const onBeforeInstall = (e) => { e.preventDefault(); deferredPrompt.current = e; setIsInstallable(true); };
    const onInstalled = () => { setIsInstalled(true); setIsInstallable(false); deferredPrompt.current = null; };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt.current) {
      deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      if (outcome === 'accepted') setIsInstallable(false);
      deferredPrompt.current = null;
    }
  };

  // Polling for pending contracts (kiosco mode)
  useEffect(() => {
    if (step !== 'kiosco') return;
    let active = true;
    let timerId;

    const poll = async () => {
      if (Date.now() < signedCooldownUntil.current) return;
      try {
        const res = await contratoPwaService.getSiguiente();
        if (!active) return;
        const data = res.data || res;
        if (data.status === 'PENDIENTE' && data.token && data.token !== lastSignedToken.current) {
          setToken(data.token);
          setPacienteNombre(data.pacienteNombre);
          loadContract(data.token);
        }
      } catch {
        if (active) setError('Error de conexion. Reintentando...');
      }
    };

    timerId = setTimeout(() => {
      poll();
      const interval = setInterval(poll, POLL_INTERVAL);
      timerId = interval;
    }, 3000);

    return () => { active = false; clearTimeout(timerId); clearInterval(timerId); };
  }, [step]);

  const loadContract = async (t) => {
    try {
      const res = await contratoPwaService.render(t);
      const data = res.data || res;
      if (data.status === 'FIRMADO') { setStep('already-signed'); return; }
      if (data.htmlContent) {
        setHtmlContent(data.htmlContent);
        setPacienteNombre(data.pacienteNombre);
        setStep('contrato');
        setHasSignature(false);
      }
    } catch {
      setError('Error al cargar el contrato');
      setStep('kiosco');
    }
  };

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

  // Called by HtmlDocViewer when user draws or clears
  const handleSignatureChange = useCallback((signed) => {
    setHasSignature(signed);
  }, []);

  const handleClear = () => {
    viewerRef.current?.clearSignature();
  };

  const handleScrollToSignature = () => {
    viewerRef.current?.scrollToSignature();
  };

  const handleSign = async () => {
    if (!hasSignature || !token) return;
    setSending(true);
    setError('');
    try {
      const firmaBase64 = viewerRef.current?.getSignatureDataUrl();
      const container = viewerRef.current?.getContainer();
      if (!firmaBase64 || !container) throw new Error('No se pudo obtener la firma');

      // Clone container and replace canvas with image
      const clone = container.cloneNode(true);
      const canvasInClone = clone.querySelector('canvas');
      if (canvasInClone) {
        const img = document.createElement('img');
        img.src = firmaBase64;
        img.style.cssText = 'width:100%;max-height:140px;display:block;';
        const wrapper = canvasInClone.parentElement;
        wrapper.innerHTML = '';
        wrapper.appendChild(img);
      }
      const htmlWithSignature = clone.innerHTML;

      await contratoPwaService.firmar(token, firmaBase64, htmlWithSignature);
      lastSignedToken.current = token;
      signedCooldownUntil.current = Date.now() + 8000;
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

  const showInstallBanner = !isInstalled && !bannerDismissed;
  const instructions = getInstallInstructions(platform.current);

  const renderInstallBanner = () => {
    if (!showInstallBanner) return null;
    return (
      <div className="contrato-pwa__install-banner">
        <div className="contrato-pwa__install-banner-content">
          <Smartphone size={18} />
          <span className="contrato-pwa__install-text">
            <strong>Instalar OHNow Contrato</strong>
            <small>{instructions.text}</small>
          </span>
        </div>
        <div className="contrato-pwa__install-banner-actions">
          {isInstallable && (
            <button className="contrato-pwa__install-btn" onClick={handleInstall}>
              <Download size={14} /> Instalar
            </button>
          )}
          <button className="contrato-pwa__install-dismiss" onClick={() => setBannerDismissed(true)}>
            <X size={14} />
          </button>
        </div>
      </div>
    );
  };

  if (step === 'login') {
    return (
      <div className="contrato-pwa">
        {renderInstallBanner()}
        <div className="contrato-pwa__login">
          <div className="contrato-pwa__login-header">
            <FileText size={48} className="contrato-pwa__icon" />
            <h1>OHNow Contrato</h1>
            <p>Kiosco de Firma</p>
          </div>
          <form onSubmit={handleLogin} className="contrato-pwa__login-form">
            {error && <div className="contrato-pwa__error"><AlertTriangle size={16} /> {error}</div>}
            <div className="contrato-pwa__field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
            </div>
            <div className="contrato-pwa__field">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
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
        {renderInstallBanner()}
        <div className="contrato-pwa__kiosco">
          <div className="contrato-pwa__kiosco-header">
            <FileText size={40} className="contrato-pwa__icon" />
            <h2>Esperando contrato...</h2>
            <p>El contrato aparecera automaticamente cuando se genere</p>
          </div>
          <div className="contrato-pwa__kiosco-spinner">
            <div className="contrato-pwa__spinner" />
          </div>
          {error && <div className="contrato-pwa__error"><AlertTriangle size={16} /> {error}</div>}
          <button className="contrato-pwa__btn-logout" onClick={handleLogout}>
            <LogOut size={16} /> Cerrar sesion
          </button>
        </div>
      </div>
    );
  }

  if (step === 'contrato') {
    const pwaActions = (
      <>
        <button className="contrato-pwa__btn-scroll" onClick={handleScrollToSignature}>
          <ChevronDown size={16} /> Ir a firma
        </button>
        <button className="contrato-pwa__btn-clear" onClick={handleClear} disabled={sending}>
          <RotateCcw size={16} /> Limpiar firma
        </button>
        <button className="contrato-pwa__btn-sign" onClick={handleSign} disabled={!hasSignature || sending}>
          <Send size={16} /> {sending ? 'Firmando...' : 'Confirmar firma'}
        </button>
      </>
    );

    const pwaOverlay = error ? (
      <div className="contrato-pwa__error"><AlertTriangle size={16} /> {error}</div>
    ) : null;

    return (
      <div className="contrato-pwa contrato-pwa--reading">
        {renderInstallBanner()}
        <HtmlDocViewer
          ref={viewerRef}
          htmlContent={htmlContent}
          title={pacienteNombre}
          fullscreen
          enableSignature
          onSignatureChange={handleSignatureChange}
          actions={pwaActions}
          overlay={pwaOverlay}
        />
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
          <p>El cliente ya ha completado la firma de este contrato.</p>
          <button className="contrato-pwa__btn-primary" onClick={() => setStep('kiosco')}>
            Volver al kiosco
          </button>
        </div>
      </div>
    );
  }

  return null;
}
