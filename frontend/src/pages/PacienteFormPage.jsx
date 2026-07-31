import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { pacienteService } from '../services/pacienteService';
import { configService } from '../services/pacienteSubServices';
import { getCountryConfig, getDefaultPais } from '../config/countryConfig';
import PacienteDocumentos from '../components/paciente/PacienteDocumentos';
import PacienteSeguros from '../components/paciente/PacienteSeguros';
import PacienteConsentimientos from '../components/paciente/PacienteConsentimientos';

const emptyPaciente = {
  apellidoPaterno: '',
  apellidoMaterno: '',
  nombres: '',
  dni: '',
  tipoDocumento: '',
  telefono: '',
  email: '',
  fechaNacimiento: '',
  sexo: '',
  estadoCivil: '',
  direccion: '',
  lugarNacimiento: '',
  lugarProcedencia: '',
  gradoInstruccion: '',
  ocupacion: '',
  nombreAcompanante: '',
  contactoEmergencia: '',
  telefonoEmergencia: '',
  parentescoEmergencia: '',
  alergias: '',
  antecedentesPersonales: '',
  antecedentesFamiliares: '',
};

export default function PacienteFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [pais, setPais] = useState(getDefaultPais());
  const [config, setConfig] = useState(getCountryConfig(getDefaultPais()));
  const [paciente, setPaciente] = useState({ ...emptyPaciente });
  const [documentos, setDocumentos] = useState([]);
  const [seguros, setSeguros] = useState([]);
  const [consentimientos, setConsentimientos] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    configService.getCountries().then((res) => {
      if (res.success) setCountries(res.data || []);
    });
  }, []);

  useEffect(() => {
    setConfig(getCountryConfig(pais));
    setPaciente((p) => ({ ...p, tipoDocumento: getCountryConfig(pais).defaultDocType }));
  }, [pais]);

  const loadPaciente = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await pacienteService.getById(id);
      if (res.success) {
        const p = res.data;
        setPais(p.pais || getDefaultPais());
        setPaciente({
          apellidoPaterno: p.apellidoPaterno || '',
          apellidoMaterno: p.apellidoMaterno || '',
          nombres: p.nombres || '',
          dni: p.dni || '',
          tipoDocumento: p.tipoDocumento || '',
          telefono: p.telefono || '',
          email: p.email || '',
          fechaNacimiento: p.fechaNacimiento || '',
          sexo: p.sexo || '',
          estadoCivil: p.estadoCivil || '',
          direccion: p.direccion || '',
          lugarNacimiento: p.lugarNacimiento || '',
          lugarProcedencia: p.lugarProcedencia || '',
          gradoInstruccion: p.gradoInstruccion || '',
          ocupacion: p.ocupacion || '',
          nombreAcompanante: p.nombreAcompanante || '',
          contactoEmergencia: p.contactoEmergencia || '',
          telefonoEmergencia: p.telefonoEmergencia || '',
          parentescoEmergencia: p.parentescoEmergencia || '',
          alergias: p.alergias || '',
          antecedentesPersonales: p.antecedentesPersonales || '',
          antecedentesFamiliares: p.antecedentesFamiliares || '',
        });
        setDocumentos(p.documentos || []);
        setSeguros(p.seguros || []);
        setConsentimientos(p.consentimientos || []);
      } else {
        setError(res.message || 'Error al cargar paciente');
      }
    } catch (err) {
      setError(err.message || 'Error al cargar paciente');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPaciente();
  }, [loadPaciente]);

  const handleChange = (field, value) => {
    setPaciente((p) => ({ ...p, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      paciente: { ...paciente },
      documentos,
      seguros,
      consentimientos,
    };

    try {
      const res = isEdit
        ? await pacienteService.update(id, payload)
        : await pacienteService.create(payload);
      if (res.success) {
        navigate(`/pacientes/${res.data.id}`);
      } else {
        setError(res.message || 'Error al guardar');
      }
    } catch (err) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="paciente-form-page">
        <div className="paciente-form-page__loading">
          <Loader2 size={32} className="spinner" />
          <p>Cargando paciente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="paciente-form-page">
      <div className="paciente-form-page__header">
        <button className="btn btn--ghost" onClick={() => navigate('/pacientes')}>
          <ArrowLeft size={18} /> Volver
        </button>
        <h2 className="paciente-form-page__title">
          {isEdit ? 'Editar Paciente' : 'Nuevo Paciente'}
        </h2>
      </div>

      {error && <div className="paciente-form-page__error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-card">
          <div className="form-field form-field--small">
            <label className="form-label">País / Región</label>
            <select className="form-select" value={pais} onChange={(e) => setPais(e.target.value)}>
              {countries.map((c) => (
                <option key={c.codigo} value={c.codigo}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-card">
          <h3 className="form-section__title">Datos Personales</h3>
          <div className="form-grid form-grid--2">
            <div className="form-field">
              <label className="form-label">Apellido Paterno *</label>
              <input
                className="form-input"
                value={paciente.apellidoPaterno}
                onChange={(e) => handleChange('apellidoPaterno', e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">Apellido Materno</label>
              <input
                className="form-input"
                value={paciente.apellidoMaterno}
                onChange={(e) => handleChange('apellidoMaterno', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Nombres *</label>
              <input
                className="form-input"
                value={paciente.nombres}
                onChange={(e) => handleChange('nombres', e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">Tipo Documento</label>
              <select
                className="form-select"
                value={paciente.tipoDocumento}
                onChange={(e) => handleChange('tipoDocumento', e.target.value)}
              >
                <option value="">Sin documento</option>
                {config.documentTypes.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Número Documento</label>
              <input
                className="form-input"
                value={paciente.dni}
                onChange={(e) => handleChange('dni', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Fecha de Nacimiento</label>
              <input
                type="date"
                className="form-input"
                value={paciente.fechaNacimiento}
                onChange={(e) => handleChange('fechaNacimiento', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Sexo</label>
              <select
                className="form-select"
                value={paciente.sexo}
                onChange={(e) => handleChange('sexo', e.target.value)}
              >
                <option value="">Seleccionar</option>
                {config.genderOptions.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Estado Civil</label>
              <select
                className="form-select"
                value={paciente.estadoCivil}
                onChange={(e) => handleChange('estadoCivil', e.target.value)}
              >
                <option value="">Seleccionar</option>
                {config.civilStatusOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3 className="form-section__title">Contacto</h3>
          <div className="form-grid form-grid--2">
            <div className="form-field">
              <label className="form-label">Teléfono</label>
              <input className="form-input" value={paciente.telefono} onChange={(e) => handleChange('telefono', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={paciente.email} onChange={(e) => handleChange('email', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Dirección</label>
              <input className="form-input" value={paciente.direccion} onChange={(e) => handleChange('direccion', e.target.value)} />
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
              <input className="form-input" value={paciente.gradoInstruccion} onChange={(e) => handleChange('gradoInstruccion', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Ocupación</label>
              <input className="form-input" value={paciente.ocupacion} onChange={(e) => handleChange('ocupacion', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3 className="form-section__title">Contacto de Emergencia</h3>
          <div className="form-grid form-grid--2">
            <div className="form-field">
              <label className="form-label">Nombre acompañante</label>
              <input className="form-input" value={paciente.nombreAcompanante} onChange={(e) => handleChange('nombreAcompanante', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Contacto emergencia</label>
              <input className="form-input" value={paciente.contactoEmergencia} onChange={(e) => handleChange('contactoEmergencia', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Teléfono emergencia</label>
              <input className="form-input" value={paciente.telefonoEmergencia} onChange={(e) => handleChange('telefonoEmergencia', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Parentesco</label>
              <input className="form-input" value={paciente.parentescoEmergencia} onChange={(e) => handleChange('parentescoEmergencia', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3 className="form-section__title">Antecedentes Médicos</h3>
          <div className="form-grid form-grid--1">
            <div className="form-field">
              <label className="form-label">Alergias</label>
              <textarea className="form-textarea" rows={3} value={paciente.alergias} onChange={(e) => handleChange('alergias', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Antecedentes Personales</label>
              <textarea className="form-textarea" rows={3} value={paciente.antecedentesPersonales} onChange={(e) => handleChange('antecedentesPersonales', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Antecedentes Familiares</label>
              <textarea className="form-textarea" rows={3} value={paciente.antecedentesFamiliares} onChange={(e) => handleChange('antecedentesFamiliares', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="form-card">
          <PacienteDocumentos config={config} documentos={documentos} onChange={setDocumentos} />
        </div>

        {config.insurance && (
          <div className="form-card">
            <PacienteSeguros config={config} seguros={seguros} onChange={setSeguros} />
          </div>
        )}

        {config.consent.required && (
          <div className="form-card">
            <PacienteConsentimientos config={config} consentimientos={consentimientos} onChange={setConsentimientos} />
          </div>
        )}

        <div className="paciente-form-page__actions">
          <button type="button" className="btn btn--secondary" onClick={() => navigate('/pacientes')} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? <Loader2 size={18} className="spinner" /> : <Save size={18} />}
            {saving ? 'Guardando...' : 'Guardar Paciente'}
          </button>
        </div>
      </form>
    </div>
  );
}
