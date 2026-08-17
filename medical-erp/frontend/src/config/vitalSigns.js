// ============================================
// Vital Signs Configuration
// ============================================

export const VITAL_SIGN_FIELDS = {
  peso: {
    key: 'peso',
    label: 'Peso',
    unit: 'kg',
    placeholder: '70.0',
    type: 'number',
    step: 0.1,
  },
  presionArterial: {
    key: 'presionArterial',
    label: 'Presión Arterial',
    unit: '',
    placeholder: '120 / 80',
    type: 'text',
  },
  temperatura: {
    key: 'temperatura',
    label: 'Temperatura',
    unit: '°C',
    placeholder: '36.4',
    type: 'number',
    step: 0.1,
  },
  pulso: {
    key: 'pulso',
    label: 'Pulso',
    unit: 'lpm',
    placeholder: '72',
    type: 'number',
    step: 1,
  },
  saturacionOxigeno: {
    key: 'saturacionOxigeno',
    label: 'SpO2',
    unit: '%',
    placeholder: '98',
    type: 'number',
    step: 1,
  },
  frecuenciaRespiratoria: {
    key: 'frecuenciaRespiratoria',
    label: 'Frec. Respiratoria',
    unit: 'rpm',
    placeholder: '16',
    type: 'number',
    step: 1,
  },
  talla: {
    key: 'talla',
    label: 'Talla',
    unit: 'cm',
    placeholder: '165',
    type: 'number',
    step: 1,
  },
};

export const getVitalSignField = (key) => VITAL_SIGN_FIELDS[key];

import { ATTENTION_TYPES } from './attentionTypes';

export const getVitalSignsForType = (attentionTypeId) => {
  const type = ATTENTION_TYPES.find((t) => t.id === attentionTypeId);
  if (!type) return [];
  return type.fields.vitalSigns.map((key) => VITAL_SIGN_FIELDS[key]).filter(Boolean);
};
