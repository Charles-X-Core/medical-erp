import { useUnitSystem } from '../../context/UnitContext';
import { calcularIMC, clasificarIMC, pesoAMetrico, tallaAMetrico, pesoAUS, tallaAUS } from '../../utils/units';

export default function SignosVitalesForm({ value = {}, onChange }) {
  const { system, toggle } = useUnitSystem();
  const isUS = system === 'us';

  const fields = [
    { key: 'presionArterial', label: 'Presión Arterial', placeholder: '120/80' },
    { key: 'pulso', label: 'Pulso (lpm)', type: 'number' },
    { key: 'temperatura', label: 'Temperatura (°C)', type: 'number', step: '0.1' },
    { key: 'peso', label: 'Peso', type: 'number', step: '0.1', unit: isUS ? 'lbs' : 'kg' },
    { key: 'talla', label: 'Talla', type: 'number', unit: isUS ? 'in' : 'cm' },
    { key: 'saturacion', label: 'SatO2 (%)', type: 'number' },
    { key: 'frecuenciaRespiratoria', label: 'FR (rpm)', type: 'number' },
  ];

  const handleChange = (key, rawValue) => {
    const field = fields.find((f) => f.key === key);
    const isNumeric = field?.type === 'number';
    if (key === 'peso') {
      const v = pesoAMetrico(rawValue, system);
      onChange({ ...value, [key]: v === null ? '' : v });
      return;
    }
    if (key === 'talla') {
      const v = tallaAMetrico(rawValue, system);
      onChange({ ...value, [key]: v === null ? '' : v });
      return;
    }
    const parsed = isNumeric && rawValue !== '' ? (rawValue.includes('.') ? parseFloat(rawValue) : parseInt(rawValue, 10)) : rawValue;
    onChange({ ...value, [key]: parsed });
  };

  const imc = calcularIMC(value.peso, value.talla, system);
  const imcClass = clasificarIMC(imc);

  const displayValue = (key) => {
    if (key === 'peso') return isUS ? pesoAUS(value.peso) : value.peso;
    if (key === 'talla') return isUS ? tallaAUS(value.talla) : value.talla;
    return value[key] || '';
  };

  return (
    <div className="form-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 className="form-section__title" style={{ margin: 0 }}>Signos Vitales</h3>
        <div className="unit-toggle">
          <button className={`unit-toggle__btn ${system === 'metric' ? 'unit-toggle__btn--active' : ''}`}
            onClick={() => system !== 'metric' && toggle()}>Metric</button>
          <button className={`unit-toggle__btn ${system === 'us' ? 'unit-toggle__btn--active' : ''}`}
            onClick={() => system !== 'us' && toggle()}>US</button>
        </div>
      </div>
      <div className="form-grid form-grid--4">
        {fields.map((f) => (
          <div key={f.key} className="form-field">
            <label className="form-label">{f.label}{f.unit ? ` (${f.unit})` : ''}</label>
            <input
              type={f.type || 'text'}
              step={f.step}
              className="form-input"
              placeholder={f.placeholder}
              value={displayValue(f.key) ?? ''}
              onChange={(e) => handleChange(f.key, e.target.value)}
            />
          </div>
        ))}
        <div className="form-field">
          <label className="form-label">IMC</label>
          <div className="form-input form-input--readonly" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600 }}>{imc || '—'}</span>
            {imcClass && (
              <span style={{
                fontSize: '11px',
                padding: '1px 8px',
                borderRadius: '9999px',
                background: `${imcClass.color}18`,
                color: imcClass.color,
                fontWeight: 600,
              }}>
                {imcClass.key}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
