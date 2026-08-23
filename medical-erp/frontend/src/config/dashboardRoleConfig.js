// ============================================
// Dashboard Role Config — returns translation keys
// ============================================

export const dashboardRoleConfig = {
  doctora: {
    titleKey: 'doctora_panel',
    subtitleKey: 'doctora_subtitle',
    hero: {
      emptyTitleKey: 'hero_no_clients',
      emptySubtitleKey: 'hero_admin_subtitle',
      ctaLabelKey: 'hero_view_agenda',
      ctaRoute: '/agenda',
    },
    sections: {
      citasHoy: { show: true, labelKey: 'section_my_appointments' },
      tratamientos: { show: true, labelKey: 'section_my_treatments' },
      alertas: { show: true, labelKey: 'section_my_alerts' },
      proximas: { show: true, labelKey: 'section_my_upcoming' },
      cola: { show: true, labelKey: 'section_clients_queue' },
      notificaciones: { show: false },
    },
  },
  admin: {
    titleKey: 'admin_panel',
    subtitleKey: 'admin_subtitle',
    hero: {
      emptyTitleKey: 'hero_admin_no_activity',
      emptySubtitleKey: 'hero_admin_subtitle',
      ctaLabelKey: 'hero_view_agenda',
      ctaRoute: '/agenda',
    },
    sections: {
      citasHoy: { show: true, labelKey: 'section_appointments_today' },
      tratamientos: { show: true, labelKey: 'section_active_treatments' },
      alertas: { show: true, labelKey: 'section_alerts' },
      proximas: { show: true, labelKey: 'section_upcoming' },
      cola: { show: true, labelKey: 'section_clients_queue' },
      notificaciones: { show: false },
    },
  },
};
