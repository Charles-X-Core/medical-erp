import i18n from '../i18n';

export const getRoleLabel = (role) => {
  if (role === 'admin') return i18n.t('admin', { ns: 'common' });
  if (role === 'doctora') return i18n.t('doctor', { ns: 'common' });
  return role;
};

export const getRoleLabelShort = (role) => {
  if (role === 'admin') return 'Admin';
  if (role === 'doctora') return 'Dra.';
  return role;
};

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
