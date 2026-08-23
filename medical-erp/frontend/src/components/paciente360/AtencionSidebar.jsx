import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, AlertCircle, Activity, Ruler, Weight, Edit3, Save, X, Loader2 } from 'lucide-react';
import { getActiveAntecedentes } from '../ui/AntecedentesEditor';
import { pacienteService } from '../../services/pacienteService';

// ============================================
// AtencionSidebar — Read-only Peso/Estatura + Edit mode
// Default: read-only. Click "Editar" to modify.
// Saves to Paciente entity via PUT /api/v1/pacientes/{id}
// ============================================

export default function AtencionSidebar({ paciente, historia, signosVitales, onSignosVitalesChange, onPacienteUpdated, pacienteId }) {
  const { t } = useTranslation('patients');
  const activeAntecedentes = historia ? getActiveAntecedentes(historia) : [];

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [peso, setPeso] = useState('');
  const [estatura, setEstatura] = useState('');

  // Initialize from paciente (persistent data)
  useEffect(() => {
    setPeso(paciente?.peso ?? '');
    setEstatura(paciente?.estatura ?? '');
  }, [paciente]);

  const handleStartEdit = () => {
    setPeso(paciente?.peso ?? '');
    setEstatura(paciente?.estatura ?? '');
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setPeso(paciente?.peso ?? '');
    setEstatura(paciente?.estatura ?? '');
    setEditing(false);
  };

  const handleSave = async () => {
    if (!pacienteId) return;
    setSaving(true);
    try {
      const pesoNum = peso !== '' ? parseFloat(peso) : null;
      const estaturaNum = estatura !== '' ? parseFloat(estatura) : null;
      const res = await pacienteService.update(pacienteId, {
        apellidoPaterno: paciente.apellidoPaterno,
        apellidoMaterno: paciente.apellidoMaterno || '',
        nombres: paciente.nombres,
        licenciaConducir: paciente.licenciaConducir || '',
        telefono: paciente.telefono || '',
        email: paciente.email || '',
        fechaNacimiento: paciente.fechaNacimiento || null,
        sexo: paciente.sexo || '',
        estadoCivil: paciente.estadoCivil || '',
        peso: isNaN(pesoNum) ? null : pesoNum,
        estatura: isNaN(estaturaNum) ? null : estaturaNum,
      });
      if (res.success) {
        setEditing(false);
        // Notify parent to update paciente state (preserves peso/estatura across tab switches)
        onPacienteUpdated?.({ ...paciente, peso: isNaN(pesoNum) ? null : pesoNum, estatura: isNaN(estaturaNum) ? null : estaturaNum });
        onSignosVitalesChange?.({
          ...signosVitales,
          peso: pesoNum,
          talla: estaturaNum,
        });
      }
    } catch (err) {
      console.error('Error saving peso/estatura:', err);
    } finally {
      setSaving(false);
    }
  };

  // IMC calculation (only when both values exist)
  const calcularIMC = () => {
    const p = parseFloat(peso);
    const t = parseInt(estatura);
    if (!p || !t || t <= 0) return null;
    const tM = t / 100;
    return (p / (tM * tM)).toFixed(1);
  };

  const imc = calcularIMC();
  const imcClass = imc ? (
    parseFloat(imc) < 18.5 ? 'bajo' :
    parseFloat(imc) < 25 ? 'normal' :
    parseFloat(imc) < 30 ? 'sobrepeso' : 'obesidad'
  ) : null;

  const imcLabel = imcClass === 'bajo' ? t('bajo_peso') :
    imcClass === 'normal' ? t('normal') :
    imcClass === 'sobrepeso' ? t('sobrepeso') : t('obesidad');

  return (
    <div className="atencion-sidebar">
      {/* Signos Vitales — Read-only by default, editable on toggle */}
      <div className="atencion-sidebar__section">
        <div className="atencion-sidebar__title-row">
          <h3 className="atencion-sidebar__title">
            <Activity size={14} /> {t('signos_vitales')}
          </h3>
          {!editing ? (
            <button className="atencion-sidebar__edit-btn" onClick={handleStartEdit} title={t('editar')}>
              <Edit3 size={13} />
            </button>
          ) : (
            <div className="atencion-sidebar__edit-actions">
              <button className="atencion-sidebar__edit-btn atencion-sidebar__edit-btn--cancel" onClick={handleCancelEdit} title={t('cancelar')}>
                <X size={13} />
              </button>
              <button
                className="atencion-sidebar__edit-btn atencion-sidebar__edit-btn--save"
                onClick={handleSave}
                disabled={saving}
                title={t('guardar')}
              >
                {saving ? <Loader2 size={13} className="spinner" /> : <Save size={13} />}
              </button>
            </div>
          )}
        </div>
        <div className="atencion-sidebar__vitals">
          {/* Peso */}
          <div className="atencion-sidebar__vital-item">
            <Weight size={14} className="atencion-sidebar__vital-icon" />
            <div className="atencion-sidebar__vital-info">
              <span className="atencion-sidebar__vital-label">{t('peso')}</span>
              {editing ? (
                <div className="atencion-sidebar__vital-input-wrap">
                  <input
                    type="number"
                    className="atencion-sidebar__vital-input"
                    placeholder="—"
                    step="0.1"
                    min="0"
                    value={peso}
                    onChange={(e) => setPeso(e.target.value)}
                  />
                  <span className="atencion-sidebar__vital-unit">kg</span>
                </div>
              ) : (
                <div className="atencion-sidebar__vital-value-row">
                  <span className="atencion-sidebar__vital-value">{peso || '—'}</span>
                  {peso && <span className="atencion-sidebar__vital-unit">kg</span>}
                </div>
              )}
            </div>
          </div>

          {/* Estatura */}
          <div className="atencion-sidebar__vital-item">
            <Ruler size={14} className="atencion-sidebar__vital-icon" />
            <div className="atencion-sidebar__vital-info">
              <span className="atencion-sidebar__vital-label">{t('estatura')}</span>
              {editing ? (
                <div className="atencion-sidebar__vital-input-wrap">
                  <input
                    type="number"
                    className="atencion-sidebar__vital-input"
                    placeholder="—"
                    step="1"
                    min="0"
                    value={estatura}
                    onChange={(e) => setEstatura(e.target.value)}
                  />
                  <span className="atencion-sidebar__vital-unit">cm</span>
                </div>
              ) : (
                <div className="atencion-sidebar__vital-value-row">
                  <span className="atencion-sidebar__vital-value">{estatura || '—'}</span>
                  {estatura && <span className="atencion-sidebar__vital-unit">cm</span>}
                </div>
              )}
            </div>
          </div>

          {/* IMC */}
          {imc && (
            <div className={`atencion-sidebar__vital-item atencion-sidebar__vital-item--imc atencion-sidebar__vital-item--${imcClass}`}>
              <Activity size={14} className="atencion-sidebar__vital-icon" />
              <div className="atencion-sidebar__vital-info">
                <span className="atencion-sidebar__vital-label">{t('imc')}</span>
                <div className="atencion-sidebar__vital-imc">
                  <span className="atencion-sidebar__vital-value">{imc}</span>
                  <span className={`atencion-sidebar__vital-badge atencion-sidebar__vital-badge--${imcClass}`}>
                    {imcLabel}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Antecedentes Médicos */}
      <div className="atencion-sidebar__section">
        <h3 className="atencion-sidebar__title">
          <FileText size={14} /> {t('antecedentes')}
        </h3>
        {activeAntecedentes.length > 0 ? (
          <div className="atencion-sidebar__antecedentes">
            {activeAntecedentes.map((item) => (
              <div key={item.key} className="atencion-sidebar__antecedente">
                <AlertCircle size={12} className="atencion-sidebar__antecedente-icon" />
                <div className="atencion-sidebar__antecedente-info">
                  <span className="atencion-sidebar__antecedente-label">{t(item.labelKey)}</span>
                  <span className="atencion-sidebar__antecedente-value">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="atencion-sidebar__empty">
            <p>{t('sin_antecedentes')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
