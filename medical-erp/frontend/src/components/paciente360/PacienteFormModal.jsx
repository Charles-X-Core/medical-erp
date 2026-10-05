import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2, ChevronRight, ChevronLeft, Check, Calendar, Scale, Ruler } from 'lucide-react';
import { pacienteService } from '../../services/pacienteService';
import { historiaClinicaService } from '../../services/historiaClinicaService';
import AntecedentesEditor from '../ui/AntecedentesEditor';
import CitaSchedulerModal from '../agenda/CitaSchedulerModal';
import { useUnitSystem } from '../../context/UnitContext';
import { calcularIMC, pesoAUS, tallaAUS, LBS_TO_KG, IN_TO_CM } from '../../utils/units';

const STEPS_NEW = [
  { labelKey: 'step_identificacion', icon: 'user' },
  { labelKey: 'personal_data', icon: 'heart' },
  { labelKey: 'contact_info', icon: 'phone' },
  { labelKey: 'emergency_contact_title', icon: 'stethoscope' },
  { labelKey: 'agendar_opcional', icon: 'calendar' },
];

const STEPS_EDIT = [
  { labelKey: 'step_identificacion', icon: 'user' },
  { labelKey: 'personal_data', icon: 'heart' },
  { labelKey: 'contact_info', icon: 'phone' },
  { labelKey: 'emergency_contact_title', icon: 'stethoscope' },
];

const emptyPaciente = {
  apellidoPaterno: '',
  nombres: '',
  licenciaConducir: '',
  telefono: '',
  email: '',
  fechaNacimiento: '',
  sexo: '',
  estadoCivil: '',
  direccionLinea1: '',
  ciudad: '',
  estadoProvincia: '',
  codigoPostal: '',
  direccionPais: 'US',
  lugarNacimiento: '',
  lugarProcedencia: '',
  gradoInstruccion: '',
  ocupacion: '',
  nombreAcompanante: '',
  contactoEmergencia: '',
  telefonoEmergencia: '',
  parentescoEmergencia: '',
  peso: '',
  estatura: '',
};

