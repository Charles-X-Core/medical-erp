import AntecedenteField from './AntecedenteField';

export const ANTECEDENTES_CONFIG = [
  { key: 'alergiaMedicamentos', label: 'Alergia a medicamentos' },
  { key: 'propensionHemorragias', label: 'Propension a hemorragias' },
  { key: 'complicacionesAnestesia', label: 'Complicaciones con anestesia' },
  { key: 'presionArterialMedicacion', label: 'Presion Arterial / Medicacion' },
  { key: 'cardiopatiasPersonales', label: 'Cardiopatias personales' },
  { key: 'cardiopatiasFamiliares', label: 'Cardiopatias familiares' },
  { key: 'diabetesPersonal', label: 'Diabetes personal' },
  { key: 'diabetesFamiliar', label: 'Diabetes familiar' },
  { key: 'hepatitis', label: 'Hepatitis (A, B, C)' },
  { key: 'otrasEnfermedades', label: 'Otras enfermedades' },
  { key: 'enfermedadActualMedicacion', label: 'Enfermedad actual / Medicacion' },
];

export const ANTECEDENTES_FIELDS_DISPLAY = ANTECEDENTES_CONFIG;

export function getActiveAntecedentes(historia) {
  if (!historia) return [];
  return ANTECEDENTES_CONFIG
    .map(({ key, label }) => {
      const value = historia[key] || '';
      const isActive = value && value !== 'No' && value !== '';
      return { key, label, value, isActive };
    })
    .filter((item) => item.isActive);
}

export default function AntecedentesEditor({
  values = {},
  onChange,
  readOnly = false,
  compact = false,
}) {
  return (
    <div className={`antecedentes-editor ${compact ? 'antecedentes-editor--compact' : ''}`}>
      {ANTECEDENTES_CONFIG.map(({ key, label }) => (
        <AntecedenteField
          key={key}
          label={label}
          value={values[key] || ''}
          onChange={readOnly ? undefined : (val) => onChange(key, val)}
          compact={compact}
        />
      ))}
    </div>
  );
}
