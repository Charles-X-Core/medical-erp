import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save, Loader2, Scale, Ruler } from 'lucide-react';
import { pacienteService } from '../services/pacienteService';
import { historiaClinicaService } from '../services/historiaClinicaService';
import AntecedentesEditor from '../components/ui/AntecedentesEditor';
import { useUnitSystem } from '../context/UnitContext';
import { pesoAUS, tallaAUS, LBS_TO_KG, IN_TO_CM } from '../utils/units';

const emptyPaciente = {
  apellidoPaterno: '', nombres: '', licenciaConducir: '',
  telefono: '', email: '', fechaNacimiento: '', sexo: '', estadoCivil: '',
  direccionLinea1: '', ciudad: '', estadoProvincia: '', codigoPostal: '', direccionPais: 'US',
  lugarNacimiento: '', lugarProcedencia: '', gradoInstruccion: '',
  ocupacion: '', nombreAcompanante: '', contactoEmergencia: '', telefonoEmergencia: '',
  parentescoEmergencia: '', estatura: '', peso: '',
};

export default function PacienteFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { t } = useTranslation('patients');

  const [paciente, setPaciente] = useState({ ...emptyPaciente });
  const [antecedentesData, setAntecedentesData] = useState({});
  const [historiaId, setHistoriaId] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Peso y estatura se guardan en métrico (kg / cm).
  const { system: unitSystem, toggle: toggleUnitSystem } = useUnitSystem();
  const isUS = unitSystem === 'us';

  const changePeso = (v) => {
    if (v === '') { setPaciente(p => ({ ...p, peso: '' })); return; }
    const n = parseFloat(v);
    if (Number.isNaN(n)) return;
    setPaciente(p => ({ ...p, peso: isUS ? parseFloat((n * LBS_TO_KG).toFixed(1)) : n }));
  };

  const changeEstatura = (v) => {
    if (v === '') { setPaciente(p => ({ ...p, estatura: '' })); return; }
    const n = parseFloat(v);
    if (Number.isNaN(n)) return;
    setPaciente(p => ({ ...p, estatura: isUS ? Math.round(n * IN_TO_CM) : n }));
  };

  const loadPaciente = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await pacienteService.getById(id);
      if (res.success) {
        const p = res.data;
        setPaciente({
          apellidoPaterno: p.apellidoPaterno || '',
          nombres: p.nombres || '', licenciaConducir: p.licenciaConducir || '',
          telefono: p.telefono || '', email: p.email || '', fechaNacimiento: p.fechaNacimiento || '',
          sexo: p.sexo || '', estadoCivil: p.estadoCivil || '',
          direccionLinea1: p.direccionLinea1 || '', ciudad: p.ciudad || '',
          estadoProvincia: p.estadoProvincia || '', codigoPostal: p.codigoPostal || '',
          direccionPais: p.direccionPais || 'US',
          lugarNacimiento: p.lugarNacimiento || '', lugarProcedencia: p.lugarProcedencia || '',
          gradoInstruccion: p.gradoInstruccion || '', ocupacion: p.ocupacion || '',
          nombreAcompanante: p.nombreAcompanante || '', contactoEmergencia: p.contactoEmergencia || '',
          telefonoEmergencia: p.telefonoEmergencia || '',           parentescoEmergencia: p.parentescoEmergencia || '',
          estatura: p.estatura ?? '',
          peso: p.peso ?? '',
        });
        try {
          const hRes = await historiaClinicaService.getByPaciente(id);
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
        } catch { /* No historia yet */ }
      } else {
        setError(res.message || t('error_loading'));
      }
    } catch (err) {
      setError(err.message || t('error_loading'));
    } finally { setLoading(false); }
  }, [id, t]);

  useEffect(() => { loadPaciente(); }, [loadPaciente]);

  const handleChange = (field, value) => setPaciente((p) => ({ ...p, [field]: value }));
  const handleAntecedentesChange = (key, value) => setAntecedentesData(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    if (!paciente.apellidoPaterno?.trim() || !paciente.nombres?.trim()) {
      setError(t('last_name') + ' y ' + t('first_names') + ' son obligatorios');
      setSaving(false); return;
    }
    if (!paciente.licenciaConducir?.trim()) {
      setError(t('doc_number') + ' es obligatorio');
      setSaving(false); return;
    }
    if (paciente.licenciaConducir.trim().length !== 8) {
      setError(t('doc_number') + ' debe tener exactamente 8 caracteres');
      setSaving(false); return;
    }
    try {
      // El backend espera Double: vacío va como null, nunca como string.
      const payload = {
        ...paciente,
        peso: paciente.peso === '' || paciente.peso === null ? null : parseFloat(paciente.peso),
        estatura: paciente.estatura === '' || paciente.estatura === null ? null : parseFloat(paciente.estatura),
      };
      const res = isEdit ? await pacienteService.update(id, payload) : await pacienteService.create(payload);
      if (res.success) {
        const pacienteCreado = res.data;
        const tieneAntecedentes = Object.values(antecedentesData).some(v => v && v !== 'No' && v !== '');
        if (historiaId) {
          await historiaClinicaService.updateAntecedentes(historiaId, antecedentesData);
        } else if (tieneAntecedentes) {
          await historiaClinicaService.create({ pacienteId: pacienteCreado.id, ...antecedentesData });
        }
        navigate(`/pacientes/${pacienteCreado.id}/workspace`);
      } else {
        setError(res.message || t('error_saving'));
      }
    } catch (err) { setError(err.message || t('error_saving')); } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="paciente-form-page">
        <div className="paciente-form-page__loading">
          <Loader2 size={32} className="spinner" />
          <p>{t('loading_client')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="paciente-form-page">
      <div className="paciente-form-page__header">
        <button className="btn btn--ghost" onClick={() => navigate('/pacientes')}>
          <ArrowLeft size={18} /> {t('back', { ns: 'common' })}
        </button>
        <h2 className="paciente-form-page__title">
          {isEdit ? t('edit_client') : t('new_client')}
        </h2>
      </div>

      {error && <div className="paciente-form-page__error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-card">
          <h3 className="form-section__title">{t('personal_data')}</h3>
          <div className="form-grid form-grid--2">
            <div className="form-field">
              <label className="form-label">ID *</label>
              <input className="form-input" value={paciente.licenciaConducir}
                onChange={(e) => handleChange('licenciaConducir', e.target.value)}
                maxLength={8} placeholder={t('id_number_placeholder')} required />
            </div>
            <div className="form-field">
              <label className="form-label">{t('last_name')} *</label>
              <input className="form-input" value={paciente.apellidoPaterno} onChange={(e) => handleChange('apellidoPaterno', e.target.value)} required />
            </div>
            <div className="form-field">
              <label className="form-label">{t('first_names')} *</label>
              <input className="form-input" value={paciente.nombres} onChange={(e) => handleChange('nombres', e.target.value)} required />
            </div>
            <div className="form-field">
              <label className="form-label">{t('birth_date')}</label>
              <input type="date" className="form-input" value={paciente.fechaNacimiento} onChange={(e) => handleChange('fechaNacimiento', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">{t('gender')}</label>
              <select className="form-select" value={paciente.sexo} onChange={(e) => handleChange('sexo', e.target.value)}>
                <option value="">{t('select_option')}</option>
                <option value="M">{t('gender_male')}</option>
                <option value="F">{t('gender_female')}</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">{t('civil_status')}</label>
              <select className="form-select" value={paciente.estadoCivil} onChange={(e) => handleChange('estadoCivil', e.target.value)}>
                <option value="">{t('select_option')}</option>
                <option value="Soltero">{t('civil_soltero')}</option>
                <option value="Casado">{t('civil_casado')}</option>
                <option value="Divorciado">{t('civil_divorciado')}</option>
                <option value="Viudo">{t('civil_viudo')}</option>
                <option value="Conviviente">{t('civil_conviviente')}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-card">
          <div className="form-section__header">
            <h3 className="form-section__title">
              {t('medidas')}
              <span className="section-hint"> ({t('optional', { ns: 'common' })})</span>
            </h3>
            <div className="unit-toggle">
              <button type="button" className={`unit-toggle__btn ${!isUS ? 'unit-toggle__btn--active' : ''}`}
                onClick={() => isUS && toggleUnitSystem()}>Metric</button>
              <button type="button" className={`unit-toggle__btn ${isUS ? 'unit-toggle__btn--active' : ''}`}
                onClick={() => !isUS && toggleUnitSystem()}>US</button>
            </div>
          </div>
          <div className="form-grid form-grid--2">
            <div className="form-field">
              <label className="form-label">
                <Scale size={12} /> {t('peso')} ({isUS ? 'lbs' : 'kg'})
              </label>
              <input type="number" inputMode="decimal" step="0.1" min="0" className="form-input"
                value={isUS ? pesoAUS(paciente.peso) : (paciente.peso ?? '')}
                onChange={(e) => changePeso(e.target.value)} placeholder="—" />
            </div>
            <div className="form-field">
              <label className="form-label">
                <Ruler size={12} /> {t('estatura')} ({isUS ? 'in' : 'cm'})
              </label>
              <input type="number" inputMode="numeric" step="1" min="0" className="form-input"
                value={isUS ? tallaAUS(paciente.estatura) : (paciente.estatura ?? '')}
                onChange={(e) => changeEstatura(e.target.value)} placeholder="—" />
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3 className="form-section__title">{t('contact_info')}</h3>
          <div className="form-grid form-grid--2">
            <div className="form-field">
              <label className="form-label">{t('phone', { ns: 'common' })}</label>
              <input className="form-input" value={paciente.telefono} onChange={(e) => handleChange('telefono', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">{t('email', { ns: 'common' })}</label>
              <input type="email" className="form-input" value={paciente.email} onChange={(e) => handleChange('email', e.target.value)} />
            </div>
            <div className="form-field form-field--full">
              <label className="form-label">{t('street')}</label>
              <input className="form-input" value={paciente.direccionLinea1 || ''} onChange={(e) => handleChange('direccionLinea1', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">{t('city')}</label>
              <input className="form-input" value={paciente.ciudad || ''} onChange={(e) => handleChange('ciudad', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">{t('state')}</label>
              <input className="form-input" value={paciente.estadoProvincia || ''} onChange={(e) => handleChange('estadoProvincia', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">{t('zip_code')}</label>
              <input className="form-input" value={paciente.codigoPostal || ''} onChange={(e) => handleChange('codigoPostal', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">{t('country')}</label>
              <input className="form-input" value={paciente.direccionPais || 'US'} onChange={(e) => handleChange('direccionPais', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Lugar de Nacimiento</label>
              <input className="form-input" value={paciente.lugarNacimiento} onChange={(e) => handleChange('lugarNacimiento', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Lugar de Procedencia</label>
              <input className="form-input" value={paciente.lugarProcedencia} onChange={(e) => handleChange('lugarProcedencia', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Grado de Instrucción</label>
              <select className="form-select" value={paciente.gradoInstruccion} onChange={(e) => handleChange('gradoInstruccion', e.target.value)}>
                <option value="">{t('select_option')}</option>
                <option value="Primaria">Primaria</option>
                <option value="Secundaria">Secundaria</option>
                <option value="Tecnico">Técnico</option>
                <option value="Universitario">Universitario</option>
                <option value="Postgrado">Postgrado</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">{t('occupation')}</label>
              <input className="form-input" value={paciente.ocupacion} onChange={(e) => handleChange('ocupacion', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3 className="form-section__title">{t('emergency_contact_title')}</h3>
          <div className="form-grid form-grid--2">
            <div className="form-field">
              <label className="form-label">{t('emergency_name')}</label>
              <input className="form-input" value={paciente.nombreAcompanante} onChange={(e) => handleChange('nombreAcompanante', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">{t('emergency_phone')}</label>
              <input className="form-input" value={paciente.contactoEmergencia} onChange={(e) => handleChange('contactoEmergencia', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">{t('emergency_phone')}</label>
              <input className="form-input" value={paciente.telefonoEmergencia} onChange={(e) => handleChange('telefonoEmergencia', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">{t('emergency_relationship')}</label>
              <input className="form-input" value={paciente.parentescoEmergencia} onChange={(e) => handleChange('parentescoEmergencia', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3 className="form-section__title">{t('medical_history_title')}</h3>
          <AntecedentesEditor values={antecedentesData} onChange={handleAntecedentesChange} compact />
        </div>

        <div className="paciente-form-page__actions">
          <button type="button" className="btn btn--secondary" onClick={() => navigate('/pacientes')} disabled={saving}>
            {t('cancel', { ns: 'common' })}
          </button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? <Loader2 size={18} className="spinner" /> : <Save size={18} />}
            {saving ? t('saving') : t('save_client')}
          </button>
        </div>
      </form>
    </div>
  );
}
