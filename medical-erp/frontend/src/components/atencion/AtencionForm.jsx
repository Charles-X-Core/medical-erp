import { useState, useEffect } from 'react';
import { Save, Calendar, Activity, Stethoscope, ClipboardList, Scale, Ruler, HeartPulse, Edit2, X as XIcon, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { pacienteService } from '../../services/pacienteService';
import { historiaClinicaService } from '../../services/historiaClinicaService';
import { getActiveAntecedentes } from '../ui/AntecedentesEditor';
import { useUnitSystem } from '../../context/UnitContext';
import { calcularIMC, pesoAUS, tallaAUS, LBS_TO_KG, IN_TO_CM } from '../../utils/units';
import { zonaIANA } from '../../utils/zonaHoraria';

export default function AtencionForm({ paciente, onSave, onSchedule, motivoInicial }) {
  const { t: tClinical } = useTranslation('clinical');
  const { t: tPatients } = useTranslation('patients');
  const { t: tCommon } = useTranslation('common');
  const { system, toggle } = useUnitSystem();

  const [reasonVisita, setReasonVisita] = useState('');
  const [motivo, setMotivo] = useState('');
  const [tiempoEnfermedad, setTiempoEnfermedad] = useState('');
  const [signosSintomas, setSignosSintomas] = useState('');
  const [relatoCronologico, setRelatoCronologico] = useState('');
  const [examenClinicoGeneral, setExamenClinicoGeneral] = useState('');
  const [planTratamiento, setPlanTratamiento] = useState('');
  const [notas, setNotas] = useState('');
  const [peso, setPeso] = useState('');
  const [estatura, setEstatura] = useState('');
  const [vitalSource, setVitalSource] = useState('');
  const [saving, setSaving] = useState(false);

  // Antecedentes state
  const [historia, setHistoria] = useState(null);
  const [editingAntecedentes, setEditingAntecedentes] = useState(false);
  const [antecedentesValues, setAntecedentesValues] = useState({});
  const [savingAntecedentes, setSavingAntecedentes] = useState(false);

  // Pre-fill reason from cita motivo
  useEffect(() => {
    if (motivoInicial) {
      setReasonVisita(motivoInicial);
    }
  }, [motivoInicial]);

  // Pre-fill peso/talla desde la última medición real (consulta o sesión de tratamiento)
  useEffect(() => {
    if (!paciente?.id) return;
    pacienteService.getUltimosSignosVitales(paciente.id).then((res) => {
      const data = res?.data || res;
      if (data?.peso != null) {
        setPeso(data.peso);
      } else if (paciente?.peso != null) {
        setPeso(paciente.peso);
      }
      if (data?.talla != null) {
        setEstatura(data.talla);
      } else if (paciente?.estatura != null) {
        setEstatura(paciente.estatura);
      }
      if (data?.fuente) {
        const fechaStr = data.fecha ? ` (${new Date(data.fecha).toLocaleDateString('es-ES', { timeZone: zonaIANA() })})` : '';
        setVitalSource(data.fuente === 'sesion' ? `Tratamiento${fechaStr}` : `Consulta${fechaStr}`);
      }
    }).catch(() => {
      if (paciente?.peso != null) setPeso(paciente.peso);
      if (paciente?.estatura != null) setEstatura(paciente.estatura);
    });
  }, [paciente?.id]);

  // Load historia clínica for antecedentes
  useEffect(() => {
    if (!paciente?.id) return;
    historiaClinicaService.getByPaciente(paciente.id).then((res) => {
      if (res?.success) setHistoria(res.data);
    }).catch(() => {});
  }, [paciente?.id]);

  const imc = calcularIMC(peso, estatura, system);

  const getIMCLabel = (val) => {
    const n = parseFloat(val);
    if (!val) return null;
    if (n < 18.5) return { text: 'Underweight', color: '#3B82F6' };
    if (n < 25) return { text: 'Normal', color: '#22C55E' };
    if (n < 30) return { text: 'Overweight', color: '#F59E0B' };
    return { text: 'Obese', color: '#EF4444' };
  };

  const handlePesoChange = (v) => {
    if (v === '' || v === null || v === undefined) { setPeso(''); return; }
    setPeso(system === 'us' ? parseFloat((parseFloat(v) * LBS_TO_KG).toFixed(1)) : v);
  };

  const handleTallaChange = (v) => {
    if (v === '' || v === null || v === undefined) { setEstatura(''); return; }
    setEstatura(system === 'us' ? Math.round(parseFloat(v) * IN_TO_CM) : v);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave?.({
        motivo,
        motivoInicial: reasonVisita,
        tiempoEnfermedad,
        signosSintomas,
        relatoCronologico,
        signosVitales: {
          peso: peso !== '' ? parseFloat(peso) : null,
          talla: estatura !== '' ? Math.round(parseFloat(estatura)) : null,
        },
        examenClinicoGeneral,
        planTratamiento: { indicaciones: planTratamiento },
        notas,
        antecedentes: antecedentesValues,
      });
    } catch (err) {
      console.error('Error saving:', err);
    } finally {
      setSaving(false);
    }
  };

  const startEditAntecedentes = () => {
    if (historia) {
      setAntecedentesValues({
        alergiaMedicamentos: historia.alergiaMedicamentos || '',
        propensionHemorragias: historia.propensionHemorragias || '',
        complicacionesAnestesia: historia.complicacionesAnestesia || '',
        presionArterialMedicacion: historia.presionArterialMedicacion || '',
        cardiopatiasPersonales: historia.cardiopatiasPersonales || '',
        cardiopatiasFamiliares: historia.cardiopatiasFamiliares || '',
        diabetesPersonal: historia.diabetesPersonal || '',
        diabetesFamiliar: historia.diabetesFamiliar || '',
        hepatitis: historia.hepatitis || '',
        otrasEnfermedades: historia.otrasEnfermedades || '',
        enfermedadActualMedicacion: historia.enfermedadActualMedicacion || '',
      });
    }
    setEditingAntecedentes(true);
  };

  const saveAntecedentes = async () => {
    if (!historia?.id) return;
    setSavingAntecedentes(true);
    try {
      const result = await historiaClinicaService.updateAntecedentes(historia.id, antecedentesValues);
      if (result?.success) {
        const refreshed = await historiaClinicaService.getByPaciente(paciente.id);
        if (refreshed?.success) setHistoria(refreshed.data);
      }
      setEditingAntecedentes(false);
    } catch (err) {
      console.error('Error saving antecedentes:', err);
    } finally {
      setSavingAntecedentes(false);
    }
  };

  const imcInfo = imc ? getIMCLabel(imc) : null;
  const activeAntecedentes = getActiveAntecedentes(historia);

  return (
    <div className="atencion-form">
      <div className="atencion-form__layout">
        {/* ─── LEFT: Main Content ─── */}
        <div className="atencion-form__main">
          {/* Reason */}
          <div className="atencion-form__section">
            <h3 className="atencion-form__section-title"><Stethoscope size={15} /> {tClinical('motivo_consulta')}</h3>
            <div className="atencion-form__fields">
              <div className="atencion-form__field">
                <label className="atencion-form__label">{tClinical('motivo_consulta')}</label>
                <textarea className="atencion-form__textarea" rows={2}
                  placeholder={tClinical('motivo_consulta_placeholder')}
                  value={reasonVisita} onChange={(e) => setReasonVisita(e.target.value)} />
              </div>
              <div className="atencion-form__field">
                <label className="atencion-form__label">{tClinical('diagnostico_enfermedad')} *</label>
                <textarea className="atencion-form__textarea" rows={2}
                  placeholder={tClinical('describa_diagnostico_placeholder')}
                  value={motivo} onChange={(e) => setMotivo(e.target.value)} />
              </div>
              <div className="atencion-form__field">
                <label className="atencion-form__label">{tClinical('dolores_sintomas')}</label>
                <textarea className="atencion-form__textarea" rows={2}
                  placeholder={tClinical('sintomas_placeholder')}
                  value={tiempoEnfermedad} onChange={(e) => setTiempoEnfermedad(e.target.value)} />
              </div>
              <div className="atencion-form__field">
                <label className="atencion-form__label">{tClinical('signos_sintomas')}</label>
                <textarea className="atencion-form__textarea" rows={2}
                  placeholder={tClinical('sintomas_placeholder')}
                  value={signosSintomas} onChange={(e) => setSignosSintomas(e.target.value)} />
              </div>
              <div className="atencion-form__field">
                <label className="atencion-form__label">{tClinical('relato_cronologico')}</label>
                <textarea className="atencion-form__textarea" rows={3}
                  placeholder={tClinical('relato_cronologico_placeholder')}
                  value={relatoCronologico} onChange={(e) => setRelatoCronologico(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Physical Exam */}
          <div className="atencion-form__section">
            <h3 className="atencion-form__section-title"><Activity size={15} /> {tClinical('examen_fisico')}</h3>
            <textarea className="atencion-form__textarea" rows={3}
              placeholder={tClinical('examen_fisico_placeholder')}
              value={examenClinicoGeneral} onChange={(e) => setExamenClinicoGeneral(e.target.value)} />
          </div>

          {/* Treatment Plan */}
          <div className="atencion-form__section">
            <h3 className="atencion-form__section-title"><ClipboardList size={15} /> {tClinical('plan_tratamiento')}</h3>
            <textarea className="atencion-form__textarea" rows={3}
              placeholder={tClinical('plan_tratamiento_placeholder')}
              value={planTratamiento} onChange={(e) => setPlanTratamiento(e.target.value)} />
          </div>

          {/* Notes */}
          <div className="atencion-form__section">
            <h3 className="atencion-form__section-title"><ClipboardList size={15} /> {tCommon('notas')}</h3>
            <textarea className="atencion-form__textarea" rows={2}
              placeholder={tClinical('observaciones_placeholder')}
              value={notas} onChange={(e) => setNotas(e.target.value)} />
          </div>
        </div>

        {/* ─── RIGHT: Sidebar ─── */}
        <div className="atencion-form__sidebar">
          {/* Vital Signs */}
          <div className="vital-sidebar">
            <div className="vital-sidebar__header-row" style={{ marginBottom: 0, paddingBottom: 0, border: 'none' }}>
              <h4 className="vital-sidebar__title" style={{ margin: 0, border: 'none', padding: 0, paddingBottom: 0 }}><HeartPulse size={15} /> {tPatients('signos_vitales')}</h4>
              <div className="unit-toggle">
                <button className={`unit-toggle__btn ${system === 'metric' ? 'unit-toggle__btn--active' : ''}`}
                  onClick={() => system !== 'metric' && toggle()}>Metric</button>
                <button className={`unit-toggle__btn ${system === 'us' ? 'unit-toggle__btn--active' : ''}`}
                  onClick={() => system !== 'us' && toggle()}>US</button>
              </div>
            </div>
            {vitalSource && (
              <span className="vital-sidebar__source">{tPatients('ultima_medicion')}: {vitalSource}</span>
            )}

            <div className="vital-sidebar__cards">
              <div className="vital-card vital-card--blue">
                <div className="vital-card__icon"><Scale size={18} /></div>
                <div className="vital-card__info">
                  <span className="vital-card__label">{tPatients('peso')}</span>
                  <input type="tel" inputMode="decimal" className="vital-card__input" placeholder="—"
                    step="0.1" min="0" value={system === 'us' ? pesoAUS(peso) : peso} onChange={(e) => handlePesoChange(e.target.value)} />
                  <span className="vital-card__unit">{system === 'us' ? 'lbs' : 'kg'}</span>
                </div>
              </div>

              <div className="vital-card vital-card--green">
                <div className="vital-card__icon"><Ruler size={18} /></div>
                <div className="vital-card__info">
                  <span className="vital-card__label">{tPatients('estatura')}</span>
                  <input type="tel" inputMode="decimal" className="vital-card__input" placeholder="—"
                    step="1" min="0" value={system === 'us' ? tallaAUS(estatura) : estatura} onChange={(e) => handleTallaChange(e.target.value)} />
                  <span className="vital-card__unit">{system === 'us' ? 'in' : 'cm'}</span>
                </div>
              </div>

              {imc ? (
                <div className="vital-card vital-card--imc" style={{ borderLeftColor: imcInfo?.color }}>
                  <div className="vital-card__icon" style={{ color: imcInfo?.color }}><Activity size={18} /></div>
                  <div className="vital-card__info">
                    <span className="vital-card__label">{tPatients('imc')}</span>
                    <div className="vital-card__imc-row">
                      <span className="vital-card__value" style={{ color: imcInfo?.color }}>{imc}</span>
                      <span className="vital-card__tag" style={{ background: imcInfo?.color + '18', color: imcInfo?.color }}>{imcInfo?.text}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="vital-card vital-card--imc vital-card--empty">
                  <div className="vital-card__icon"><Activity size={18} /></div>
                  <div className="vital-card__info">
                    <span className="vital-card__label">{tPatients('imc')}</span>
                    <span className="vital-card__placeholder">{tPatients('peso')} + {tPatients('estatura')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Antecedentes */}
          <div className="vital-sidebar vital-sidebar--antecedentes">
            <div className="vital-sidebar__header-row">
              <h4 className="vital-sidebar__title" style={{ margin: 0, border: 'none', padding: 0 }}>{tPatients('medical_history_title')}</h4>
              {!editingAntecedentes ? (
                <button className="vital-sidebar__edit-btn" onClick={startEditAntecedentes} disabled={!historia}>
                  <Edit2 size={13} />
                </button>
              ) : (
                <div className="vital-sidebar__edit-actions">
                  <button className="vital-sidebar__edit-btn" onClick={() => setEditingAntecedentes(false)}>
                    <XIcon size={13} />
                  </button>
                  <button className="vital-sidebar__edit-btn vital-sidebar__edit-btn--save" onClick={saveAntecedentes} disabled={savingAntecedentes}>
                    {savingAntecedentes ? <span className="spinner spinner--xs" /> : <Check size={13} />}
                  </button>
                </div>
              )}
            </div>

            {editingAntecedentes ? (
              <div className="vital-sidebar__antecedentes-edit">
                {[
                  { key: 'alergiaMedicamentos', label: tPatients('alergia_medicamentos') },
                  { key: 'propensionHemorragias', label: tPatients('propension_hemorragias') },
                  { key: 'complicacionesAnestesia', label: tPatients('complicaciones_anestesia') },
                  { key: 'presionArterialMedicacion', label: tPatients('presion_arterial_medicacion') },
                  { key: 'cardiopatiasPersonales', label: tPatients('cardiopatias_personales') },
                  { key: 'cardiopatiasFamiliares', label: tPatients('cardiopatias_familiares') },
                  { key: 'diabetesPersonal', label: tPatients('diabetes_personal') },
                  { key: 'diabetesFamiliar', label: tPatients('diabetes_familiar') },
                  { key: 'hepatitis', label: tPatients('hepatitis') },
                  { key: 'otrasEnfermedades', label: tPatients('otras_enfermedades') },
                  { key: 'enfermedadActualMedicacion', label: tPatients('enfermedad_actual_medicacion') },
                ].map(({ key, label }) => {
                  const val = antecedentesValues[key] || '';
                  const isYes = val && val !== 'No' && val !== '';
                  const isNo = val === 'No';
                  return (
                    <div key={key} className="vital-sidebar__ant-row">
                      <span className="vital-sidebar__ant-label">{label}</span>
                      <div className="vital-sidebar__ant-btns">
                        <button type="button" className={`antecedente-btn antecedente-btn--sm ${isYes ? 'si-activo' : ''}`}
                          onClick={() => setAntecedentesValues(prev => ({ ...prev, [key]: isYes ? '' : 'Si' }))}>
                          {tCommon('yes')}
                        </button>
                        <button type="button" className={`antecedente-btn antecedente-btn--sm ${isNo ? 'no-activo' : ''}`}
                          onClick={() => setAntecedentesValues(prev => ({ ...prev, [key]: isNo ? '' : 'No' }))}>
                          {tCommon('no')}
                        </button>
                      </div>
                      {isYes && (
                        <textarea className="vital-sidebar__ant-detail" rows={2}
                          value={val === 'Si' ? '' : val}
                          placeholder={tCommon('details') + '...'}
                          onChange={(e) => setAntecedentesValues(prev => ({ ...prev, [key]: e.target.value || 'Si' }))} />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : activeAntecedentes.length === 0 ? (
              <p className="vital-sidebar__empty">{tPatients('sin_historia_clinica')}</p>
            ) : (
              <div className="vital-sidebar__antecedentes-list">
                {activeAntecedentes.map(({ key, labelKey, value }) => (
                  <div key={key} className="vital-sidebar__ant-item">
                    <span className="vital-sidebar__ant-dot" />
                    <span className="vital-sidebar__ant-name">{tPatients(labelKey)}</span>
                    {value !== 'Si' && value !== 'Yes' && <span className="vital-sidebar__ant-value">{value}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="atencion-form__actions">
        <button className="btn btn--secondary" onClick={() => onSchedule?.()} disabled={saving}>
          <Calendar size={16} /> {tPatients('agendar_cita')}
        </button>
        <button className="btn btn--primary" onClick={handleSave} disabled={saving || !motivo.trim()}>
          {saving ? tCommon('guardando') : <><Save size={16} /> {tClinical('guardar_consulta')}</>}
        </button>
      </div>
    </div>
  );
}
