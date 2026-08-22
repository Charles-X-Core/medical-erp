import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Save, Loader2, Check } from 'lucide-react';
import { pacienteService } from '../../services/pacienteService';
import { useAuth } from '../../hooks/useAuth';
import { getPrimaryRole } from '../../utils/roleUtils';

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

const steps = [
  { label: 'Datos Personales', description: 'Información básica del cliente' },
  { label: 'Motivo de Consulta', description: 'Motivo y antecedentes' },
  { label: 'Tratamiento', description: 'Tipo y configuración del tratamiento' },
  { label: 'Consentimiento', description: 'Revisión de consentimientos' },
];

const sexoOptions = ['M', 'F'];
const sexoLabels = { M: 'Masculino', F: 'Femenino' };
const estadoCivilOptions = ['Soltero(a)', 'Casado(a)', 'Divorciado(a)', 'Viudo(a)', 'Unión libre'];

export default function ManualForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const primaryRole = getPrimaryRole(user);

  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState({ ...emptyData });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [createdPacienteId, setCreatedPacienteId] = useState(null);

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
      };

      const res = await pacienteService.create(pacienteData);
      if (res.success) {
        const pacienteId = res.data.id;
        setCreatedPacienteId(pacienteId);
        setSaved(true);
      }
    } catch (e) {
      setError(e.message || 'Error al guardar');
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
        <h3>Cliente creado correctamente</h3>
        <p>ID de licencia: <strong>{createdPacienteId ? `IMP-${String(createdPacienteId).padStart(4, '0')}` : 'N/A'}</strong></p>
        <div className="manual-form__success-actions">
          <button className="manual-form__btn manual-form__btn--primary" onClick={() => {
            setData({ ...emptyData });
            setSaved(false);
            setCreatedPacienteId(null);
            setCurrentStep(0);
          }}>
            Registrar otro cliente
          </button>
          <button className="manual-form__btn manual-form__btn--secondary" onClick={() => navigate('/inicio')}>
            Volver al inicio
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
              <label>Nombres *</label>
              <input type="text" value={data.nombres} onChange={(e) => update('nombres', e.target.value)} placeholder="Nombres completos" />
            </div>
            <div className="manual-form__field">
              <label>Apellido Paterno *</label>
              <input type="text" value={data.apellidoPaterno} onChange={(e) => update('apellidoPaterno', e.target.value)} placeholder="Apellido paterno" />
            </div>
            <div className="manual-form__field">
              <label>Apellido Materno</label>
              <input type="text" value={data.apellidoMaterno} onChange={(e) => update('apellidoMaterno', e.target.value)} placeholder="Apellido materno" />
            </div>
            <div className="manual-form__field">
              <label>Fecha de Nacimiento</label>
              <input type="date" value={data.fechaNacimiento} onChange={(e) => update('fechaNacimiento', e.target.value)} />
            </div>
            <div className="manual-form__field">
              <label>Sexo</label>
              <select value={data.sexo} onChange={(e) => update('sexo', e.target.value)}>
                <option value="">Seleccionar</option>
                {sexoOptions.map((s) => (
                  <option key={s} value={s}>{sexoLabels[s]}</option>
                ))}
              </select>
            </div>
            <div className="manual-form__field">
              <label>Estado Civil</label>
              <select value={data.estadoCivil} onChange={(e) => update('estadoCivil', e.target.value)}>
                <option value="">Seleccionar</option>
                {estadoCivilOptions.map((ec) => (
                  <option key={ec} value={ec}>{ec}</option>
                ))}
              </select>
            </div>
            <div className="manual-form__field">
              <label>Teléfono</label>
              <input type="tel" value={data.telefono} onChange={(e) => update('telefono', e.target.value)} placeholder="Teléfono" />
            </div>
            <div className="manual-form__field">
              <label>Correo Electrónico</label>
              <input type="email" value={data.email} onChange={(e) => update('email', e.target.value)} placeholder="email@ejemplo.com" />
            </div>
            <div className="manual-form__field manual-form__field--full">
              <label>Dirección</label>
              <input type="text" value={data.direccion} onChange={(e) => update('direccion', e.target.value)} placeholder="Dirección completa" />
            </div>
            <div className="manual-form__field">
              <label>Ciudad / Estado</label>
              <input type="text" value={data.ciudadEstado} onChange={(e) => update('ciudadEstado', e.target.value)} placeholder="Ciudad, Estado" />
            </div>
            <div className="manual-form__field">
              <label>Ocupación</label>
              <input type="text" value={data.ocupacion} onChange={(e) => update('ocupacion', e.target.value)} placeholder="Ocupación" />
            </div>
            <div className="manual-form__field">
              <label>Contacto de Emergencia</label>
              <input type="text" value={data.contactoEmergencia} onChange={(e) => update('contactoEmergencia', e.target.value)} placeholder="Nombre del contacto" />
            </div>
            <div className="manual-form__field">
              <label>Tel. Emergencia</label>
              <input type="tel" value={data.telefonoEmergencia} onChange={(e) => update('telefonoEmergencia', e.target.value)} placeholder="Teléfono de emergencia" />
            </div>
            <div className="manual-form__field">
              <label>Parentesco</label>
              <input type="text" value={data.parentescoEmergencia} onChange={(e) => update('parentescoEmergencia', e.target.value)} placeholder="Parentesco" />
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="manual-form__grid manual-form__grid--2">
            <div className="manual-form__field manual-form__field--full">
              <label>Motivo de Consulta *</label>
              <textarea value={data.motivoConsulta} onChange={(e) => update('motivoConsulta', e.target.value)} rows={3} placeholder="Describir el motivo de la consulta..." />
            </div>
            <div className="manual-form__field manual-form__field--full">
              <label>Observaciones</label>
              <textarea value={data.observaciones} onChange={(e) => update('observaciones', e.target.value)} rows={3} placeholder="Observaciones adicionales..." />
            </div>
            <div className="manual-form__field manual-form__field--full">
              <label>Alergias</label>
              <textarea value={data.alergias} onChange={(e) => update('alergias', e.target.value)} rows={2} placeholder="Describir alergias conocidas..." />
            </div>
            <div className="manual-form__field manual-form__field--full">
              <label>Antecedentes Personales</label>
              <textarea value={data.antecedentesPersonales} onChange={(e) => update('antecedentesPersonales', e.target.value)} rows={3} placeholder="Antecedentes médicos relevantes..." />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="manual-form__grid manual-form__grid--2">
            <div className="manual-form__field">
              <label>Tipo de Tratamiento *</label>
              <input type="text" value={data.tipoTratamiento} onChange={(e) => update('tipoTratamiento', e.target.value)} placeholder="Ej: Quiropráctico, Naturopatía" />
            </div>
            <div className="manual-form__field">
              <label>Sesiones Planeadas</label>
              <input type="number" min="1" max="100" value={data.sesionesPlaneadas} onChange={(e) => update('sesionesPlaneadas', parseInt(e.target.value) || 1)} />
            </div>
            <div className="manual-form__field">
              <label>Costo Estimado ($)</label>
              <input type="number" min="0" step="0.01" value={data.costoEstimado} onChange={(e) => update('costoEstimado', e.target.value)} placeholder="0.00" />
            </div>
            <div className="manual-form__field manual-form__field--full">
              <label>Objetivo del Tratamiento</label>
              <textarea value={data.objetivoTratamiento} onChange={(e) => update('objetivoTratamiento', e.target.value)} rows={3} placeholder="Describir el objetivo del tratamiento..." />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="manual-form__consentimiento-info">
            <div className="manual-form__consentimiento-card">
              <h4>Consentimientos</h4>
              <p>Los consentimientos se generarán automáticamente cuando se inicie la primera sesión de atención del cliente.</p>
              <p>Tipos de consentimiento disponibles:</p>
              <ul>
                <li><strong>TRATAMIENTO</strong> — Autorización del tratamiento propuesto</li>
                <li><strong>PRIVACIDAD</strong> — Aviso de privacidad y manejo de datos</li>
                <li><strong>INFORMADO</strong> — Consentimiento informado para procedimientos</li>
              </ul>
              <p className="manual-form__consentimiento-note">
                Los consentimientos se pueden firmar digitalmente desde la vista del cliente en el kiosco o tablet.
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
          <ChevronLeft size={18} /> Anterior
        </button>
        <div className="manual-form__footer-right">
          {currentStep < steps.length - 1 ? (
            <button
              className="manual-form__btn manual-form__btn--primary"
              disabled={!canNext()}
              onClick={() => setCurrentStep((s) => s + 1)}
            >
              Siguiente <ChevronRight size={18} />
            </button>
          ) : (
            <button
              className="manual-form__btn manual-form__btn--primary"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? <Loader2 size={18} className="manual-form__spinner" /> : <Save size={18} />}
              Guardar Cliente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
