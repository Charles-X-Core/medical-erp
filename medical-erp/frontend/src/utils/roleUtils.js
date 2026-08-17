// ============================================
// Role Utilities — No hardcodeo
// ============================================

const ROLE_LABELS = {
  admin: 'Administrador',
  doctora: 'Doctora',
  enfermera: 'Enfermera',
};

const ROLE_LABELS_SHORT = {
  admin: 'Admin',
  doctora: 'Dra.',
  enfermera: 'Enf.',
};

const ROLE_DASHBOARD_LABELS = {
  admin: 'Centro de Administración',
  doctora: 'Centro de Atención',
  enfermera: 'Centro de Admisión',
};

export const getRoleLabel = (role) => ROLE_LABELS[role] || role;
export const getRoleLabelShort = (role) => ROLE_LABELS_SHORT[role] || role;
export const getDashboardLabel = (role) => ROLE_DASHBOARD_LABELS[role] || 'Centro de Trabajo';

export const getPrimaryRole = (user) => {
  const role = user?.role;
  if (role === 'admin') return 'admin';
  if (role === 'doctora') return 'doctora';
  return 'enfermera';
};
