import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { Mail, Lock, ArrowRight, AlertCircle, ExternalLink } from 'lucide-react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { storeAuth } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('auth');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authService.login(email, password);
      if (res.success && res.data?.token) {
        storeAuth(res.data);
        navigate('/dashboard');
      } else {
        setError(res.message || t('login_error'));
      }
    } catch (err) {
      if (err.status === 423) {
        setError(t('login_locked'));
      } else if (err.status === 401) {
        setError(t('login_invalid'));
      } else {
        setError(err.message || t('login_connection_error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form__wrapper">
      <div className="auth-form__brand">
        <div className="auth-form__logo-circle">
          <img src="/logo.ico" alt="Logo" className="auth-form__logo" />
        </div>
        <h1 className="auth-form__title">{t('login_title')}</h1>
        <p className="auth-form__subtitle">{t('login_subtitle')}</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && (
          <div className="auth-form__error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="auth-form__field">
          <label className="auth-form__label">{t('email_label')}</label>
          <div className="auth-form__input-wrapper">
            <Mail size={18} className="auth-form__input-icon" />
            <input
              type="email"
              className="auth-form__input"
              placeholder="doctor@clinica.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>
        </div>

        <div className="auth-form__field">
          <label className="auth-form__label">{t('password_label')}</label>
          <div className="auth-form__input-wrapper">
            <Lock size={18} className="auth-form__input-icon" />
            <input
              type="password"
              className="auth-form__input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={8}
              autoComplete="current-password"
            />
          </div>
        </div>

        <button
          type="submit"
          className="auth-form__submit"
          disabled={loading}
        >
          {loading ? (
            <span className="spinner spinner--sm" />
          ) : (
            <>
              {t('login_button')} <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <div className="auth-form__footer">
        <a
          href="https://erp.myoptimalhealthnow.com/contrato"
          target="_blank"
          rel="noopener noreferrer"
          className="auth-form__contract-link"
        >
          <ExternalLink size={14} />
          {t('view_contract')}
        </a>
      </div>
    </div>
  );
}
