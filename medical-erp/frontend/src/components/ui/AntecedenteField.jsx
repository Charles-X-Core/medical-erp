import { useTranslation } from 'react-i18next';

export default function AntecedenteField({
  label,
  value,
  onChange,
  placeholder,
  compact = false,
}) {
  const { t } = useTranslation('common');
  const isYes = value && value !== 'No' && value !== '';
  const isNo = value === 'No';

  return (
    <div className={`antecedente-field ${compact ? 'antecedente-field--compact' : ''}`}>
      <label className="antecedente-field__label">{label}</label>
      <div className="antecedente-field__sino">
        <button
          type="button"
          className={`antecedente-btn ${isYes ? 'si-activo' : ''}`}
          onClick={() => onChange(isYes ? '' : 'Si')}
        >
          {t('yes')}
        </button>
        <button
          type="button"
          className={`antecedente-btn ${isNo ? 'no-activo' : ''}`}
          onClick={() => onChange(isNo ? '' : 'No')}
        >
          {t('no')}
        </button>
      </div>
      {isYes && (
        <textarea
          className="antecedente-field__obs"
          value={value === 'Si' ? '' : value}
          onChange={(e) => onChange(e.target.value || 'Si')}
          placeholder={placeholder || t('details_optional')}
          rows={2}
        />
      )}
    </div>
  );
}
