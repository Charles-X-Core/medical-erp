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
      </div>
    </div>
  );
}
