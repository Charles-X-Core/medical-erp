// ============================================
// Dashboard Role Config — qué ve cada rol
// ============================================

export const dashboardRoleConfig = {
  doctora: {
    title: 'Panel de la Doctora',
    subtitle: 'Resumen clínico del día',
    hero: {
      emptyTitle: 'No hay pacientes en cola',
      emptySubtitle: 'La agenda de hoy está al día',
      ctaLabel: 'Ver agenda',
      ctaRoute: '/agenda',
    },
    sections: {
      citasHoy: { show: true, label: 'Citas de hoy' },
      tratamientos: { show: true, label: 'Tratamientos activos' },
      alertas: { show: true, label: 'Alertas clínicas' },
      proximas: { show: true, label: 'Próximas citas' },
    },
  },
  enfermera: {
    title: 'Panel de Admisión',
    subtitle: 'Resumen operativo del día',
    hero: {
      emptyTitle: 'Sin pacientes en espera',
      emptySubtitle: 'La recepción está al día',
      ctaLabel: 'Ir a admisión',
      ctaRoute: '/admision',
    },
    sections: {
      citasHoy: { show: true, label: 'Citas de hoy' },
      tratamientos: { show: false, label: 'Tratamientos activos' },
      alertas: { show: true, label: 'Alertas' },
      proximas: { show: false, label: 'Próximas citas' },
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
      citasHoy: { show: true, label: 'Citas de hoy' },
      tratamientos: { show: true, label: 'Tratamientos activos' },
      alertas: { show: true, label: 'Alertas' },
      proximas: { show: false, label: 'Próximas citas' },
    },
  },
};
