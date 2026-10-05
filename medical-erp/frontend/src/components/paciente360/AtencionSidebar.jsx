import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, AlertCircle, Activity, Ruler, Weight, Edit3, Save, X, Loader2, CheckCircle } from 'lucide-react';
import { getActiveAntecedentes, ANTECEDENTES_CONFIG } from '../ui/AntecedentesEditor';
import AntecedentesEditor from '../ui/AntecedentesEditor';
import { pacienteService } from '../../services/pacienteService';
import { historiaClinicaService } from '../../services/historiaClinicaService';
import { useUnitSystem } from '../../context/UnitContext';
import { calcularIMC, clasificarIMC, pesoAUS, tallaAUS, LBS_TO_KG, IN_TO_CM } from '../../utils/units';

// ============================================
// AtencionSidebar — Read-only Peso/Estatura + Edit mode
// Default: read-only. Click "Editar" to modify.
// Saves to Paciente entity via PUT /api/v1/pacientes/{id}
// ============================================

export default function AtencionSidebar({ paciente, historia, signosVitales, onSignosVitalesChange, onPacienteUpdated, pacienteId, onSaveAntecedentes, onHistoriaRefreshed }) {
  const { t } = useTranslation('patients');
  const { system, toggle } = useUnitSystem();
  const activeAntecedentes = historia ? getActiveAntecedentes(historia) : [];

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [peso, setPeso] = useState('');
  const [estatura, setEstatura] = useState('');
  const [editingAntecedentes, setEditingAntecedentes] = useState(false);
  const [savingAntecedentes, setSavingAntecedentes] = useState(false);
  const [antecedentesValues, setAntecedentesValues] = useState({});

  const desdeHistoria = () => {
    const vals = {};
    ANTECEDENTES_CONFIG.forEach(({ key }) => { vals[key] = historia?.[key] || ''; });
    return vals;
  };

  const handleSaveAntecedentes = async () => {
    if (!pacienteId) return;
    setSavingAntecedentes(true);
    try {
      await onSaveAntecedentes?.(antecedentesValues);
      setEditingAntecedentes(false);
      // Refrescar historia para mostrar los nuevos activos
      if (onHistoriaRefreshed && historia?.id) {
        try {
          const refreshed = await historiaClinicaService.getByPaciente(pacienteId);
          if (refreshed.success) onHistoriaRefreshed(refreshed.data);
        } catch { /* silencio */ }
      }
    } catch (err) {
      console.error('Error guardando antecedentes:', err);
    } finally {
      setSavingAntecedentes(false);
    }
  };

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

  const handlePesoChange = (v) => {
    if (v === '' || v === null || v === undefined) { setPeso(''); return; }
    setPeso(system === 'us' ? parseFloat((parseFloat(v) * LBS_TO_KG).toFixed(1)) : v);
  };

  const handleTallaChange = (v) => {
    if (v === '' || v === null || v === undefined) { setEstatura(''); return; }
    setEstatura(system === 'us' ? Math.round(parseFloat(v) * IN_TO_CM) : v);
  };

  const imc = calcularIMC(peso, estatura, system);
  const imcMeta = clasificarIMC(imc);
  const imcClass = imcMeta?.key || '';
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
          <div className="unit-toggle">
            <button className={`unit-toggle__btn ${system === 'metric' ? 'unit-toggle__btn--active' : ''}`}
              onClick={() => system !== 'metric' && toggle()}>Metric</button>
            <button className={`unit-toggle__btn ${system === 'us' ? 'unit-toggle__btn--active' : ''}`}
              onClick={() => system !== 'us' && toggle()}>US</button>
          </div>
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
                    value={system === 'us' ? pesoAUS(peso) : peso}
                    onChange={(e) => handlePesoChange(e.target.value)}
                  />
                  <span className="atencion-sidebar__vital-unit">{system === 'us' ? 'lbs' : 'kg'}</span>
                </div>
              ) : (
                <div className="atencion-sidebar__vital-value-row">
                  <span className="atencion-sidebar__vital-value">{system === 'us' ? pesoAUS(peso) : peso || '—'}</span>
                  {peso && <span className="atencion-sidebar__vital-unit">{system === 'us' ? 'lbs' : 'kg'}</span>}
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
                    value={system === 'us' ? tallaAUS(estatura) : estatura}
                    onChange={(e) => handleTallaChange(e.target.value)}
                  />
                  <span className="atencion-sidebar__vital-unit">{system === 'us' ? 'in' : 'cm'}</span>
                </div>
              ) : (
                <div className="atencion-sidebar__vital-value-row">
                  <span className="atencion-sidebar__vital-value">{system === 'us' ? tallaAUS(estatura) : estatura || '—'}</span>
                  {estatura && <span className="atencion-sidebar__vital-unit">{system === 'us' ? 'in' : 'cm'}</span>}
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

      {/* Antecedentes Médicos — editable */}
      <div className="atencion-sidebar__section">
        <div className="atencion-sidebar__title-row">
          <h3 className="atencion-sidebar__title">
            <FileText size={14} /> {t('antecedentes')}
          </h3>
          {!editingAntecedentes ? (
            <button className="atencion-sidebar__edit-btn" onClick={() => { setAntecedentesValues(desdeHistoria()); setEditingAntecedentes(true); }} title={t('editar')}>
              <Edit3 size={13} />
            </button>
          ) : (
            <div className="atencion-sidebar__edit-actions">
              <button className="atencion-sidebar__edit-btn atencion-sidebar__edit-btn--cancel" onClick={() => setEditingAntecedentes(false)} title={t('cancelar')}>
                <X size={13} />
              </button>
              <button
                className="atencion-sidebar__edit-btn atencion-sidebar__edit-btn--save"
                onClick={handleSaveAntecedentes}
                disabled={savingAntecedentes}
                title={t('guardar')}
              >
                {savingAntecedentes ? <Loader2 size={13} className="spinner" /> : <Save size={13} />}
              </button>
            </div>
          )}
        </div>

        {editingAntecedentes ? (
          <AntecedentesEditor
            values={antecedentesValues}
            onChange={(key, val) => setAntecedentesValues((prev) => ({ ...prev, [key]: val }))}
            compact
          />
        ) : activeAntecedentes.length > 0 ? (
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