export default function PacienteFormModal({ isOpen, onClose, onSave, pacienteId = null }) {
  const { t } = useTranslation('patients');
  const isEdit = Boolean(pacienteId);
  const steps = isEdit ? STEPS_EDIT : STEPS_NEW;
  const lastDataStep = 3;
  const agendarStep = 4;

  const [formData, setFormData] = useState({ ...emptyPaciente });
  const [antecedentesData, setAntecedentesData] = useState({});
  const [historiaId, setHistoriaId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  const { system: unitSystem, toggle: toggleUnitSystem } = useUnitSystem();
  const isUS = unitSystem === 'us';
  const imc = formData.peso !== '' && formData.estatura !== ''
    ? calcularIMC(formData.peso, formData.estatura, 'metric')
    : null;

  const [createdPacienteId, setCreatedPacienteId] = useState(null);
  const [showScheduler, setShowScheduler] = useState(false);

  useEffect(() => {
    if (isOpen && pacienteId) {
      loadPaciente();
    } else if (isOpen) {
      setFormData({ ...emptyPaciente });
      setAntecedentesData({});
      setHistoriaId(null);
      setError('');
      setCurrentStep(0);
      setCreatedPacienteId(null);
      setShowScheduler(false);
    }
  }, [isOpen, pacienteId]);

  const loadPaciente = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await pacienteService.getById(pacienteId);
      if (res.success) {
        const p = res.data;
        setFormData({
          apellidoPaterno: p.apellidoPaterno || '',
          nombres: p.nombres || '',
          licenciaConducir: p.licenciaConducir || '',
          telefono: p.telefono || '',
          email: p.email || '',
          fechaNacimiento: p.fechaNacimiento || '',
          sexo: p.sexo || '',
          estadoCivil: p.estadoCivil || '',
          direccionLinea1: p.direccionLinea1 || '',
          ciudad: p.ciudad || '',
          estadoProvincia: p.estadoProvincia || '',
          codigoPostal: p.codigoPostal || '',
          direccionPais: p.direccionPais || 'US',
          lugarNacimiento: p.lugarNacimiento || '',
          lugarProcedencia: p.lugarProcedencia || '',
          gradoInstruccion: p.gradoInstruccion || '',
          ocupacion: p.ocupacion || '',
          nombreAcompanante: p.nombreAcompanante || '',
          contactoEmergencia: p.contactoEmergencia || '',
          telefonoEmergencia: p.telefonoEmergencia || '',
          parentescoEmergencia: p.parentescoEmergencia || '',
          peso: p.peso ?? '',
          estatura: p.estatura ?? '',
        });

        try {
          const hRes = await historiaClinicaService.getByPaciente(pacienteId);
          if (hRes.success && hRes.data) {
            setHistoriaId(hRes.data.id);
            setAntecedentesData({
              alergiaMedicamentos: hRes.data.alergiaMedicamentos || '',
              propensionHemorragias: hRes.data.propensionHemorragias || '',
              complicacionesAnestesia: hRes.data.complicacionesAnestesia || '',
              presionArterialMedicacion: hRes.data.presionArterialMedicacion || '',
              cardiopatiasPersonales: hRes.data.cardiopatiasPersonales || '',
              cardiopatiasFamiliares: hRes.data.cardiopatiasFamiliares || '',
              diabetesPersonal: hRes.data.diabetesPersonal || '',
              diabetesFamiliar: hRes.data.diabetesFamiliar || '',
              hepatitis: hRes.data.hepatitis || '',
              otrasEnfermedades: hRes.data.otrasEnfermedades || '',
              enfermedadActualMedicacion: hRes.data.enfermedadActualMedicacion || '',
            });
          }
        } catch {}
      } else {
        setError(res.message || t('error_loading'));
      }
    } catch (err) {
      setError(err.message || t('error_loading'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Peso y estatura siempre se guardan en métrico (kg / cm). Si la doctora está
  // en modo US se muestra en lbs / in y se convierte al escribir.
  const handlePesoChange = (v) => {
    if (v === '' || v === null || v === undefined) { setFormData(p => ({ ...p, peso: '' })); return; }
    const n = parseFloat(v);
    if (Number.isNaN(n)) return;
    setFormData(p => ({ ...p, peso: isUS ? parseFloat((n * LBS_TO_KG).toFixed(1)) : n }));
  };

  const handleEstaturaChange = (v) => {
    if (v === '' || v === null || v === undefined) { setFormData(p => ({ ...p, estatura: '' })); return; }
    const n = parseFloat(v);
    if (Number.isNaN(n)) return;
    setFormData(p => ({ ...p, estatura: isUS ? Math.round(n * IN_TO_CM) : n }));
  };

  const handleAntecedentesChange = (key, value) => {
    setAntecedentesData(prev => ({ ...prev, [key]: value }));
  };

  const validateStep = (step) => {
    if (step === 0) {
      if (!formData.licenciaConducir?.trim()) { setError(t('id_required', { ns: 'patients' })); return false; }
      if (formData.licenciaConducir.trim().length !== 8) { setError(t('id_min_length', { ns: 'patients' })); return false; }
      if (!formData.apellidoPaterno?.trim()) { setError(t('last_name_required', { ns: 'patients' })); return false; }
      if (!formData.nombres?.trim()) { setError(t('names_required', { ns: 'patients' })); return false; }
    }
    if (step === 1) {
      if (formData.peso !== '' && !(parseFloat(formData.peso) > 0)) { setError(t('peso_invalido')); return false; }
      if (formData.estatura !== '' && !(parseFloat(formData.estatura) > 0)) { setError(t('estatura_invalida')); return false; }
    }
    return true;
  };

  const savePacienteData = async () => {
    const payload = { ...formData };
    // El backend espera Double: vacío va como null, nunca como string.
    payload.peso = formData.peso === '' || formData.peso === null ? null : parseFloat(formData.peso);
    payload.estatura = formData.estatura === '' || formData.estatura === null ? null : parseFloat(formData.estatura);
    let result;
    if (isEdit) {
      result = await pacienteService.update(pacienteId, payload);
    } else {
      try {
        result = await pacienteService.create(payload);
      } catch (createErr) {
        if (createErr.status === 500) {
          const searchRes = await pacienteService.search(payload.licenciaConducir);
          const found = searchRes?.data?.content?.find(p => p.licenciaConducir === payload.licenciaConducir);
          if (found) {
            return found.id;
          }
        }
        throw createErr;
      }
    }
    if (!result.success) throw new Error(result.message || t('error_saving'));

    const pacId = result.data.id;
    const tieneAntecedentes = Object.values(antecedentesData).some(v => v && v !== 'No' && v !== '');
    if (historiaId) {
      await historiaClinicaService.updateAntecedentes(historiaId, antecedentesData);
    } else if (tieneAntecedentes) {
      await historiaClinicaService.create({ pacienteId: pacId, ...antecedentesData });
    }

    return pacId;
  };

  const handleNext = async () => {
    setError('');
    if (!validateStep(currentStep)) return;

    if (currentStep === lastDataStep && !isEdit && !createdPacienteId) {
      setSaving(true);
      try {
        const pacId = await savePacienteData();
        setCreatedPacienteId(pacId);
        setCurrentStep(prev => prev + 1);
      } catch (err) {
        setError(err.message || t('error_saving'));
      } finally {
        setSaving(false);
      }
      return;
    }

    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrev = () => {
    setError('');
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    setError('');
    setSaving(true);
    try {
      if (!isEdit && createdPacienteId) {
        onSave?.({ id: createdPacienteId, ...formData });
      } else if (isEdit) {
        await savePacienteData();
        onSave?.({ id: pacienteId, ...formData });
      }
      onClose();
    } catch (err) {
      setError(err.message || t('error_saving'));
    } finally {
      setSaving(false);
    }
  };

  const handleFinishPostSteps = () => {
    const pacId = createdPacienteId || pacienteId;
    onSave?.({ id: pacId, ...formData });
    onClose();
  };

  if (!isOpen) return null;

  const isLastStep = currentStep === steps.length - 1;
  const activePacienteId = createdPacienteId || pacienteId;
  const showPostSteps = !isEdit && currentStep >= agendarStep;

  return (
    <div className="wizard-overlay">
      <div className="wizard-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wizard-header">
          <h3>{isEdit ? t('edit_client') : t('new_client')}</h3>
          <button className="wizard-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="wizard-stepper">
          {steps.map((step, i) => {
            const canNavigate = i <= currentStep || i === currentStep + 1;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  className={`wizard-step ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'completed' : ''}`}
                  onClick={() => canNavigate && setCurrentStep(i)}
                  style={{ cursor: canNavigate ? 'pointer' : 'default', opacity: i > currentStep + 1 ? 0.45 : 1 }}
                >
                  <div className="wizard-step__circle">
                    {i < currentStep ? <Check size={14} /> : i + 1}
                  </div>
                  <span className="wizard-step__label">{t(step.labelKey)}</span>
                </div>
                {i < steps.length - 1 && <div className="wizard-step__connector" />}
              </div>
            );
          })}
        </div>

        {error && <div className="wizard-error">{error}</div>}

        {loading ? (
          <div className="wizard-loading">
            <Loader2 size={28} className="spinner" />
            <p>{t('loading_data', { ns: 'common' })}</p>
          </div>
        ) : (
          <div className="wizard-body">
            {/* Step 0: Identificacion */}
            {currentStep === 0 && (
              <div className="wizard-form-section">
                <div className="wizard-form-grid">
                  <div className="wizard-field wizard-field--full">
                    <label>{t('doc_number')} *</label>
                    <input type="text" name="licenciaConducir" value={formData.licenciaConducir} onChange={handleInputChange} required maxLength={8} placeholder={t('id_number_placeholder')} />
                  </div>
                  <div className="wizard-field">
                    <label>{t('last_name')} *</label>
                    <input type="text" name="apellidoPaterno" value={formData.apellidoPaterno} onChange={handleInputChange} required placeholder={t('last_name')} />
                  </div>
                  <div className="wizard-field wizard-field--full">
                    <label>{t('first_names')} *</label>
                    <input type="text" name="nombres" value={formData.nombres} onChange={handleInputChange} required placeholder={t('manual_form_names')} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Datos Personales */}
            {currentStep === 1 && (
              <div className="wizard-form-section">
                <div className="wizard-form-grid">
                  <div className="wizard-field">
                    <label>{t('birth_date')}</label>
                    <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleInputChange} />
                  </div>
                  <div className="wizard-field">
                    <label>{t('gender')}</label>
                    <select name="sexo" value={formData.sexo} onChange={handleInputChange}>
                      <option value="">{t('select_option', { ns: 'common' })}</option>
                      <option value="M">{t('gender_male')}</option>
                      <option value="F">{t('gender_female')}</option>
                    </select>
                  </div>
                  <div className="wizard-field">
                    <label>{t('civil_status')}</label>
                    <select name="estadoCivil" value={formData.estadoCivil} onChange={handleInputChange}>
                      <option value="">{t('select_option', { ns: 'common' })}</option>
                      <option value="Soltero">{t('civil_soltero')}</option>
                      <option value="Casado">{t('civil_casado')}</option>
                      <option value="Divorciado">{t('civil_divorciado')}</option>
                      <option value="Viudo">{t('civil_viudo')}</option>
                      <option value="Conviviente">{t('civil_conviviente')}</option>
                    </select>
                  </div>
                </div>

                {/* Peso y altura (opcionales). Se guardan en kg / cm. */}
                <div className="wizard-form-section wizard-form-section--medidas">
                  <h4>
                    <span>{t('medidas')}</span>
                    <span className="section-hint">({t('optional', { ns: 'common' })})</span>
                    <span className="wizard-unit-toggle-spacer" />
                    <span className="unit-toggle">
                      <button
                        type="button"
                        className={`unit-toggle__btn ${!isUS ? 'unit-toggle__btn--active' : ''}`}
                        onClick={() => isUS && toggleUnitSystem()}
                      >Metric</button>
                      <button
                        type="button"
                        className={`unit-toggle__btn ${isUS ? 'unit-toggle__btn--active' : ''}`}
                        onClick={() => !isUS && toggleUnitSystem()}
                      >US</button>
                    </span>
                  </h4>
                  <div className="wizard-form-grid">
                    <div className="wizard-field">
                      <label><Scale size={12} /> {t('peso')} ({isUS ? 'lbs' : 'kg'})</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        min="0"
                        value={isUS ? pesoAUS(formData.peso) : formData.peso}
                        onChange={(e) => handlePesoChange(e.target.value)}
                        placeholder="—"
                      />
                    </div>
                    <div className="wizard-field">
                      <label><Ruler size={12} /> {t('estatura')} ({isUS ? 'in' : 'cm'})</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        step="1"
                        min="0"
                        value={isUS ? tallaAUS(formData.estatura) : formData.estatura}
                        onChange={(e) => handleEstaturaChange(e.target.value)}
                        placeholder="—"
                      />
                    </div>
                    <div className="wizard-field">
                      <label>{t('imc')}</label>
                      <div className="wizard-field--readonly">{imc || '—'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Contacto */}
            {currentStep === 2 && (
              <div className="wizard-form-section">
                <div className="wizard-form-grid">
                  <div className="wizard-field">
                    <label>{t('phone_placeholder')}</label>
                    <input type="text" name="telefono" value={formData.telefono} onChange={handleInputChange} placeholder={t('phone_placeholder')} />
                  </div>
                  <div className="wizard-field">
                    <label>{t('email_placeholder')}</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder={t('email_placeholder')} />
                  </div>
                  <div className="wizard-field wizard-field--full">
                    <label>{t('street')}</label>
                    <input type="text" name="direccionLinea1" value={formData.direccionLinea1} onChange={handleInputChange} placeholder={t('street_placeholder')} />
                  </div>
                  <div className="wizard-field">
                    <label>{t('city')}</label>
                    <input type="text" name="ciudad" value={formData.ciudad} onChange={handleInputChange} placeholder={t('city_placeholder')} />
                  </div>
                  <div className="wizard-field">
                    <label>{t('state')}</label>
                    <input type="text" name="estadoProvincia" value={formData.estadoProvincia} onChange={handleInputChange} placeholder={t('state_placeholder')} />
                  </div>
                  <div className="wizard-field">
                    <label>{t('zip_code')}</label>
                    <input type="text" name="codigoPostal" value={formData.codigoPostal} onChange={handleInputChange} placeholder={t('zip_placeholder')} />
                  </div>
                  <div className="wizard-field">
                    <label>{t('country')}</label>
                    <input type="text" name="direccionPais" value={formData.direccionPais} onChange={handleInputChange} placeholder="US" />
                  </div>
                  <div className="wizard-field">
                    <label>{t('lugar_nacimiento')}</label>
                    <input type="text" name="lugarNacimiento" value={formData.lugarNacimiento} onChange={handleInputChange} placeholder={t('ciudad_estado')} />
                  </div>
                  <div className="wizard-field">
                    <label>{t('procedencia')}</label>
                    <input type="text" name="lugarProcedencia" value={formData.lugarProcedencia} onChange={handleInputChange} placeholder={t('ciudad_estado')} />
                  </div>
                  <div className="wizard-field">
                    <label>{t('grado_instruccion')}</label>
                    <select name="gradoInstruccion" value={formData.gradoInstruccion} onChange={handleInputChange}>
                      <option value="">{t('select_option', { ns: 'common' })}</option>
                      <option value="Primaria">{t('primaria', { ns: 'patients' })}</option>
                      <option value="Secundaria">{t('secundaria', { ns: 'patients' })}</option>
                      <option value="Tecnico">{t('tecnico', { ns: 'patients' })}</option>
                      <option value="Universitario">{t('universitario', { ns: 'patients' })}</option>
                      <option value="Postgrado">{t('postgrado', { ns: 'patients' })}</option>
                    </select>
                  </div>
                  <div className="wizard-field">
                    <label>{t('occupation')}</label>
                    <input type="text" name="ocupacion" value={formData.ocupacion} onChange={handleInputChange} placeholder={t('occupation')} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Emergencia y Antecedentes */}
            {currentStep === 3 && (
              <>
                <div className="wizard-form-section">
                  <h4>{t('emergency_contact_title')}</h4>
                  <div className="wizard-form-grid">
                    <div className="wizard-field">
                      <label>{t('acompanante')}</label>
                      <input type="text" name="nombreAcompanante" value={formData.nombreAcompanante} onChange={handleInputChange} placeholder={t('acompanante')} />
                    </div>
                    <div className="wizard-field">
                      <label>{t('contacto_emergencia')}</label>
                      <input type="text" name="contactoEmergencia" value={formData.contactoEmergencia} onChange={handleInputChange} placeholder={t('emergency_name')} />
                    </div>
                    <div className="wizard-field">
                      <label>{t('emergency_phone')}</label>
                      <input type="text" name="telefonoEmergencia" value={formData.telefonoEmergencia} onChange={handleInputChange} placeholder={t('phone_placeholder')} />
                    </div>
                    <div className="wizard-field">
                      <label>{t('parentesco')}</label>
                      <input type="text" name="parentescoEmergencia" value={formData.parentescoEmergencia} onChange={handleInputChange} placeholder={t('manual_form_relationship')} />
                    </div>
                  </div>
                </div>
                <div className="wizard-form-section">
                  <h4>{t('medical_history_title')} <span className="section-hint">({t('optional', { ns: 'common' })})</span></h4>
                  <AntecedentesEditor values={antecedentesData} onChange={handleAntecedentesChange} compact />
                </div>
              </>
            )}

            {/* Step 4: Agendar Cita (opcional) */}
            {currentStep === agendarStep && !isEdit && activePacienteId && (
              <div className="wizard-form-section" style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: 16 }}>
                  <Calendar size={32} color="#16a34a" />
                  <h4 style={{ margin: '8px 0 4px' }}>{t('agendar_cita')}</h4>
                  <p style={{ color: '#64748b', fontSize: 14 }}>{t('seleccionar_cliente')}</p>
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button
                    className="wizard-btn wizard-btn--next"
                    onClick={() => setShowScheduler(true)}
                    style={{ gap: 8 }}
                  >
                    <Calendar size={16} /> {t('agendar_cita')}
                  </button>
                  <button
                    className="wizard-btn wizard-btn--save"
                    onClick={handleFinishPostSteps}
                    style={{ gap: 8 }}
                  >
                    <Check size={16} /> {t('guardar_finalizar')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && (
          <div className="wizard-footer">
            <button type="button" className="wizard-btn wizard-btn--cancel" onClick={onClose} disabled={saving}>
              {t('cancel', { ns: 'common' })}
            </button>

            {currentStep > 0 && (
              <button type="button" className="wizard-btn wizard-btn--back" onClick={handlePrev} disabled={saving}>
                <ChevronLeft size={16} /> {t('anterior')}
              </button>
            )}

            {isLastStep && showPostSteps ? (
              <button type="button" className="wizard-btn wizard-btn--save" onClick={handleFinishPostSteps} disabled={saving}>
                <Check size={16} /> {t('guardar_finalizar')}
              </button>
            ) : currentStep === lastDataStep && !isEdit ? (
              <button type="button" className="wizard-btn wizard-btn--save" onClick={handleNext} disabled={saving}>
                {saving ? <Loader2 size={16} className="spinner" /> : <Check size={16} />}
                {saving ? t('saving') : t('guardar_continuar')}
              </button>
            ) : isEdit ? (
              <button type="button" className="wizard-btn wizard-btn--save" onClick={handleSubmit} disabled={saving}>
                {saving ? <Loader2 size={16} className="spinner" /> : <Check size={16} />}
                {saving ? t('saving') : t('save_client')}
              </button>
            ) : (
              <button type="button" className="wizard-btn wizard-btn--next" onClick={handleNext} disabled={saving}>
                {t('siguiente')} <ChevronRight size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {showScheduler && activePacienteId && (
        <CitaSchedulerModal
          isOpen={showScheduler}
          onClose={() => setShowScheduler(false)}
          paciente={{ id: activePacienteId, ...formData }}
          onCitaCreada={handleFinishPostSteps}
        />
      )}
    </div>
  );
}
