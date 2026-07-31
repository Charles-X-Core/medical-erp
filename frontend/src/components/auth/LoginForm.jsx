import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { Mail, Lock, ArrowRight, Stethoscope } from 'lucide-react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setPendingEmail } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authService.loginStep1(email, password);
      if (res.success) {
        setPendingEmail(email);
        sessionStorage.setItem('pendingEmail', email);
        navigate('/otp');
      } else {
        setError(res.message || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError(err.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form__wrapper">
      <div className="auth-form__brand">
        <Stethoscope size={48} className="auth-form__icon" />
        <h2 className="auth-form__title">Optimal Health NOW</h2>
        <p className="auth-form__subtitle">ERP Médico — Acceso seguro</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && (
          <div className="auth-form__error">
            {error}
          </div>
        )}

        <div className="auth-form__field">
          <label className="auth-form__label">Email</label>
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
            />
          </div>
        </div>

        <div className="auth-form__field">
          <label className="auth-form__label">Contraseña</label>
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
              Continuar <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
