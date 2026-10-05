export const KG_TO_LBS = 2.20462;
export const LBS_TO_KG = 1 / KG_TO_LBS;
export const CM_TO_IN = 1 / 2.54;
export const IN_TO_CM = 2.54;

export const UNIT_STORAGE_KEY = 'med_units';

export function getUnitSystem() {
  try {
    return localStorage.getItem(UNIT_STORAGE_KEY) || 'metric';
  } catch {
    return 'metric';
  }
}

export function setUnitSystem(value) {
  try {
    localStorage.setItem(UNIT_STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
}

export function pesoAMetrico(peso, system = 'metric') {
  if (peso === '' || peso === null || peso === undefined) return null;
  const v = parseFloat(peso);
  if (isNaN(v)) return null;
  return system === 'us' ? parseFloat((v * LBS_TO_KG).toFixed(1)) : v;
}

export function tallaAMetrico(talla, system = 'metric') {
  if (talla === '' || talla === null || talla === undefined) return null;
  const v = parseFloat(talla);
  if (isNaN(v)) return null;
  return system === 'us' ? Math.round(v * IN_TO_CM) : v;
}

export function pesoAUS(pesoKg) {
  if (pesoKg === null || pesoKg === undefined || pesoKg === '') return '';
  const v = parseFloat(pesoKg);
  return isNaN(v) ? '' : (v * KG_TO_LBS).toFixed(1);
}

export function tallaAUS(tallaCm) {
  if (tallaCm === null || tallaCm === undefined || tallaCm === '') return '';
  const v = parseFloat(tallaCm);
  return isNaN(v) ? '' : String(Math.round(v * CM_TO_IN));
}

export function calcularIMC(peso, talla, system = 'metric') {
  const p = pesoAMetrico(peso, system);
  const t = tallaAMetrico(talla, system);
  if (p == null || t == null || t <= 0) return null;
  const tM = t / 100;
  return (p / (tM * tM)).toFixed(1);
}

export function clasificarIMC(imc) {
  if (imc == null || imc === '') return null;
  const v = parseFloat(imc);
  if (isNaN(v)) return null;
  if (v < 18.5) return { key: 'bajo', color: '#3B82F6' };
  if (v < 25.0) return { key: 'normal', color: '#22C55E' };
  if (v < 30.0) return { key: 'sobrepeso', color: '#F59E0B' };
  return { key: 'obesidad', color: '#EF4444' };
}
