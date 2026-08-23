import { useState } from 'react';
import { Save, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ============================================
// AtencionForm — Motivo de Consulta (Step 1)
// Doctora fills this while talking to patient
// After saving → can start treatment or schedule
// ============================================

export default function AtencionForm({ paciente, onSave, onSchedule }) {
  const { t: tClinical } = useTranslation('clinical');
  const { t: tPatients } = useTranslation('patients');
  const { t: tCommon } = useTranslation('common');

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
        <h3 className="atencion-form__section-title">{tClinical('motivo_consulta')}</h3>
        <div className="atencion-form__fields">
          <div className="atencion-form__field">
            <label className="atencion-form__label">{tClinical('diagnostico_enfermedad')} *</label>
            <textarea
              className="atencion-form__textarea"
              placeholder={tClinical('describa_diagnostico_placeholder')}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>
          <div className="atencion-form__field">
            <label className="atencion-form__label">{tClinical('dolores_sintomas')}</label>
            <textarea
              className="atencion-form__textarea"
              placeholder={tClinical('sintomas_placeholder')}
              value={tiempoEnfermedad}
              onChange={(e) => setTiempoEnfermedad(e.target.value)}
            />
          </div>
          <div className="atencion-form__field">
            <label className="atencion-form__label">{tClinical('antecedentes_medicos')}</label>
            <textarea
              className="atencion-form__textarea"
              placeholder={tClinical('antecedentes_placeholder')}
              value={signosSintomas}
              onChange={(e) => setSignosSintomas(e.target.value)}
            />
          </div>
          <div className="atencion-form__field">
            <label className="atencion-form__label">{tClinical('examen_clinico_general')}</label>
            <textarea
              className="atencion-form__textarea"
              placeholder={tClinical('hallazgos_placeholder')}
              value={examenClinico}
              onChange={(e) => setExamenClinico(e.target.value)}
            />
          </div>
          <div className="atencion-form__field">
            <label className="atencion-form__label">{tClinical('diagnostico_definitivo')}</label>
            <textarea
              className="atencion-form__textarea"
              placeholder={tClinical('diagnostico_definitivo_placeholder')}
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
          {tPatients('agendar_cita')}
        </button>
        <button
          className="btn btn--primary"
          onClick={handleSave}
          disabled={saving || !motivo.trim()}
        >
          {saving ? tCommon('guardando') : (
            <>
              <Save size={16} />
              {tClinical('guardar_consulta')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
