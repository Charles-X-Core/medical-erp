import { zonaIANA, horaMostrar } from './zonaHoraria';

/**
 * Returns today's date as "YYYY-MM-DD" string in America/Los_Angeles timezone.
 * Uses toLocaleDateString('en-CA') which outputs ISO format directly,
 * avoiding the timezone trap of new Date(toLocaleString()).
 *
 * IMPORTANTE: esto es CÁLCULO, no visualización. El "hoy" del sistema es y
 * sigue siendo el de California, aunque la app esté en modo Perú.
 */
export function getLADateString() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
}

/**
 * Returns a Date object set to midnight in LA timezone.
 * Useful for week calculations where a Date object is needed.
 */
export function getLAToday() {
  const parts = getLADateString().split('-');
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
}

/**
 * Parses an ISO-8601 string (with or without 'Z' suffix) from the backend
 * into a Date object. The backend now sends Instant values as ISO-8601Z
 * (e.g. "2026-09-06T21:30:00.000Z"), which Date parses correctly.
 *
 * Also handles legacy LocalDateTime strings ("2026-09-06T14:30:00") by
 * interpreting them as America/Los_Angeles.
 */
export function parseLADateTime(str) {
  if (!str) return null;
  const s = String(str);

  // If it ends with 'Z' or has an explicit offset (+HH:MM / -HH:MM), Date.parse handles it natively
  if (s.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(s)) {
    return new Date(s);
  }

  // Legacy LocalDateTime string (no timezone info) — interpret as LA
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return null;
  const y = +match[1], mo = +match[2], d = +match[3], h = +match[4], mi = +match[5], sec = +(match[6] || 0);

  // Build a date in LA timezone using Intl to get the UTC offset
  const laDate = new Date(Date.UTC(y, mo - 1, d, h, mi, sec));
  const laOffsetMs = getLAOffsetMs(laDate);
  return new Date(laDate.getTime() - laOffsetMs);
}

/**
 * Returns the UTC offset of America/Los_Angeles in milliseconds for a given Date.
 */
function getLAOffsetMs(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t).value;
  const asUTC = Date.UTC(+get('year'), +get('month') - 1, +get('day'), +get('hour') % 24, +get('minute'), +get('second'));
  return asUTC - date.getTime();
}

/**
 * "Ahora" en California. Devuelve el instante real actual (new Date()).
 * Nota: para mostrar la hora de California usar toLocaleTimeString(LA) sobre el
 * instante, ya que un Date JS siempre representa un instante (ms desde epoch UTC).
 */
export function nowLA() {
  return new Date();
}

/**
 * Formatea una fecha ISO "YYYY-MM-DD" (del backend, ya en California) a texto
 * legible (ej. "31 ago 2026") usando la zona de California, SIN que el día se
 * desplace por la zona horaria del navegador.
 * Evita el bug de new Date("YYYY-MM-DD") que interpreta en UTC y retrocede el día.
 */
export function formatLADate(dateStr, locale = 'es-ES') {
  if (!dateStr) return '-';
  const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return String(dateStr);
  const y = +m[1], mo = +m[2], d = +m[3];
  const safe = new Date(y, mo - 1, d, 12, 0, 0);
  return safe.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Combina fecha "YYYY-MM-DD" + hora "HH:mm" en California y formatea
 * día/mes/año + hora (ej. "31 ago 2026 at 09:15").
 * El día nunca se desplaza (es el día clínico de California); solo la
 * hora se traduce a la zona de visualización activa.
 */
export function formatLADateTime(fechaStr, horaStr, locale = 'es-ES') {
  const fecha = formatLADate(fechaStr, locale);
  const hora = horaStr ? horaMostrar(horaStr, fechaStr).substring(0, 5) : '';
  return hora ? `${fecha} ${hora}` : fecha;
}

/**
 * Formatea un Instant (ISO-8601Z) a hora para display, en la zona activa
 * (California o Lima). Los datos siguen llegando igual desde el backend.
 */
export function formatBusinessTime(isoString, locale = 'en-US') {
  if (!isoString) return '--';
  return new Date(isoString).toLocaleTimeString(locale, {
    timeZone: zonaIANA(),
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Devuelve la fecha+hora ACTUAL de California como string
 * "YYYY-MM-DDTHH:mm:ss", listo para enviar al backend (que espera LA).
 * Evita enviar UTC (toISOString) que desplaza la hora.
 */
export function toLocalDateTime() {
  return new Date().toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles' }).replace(' ', 'T');
}
