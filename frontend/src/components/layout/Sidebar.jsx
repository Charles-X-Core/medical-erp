import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/pacientes', label: 'Pacientes', icon: Users },
  { path: '/citas', label: 'Citas', icon: CalendarDays },
  { path: '/documentos', label: 'Documentos', icon: FileText },
  { path: '/configuracion', label: 'Configuración', icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__header">
        <div className="sidebar__brand">
          <Stethoscope className="sidebar__brand-icon" size={28} />
          {!collapsed && (
            <div className="sidebar__brand-text">
              <span className="sidebar__brand-title">Optimal Health</span>
              <span className="sidebar__brand-subtitle">ERP Médico</span>
            </div>
          )}
        </div>
        <button
          className="sidebar__toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="sidebar__nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              className={`sidebar__link ${active ? 'sidebar__link--active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <Icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        {!collapsed && user && (
          <div className="sidebar__user">
            <div className="sidebar__user-avatar">
              {user.nombre?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{user.nombre}</span>
              <span className="sidebar__user-role">{user.role}</span>
            </div>
          </div>
        )}
        <button className="sidebar__logout" onClick={logout}>
          <LogOut size={18} />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
