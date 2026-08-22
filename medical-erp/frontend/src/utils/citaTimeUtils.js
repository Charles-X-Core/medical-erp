// ============================================
// Cita Time Utils — Validación de horario de citas
// ============================================

/**
 * Determina el estado temporal de una cita
 * @param {Object} cita - CitaResumenDto con hora, fecha, duracionMinutos, estado
 * @returns {'active'|'completed'|'too_early'|'ready_soon'|'in_window'|'passed'|'unknown'}
 */
export function getAppointmentStatus(cita) {
  if (!cita?.hora || !cita?.fecha) return 'unknown';

  if (cita.estado === 'en_atencion') return 'active';
  if (cita.estado === 'completada') return 'completed';

  const now = new Date();
  const appointmentStart = new Date(cita.fecha + 'T' + cita.hora);
  const appointmentEnd = new Date(appointmentStart);
  appointmentEnd.setMinutes(appointmentEnd.getMinutes() + (cita.duracionMinutos || 30));

  const diffMinutes = (appointmentStart - now) / 60000;

  if (diffMinutes > 15) return 'too_early';
  if (diffMinutes > -5) return 'ready_soon';
  if (now <= appointmentEnd) return 'in_window';
  return 'passed';
}

/**
 * Retorna un mensaje descriptivo del estado temporal
 */
export function getTimeMessage(cita) {
  const status = getAppointmentStatus(cita);
  const [h, m] = cita.hora.split(':').map(Number);
  const horaStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  switch (status) {
    case 'too_early': return `A las ${horaStr}`;
    case 'ready_soon': return `A las ${horaStr}`;
    case 'active': return 'En atencion';
    case 'completed': return 'Completada';
    case 'passed': return `Era a las ${horaStr}`;
    default: return '';
  }
}

/**
 * Retorna el label del badge de estado temporal
 */
export function getTimeBadgeLabel(cita) {
  const status = getAppointmentStatus(cita);
  const [h, m] = cita.hora.split(':').map(Number);
  const horaStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  switch (status) {
    case 'too_early': return `A las ${horaStr}`;
    case 'ready_soon': return 'Listo';
    case 'active': return 'Ahora';
    case 'completed': return 'Listo';
    case 'passed': return 'Paso';
    default: return '';
  }
}

/**
 * Indica si la cita está en ventana para iniciar atención
 * (dentro de -5min a +duracionMinutos de la hora programada)
 */
export function isReadyForAttention(cita) {
  const status = getAppointmentStatus(cita);
  return status === 'ready_soon' || status === 'in_window';
}
