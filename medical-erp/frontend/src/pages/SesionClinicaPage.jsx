import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import PasoPaciente from '../components/sesion/PasoPaciente';
import PasoEnfermedad from '../components/sesion/PasoEnfermedad';
import PasoDiagnostico from '../components/sesion/PasoDiagnostico';
import PasoEvidencias from '../components/sesion/PasoEvidencias';
import PasoRecetas from '../components/sesion/PasoRecetas';
import PasoTratamientos from '../components/sesion/PasoTratamientos';
import PasoResumen from '../components/sesion/PasoResumen';
import { pacienteService } from '../services/pacienteService';
import { consultasService } from '../services/consultasService';

const STEPS = [
  { id: 1, label: 'Paciente', component: PasoPaciente },
  { id: 2, label: 'Enfermedad', component: PasoEnfermedad },
  { id: 3, label: 'Diagnóstico', component: PasoDiagnostico },
  { id: 4, label: 'Evidencias', component: PasoEvidencias },
  { id: 5, label: 'Recetas', component: PasoRecetas },
  { id: 6, label: 'Tratamientos', component: PasoTratamientos },
  { id: 7, label: 'Resumen', component: PasoResumen },
];

const INITIAL_STATE = {
  paciente: null,
  pacienteId: null,
  historiaId: null,
  enfermedad: {
    motivo: '',
    tiempoEnfermedad: '',
    signosSintomas: '',
    relatoCronologico: '',
    medicamentosActuales: '',
    alergias: '',
    funcionesBiologicas: '',
  },
  diagnostico: {
    signosVitales: {
      presionArterial: '',
      pulso: '',
      temperatura: '',
      peso: '',
      talla: '',
      saturacionO2: '',
      frecuenciaRespiratoria: '',
    },
    examenClinicoGeneral: '',
    diagnosticoTexto: '',
    consentimientoInformado: false,
  },
  evidencias: [],
  recetas: [],
  tratamientos: [],
  resumen: {
    tipoTratamiento: '',
    sesionesRealizadas: 0,
    evolucionMejoria: '',
    proximaFecha: '',
    costoTotal: 0,
  },
};

