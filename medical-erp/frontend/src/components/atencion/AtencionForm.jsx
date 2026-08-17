import { useState } from 'react';
import { Save, Calendar } from 'lucide-react';

// ============================================
// AtencionForm — Motivo de Consulta (Step 1)
// Doctora fills this while talking to patient
// After saving → can start treatment or schedule
// ============================================

export default function AtencionForm({ paciente, onSave, onSchedule }) {
  const [motivo, setMotivo] = useState('');
  const [tiempoEnfermedad, setTiempoEnfermedad] = useState('');
  const [signosSintomas, setSignosSintomas] = useState('');
  const [examenClinico, setExamenClinico] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave?.({
        motivo,
        tiempoEnfermedad,
        signosSintomas,
        examenClinico,
        diagnostico,
      });
    } catch (err) {
      console.error('Error saving:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="atencion-form">
      <div className="atencion-form__section">
        <h3 className="atencion-form__section-title">Motivo de Consulta</h3>
        <div className="atencion-form__fields">
          <div className="atencion-form__field">
            <label className="atencion-form__label">Diagnóstico / Enfermedad *</label>
            <textarea
              className="atencion-form__textarea"
              placeholder="Describa el diagnóstico o enfermedad..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>
          <div className="atencion-form__field">
            <label className="atencion-form__label">Dolores o síntomas</label>
            <textarea
              className="atencion-form__textarea"
              placeholder="Síntomas con los que inicia..."
              value={tiempoEnfermedad}
              onChange={(e) => setTiempoEnfermedad(e.target.value)}
            />
          </div>
          <div className="atencion-form__field">
            <label className="atencion-form__label">Antecedentes médicos</label>
            <textarea
              className="atencion-form__textarea"
              placeholder="Antecedentes relevantes..."
              value={signosSintomas}
              onChange={(e) => setSignosSintomas(e.target.value)}
            />
          </div>
          <div className="atencion-form__field">
            <label className="atencion-form__label">Examen clínico general</label>
            <textarea
              className="atencion-form__textarea"
              placeholder="Hallazgos del examen..."
              value={examenClinico}
              onChange={(e) => setExamenClinico(e.target.value)}
            />
          </div>
          <div className="atencion-form__field">
            <label className="atencion-form__label">Diagnóstico definitivo</label>
            <textarea
              className="atencion-form__textarea"
              placeholder="Diagnóstico definitivo..."
              value={diagnostico}
              onChange={(e) => setDiagnostico(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="atencion-form__actions">
        <button
          className="btn btn--secondary"
          onClick={() => onSchedule?.()}
          disabled={saving}
        >
          <Calendar size={16} />
          Agendar Cita
        </button>
        <button
          className="btn btn--primary"
          onClick={handleSave}
          disabled={saving || !motivo.trim()}
        >
          {saving ? 'Guardando...' : (
            <>
              <Save size={16} />
              Guardar Consulta
            </>
          )}
        </button>
      </div>
    </div>
  );
}
