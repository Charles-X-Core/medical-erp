// ============================================
// Dashboard Role Config — qué ve cada rol
// ============================================

export const dashboardRoleConfig = {
  doctora: {
    title: 'Panel de la Doctora',
    subtitle: 'Resumen clínico del día',
    hero: {
      emptyTitle: 'No hay clientes en cola',
      emptySubtitle: 'La agenda de hoy está al día',
      ctaLabel: 'Ver agenda',
      ctaRoute: '/agenda',
    },
    sections: {
      citasHoy: { show: true, label: 'Mis Citas' },
      tratamientos: { show: true, label: 'Mis Tratamientos' },
      alertas: { show: true, label: 'Mis Alertas' },
      proximas: { show: true, label: 'Mis Próximas Citas' },
      cola: { show: true, label: 'Clientes en Cola' },
      notificaciones: { show: false },
    },
  },
  admin: {
    title: 'Centro de Administración',
    subtitle: 'Resumen general de la clínica',
    hero: {
      emptyTitle: 'Sin actividad reciente',
      emptySubtitle: 'Todo operando con normalidad',
      ctaLabel: 'Ver agenda',
      ctaRoute: '/agenda',
    },
    sections: {
      citasHoy: { show: true, label: 'Citas de Hoy' },
      tratamientos: { show: true, label: 'Tratamientos activos' },
      alertas: { show: true, label: 'Alertas' },
      proximas: { show: true, label: 'Próximas Citas' },
      cola: { show: true, label: 'Clientes en Cola' },
      notificaciones: { show: false },
    },
  },
};
