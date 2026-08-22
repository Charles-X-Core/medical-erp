import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  Globe,
} from 'lucide-react';

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation('sidebar');

  const primaryRole = getPrimaryRole(user);

  const allMenuItems = [
    { id: 'inicio', path: '/inicio', labelKey: 'care_center', icon: Home, roles: ['admin', 'doctora'] },
    { id: 'admision', path: '/admision', labelKey: 'clients', icon: ClipboardCheck, roles: ['admin', 'doctora'] },
    { id: 'agenda', path: '/agenda', labelKey: 'agenda', icon: CalendarDays, roles: ['admin', 'doctora'] },
    { id: 'centro-datos', path: '/centro-datos', labelKey: 'data_center', icon: Database, roles: ['doctora'] },
    { id: 'admin', path: '/admin', labelKey: 'administration', icon: Settings, roles: ['admin'] },
  ];

  const menuItems = allMenuItems.filter((item) => item.roles.includes(primaryRole));

  const handleNavigate = (path) => {
    navigate(path);
    onMobileClose?.();
  };

  const isActive = (path) => {
    if (path === '/inicio') return location.pathname === '/inicio' || location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'es' : 'en';
    i18n.changeLanguage(newLang);
  };

  const currentLang = i18n.language?.startsWith('es') ? 'es' : 'en';

  function getInitials(nombre) {
    if (!nombre) return '?';
    const parts = nombre.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  const renderNav = () => (
    <>
      <div className="sidebar__section sidebar__section--nav">
        {!collapsed && <span className="sidebar__section-label">{t('nav_section')}</span>}
        <nav className="sidebar__nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                className={`sidebar__link ${active ? 'sidebar__link--active' : ''}`}
                onClick={() => handleNavigate(item.path)}
                title={collapsed ? t(item.labelKey) : undefined}
              >
                <Icon size={20} />
                {!collapsed && <span>{t(item.labelKey)}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="sidebar__footer">
        {!collapsed && (
          <button
            className="sidebar__lang-toggle"
            onClick={toggleLanguage}
            title={currentLang === 'en' ? 'Switch to Spanish' : 'Cambiar a Inglés'}
          >
            <Globe size={16} />
            <span>{currentLang === 'en' ? 'ES' : 'EN'}</span>
          </button>
        )}
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
        <button className="sidebar__logout" onClick={logout} title={collapsed ? t('logout') : undefined}>
          <LogOut size={18} />
          {!collapsed && <span>{t('logout')}</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className={`sidebar sidebar--desktop ${collapsed ? 'sidebar--collapsed' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <img src="/logo.ico" alt="Logo" className="sidebar__brand-logo" />
            {!collapsed && (
              <div className="sidebar__brand-text">
                <span className="sidebar__brand-title">{user?.clinicaNombre || t('clinic')}</span>
                <span className="sidebar__brand-subtitle">{t('medical_erp')}</span>
              </div>
            )}
          </div>
          <button
            className="sidebar__toggle"
            onClick={onToggle}
            aria-label={collapsed ? t('expand_sidebar') : t('collapse_sidebar')}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {renderNav()}
      </aside>

      <aside className={`sidebar sidebar--mobile ${mobileOpen ? 'sidebar--mobile-open' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <img src="/logo.ico" alt="Logo" className="sidebar__brand-logo" />
            <div className="sidebar__brand-text">
              <span className="sidebar__brand-title">{user?.clinicaNombre || t('clinic')}</span>
              <span className="sidebar__brand-subtitle">{t('medical_erp')}</span>
            </div>
          </div>
          <button className="sidebar__close" onClick={onMobileClose} aria-label={t('close_menu')}>
            <X size={20} />
          </button>
        </div>

        {renderNav()}
      </aside>
    </>
  );
}
