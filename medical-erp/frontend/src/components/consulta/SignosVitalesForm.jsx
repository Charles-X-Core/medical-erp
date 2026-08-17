export default function SignosVitalesForm({ value = {}, onChange }) {
  const fields = [
    { key: 'presionArterial', label: 'Presión Arterial', placeholder: '120/80' },
    { key: 'pulso', label: 'Pulso (lpm)', type: 'number' },
    { key: 'temperatura', label: 'Temperatura (°C)', type: 'number', step: '0.1' },
    { key: 'peso', label: 'Peso (kg)', type: 'number', step: '0.1' },
    { key: 'talla', label: 'Talla (cm)', type: 'number' },
    { key: 'saturacion', label: 'SatO2 (%)', type: 'number' },
    { key: 'frecuenciaRespiratoria', label: 'FR (rpm)', type: 'number' },
  ];

  const handleChange = (key, rawValue) => {
    const isNumeric = fields.find((f) => f.key === key)?.type === 'number';
    const parsed = isNumeric && rawValue !== '' ? (rawValue.includes('.') ? parseFloat(rawValue) : parseInt(rawValue, 10)) : rawValue;
    onChange({ ...value, [key]: parsed });
  };

  const calcularIMC = () => {
    const peso = parseFloat(value.peso);
    const talla = parseInt(value.talla);
    if (!peso || !talla || talla <= 0) return null;
    const tallaM = talla / 100;
    return (peso / (tallaM * tallaM)).toFixed(1);
  };

  const clasificarIMC = (imc) => {
    if (!imc) return null;
    const v = parseFloat(imc);
    if (v < 18.5) return { label: 'Bajo peso', color: '#3B82F6' };
    if (v < 25.0) return { label: 'Normal', color: '#22C55E' };
    if (v < 30.0) return { label: 'Sobrepeso', color: '#F59E0B' };
    return { label: 'Obesidad', color: '#EF4444' };
  };

  const imc = calcularIMC();
  const imcClass = clasificarIMC(imc);

  return (
    <div className="form-section">
      <h3 className="form-section__title">Signos Vitales</h3>
      <div className="form-grid form-grid--4">
        {fields.map((f) => (
          <div key={f.key} className="form-field">
            <label className="form-label">{f.label}</label>
            <input
              type={f.type || 'text'}
              step={f.step}
              className="form-input"
              placeholder={f.placeholder}
              value={value[f.key] || ''}
              onChange={(e) => handleChange(f.key, e.target.value)}
            />
          </div>
        ))}
        {/* IMC calculado */}
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
                {imcClass.label}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
