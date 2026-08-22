import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { storeAuth } = useAuth();
  const navigate = useNavigate();

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
        setError(res.message || 'Error al iniciar sesión');
      }
    } catch (err) {
      if (err.status === 423) {
        setError('Cuenta bloqueada temporalmente por múltiples intentos fallidos. Espere unos minutos.');
      } else if (err.status === 401) {
        setError('Credenciales inválidas. Verifique su email y contraseña.');
      } else {
        setError(err.message || 'Error de conexión');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form__wrapper">
      <div className="auth-form__brand">
        <img src="/logo.ico" alt="Logo" className="auth-form__logo" />
        <h2 className="auth-form__title">ERP Médico</h2>
        <p className="auth-form__subtitle">Optimal Health NOW</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && (
          <div className="auth-form__error">
            <AlertCircle size={16} />
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
              autoComplete="email"
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
              Iniciar Sesión <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
