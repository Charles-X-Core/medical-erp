import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Save, Loader2, Check } from 'lucide-react';
import { pacienteService } from '../../services/pacienteService';

const emptyData = {
  // Step 1 - Datos personales
  nombres: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  fechaNacimiento: '',
  sexo: '',
  estadoCivil: '',
  telefono: '',
  email: '',
  direccion: '',
  ciudadEstado: '',
  ocupacion: '',
  contactoEmergencia: '',
  telefonoEmergencia: '',
  parentescoEmergencia: '',
  // Step 2 - Motivo de consulta
  motivoConsulta: '',
  observaciones: '',
  alergias: '',
  antecedentesPersonales: '',
  // Step 3 - Tratamiento
  tipoTratamiento: '',
  sesionesPlaneadas: 1,
  costoEstimado: '',
  objetivoTratamiento: '',
};

const sexoOptions = ['M', 'F'];
const sexoLabelsKey = { M: 'masculino', F: 'femenino' };
const estadoCivilOptionsKey = ['soltero', 'casado', 'divorciado', 'viudo', 'union_libre'];

export default function ManualForm() {
  const { t } = useTranslation('patients');
  const { t: tc } = useTranslation('common');
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState({ ...emptyData });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [createdPacienteId, setCreatedPacienteId] = useState(null);

  const steps = [
    { label: t('personal_data'), description: t('personal_data_desc') },
    { label: t('consultation_reason'), description: t('consultation_reason_desc') },
    { label: t('treatment'), description: t('treatment_desc') },
    { label: t('consent'), description: t('consent_desc') },
  ];

  const estadoCivilLabels = {
    soltero: t('soltero'),
    casado: t('casado'),
    divorciado: t('divorciado'),
    viudo: t('viudo'),
    union_libre: t('union_libre'),
  };

  const update = (field, value) => setData((prev) => ({ ...prev, [field]: value }));

  const canNext = () => {
    if (currentStep === 0) {
      return data.nombres.trim() && data.apellidoPaterno.trim();
    }
    return true;
  };

  const canPrev = () => currentStep > 0;

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const pacienteData = {
        nombres: data.nombres,
        apellidoPaterno: data.apellidoPaterno,
        apellidoMaterno: data.apellidoMaterno || null,
        fechaNacimiento: data.fechaNacimiento || null,
        sexo: data.sexo || null,
        estadoCivil: data.estadoCivil || null,
        telefono: data.telefono || null,
        email: data.email || null,
        direccionLinea1: data.direccion || null,
        ciudad: data.ciudadEstado?.split(',')[0]?.trim() || null,
        estadoProvincia: data.ciudadEstado?.split(',')[1]?.trim() || null,
        ocupacion: data.ocupacion || null,
        contactoEmergencia: data.contactoEmergencia || null,
        telefonoEmergencia: data.telefonoEmergencia || null,
        parentescoEmergencia: data.parentescoEmergencia || null,
        alergias: data.alergias || null,
        antecedentesPersonales: data.antecedentesPersonales || null,
        // Treatment data
        tipoTratamiento: data.tipoTratamiento || null,
        sesionesPlaneadas: data.sesionesPlaneadas || null,
        costoEstimado: data.costoEstimado || null,
        objetivoTratamiento: data.objetivoTratamiento || null,
      };

      const res = await pacienteService.create(pacienteData);
      if (res.success) {
        const pacienteId = res.data.id;
        setCreatedPacienteId(pacienteId);
        setSaved(true);
      }
    } catch (e) {
      setError(e.message || t('error_saving'));
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="manual-form__success">
        <div className="manual-form__success-icon">
          <Check size={48} />
        </div>
        <h3>{t('client_created')}</h3>
        <p>{t('license_id')}: <strong>{createdPacienteId ? `IMP-${String(createdPacienteId).padStart(4, '0')}` : 'N/A'}</strong></p>
        <div className="manual-form__success-actions">
          <button className="manual-form__btn manual-form__btn--primary" onClick={() => {
            setData({ ...emptyData });
            setSaved(false);
            setCreatedPacienteId(null);
            setCurrentStep(0);
          }}>
            {t('register_another')}
          </button>
          <button className="manual-form__btn manual-form__btn--secondary" onClick={() => navigate('/inicio')}>
            {t('back_to_home')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="manual-form">
      <div className="manual-form__stepper">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`manual-form__step ${i === currentStep ? 'manual-form__step--active' : ''} ${i < currentStep ? 'manual-form__step--completed' : ''}`}
            onClick={() => i < currentStep && setCurrentStep(i)}
          >
            <div className="manual-form__step-number">{i < currentStep ? '✓' : i + 1}</div>
            <div className="manual-form__step-info">
              <span className="manual-form__step-label">{step.label}</span>
              <span className="manual-form__step-desc">{step.description}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="manual-form__body">
        {currentStep === 0 && (
          <div className="manual-form__grid manual-form__grid--2">
            <div className="manual-form__field">
              <label>{t('names')}</label>
              <input type="text" value={data.nombres} onChange={(e) => update('nombres', e.target.value)} placeholder={t('full_names')} />
            </div>
            <div className="manual-form__field">
              <label>{t('paternal_surname')}</label>
              <input type="text" value={data.apellidoPaterno} onChange={(e) => update('apellidoPaterno', e.target.value)} placeholder={t('paternal_surname_placeholder')} />
            </div>
            <div className="manual-form__field">
              <label>{t('maternal_surname')}</label>
              <input type="text" value={data.apellidoMaterno} onChange={(e) => update('apellidoMaterno', e.target.value)} placeholder={t('maternal_surname_placeholder')} />
            </div>
            <div className="manual-form__field">
              <label>{t('birth_date')}</label>
              <input type="date" value={data.fechaNacimiento} onChange={(e) => update('fechaNacimiento', e.target.value)} />
            </div>
            <div className="manual-form__field">
              <label>{t('sex')}</label>
              <select value={data.sexo} onChange={(e) => update('sexo', e.target.value)}>
                <option value="">{t('select_option')}</option>
                {sexoOptions.map((s) => (
                  <option key={s} value={s}>{t(sexoLabelsKey[s])}</option>
                ))}
              </select>
            </div>
            <div className="manual-form__field">
              <label>{t('marital_status')}</label>
              <select value={data.estadoCivil} onChange={(e) => update('estadoCivil', e.target.value)}>
                <option value="">{t('select_option')}</option>
                {estadoCivilOptionsKey.map((ec) => (
                  <option key={ec} value={ec}>{estadoCivilLabels[ec]}</option>
                ))}
              </select>
            </div>
            <div className="manual-form__field">
              <label>{t('phone')}</label>
              <input type="tel" value={data.telefono} onChange={(e) => update('telefono', e.target.value)} placeholder={t('phone')} />
            </div>
            <div className="manual-form__field">
              <label>{t('email')}</label>
              <input type="email" value={data.email} onChange={(e) => update('email', e.target.value)} placeholder={t('email_placeholder')} />
            </div>
            <div className="manual-form__field manual-form__field--full">
              <label>{t('address')}</label>
              <input type="text" value={data.direccion} onChange={(e) => update('direccion', e.target.value)} placeholder={t('address_placeholder')} />
            </div>
            <div className="manual-form__field">
              <label>{t('city_state')}</label>
              <input type="text" value={data.ciudadEstado} onChange={(e) => update('ciudadEstado', e.target.value)} placeholder={t('city_state_placeholder')} />
            </div>
            <div className="manual-form__field">
              <label>{t('occupation')}</label>
              <input type="text" value={data.ocupacion} onChange={(e) => update('ocupacion', e.target.value)} placeholder={t('occupation')} />
            </div>
            <div className="manual-form__field">
              <label>{t('emergency_contact')}</label>
              <input type="text" value={data.contactoEmergencia} onChange={(e) => update('contactoEmergencia', e.target.value)} placeholder={t('emergency_contact_placeholder')} />
            </div>
            <div className="manual-form__field">
              <label>{t('emergency_phone')}</label>
              <input type="tel" value={data.telefonoEmergencia} onChange={(e) => update('telefonoEmergencia', e.target.value)} placeholder={t('emergency_phone_placeholder')} />
            </div>
            <div className="manual-form__field">
              <label>{t('relationship')}</label>
              <input type="text" value={data.parentescoEmergencia} onChange={(e) => update('parentescoEmergencia', e.target.value)} placeholder={t('relationship_placeholder')} />
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="manual-form__grid manual-form__grid--2">
            <div className="manual-form__field manual-form__field--full">
              <label>{t('consultation_reason_label')}</label>
              <textarea value={data.motivoConsulta} onChange={(e) => update('motivoConsulta', e.target.value)} rows={3} placeholder={t('consultation_reason_placeholder')} />
            </div>
            <div className="manual-form__field manual-form__field--full">
              <label>{t('observations')}</label>
              <textarea value={data.observaciones} onChange={(e) => update('observaciones', e.target.value)} rows={3} placeholder={t('observations_placeholder')} />
            </div>
            <div className="manual-form__field manual-form__field--full">
              <label>{t('allergies_label')}</label>
              <textarea value={data.alergias} onChange={(e) => update('alergias', e.target.value)} rows={2} placeholder={t('allergies_placeholder')} />
            </div>
            <div className="manual-form__field manual-form__field--full">
              <label>{t('personal_background')}</label>
              <textarea value={data.antecedentesPersonales} onChange={(e) => update('antecedentesPersonales', e.target.value)} rows={3} placeholder={t('personal_background_placeholder')} />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="manual-form__grid manual-form__grid--2">
            <div className="manual-form__field">
              <label>{t('treatment_type')}</label>
              <input type="text" value={data.tipoTratamiento} onChange={(e) => update('tipoTratamiento', e.target.value)} placeholder={t('treatment_type_placeholder')} />
            </div>
            <div className="manual-form__field">
              <label>{t('planned_sessions')}</label>
              <input type="number" min="1" max="100" value={data.sesionesPlaneadas} onChange={(e) => update('sesionesPlaneadas', parseInt(e.target.value) || 1)} />
            </div>
            <div className="manual-form__field">
              <label>{t('estimated_cost')}</label>
              <input type="number" min="0" step="0.01" value={data.costoEstimado} onChange={(e) => update('costoEstimado', e.target.value)} placeholder={t('cost_placeholder')} />
            </div>
            <div className="manual-form__field manual-form__field--full">
              <label>{t('treatment_objective')}</label>
              <textarea value={data.objetivoTratamiento} onChange={(e) => update('objetivoTratamiento', e.target.value)} rows={3} placeholder={t('treatment_objective_placeholder')} />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="manual-form__consentimiento-info">
            <div className="manual-form__consentimiento-card">
              <h4>{t('consent_title')}</h4>
              <p>{t('consent_desc_text')}</p>
              <p>{t('consent_types')}</p>
              <ul>
                <li><strong>TRATAMIENTO</strong> — {t('consent_treatment')}</li>
                <li><strong>PRIVACIDAD</strong> — {t('consent_privacy')}</li>
                <li><strong>INFORMADO</strong> — {t('consent_informed')}</li>
              </ul>
              <p className="manual-form__consentimiento-note">
                {t('consent_note')}
              </p>
            </div>
          </div>
        )}

        {error && <div className="manual-form__error">{error}</div>}
      </div>

      <div className="manual-form__footer">
        <button
          className="manual-form__btn manual-form__btn--secondary"
          disabled={!canPrev() || saving}
          onClick={() => setCurrentStep((s) => s - 1)}
        >
          <ChevronLeft size={18} /> {t('prev')}
        </button>
        <div className="manual-form__footer-right">
          {currentStep < steps.length - 1 ? (
            <button
              className="manual-form__btn manual-form__btn--primary"
              disabled={!canNext()}
              onClick={() => setCurrentStep((s) => s + 1)}
            >
              {t('next')} <ChevronRight size={18} />
            </button>
          ) : (
            <button
              className="manual-form__btn manual-form__btn--primary"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? <Loader2 size={18} className="manual-form__spinner" /> : <Save size={18} />}
              {t('save_client')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
