import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('auth');

  useEffect(() => {
    if (resendTimer > 0) {
      const t2 = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(t2);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (!pendingEmail) {
      navigate('/login');
    }
  }, [pendingEmail, navigate]);

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
      setError(t('otp_enter_code'));
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
        setError(res.message || t('otp_incorrect'));
        setCode(['', '', '', '', '', '']);
        inputsRef.current[0]?.focus();
      }
    } catch (err) {
      setError(err.message || t('otp_verify_error'));
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
        <h2 className="auth-form__title">{t('otp_title')}</h2>
        <p className="auth-form__subtitle">
          {t('otp_subtitle')} <strong>{pendingEmail}</strong>
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
              {t('otp_dev_mode')}
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
            t('otp_verify')
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
              ? t('otp_resend')
              : t('otp_resend_in', { seconds: resendTimer })
            }
          </button>

          <button
            type="button"
            className="auth-form__link"
            onClick={handleBack}
          >
            <ArrowLeft size={14} />
            {t('otp_back')}
          </button>
        </div>
      </form>
    </div>
  );
}
