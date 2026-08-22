import i18n from '../i18n';

const ROLE_LABELS = {
  admin: 'admin',
  doctora: 'doctora',
};

const ROLE_LABELS_SHORT = {
  admin: 'Admin',
  doctora: 'Dra.',
};

export const getRoleLabel = (role) => {
  if (role === 'admin') return i18n.t('Admin', { ns: 'common' });
  if (role === 'doctora') return i18n.t('Doctor', { ns: 'common' });
  return role;
};

export const getRoleLabelShort = (role) => ROLE_LABELS_SHORT[role] || role;

export const getDashboardLabel = (role) => {
  if (role === 'admin') return i18n.t('admin_panel', { ns: 'dashboard' });
  if (role === 'doctora') return i18n.t('doctora_panel', { ns: 'dashboard' });
  return i18n.t('care_center', { ns: 'sidebar' });
};

export const getPrimaryRole = (user) => {
  const role = user?.role;
  if (role === 'admin') return 'admin';
  return 'doctora';
};
