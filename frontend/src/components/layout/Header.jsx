import { useAuth } from '../../hooks/useAuth';
import { Bell, User } from 'lucide-react';

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="header">
      <div className="header__left">
        <h1 className="header__title">Panel Médico</h1>
      </div>
      <div className="header__right">
        <button className="header__icon-btn" aria-label="Notificaciones">
          <Bell size={20} />
        </button>
        <div className="header__profile">
          <div className="header__profile-avatar">
            <User size={18} />
          </div>
          <div className="header__profile-info">
            <span className="header__profile-name">{user?.nombre || 'Usuario'}</span>
            <span className="header__profile-role">
              {user?.clinicaNombre || ''} {user?.role ? `· ${user.role}` : ''}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
