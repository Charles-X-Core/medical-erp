import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { pacienteService } from '../services/pacienteService';
import { historiaClinicaService } from '../services/historiaClinicaService';
import AntecedentesEditor from '../components/ui/AntecedentesEditor';

const emptyPaciente = {
  apellidoPaterno: '',
  apellidoMaterno: '',
  nombres: '',
  licenciaConducir: '',
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
  estatura: '',
  ciudadEstado: '',
};

export default function PacienteFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [paciente, setPaciente] = useState({ ...emptyPaciente });
  const [antecedentesData, setAntecedentesData] = useState({});
  const [historiaId, setHistoriaId] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadPaciente = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await pacienteService.getById(id);
      if (res.success) {
        const p = res.data;
        setPaciente({
          apellidoPaterno: p.apellidoPaterno || '',
          apellidoMaterno: p.apellidoMaterno || '',
          nombres: p.nombres || '',
          licenciaConducir: p.licenciaConducir || '',
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
          estatura: p.estatura || '',
          ciudadEstado: p.ciudadEstado || '',
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
        } catch {
          // No historia yet
        }
      } else {
        setError(res.message || 'Error al cargar cliente');
      }
    } catch (err) {
      setError(err.message || 'Error al cargar cliente');
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

  const handleAntecedentesChange = (key, value) => {
    setAntecedentesData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!paciente.apellidoPaterno?.trim() || !paciente.nombres?.trim()) {
      setError('Apellido paterno y nombres son obligatorios');
      setSaving(false);
      return;
    }

    if (!paciente.licenciaConducir?.trim()) {
      setError('El numero de ID es obligatorio');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        ...paciente,
      };

      const res = isEdit
        ? await pacienteService.update(id, payload)
        : await pacienteService.create(payload);

      if (res.success) {
        const pacienteCreado = res.data;

        const tieneAntecedentes = Object.values(antecedentesData).some(v => v && v !== 'No' && v !== '');

        if (historiaId) {
          await historiaClinicaService.updateAntecedentes(historiaId, antecedentesData);
        } else if (tieneAntecedentes) {
          await historiaClinicaService.create({
            pacienteId: pacienteCreado.id,
            ...antecedentesData,
          });
        }

        navigate(`/pacientes/${pacienteCreado.id}/workspace`);
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
          <p>Cargando cliente...</p>
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
          {isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
        </h2>
      </div>

      {error && <div className="paciente-form-page__error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-card">
          <h3 className="form-section__title">Datos Personales</h3>
          <div className="form-grid form-grid--2">
            <div className="form-field">
              <label className="form-label">ID *</label>
              <input
                className="form-input"
                value={paciente.licenciaConducir}
                onChange={(e) => handleChange('licenciaConducir', e.target.value)}
                maxLength={20}
                placeholder="Ingrese su numero de identificacion"
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">Apellido Paterno *</label>
              <input className="form-input" value={paciente.apellidoPaterno} onChange={(e) => handleChange('apellidoPaterno', e.target.value)} required />
            </div>
            <div className="form-field">
              <label className="form-label">Apellido Materno</label>
              <input className="form-input" value={paciente.apellidoMaterno} onChange={(e) => handleChange('apellidoMaterno', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Nombres *</label>
              <input className="form-input" value={paciente.nombres} onChange={(e) => handleChange('nombres', e.target.value)} required />
            </div>
            <div className="form-field">
              <label className="form-label">Fecha de Nacimiento</label>
              <input type="date" className="form-input" value={paciente.fechaNacimiento} onChange={(e) => handleChange('fechaNacimiento', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Sexo</label>
              <select className="form-select" value={paciente.sexo} onChange={(e) => handleChange('sexo', e.target.value)}>
                <option value="">Seleccionar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Estado Civil</label>
              <select className="form-select" value={paciente.estadoCivil} onChange={(e) => handleChange('estadoCivil', e.target.value)}>
                <option value="">Seleccionar</option>
                <option value="Soltero">Soltero(a)</option>
                <option value="Casado">Casado(a)</option>
                <option value="Divorciado">Divorciado(a)</option>
                <option value="Viudo">Viudo(a)</option>
                <option value="Conviviente">Conviviente</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Estatura (cm)</label>
              <input type="number" step="0.01" className="form-input" value={paciente.estatura || ''} onChange={(e) => handleChange('estatura', e.target.value ? parseFloat(e.target.value) : null)} />
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3 className="form-section__title">Contacto</h3>
          <div className="form-grid form-grid--2">
            <div className="form-field">
              <label className="form-label">Telefono</label>
              <input className="form-input" value={paciente.telefono} onChange={(e) => handleChange('telefono', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={paciente.email} onChange={(e) => handleChange('email', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Ciudad / Estado</label>
              <input className="form-input" value={paciente.ciudadEstado || ''} onChange={(e) => handleChange('ciudadEstado', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Direccion</label>
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
              <label className="form-label">Grado de Instruccion</label>
              <select className="form-select" value={paciente.gradoInstruccion} onChange={(e) => handleChange('gradoInstruccion', e.target.value)}>
                <option value="">Seleccionar</option>
                <option value="Primaria">Primaria</option>
                <option value="Secundaria">Secundaria</option>
                <option value="Tecnico">Tecnico</option>
                <option value="Universitario">Universitario</option>
                <option value="Postgrado">Postgrado</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Ocupacion</label>
              <input className="form-input" value={paciente.ocupacion} onChange={(e) => handleChange('ocupacion', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3 className="form-section__title">Contacto de Emergencia</h3>
          <div className="form-grid form-grid--2">
            <div className="form-field">
              <label className="form-label">Nombre acompanante</label>
              <input className="form-input" value={paciente.nombreAcompanante} onChange={(e) => handleChange('nombreAcompanante', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Contacto emergencia</label>
              <input className="form-input" value={paciente.contactoEmergencia} onChange={(e) => handleChange('contactoEmergencia', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Telefono emergencia</label>
              <input className="form-input" value={paciente.telefonoEmergencia} onChange={(e) => handleChange('telefonoEmergencia', e.target.value)} />
            </div>
            <div className="form-field">
              <label className="form-label">Parentesco</label>
              <input className="form-input" value={paciente.parentescoEmergencia} onChange={(e) => handleChange('parentescoEmergencia', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="form-card">
          <h3 className="form-section__title">Antecedentes Medicos</h3>
          <AntecedentesEditor
            values={antecedentesData}
            onChange={handleAntecedentesChange}
            compact
          />
        </div>

        <div className="paciente-form-page__actions">
          <button type="button" className="btn btn--secondary" onClick={() => navigate('/pacientes')} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? <Loader2 size={18} className="spinner" /> : <Save size={18} />}
            {saving ? 'Guardando...' : 'Guardar Cliente'}
          </button>
        </div>
      </form>
    </div>
  );
}
