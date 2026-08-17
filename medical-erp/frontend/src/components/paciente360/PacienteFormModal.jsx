import { useState, useEffect } from 'react';
import { X, Loader2, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { pacienteService } from '../../services/pacienteService';
import { historiaClinicaService } from '../../services/historiaClinicaService';
import AntecedentesEditor from '../ui/AntecedentesEditor';

const STEPS = [
  { label: 'Identificacion', icon: 'user' },
  { label: 'Datos Personales', icon: 'heart' },
  { label: 'Contacto', icon: 'phone' },
  { label: 'Emergencia y Salud', icon: 'stethoscope' },
];

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

export default function PacienteFormModal({ isOpen, onClose, onSave, pacienteId = null }) {
  const isEdit = Boolean(pacienteId);
  const [formData, setFormData] = useState({ ...emptyPaciente });
  const [antecedentesData, setAntecedentesData] = useState({});
  const [historiaId, setHistoriaId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen && pacienteId) {
      loadPaciente();
    } else if (isOpen) {
      setFormData({ ...emptyPaciente });
      setAntecedentesData({});
      setHistoriaId(null);
      setError('');
      setCurrentStep(0);
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
        } catch {
          // No historia yet
        }
      } else {
        setError(res.message || 'Error al cargar paciente');
      }
    } catch (err) {
      setError(err.message || 'Error al cargar paciente');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAntecedentesChange = (key, value) => {
    setAntecedentesData(prev => ({ ...prev, [key]: value }));
  };

  const validateStep = (step) => {
    if (step === 0) {
      if (!formData.licenciaConducir?.trim()) {
        setError('El ID es obligatorio');
        return false;
      }
      if (!formData.apellidoPaterno?.trim()) {
        setError('El apellido paterno es obligatorio');
        return false;
      }
      if (!formData.nombres?.trim()) {
        setError('Los nombres son obligatorios');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (!validateStep(currentStep)) return;
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const handlePrev = () => {
    setError('');
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    setError('');
    setSaving(true);

    if (!formData.apellidoPaterno?.trim() || !formData.nombres?.trim()) {
      setError('Apellido paterno y nombres son obligatorios');
      setSaving(false);
      return;
    }

    if (!formData.licenciaConducir?.trim()) {
      setError('El ID es obligatorio');
      setSaving(false);
      return;
    }

    try {
      let pacienteCreado;
      const payload = { ...formData };

      if (isEdit) {
        const res = await pacienteService.update(pacienteId, payload);
        if (!res.success) throw new Error(res.message || 'Error al actualizar');
        pacienteCreado = res.data;
      } else {
        const res = await pacienteService.create(payload);
        if (!res.success) throw new Error(res.message || 'Error al crear');
        pacienteCreado = res.data;
      }

      const tieneAntecedentes = Object.values(antecedentesData).some(v => v && v !== 'No' && v !== '');

      if (historiaId) {
        await historiaClinicaService.updateAntecedentes(historiaId, antecedentesData);
      } else if (tieneAntecedentes) {
        await historiaClinicaService.create({
          pacienteId: pacienteCreado.id,
          ...antecedentesData,
        });
      }

      onSave?.(pacienteCreado);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className="wizard-overlay" onClick={onClose}>
      <div className="wizard-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="wizard-header">
          <h3>{isEdit ? 'Editar Paciente' : 'Nuevo Paciente'}</h3>
          <button className="wizard-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Stepper */}
        <div className="wizard-stepper">
          {STEPS.map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <div className={`wizard-step ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'completed' : ''}`}>
                <div className="wizard-step__circle">
                  {i < currentStep ? <Check size={14} /> : i + 1}
                </div>
                <span className="wizard-step__label">{step.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className="wizard-step__connector" />}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && <div className="wizard-error">{error}</div>}

        {/* Body */}
        {loading ? (
          <div className="wizard-loading">
            <Loader2 size={28} className="spinner" />
            <p>Cargando datos...</p>
          </div>
        ) : (
          <div className="wizard-body">
            {/* Step 0: Identificacion */}
            {currentStep === 0 && (
              <div className="wizard-form-section">
                <div className="wizard-form-grid">
                  <div className="wizard-field wizard-field--full">
                    <label>ID *</label>
                    <input
                      type="text"
                      name="licenciaConducir"
                      value={formData.licenciaConducir}
                      onChange={handleInputChange}
                      required
                      maxLength={20}
                      placeholder="Numero de identificacion"
                    />
                  </div>
                  <div className="wizard-field">
                    <label>Apellido Paterno *</label>
                    <input
                      type="text"
                      name="apellidoPaterno"
                      value={formData.apellidoPaterno}
                      onChange={handleInputChange}
                      required
                      placeholder="Apellido paterno"
                    />
                  </div>
                  <div className="wizard-field">
                    <label>Apellido Materno</label>
                    <input
                      type="text"
                      name="apellidoMaterno"
                      value={formData.apellidoMaterno}
                      onChange={handleInputChange}
                      placeholder="Apellido materno"
                    />
                  </div>
                  <div className="wizard-field wizard-field--full">
                    <label>Nombres *</label>
                    <input
                      type="text"
                      name="nombres"
                      value={formData.nombres}
                      onChange={handleInputChange}
                      required
                      placeholder="Nombres completos"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Datos Personales */}
            {currentStep === 1 && (
              <div className="wizard-form-section">
                <div className="wizard-form-grid">
                  <div className="wizard-field">
                    <label>Fecha de Nacimiento</label>
                    <input
                      type="date"
                      name="fechaNacimiento"
                      value={formData.fechaNacimiento}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="wizard-field">
                    <label>Sexo</label>
                    <select name="sexo" value={formData.sexo} onChange={handleInputChange}>
                      <option value="">Seleccionar...</option>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>
                  <div className="wizard-field">
                    <label>Estado Civil</label>
                    <select name="estadoCivil" value={formData.estadoCivil} onChange={handleInputChange}>
                      <option value="">Seleccionar...</option>
                      <option value="Soltero">Soltero(a)</option>
                      <option value="Casado">Casado(a)</option>
                      <option value="Divorciado">Divorciado(a)</option>
                      <option value="Viudo">Viudo(a)</option>
                      <option value="Conviviente">Conviviente</option>
                    </select>
                  </div>
                  <div className="wizard-field">
                    <label>Estatura (cm)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="estatura"
                      value={formData.estatura}
                      onChange={handleInputChange}
                      placeholder="Ej: 170"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Contacto */}
            {currentStep === 2 && (
              <div className="wizard-form-section">
                <div className="wizard-form-grid">
                  <div className="wizard-field">
                    <label>Telefono</label>
                    <input
                      type="text"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      placeholder="Numero de telefono"
                    />
                  </div>
                  <div className="wizard-field">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                  <div className="wizard-field">
                    <label>Ciudad / Estado</label>
                    <input
                      type="text"
                      name="ciudadEstado"
                      value={formData.ciudadEstado}
                      onChange={handleInputChange}
                      placeholder="Ciudad o estado"
                    />
                  </div>
                  <div className="wizard-field">
                    <label>Direccion</label>
                    <input
                      type="text"
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleInputChange}
                      placeholder="Direccion completa"
                    />
                  </div>
                  <div className="wizard-field">
                    <label>Lugar de Nacimiento</label>
                    <input
                      type="text"
                      name="lugarNacimiento"
                      value={formData.lugarNacimiento}
                      onChange={handleInputChange}
                      placeholder="Ciudad, pais"
                    />
                  </div>
                  <div className="wizard-field">
                    <label>Lugar de Procedencia</label>
                    <input
                      type="text"
                      name="lugarProcedencia"
                      value={formData.lugarProcedencia}
                      onChange={handleInputChange}
                      placeholder="Ciudad, pais"
                    />
                  </div>
                  <div className="wizard-field">
                    <label>Grado de Instruccion</label>
                    <select name="gradoInstruccion" value={formData.gradoInstruccion} onChange={handleInputChange}>
                      <option value="">Seleccionar...</option>
                      <option value="Primaria">Primaria</option>
                      <option value="Secundaria">Secundaria</option>
                      <option value="Tecnico">Tecnico</option>
                      <option value="Universitario">Universitario</option>
                      <option value="Postgrado">Postgrado</option>
                    </select>
                  </div>
                  <div className="wizard-field">
                    <label>Ocupacion</label>
                    <input
                      type="text"
                      name="ocupacion"
                      value={formData.ocupacion}
                      onChange={handleInputChange}
                      placeholder="Profesion u ocupacion"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Emergencia y Antecedentes */}
            {currentStep === 3 && (
              <>
                <div className="wizard-form-section">
                  <h4>Contacto de Emergencia</h4>
                  <div className="wizard-form-grid">
                    <div className="wizard-field">
                      <label>Acompanante</label>
                      <input
                        type="text"
                        name="nombreAcompanante"
                        value={formData.nombreAcompanante}
                        onChange={handleInputChange}
                        placeholder="Nombre del acompanante"
                      />
                    </div>
                    <div className="wizard-field">
                      <label>Contacto Emergencia</label>
                      <input
                        type="text"
                        name="contactoEmergencia"
                        value={formData.contactoEmergencia}
                        onChange={handleInputChange}
                        placeholder="Nombre o numero"
                      />
                    </div>
                    <div className="wizard-field">
                      <label>Telefono Emergencia</label>
                      <input
                        type="text"
                        name="telefonoEmergencia"
                        value={formData.telefonoEmergencia}
                        onChange={handleInputChange}
                        placeholder="Numero de emergencia"
                      />
                    </div>
                    <div className="wizard-field">
                      <label>Parentesco</label>
                      <input
                        type="text"
                        name="parentescoEmergencia"
                        value={formData.parentescoEmergencia}
                        onChange={handleInputChange}
                        placeholder="Ej: Madre, Esposo, Hermano"
                      />
                    </div>
                  </div>
                </div>

                <div className="wizard-form-section">
                  <h4>Antecedentes Medicos <span className="section-hint">(Opcional)</span></h4>
                  <AntecedentesEditor
                    values={antecedentesData}
                    onChange={handleAntecedentesChange}
                    compact
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        {!loading && (
          <div className="wizard-footer">
            <button
              type="button"
              className="wizard-btn wizard-btn--cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>

            {currentStep > 0 && (
              <button
                type="button"
                className="wizard-btn wizard-btn--back"
                onClick={handlePrev}
                disabled={saving}
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
            )}

            {isLastStep ? (
              <button
                type="button"
                className="wizard-btn wizard-btn--save"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? <Loader2 size={16} className="spinner" /> : <Check size={16} />}
                {saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Paciente'}
              </button>
            ) : (
              <button
                type="button"
                className="wizard-btn wizard-btn--next"
                onClick={handleNext}
                disabled={saving}
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
