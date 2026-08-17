import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Bell, User, Menu } from 'lucide-react';

const ROUTE_TITLES = {
  '/dashboard': 'Dashboard',
  '/admision': 'Admisión',
  '/admision/nuevo': 'Nuevo Paciente',
  '/admision/sesion': 'Sesión Clínica',
  '/agenda': 'Agenda',
  '/agenda/config': 'Config. Agenda',
  '/citas': 'Citas',
  '/documentos': 'Documentos',
  '/configuracion': 'Configuración',
};

function getTitle(pathname) {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  if (pathname.startsWith('/admision/sesion')) return 'Sesión Clínica';
  if (pathname.startsWith('/admision/')) return 'Nuevo Paciente';
  if (pathname.startsWith('/pacientes/') && pathname.includes('/editar')) return 'Editar Paciente';
  if (pathname.startsWith('/pacientes/') && pathname.includes('/workspace')) return 'Centro del Paciente';
  if (pathname.startsWith('/pacientes/') && pathname.includes('/detalle')) return 'Detalle del Paciente';
  if (pathname.startsWith('/pacientes/')) return 'Paciente';
  if (pathname.startsWith('/historia')) return 'Historia Clínica';
  if (pathname.startsWith('/consultas')) return 'Consulta';
  return 'Panel Médico';
}

export default function Header({ onToggleSidebar }) {
  const { user } = useAuth();
  const location = useLocation();
  const title = getTitle(location.pathname);

  return (
    <header className="header">
      <div className="header__left">
        <button className="header__hamburger" onClick={onToggleSidebar} aria-label="Menú">
          <Menu size={22} />
        </button>
        <h1 className="header__title">{title}</h1>
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