export default function SesionClinicaPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pacienteIdParam = searchParams.get('pacienteId');

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (pacienteIdParam) {
      loadPaciente(parseInt(pacienteIdParam));
    }
  }, [pacienteIdParam]);

  const loadPaciente = async (id) => {
    try {
      const response = await pacienteService.getById(id);
      const pacienteData = response?.data || response;
      setFormData((prev) => ({
        ...prev,
        paciente: pacienteData,
        pacienteId: pacienteData.id,
      }));
      // Look up existing historia clinica
      try {
        const historiaResp = await consultasService.getHistoriaByPaciente(id);
        const historiaData = historiaResp?.data || historiaResp;
        if (historiaData?.id) {
          setFormData((prev) => ({ ...prev, historiaId: historiaData.id }));
        }
      } catch {
        // No existing historia — will create on save
      }
    } catch (err) {
      console.error('Error loading paciente:', err);
      setError('Error al cargar el paciente');
    }
  };

  const updateFormData = useCallback((section, data) => {
    setFormData((prev) => ({
      ...prev,
      [section]: typeof data === 'function'
        ? data(prev[section])
        : Array.isArray(data)
          ? data
          : { ...prev[section], ...data },
    }));
  }, []);

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return formData.pacienteId !== null;
      case 2:
        return formData.enfermedad.motivo.trim() !== '';
      default:
        return true;
    }
  };

  const goNext = () => {
    if (currentStep < 7 && canGoNext()) {
      setCurrentStep((s) => s + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  };

  const calcularCostoTotal = () => {
    return formData.tratamientos.reduce((sum, t) => sum + (parseFloat(t.costoTotal) || 0), 0);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // 1. Create historia clinica if not exists
      let historiaId = formData.historiaId;
      if (!historiaId) {
        const historiaData = {
          pacienteId: formData.pacienteId,
          antecedentesPersonales: formData.paciente?.antecedentesPersonales || '',
          antecedentesFamiliares: formData.paciente?.antecedentesFamiliares || '',
          alergias: formData.paciente?.alergias || formData.enfermedad.alergias || '',
        };
        const historiaResp = await consultasService.createHistoria(historiaData);
        const historiaCreated = historiaResp?.data || historiaResp;
        historiaId = historiaCreated.id;
      }

      // 2. Create consulta
      const consultaData = {
        historiaId,
        fecha: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
        motivo: formData.enfermedad.motivo,
        tiempoEnfermedad: formData.enfermedad.tiempoEnfermedad,
        signosSintomas: formData.enfermedad.signosSintomas,
        relatoCronologico: formData.enfermedad.relatoCronologico,
        signosVitales: formData.diagnostico.signosVitales,
        examenClinicoGeneral: formData.diagnostico.examenClinicoGeneral,
        diagnosticoLista: formData.diagnostico.diagnosticoTexto
          ? [{ codigo: '', descripcion: formData.diagnostico.diagnosticoTexto }]
          : [],
        funcionesBiologicas: formData.enfermedad.funcionesBiologicas,
        consentimientoInformado: formData.diagnostico.consentimientoInformado,
        evolucionMejoria: formData.resumen.evolucionMejoria,
        proximaFecha: formData.resumen.proximaFecha || null,
        tipoTratamiento: formData.resumen.tipoTratamiento,
        sesionesRealizadas: formData.resumen.sesionesRealizadas,
        costoTotal: calcularCostoTotal(),
        notas: '',
      };
      const consultaResp = await consultasService.create(consultaData);
      const consultaCreated = consultaResp?.data || consultaResp;
      const consultaId = consultaCreated.id;

      // 3. Create tratamientos
      if (formData.tratamientos.length > 0) {
        const tratamientosData = formData.tratamientos.map((t) => ({
          consultaId,
          pacienteId: formData.pacienteId,
          procedimientoRealizado: t.procedimientoRealizado,
          costoTotal: parseFloat(t.costoTotal) || 0,
          notas: t.notas || '',
          estado: t.estado || 'realizado',
        }));
        await consultasService.createTratamientosBatch(tratamientosData);
      }

      // 4. Create recetas
      if (formData.recetas.length > 0) {
        const recetasData = formData.recetas.map((r) => ({
          consultaId,
          pacienteId: formData.pacienteId,
          medicamentos: JSON.stringify(r.medicamentos),
          indicaciones: r.indicaciones || '',
          observaciones: r.observaciones || '',
        }));
        await consultasService.createRecetasBatch(recetasData);
      }

      // 5. Upload evidencias
      for (const ev of formData.evidencias) {
        if (ev.file) {
          const uploadData = new FormData();
          uploadData.append('file', ev.file);
          uploadData.append('pacienteId', formData.pacienteId);
          uploadData.append('consultaId', consultaId);
          uploadData.append('tipo', ev.tipo || 'otro');
          uploadData.append('descripcion', ev.descripcion || '');
          await consultasService.uploadEvidencia(uploadData);
        }
      }

      navigate('/dashboard');
    } catch (err) {
      console.error('Error saving session:', err);
      setError(err.message || 'Error al guardar la sesión');
    } finally {
      setSaving(false);
    }
  };

  const StepComponent = STEPS[currentStep - 1].component;

  return (
      <div className="sesion-page">
        <div className="sesion-page__header">
          <button className="sesion-page__back" onClick={() => navigate('/recepcion')}>
            <ArrowLeft size={18} />
            Recepción
          </button>
          <h1 className="sesion-page__title">Sesión Clínica</h1>
          {formData.paciente && (
            <span className="sesion-page__patient">
              {formData.paciente.apellidoPaterno} {formData.paciente.nombres}
            </span>
          )}
        </div>

        <div className="sesion-page__progress">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`sesion-page__step ${
                step.id === currentStep
                  ? 'sesion-page__step--active'
                  : step.id < currentStep
                  ? 'sesion-page__step--done'
                  : ''
              }`}
              onClick={() => step.id <= currentStep && setCurrentStep(step.id)}
            >
              <div className="sesion-page__step-number">
                {step.id < currentStep ? <Check size={14} /> : step.id}
              </div>
              <span className="sesion-page__step-label">{step.label}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="sesion-page__error">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div className="sesion-page__content">
          <StepComponent
            formData={formData}
            updateFormData={updateFormData}
            paciente={formData.paciente}
          />
        </div>

        <div className="sesion-page__nav">
          <button
            className="sesion-page__btn sesion-page__btn--secondary"
            onClick={goBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft size={18} />
            Anterior
          </button>

          {currentStep < 7 ? (
            <button
              className="sesion-page__btn sesion-page__btn--primary"
              onClick={goNext}
              disabled={!canGoNext()}
            >
              Siguiente
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              className="sesion-page__btn sesion-page__btn--save"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check size={18} />
                  Guardar Sesión
                </>
              )}
            </button>
          )}
        </div>
      </div>
  );
}
