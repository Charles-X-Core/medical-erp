// ============================================
// Cita estados — labels y clases (no hardcodeo)
// ============================================

export const CITA_ESTADOS = {
  solicitada: { label: 'Solicitada', tone: 'warning', icon: 'Clock' },
  pendiente: { label: 'Pendiente', tone: 'neutral' },
  programada: { label: 'Programada', tone: 'info' },
  confirmada: { label: 'Confirmada', tone: 'info' },
  asistio: { label: 'Asistió', tone: 'success' },
  completada: { label: 'Completada', tone: 'success' },
  cancelada: { label: 'Cancelada', tone: 'danger' },
  reprogramada: { label: 'Reprogramada', tone: 'warning' },
  no_show: { label: 'No Asistió', tone: 'danger' },
};

export const getCitaEstado = (estado) =>
  CITA_ESTADOS[estado] || { label: estado || '—', tone: 'neutral' };

export const formatNombre = (pacienteNombre) => pacienteNombre || 'Paciente';

export const formatHora = (hora) => (hora ? hora.substring(0, 5) : '—');
