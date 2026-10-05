import i18n from '../i18n';
import { parseLADateTime } from './laTimezone';

export function getAppointmentStatus(cita) {
  if (!cita?.hora || !cita?.fecha) return 'unknown';
  if (cita.estado === 'en_atencion') return 'active';
  if (cita.estado === 'completada') return 'completed';
  const now = new Date();
  const appointmentStart = parseLADateTime(cita.fecha + 'T' + cita.hora) || new Date(cita.fecha + 'T' + cita.hora);
  const appointmentEnd = new Date(appointmentStart);
  appointmentEnd.setMinutes(appointmentEnd.getMinutes() + (cita.duracionMinutos || 30));
  const diffMinutes = (appointmentStart - now) / 60000;
  if (diffMinutes > 15) return 'too_early';
  if (diffMinutes > -5) return 'ready_soon';
  if (now <= appointmentEnd) return 'in_window';
  return 'passed';
}

export function getTimeMessage(cita) {
  const status = getAppointmentStatus(cita);
  const [h, m] = cita.hora.split(':').map(Number);
  const horaStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  switch (status) {
    case 'too_early': return i18n.t('time_at', { time: horaStr, ns: 'dashboard' });
    case 'ready_soon': return i18n.t('time_at', { time: horaStr, ns: 'dashboard' });
    case 'active': return i18n.t('time_active', { ns: 'dashboard' });
    case 'completed': return i18n.t('estado_completada', { ns: 'dashboard' });
    case 'passed': return i18n.t('time_passed', { time: horaStr, ns: 'dashboard' });
    default: return '';
  }
}

export function getTimeBadgeLabel(cita) {
  const status = getAppointmentStatus(cita);
  const [h, m] = cita.hora.split(':').map(Number);
  const horaStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  switch (status) {
    case 'too_early': return i18n.t('time_at', { time: horaStr, ns: 'dashboard' });
    case 'ready_soon': return i18n.t('time_ready', { ns: 'dashboard' });
    case 'active': return i18n.t('time_active', { ns: 'dashboard' });
    case 'completed': return i18n.t('time_ready', { ns: 'dashboard' });
    case 'passed': return i18n.t('time_not_yet', { ns: 'dashboard' });
    default: return '';
  }
}

export function isReadyForAttention(cita) {
  const status = getAppointmentStatus(cita);
  return status === 'ready_soon' || status === 'in_window';
}
