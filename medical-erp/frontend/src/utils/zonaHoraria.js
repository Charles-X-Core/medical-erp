import { useSyncExternalStore } from 'react';

/**
 * TRADUCTOR DE HORA (visualización únicamente).
 *
 * El sistema es y sigue siendo de CALIFORNIA: todo se guarda, se calcula,
 * se compara y se consulta en America/Los_Angeles. Este módulo NO modifica
 * datos, NO verifica nada y NO escribe nada: solo convierte el rótulo que
 * se muestra para que la doctora lo lea en su reloj (Lima) o en el de la
 * clínica (California).
 *
 * Regla: posiciones y cálculos en California, etiquetas en la zona activa.
 */

const STORAGE_KEY = 'mostrar_zona';

/** Zona donde vive y se guarda la información. NUNCA cambia. */
export const ZONA_ALMACEN = 'America/Los_Angeles';

const IANA = { CA: 'America/Los_Angeles', PE: 'America/Lima' };

let zona = readZona();
const suscriptores = new Set();

function readZona() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'PE' ? 'PE' : 'CA';
  } catch {
    return 'CA';
  }
}

export function getZona() {
  return zona;
}

export function esPE() {
  return zona === 'PE';
}

export function setZona(z) {
  const nueva = z === 'PE' ? 'PE' : 'CA';
  if (nueva === zona) return;
  zona = nueva;
  try {
    localStorage.setItem(STORAGE_KEY, nueva);
  } catch {
    /* modo privado: seguimos con la memoria */
  }
  suscriptores.forEach((fn) => fn());
}

export function subscribeZona(fn) {
  suscriptores.add(fn);
  return () => suscriptores.delete(fn);
}

export function useZona() {
  return useSyncExternalStore(subscribeZona, getZona, getZona);
}

/** Zona IANA a mostrar: 'America/Los_Angeles' | 'America/Lima' */
export function zonaIANA() {
  return IANA[zona];
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    const nueva = readZona();
    if (nueva === zona) return;
    zona = nueva;
    suscriptores.forEach((fn) => fn());
  });
}

/**
 * Offset UTC (ms) de una zona IANA para un instante dado.
 * Usa Intl → respeta DST sin calendarios hardcodeados.
 */
function offsetMs(tz, date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const g = (t) => parts.find((p) => p.type === t).value;
  const comoUTC = Date.UTC(
    +g('year'),
    +g('month') - 1,
    +g('day'),
    +g('hour') % 24,
    +g('minute'),
    +g('second')
  );
  return comoUTC - Math.floor(date.getTime() / 1000) * 1000;
}

function refParaFecha(fechaStr) {
  if (fechaStr) {
    const m = String(fechaStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12, 0, 0));
  }
  return new Date();
}

const cacheOffset = new Map();

/**
 * Desfase en MINUTOS entre la zona a mostrar y la zona de almacenamiento.
 * +120 = California está en PDT (mar–nov). +180 = PST (nov–mar). +0 en CA.
 * Se calcula por fecha para que una cita de diciembre se traduzca con +3
 * aunque hoy estemos en septiembre.
 */
export function offsetMinutosPara(fechaStr) {
  let clave = fechaStr;
  if (!clave) {
    // "hoy" según California, para que el caché caduque al cambiar de día
    clave = `hoy:${new Date().toLocaleDateString('en-CA', { timeZone: ZONA_ALMACEN })}`;
  }
  const memo = `${zona}|${clave}`;
  if (cacheOffset.has(memo)) return cacheOffset.get(memo);

  const ref = refParaFecha(fechaStr);
  const valor = Math.round(
    (offsetMs(zonaIANA(), ref) - offsetMs(ZONA_ALMACEN, ref)) / 60000
  );
  cacheOffset.set(memo, valor);
  return valor;
}

function dosDig(n) {
  return String(n).padStart(2, '0');
}

function corregir(total) {
  return ((total % 1440) + 1440) % 1440;
}

/**
 * Traduce una hora "HH:mm[:ss[.SSS]]" de California a la zona activa.
 * Conserva exactamente el sufijo (segundos/milisegundos) que traiga.
 * `fecha` es opcional pero recomendable: define el offset por DST.
 */
export function horaMostrar(hora, fecha) {
  if (hora === null || hora === undefined || hora === '') return hora;
  const s = String(hora);
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return hora;
  const min = corregir((+m[1]) * 60 + (+m[2]) + offsetMinutosPara(fecha));
  return `${dosDig(Math.floor(min / 60))}:${dosDig(min % 60)}${s.slice(m[0].length)}`;
}

/**
 * Traduce "minutos del día" (0–1439, formato California) a etiqueta legible.
 * Para ejes de la agenda, fin de intervalos, etc.
 */
export function horaMostrarMin(minutos, fecha) {
  if (minutos === null || minutos === undefined || Number.isNaN(+minutos)) return minutos;
  const total = corregir(Math.round(+minutos) + offsetMinutosPara(fecha));
  return `${dosDig(Math.floor(total / 60))}:${dosDig(total % 60)}`;
}

/**
 * "08:15" + 45min → "10:00" (inicio y fin traducidos, duración intacta).
 * Para rangos "08:15 - 09:00" de citas.
 */
export function rangoHoras(hora, duracionMinutos, fecha) {
  const inicio = horaMostrar(hora, fecha);
  const m = String(hora || '').match(/^(\d{1,2}):(\d{2})/);
  if (!m) return inicio;
  const fin = horaMostrarMin((+m[1]) * 60 + (+m[2]) + (duracionMinutos || 30), fecha);
  return `${inicio} - ${fin}`;
}
