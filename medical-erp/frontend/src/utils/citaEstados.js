import i18n from '../i18n';
import { horaMostrar } from './zonaHoraria';

export const getCitaEstado = (estado) => {
  const estados = {
    solicitada: { key: 'solicitada', tone: 'warning', icon: 'Clock' },
    pendiente: { key: 'pendiente', tone: 'neutral' },
    programada: { key: 'programada', tone: 'info' },
    confirmada: { key: 'confirmada', tone: 'info' },
    asistio: { key: 'asistio', tone: 'success' },
    llegada: { key: 'llegada', tone: 'success' },
    en_atencion: { key: 'en_atencion', tone: 'active', icon: 'Stethoscope' },
    completada: { key: 'completada', tone: 'success' },
    cancelada: { key: 'cancelada', tone: 'danger' },
    reprogramada: { key: 'reprogramada', tone: 'warning' },
    no_show: { key: 'no_show', tone: 'danger' },
  };
  const found = estados[estado];
  if (!found) return { label: estado || '—', tone: 'neutral' };
  return { ...found, label: i18n.t(`estado_${found.key}`, { ns: 'dashboard' }) };
};

export const formatNombre = (pacienteNombre) => pacienteNombre || i18n.t('patient', { ns: 'common' });

/**
 * Hora de la cita para mostrar. El dato llega en California y aquí se
 * traduce a la zona activa (CA/PE). `fecha` define el desfase por DST.
 */
export const formatHora = (hora, fecha) =>
  hora ? horaMostrar(hora, fecha).substring(0, 5) : '—';
