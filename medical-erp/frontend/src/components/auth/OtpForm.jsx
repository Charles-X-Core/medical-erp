import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { Shield, RotateCcw, ArrowLeft } from 'lucide-react';

export default function OtpForm() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [devOtp, setDevOtp] = useState(null);
  const { pendingEmail, storeAuth, clearAuth } = useAuth();
  const navigate = useNavigate();
  const inputsRef = useRef([]);

  // Countdown for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(t);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  // Redirect if no pending email
  useEffect(() => {
    if (!pendingEmail) {
      navigate('/login');
    }
  }, [pendingEmail, navigate]);

  // Dev: fetch OTP code from backend
  useEffect(() => {
    if (pendingEmail) {
      fetch(`/api/v1/auth/dev/otp-code?email=${encodeURIComponent(pendingEmail)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success !== false && data.codigo) {
            setDevOtp(data.codigo);
          }
        })
        .catch(() => {});
    }
  }, [pendingEmail]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Ingresa los 6 dígitos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authService.loginStep2(pendingEmail, fullCode);
      if (res.success) {
        storeAuth(res.data);
        navigate('/dashboard');
      } else {
        setError(res.message || 'Código incorrecto');
        setCode(['', '', '', '', '', '']);
        inputsRef.current[0]?.focus();
      }
    } catch (err) {
      setError(err.message || 'Error al verificar código');
      setCode(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setLoading(true);
    setError('');
    try {
      await authService.resendOtp(pendingEmail);
      setResendTimer(60);
      setCanResend(false);
      setDevOtp(null);
      fetch(`/api/v1/auth/dev/otp-code?email=${encodeURIComponent(pendingEmail)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success !== false && data.codigo) {
            setDevOtp(data.codigo);
          }
        })
        .catch(() => {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    clearAuth();
    navigate('/login');
  };

  if (!pendingEmail) return null;

  return (
    <div className="auth-form__wrapper">
      <div className="auth-form__brand">
        <Shield size={48} className="auth-form__icon" />
        <h2 className="auth-form__title">Verificación OTP</h2>
        <p className="auth-form__subtitle">
          Ingresa el código de 6 dígitos enviado a <strong>{pendingEmail}</strong>
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && (
          <div className="auth-form__error">
            {error}
          </div>
        )}

        {devOtp && (
          <div style={{
            background: 'linear-gradient(135deg, #e0f2fe, #dbeafe)',
            border: '2px solid #3b82f6',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              Modo Desarrollo — Código OTP
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: '#1e40af', letterSpacing: '8px', fontFamily: 'monospace' }}>
              {devOtp}
            </p>
          </div>
        )}

        <div className="auth-form__otp">
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputsRef.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              className="auth-form__otp-digit"
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              disabled={loading}
              autoFocus={i === 0}
            />
          ))}
        </div>

        <button
          type="submit"
          className="auth-form__submit"
          disabled={loading || code.join('').length !== 6}
        >
          {loading ? (
            <span className="spinner spinner--sm" />
          ) : (
            'Verificar y entrar'
          )}
        </button>

        <div className="auth-form__actions">
          <button
            type="button"
            className="auth-form__link"
            onClick={handleResend}
            disabled={!canResend || loading}
          >
            <RotateCcw size={14} />
            {canResend
              ? 'Reenviar código'
              : `Reenviar en ${resendTimer}s`
            }
          </button>

          <button
            type="button"
            className="auth-form__link"
            onClick={handleBack}
          >
            <ArrowLeft size={14} />
            Volver al login
          </button>
        </div>
      </form>
    </div>
  );
}
