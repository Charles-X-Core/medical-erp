import { useTranslation } from 'react-i18next';
import AntecedenteField from './AntecedenteField';

export const ANTECEDENTES_CONFIG = [
  { key: 'alergiaMedicamentos', labelKey: 'alergia_medicamentos' },
  { key: 'propensionHemorragias', labelKey: 'propension_hemorragias' },
  { key: 'complicacionesAnestesia', labelKey: 'complicaciones_anestesia' },
  { key: 'presionArterialMedicacion', labelKey: 'presion_arterial_medicacion' },
  { key: 'cardiopatiasPersonales', labelKey: 'cardiopatias_personales' },
  { key: 'cardiopatiasFamiliares', labelKey: 'cardiopatias_familiares' },
  { key: 'diabetesPersonal', labelKey: 'diabetes_personal' },
  { key: 'diabetesFamiliar', labelKey: 'diabetes_familiar' },
  { key: 'hepatitis', labelKey: 'hepatitis' },
  { key: 'otrasEnfermedades', labelKey: 'otras_enfermedades' },
  { key: 'enfermedadActualMedicacion', labelKey: 'enfermedad_actual_medicacion' },
];

export const ANTECEDENTES_FIELDS_DISPLAY = ANTECEDENTES_CONFIG;

export function getActiveAntecedentes(historia) {
  if (!historia) return [];
  return ANTECEDENTES_CONFIG
    .map(({ key, labelKey }) => {
      const value = historia[key] || '';
      const isActive = value && value !== 'No' && value !== '';
      return { key, labelKey, label: labelKey, value, isActive };
    })
    .filter((item) => item.isActive);
}

export default function AntecedentesEditor({
  values = {},
  onChange,
  readOnly = false,
  compact = false,
}) {
  const { t } = useTranslation('patients');
  return (
    <div className={`antecedentes-editor ${compact ? 'antecedentes-editor--compact' : ''}`}>
      {ANTECEDENTES_CONFIG.map(({ key, labelKey }) => (
        <AntecedenteField
          key={key}
          label={t(labelKey)}
          value={values[key] || ''}
          onChange={readOnly ? undefined : (val) => onChange(key, val)}
          compact={compact}
        />
      ))}
    </div>
  );
}
