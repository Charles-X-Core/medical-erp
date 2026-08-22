import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getPrimaryRole, getRoleLabel } from '../../utils/roleUtils';
import {
  Home,
  ClipboardCheck,
  CalendarDays,
  CalendarClock,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Database,
} from 'lucide-react';

const allMenuItems = [
  { id: 'inicio', path: '/inicio', label: 'Centro de Atención', icon: Home, roles: ['admin', 'doctora'] },
  { id: 'admision', path: '/admision', label: 'Clientes', icon: ClipboardCheck, roles: ['admin', 'doctora'] },
  { id: 'agenda', path: '/agenda', label: 'Agenda', icon: CalendarDays, roles: ['admin', 'doctora'] },
  { id: 'centro-datos', path: '/centro-datos', label: 'Centro de Datos', icon: Database, roles: ['doctora'] },

  { id: 'admin', path: '/admin', label: 'Administración', icon: Settings, roles: ['admin'] },
];

function getInitials(nombre) {
  if (!nombre) return '?';
  const parts = nombre.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const primaryRole = getPrimaryRole(user);
  const menuItems = allMenuItems.filter((item) => item.roles.includes(primaryRole));

  const handleNavigate = (path) => {
    navigate(path);
    onMobileClose?.();
  };

  const isActive = (path) => {
    if (path === '/inicio') return location.pathname === '/inicio' || location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const renderNav = () => (
    <>
      {/* NAVIGATION */}
      <div className="sidebar__section sidebar__section--nav">
        {!collapsed && <span className="sidebar__section-label">NAVEGACIÓN</span>}
        <nav className="sidebar__nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                className={`sidebar__link ${active ? 'sidebar__link--active' : ''}`}
                onClick={() => handleNavigate(item.path)}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={20} />
                {!collapsed && <span>{typeof item.label === 'function' ? item.label(primaryRole) : item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* USER + LOGOUT */}
      <div className="sidebar__footer">
        {!collapsed && user && (
          <div className="sidebar__user">
            <div className="sidebar__user-avatar">
              {getInitials(user.nombre)}
            </div>
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{user.nombre}</span>
              <span className="sidebar__user-role">{getRoleLabel(primaryRole)}</span>
            </div>
          </div>
        )}
        <button className="sidebar__logout" onClick={logout} title={collapsed ? 'Cerrar sesión' : undefined}>
          <LogOut size={18} />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`sidebar sidebar--desktop ${collapsed ? 'sidebar--collapsed' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <img src="/logo.ico" alt="Logo" className="sidebar__brand-logo" />
            {!collapsed && (
              <div className="sidebar__brand-text">
                <span className="sidebar__brand-title">{user?.clinicaNombre || 'Clínica'}</span>
                <span className="sidebar__brand-subtitle">ERP Médico</span>
              </div>
            )}
          </div>
          <button
            className="sidebar__toggle"
            onClick={onToggle}
            aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {renderNav()}
      </aside>

      {/* Mobile overlay sidebar */}
      <aside className={`sidebar sidebar--mobile ${mobileOpen ? 'sidebar--mobile-open' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <img src="/logo.ico" alt="Logo" className="sidebar__brand-logo" />
            <div className="sidebar__brand-text">
              <span className="sidebar__brand-title">{user?.clinicaNombre || 'Clínica'}</span>
              <span className="sidebar__brand-subtitle">ERP Médico</span>
            </div>
          </div>
          <button className="sidebar__close" onClick={onMobileClose} aria-label="Cerrar menú">
            <X size={20} />
          </button>
        </div>

        {renderNav()}
      </aside>
    </>
  );
}
