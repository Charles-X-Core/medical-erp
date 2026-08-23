import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { Bell, User, Menu } from 'lucide-react';

export default function Header({ onToggleSidebar }) {
  const { user } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  const ROUTE_TITLES = {
    '/dashboard': t('admin_panel', { ns: 'dashboard' }),
    '/admision': t('clients', { ns: 'sidebar' }),
    '/agenda': t('agenda', { ns: 'sidebar' }),
  };

  function getTitle(pathname) {
    if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
    if (pathname.startsWith('/admision/sesion')) return t('session_title', { ns: 'clinical' });
    if (pathname.startsWith('/admision/')) return t('new_client', { ns: 'patients' });
    if (pathname.startsWith('/pacientes/') && pathname.includes('/editar')) return t('edit_client', { ns: 'patients' });
    if (pathname.startsWith('/pacientes/') && pathname.includes('/workspace')) return t('client_workspace', { ns: 'patients' });
    if (pathname.startsWith('/pacientes/') && pathname.includes('/detalle')) return t('client_detail', { ns: 'patients' });
    if (pathname.startsWith('/pacientes/')) return t('client', { ns: 'common' });
    if (pathname.startsWith('/historia')) return t('historia_clinica', { ns: 'patients' });
    if (pathname.startsWith('/consultas')) return t('consultation', { ns: 'common' });
    return t('doctora_panel', { ns: 'dashboard' });
  }

  const title = getTitle(location.pathname);

  return (
    <header className="header">
      <div className="header__left">
        <button className="header__hamburger" onClick={onToggleSidebar} aria-label={t('menu', { ns: 'sidebar' })}>
          <Menu size={22} />
        </button>
        <h1 className="header__title">{title}</h1>
      </div>
      <div className="header__right">
        <button className="header__icon-btn" aria-label={t('notifications', { ns: 'sidebar' })}>
          <Bell size={20} />
        </button>
        <div className="header__profile">
          <div className="header__profile-avatar">
            <User size={18} />
          </div>
          <div className="header__profile-info">
            <span className="header__profile-name">{user?.nombre || t('name', { ns: 'common' })}</span>
            <span className="header__profile-role">
              {user?.clinicaNombre || ''} {user?.role ? `· ${user.role}` : ''}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
