import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, User, FileText, Activity, ArrowLeft, Stethoscope, AlertCircle, Calendar, Edit2, Save, X } from 'lucide-react';
import { pacienteService } from '../services/pacienteService';
import { historiaClinicaService } from '../services/historiaClinicaService';
import { consultasService } from '../services/consultasService';
import { tratamientoService } from '../services/tratamientoService';
import agendaService from '../services/agendaService';
import ResumenSidebar from '../components/paciente360/ResumenSidebar';
import AtencionSidebar from '../components/paciente360/AtencionSidebar';
import WorkspaceTimeline from '../components/paciente360/WorkspaceTimeline';
import TabClinico from '../components/paciente360/TabClinico';
import TabTratamientos from '../components/paciente360/TabTratamientos';
import AtencionForm from '../components/atencion/AtencionForm';
import SesionTratamientoView from '../components/atencion/SesionTratamientoView';
import { useAtencionType } from '../hooks/useAtencionType';
import { getActiveAntecedentes } from '../components/ui/AntecedentesEditor';
import AntecedentesEditor from '../components/ui/AntecedentesEditor';

const WORKSPACE_TABS = [
  { id: 'resumen', label: 'Resumen', icon: User },
  { id: 'atencion', label: 'Atención', icon: Activity },
  { id: 'tratamientos', label: 'Tratamientos', icon: Stethoscope },
  { id: 'historia', label: 'Historia', icon: FileText },
];

// ============================================
// AtencionWorkspace — Doctora's Clinical Screen
// Flow: Entry logic → Motivo → Sesión de Tratamiento
// ============================================

export default function AtencionWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('resumen');
  const [atencionView, setAtencionView] = useState('entry'); // entry | motivo | sesion
  const [paciente, setPaciente] = useState(null);
  const [historia, setHistoria] = useState(null);
  const [tratamientos, setTratamientos] = useState([]);
  const [citasHoy, setCitasHoy] = useState([]);
  const [citasFuturas, setCitasFuturas] = useState([]);
  const [citasPendientes, setCitasPendientes] = useState([]);
  const [tratamientosBloqueados, setTratamientosBloqueados] = useState(new Set());
  const [signosVitales, setSignosVitales] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingAntecedentes, setEditingAntecedentes] = useState(false);
  const [antecedentesValues, setAntecedentesValues] = useState({});
  const [savingAntecedentes, setSavingAntecedentes] = useState(false);
  const [savedAntecedentes, setSavedAntecedentes] = useState(false);
  const [errorAntecedentes, setErrorAntecedentes] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [pRes, hRes, tRes, cRes, cfRes] = await Promise.allSettled([
        pacienteService.getById(id),
        historiaClinicaService.getByPaciente(id),
        tratamientoService.listByPaciente(id),
        agendaService.getCitasHoy(),
        agendaService.getCitasPorPaciente(id),
      ]);

      if (pRes.status === 'fulfilled' && pRes.value?.success) setPaciente(pRes.value.data);
      if (hRes.status === 'fulfilled' && hRes.value?.success) setHistoria(hRes.value.data);
      if (tRes.status === 'fulfilled' && tRes.value?.success) {
        const list = Array.isArray(tRes.value.data) ? tRes.value.data : tRes.value.data?.content || [];
        setTratamientos(list);

        // Use list directly (state not yet updated in this scope)
        const activos = list.filter(
          (t) => t.estado === 'EN_CURSO' || t.estado === 'PROGRAMADO' || t.estado === 'PENDIENTE'
        );
        if (cfRes.status === 'fulfilled' && cfRes.value?.success) {
          const todas = Array.isArray(cfRes.value.data) ? cfRes.value.data : [];
          const hoyStr = new Date().toISOString().split('T')[0];

          // Citas pendientes (esperando confirmación de enfermera)
          const pendientes = todas.filter((c) =>
            c.fecha >= hoyStr && c.estado === 'pendiente'
          );
          setCitasPendientes(pendientes);

          // Set de IDs de tratamientos que tienen cita pendiente (bloqueados)
          let bloqueados = new Set(
            pendientes.filter((c) => c.tratamientoId).map((c) => c.tratamientoId)
          );

          // Fallback: if pending citations exist but none have tratamientoId,
          // block all active treatments (old citas without the column)
          if (pendientes.length > 0 && bloqueados.size === 0) {
            activos.forEach((t) => bloqueados.add(t.id));
          }

          setTratamientosBloqueados(bloqueados);

          // Todas las citas futuras (pendiente + confirmada) para mostrar info
          const futuras = todas.filter((c) =>
            c.fecha >= hoyStr &&
            (c.estado === 'pendiente' || c.estado === 'confirmada')
          );
          setCitasFuturas(futuras);
        }
      }

      if (cRes.status === 'fulfilled' && cRes.value?.success) {
        const hoy = Array.isArray(cRes.value.data) ? cRes.value.data : [];
        setCitasHoy(hoy.filter((c) => String(c.pacienteId) === String(id)));
      }
    } catch (err) {
      setError(err.message || 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const { attentionType } = useAtencionType({ historia, tratamientos, citasHoy });

  // Determine if patient has active treatment
  const activeTreatments = tratamientos.filter(
    (t) => t.estado === 'EN_CURSO' || t.estado === 'PROGRAMADO' || t.estado === 'PENDIENTE'
  );
  const hasActiveTreatment = activeTreatments.length > 0;
  const hasCitaHoy = citasHoy.length > 0;

  // === Atención handlers ===

  const handleSaveMotivo = async (formData) => {
    try {
      if (!historia?.id) {
        const hRes = await historiaClinicaService.create({ pacienteId: id });
        if (hRes.success) setHistoria(hRes.data);
      }

      await consultasService.create({
        historiaId: historia?.id,
        fecha: toLocalDateTime(),
        motivo: formData.motivo || 'Atención',
        tiempoEnfermedad: formData.tiempoEnfermedad || null,
        signosSintomas: formData.signosSintomas || null,
        examenClinicoGeneral: formData.examenClinico || null,
        diagnosticoLista: formData.diagnostico ? [{ descripcion: formData.diagnostico, principal: true }] : null,
        signosVitales: Object.keys(signosVitales).length > 0 ? signosVitales : null,
      });

      // After saving motivo → go to session view
      setAtencionView('sesion');
      await load();
    } catch (err) {
      console.error('Error saving motivo:', err);
    }
  };

  const handleScheduleFromMotivo = async () => {
    // Save motivo first, then show schedule
    setAtencionView('sesion');
  };

  const handleNewSession = async (tratamiento, mode, data) => {
    try {
      if (mode === 'new') {
        // Create treatment + first session in sequence
        const res = await tratamientoService.create({
          pacienteId: id,
          historiaClinicaId: historia?.id,
          tipoTratamiento: data.tipoTratamiento,
          sesionesPlaneadas: data.sesionesPlaneadas,
          costoEstimado: data.costoSesion ? parseFloat(data.costoSesion) : null,
          objetivo: 'Tratamiento indicado por consulta',
        });
        if (res?.success) {
          const nuevoId = res.data.id;
          // PENDIENTE → PROGRAMADO → EN_CURSO
          await tratamientoService.programar(nuevoId);
          await tratamientoService.iniciar(nuevoId);
          // Register first session (Evaluación Inicial)
          await tratamientoService.createSession(nuevoId, {
            tipoSesionId: 1,
            fecha: toLocalDateTime(),
            evolucion: data.evolucion || null,
            observaciones: data.observaciones || null,
            signosVitales: Object.keys(signosVitales).length > 0 ? signosVitales : null,
            costoSesion: data.costoSesion ? parseFloat(data.costoSesion) : null,
          });
        }
      } else {
        // first-session / continuing / last: Register session on existing treatment
        // Use tipoSesionId based on mode
        const tipoSesionId = mode === 'last' ? 5 : mode === 'first-session' ? 1 : 3;
        await tratamientoService.createSession(tratamiento.id, {
          tipoSesionId,
          fecha: toLocalDateTime(),
          evolucion: data.evolucion || null,
          observaciones: data.observaciones || null,
          signosVitales: Object.keys(signosVitales).length > 0 ? signosVitales : null,
          costoSesion: data.costoSesion ? parseFloat(data.costoSesion) : null,
        });
      }

      // Handle post-action
      if (data.postAction === 'finalize') {
        await tratamientoService.finalizar(tratamiento?.id, 'Tratamiento completado');
        setAtencionView('entry');
        await load();
      } else if (data.postAction === 'schedule') {
        // Don't load() — schedule modal opens next, load happens after scheduling in handleSchedule
      } else {
        // No post-action (e.g. mode='new'): reload to reflect new treatment
        await load();
      }
    } catch (err) {
      console.error('Error saving session:', err);
    }
  };

  const handleFinalize = async (tratamiento, data) => {
    try {
      await tratamientoService.finalizar(tratamiento.id, data.resultadoFinal || 'Tratamiento completado');

      if (data.quiereOtroTratamiento) {
        // Stay in session view for new treatment
        setAtencionView('sesion');
      } else {
        // Back to entry
        setAtencionView('entry');
      }
      await load();
    } catch (err) {
      console.error('Error finalizing:', err);
    }
  };

  const handleSchedule = async (tratamiento, scheduleData) => {
    try {
      const payload = {
        pacienteId: parseInt(id, 10),
        tratamientoId: tratamiento?.id || null,
        fecha: scheduleData.fechaDesde,
        hora: scheduleData.horaPreferida || '09:00',
        motivo: scheduleData.notas || 'Próxima sesión de tratamiento',
        notas: scheduleData.notas || null,
      };
      await agendaService.crearCita(payload);
      setAtencionView('entry');
      await load();
    } catch (err) {
      console.error('[AtencionWorkspace] Error scheduling:', err);
      setAtencionView('entry');
      await load();
    }
  };

  // === Treatment creation handler ===

  const handleCreateTratamiento = async (formData) => {
    try {
      const createRes = await tratamientoService.create({
        pacienteId: parseInt(id),
        tipoTratamiento: formData.tipoTratamiento,
        sesionesPlaneadas: formData.sesionesPlaneadas,
        costoEstimado: formData.costoEstimado ? parseFloat(formData.costoEstimado) : null,
        objetivo: formData.objetivo || 'Tratamiento indicado por consulta',
      });

      if (!createRes?.success) {
        throw new Error(createRes?.message || 'Error al crear tratamiento');
      }

      const nuevoTratamiento = createRes.data;
      const tId = nuevoTratamiento?.id;

      if (!tId) throw new Error('Tratamiento creado sin ID');

      // PENDIENTE → PROGRAMADO → EN_CURSO
      await tratamientoService.programar(tId);
      await tratamientoService.iniciar(tId);

      // Reload data and switch to sesion view
      await load();
      setAtencionView('sesion');
    } catch (err) {
      console.error('Error creando tratamiento:', err);
      throw err;
    }
  };

  // === Treatment action handlers ===

  const handlePausarTratamiento = async (tratamiento, motivo) => {
    try {
      await tratamientoService.pausar(tratamiento.id, motivo || 'Pausado por la doctora');
      await load();
    } catch (err) {
      console.error('Error pausing treatment:', err);
    }
  };

  const handleReanudarTratamiento = async (tratamiento) => {
    try {
      await tratamientoService.reanudar(tratamiento.id);
      await load();
    } catch (err) {
      console.error('Error resuming treatment:', err);
    }
  };

  const handleCancelarTratamiento = async (tratamiento, motivo) => {
    try {
      await tratamientoService.cancelar(tratamiento.id, motivo);
      setAtencionView('entry');
      await load();
    } catch (err) {
      console.error('Error canceling treatment:', err);
    }
  };

  const handleAmpliarTratamiento = async (tratamiento, nuevasSesiones, motivo) => {
    try {
      await tratamientoService.ampliarPlan(tratamiento.id, nuevasSesiones, motivo);
      await load();
    } catch (err) {
      console.error('Error expanding plan:', err);
    }
  };

  // === Antecedentes editing ===

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
    setSavedAntecedentes(false);
    setErrorAntecedentes('');
  };

  const cancelEditAntecedentes = () => {
    setEditingAntecedentes(false);
    setErrorAntecedentes('');
  };

  const saveAntecedentes = async () => {
    if (!historia?.id) return;
    setSavingAntecedentes(true);
    setErrorAntecedentes('');
    try {
      const result = await historiaClinicaService.updateAntecedentes(historia.id, antecedentesValues);
      if (!result.success) throw new Error(result.message || 'Error al guardar');
      // Refresh historia from API
      const refreshed = await historiaClinicaService.getByPaciente(id);
      if (refreshed.success) setHistoria(refreshed.data);
      setSavedAntecedentes(true);
      setEditingAntecedentes(false);
      setTimeout(() => setSavedAntecedentes(false), 2000);
    } catch (err) {
      setErrorAntecedentes(err.message);
    } finally {
      setSavingAntecedentes(false);
    }
  };

  // === Entry view handlers ===

  const handleContinueTreatment = () => {
    setAtencionView('sesion');
  };

  const handleNewConsulta = () => {
    setAtencionView('motivo');
  };

  // === Loading/error states ===

  if (loading) {
    return (
      <div className="workspace workspace--compact">
        <div className="workspace__loading">
          <Loader2 size={32} className="spinner" />
          <p>Cargando workspace...</p>
        </div>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="workspace workspace--compact">
        <div className="workspace__error">{error || 'Paciente no encontrado'}</div>
      </div>
    );
  }

  const fullName = `${paciente.apellidoPaterno || ''} ${paciente.apellidoMaterno || ''}, ${paciente.nombres || ''}`.trim();
  const edad = calcularEdad(paciente.fechaNacimiento);
  const sexoLabel = paciente.sexo === 'M' ? 'Masculino' : paciente.sexo === 'F' ? 'Femenino' : '';

  return (
    <div className="workspace workspace--compact">
      {/* ==================== HEADER ==================== */}
      <div className="workspace__header">
        <div className="workspace__patient-info">
          <h1 className="workspace__patient-name">{fullName}</h1>
          <div className="workspace__patient-meta">
            {sexoLabel && (
              <span className="workspace__patient-badge workspace__patient-badge--gender">
                {sexoLabel} {edad ? `${edad} años` : ''}
              </span>
            )}
            {!sexoLabel && edad && <span>{edad} años</span>}
            {paciente.licenciaConducir && (
              <span>ID: {paciente.licenciaConducir}</span>
            )}
          </div>
        </div>
        <div className="workspace__header-actions">
          <button className="btn btn--ghost btn--sm" onClick={() => navigate('/pacientes')}>
            <ArrowLeft size={16} /> Volver
          </button>
          <button className="btn btn--secondary btn--sm" onClick={() => navigate('/pacientes')}>
            <ArrowLeft size={16} /> Volver a Pacientes
          </button>
        </div>
      </div>

      {/* ==================== HORIZONTAL TABS ==================== */}
      <div className="workspace__tabs-bar">
        {WORKSPACE_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`workspace__tab ${activeTab === tab.id ? 'workspace__tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==================== CONTENT (2-column) ==================== */}
      <div className="workspace__body workspace__body--2col">
        <div className="workspace__content workspace__content--full">
          {/* TAB: Atención — clinical flow */}
          {activeTab === 'atencion' && (
            <div className="atencion-workspace">
              {/* ENTRY: Choose path */}
              {atencionView === 'entry' && (
                <div className="atencion-workspace__entry">
                  {hasActiveTreatment ? (
                    <>
                      {(() => {
                        // Check if the main active treatment is blocked (has pending cita)
                        const mainTreatment = activeTreatments[0];
                        const isBlocked = mainTreatment && tratamientosBloqueados.has(mainTreatment.id);
                        const pendingCita = isBlocked
                          ? citasPendientes.find((c) => c.tratamientoId === mainTreatment.id)
                          : null;
                        const confirmedCitas = citasFuturas.filter(
                          (c) => c.tratamientoId === mainTreatment?.id && c.estado === 'confirmada'
                        );

                        return (
                          <div className={`atencion-workspace__entry-card atencion-workspace__entry-card--info ${isBlocked ? 'atencion-workspace__entry-card--blocked' : ''}`}>
                            <Stethoscope size={24} />
                            <h3>{isBlocked ? 'Tratamiento pendiente de confirmación' : 'Tiene tratamiento activo'}</h3>
                            <p>
                              {activeTreatments.length === 1
                                ? `${activeTreatments[0].tipoSesionTratamiento?.nombre || activeTreatments[0].tipoTratamiento || 'Tratamiento'} — Sesión ${(activeTreatments[0].sesionesRealizadas || 0) + 1} de ${activeTreatments[0].sesionesPlaneadas || '?'}`
                                : `${activeTreatments.length} tratamientos activos`}
                            </p>
                            <div className="atencion-workspace__entry-actions">
                              {isBlocked ? (
                                <>
                                  <div className="atencion-workspace__entry-info atencion-workspace__entry-info--pending">
                                    <Calendar size={14} />
                                    <span>Esperando confirmación de fecha por la enfermera</span>
                                    {pendingCita?.fecha && (
                                      <span className="atencion-workspace__entry-hint">
                                        Fecha sugerida: {formatDate(pendingCita.fecha)}
                                      </span>
                                    )}
                                  </div>
                                  <button className="btn btn--primary" disabled>
                                    <Activity size={16} /> Continuar Tratamiento
                                  </button>
                                  <span className="atencion-workspace__entry-hint">
                                    Disponible una vez que la enfermera confirme la fecha
                                  </span>
                                </>
                              ) : (
                                <>
                                  {confirmedCitas.length > 0 && (
                                    <div className="atencion-workspace__entry-info">
                                      <Calendar size={14} />
                                      <span>Próxima sesión: {formatDate(confirmedCitas[0].fecha)}</span>
                                    </div>
                                  )}
                                  <button className="btn btn--primary" onClick={handleContinueTreatment}>
                                    <Activity size={16} /> Continuar Tratamiento
                                  </button>
                                </>
                              )}
                              <button className="btn btn--secondary" onClick={handleNewConsulta}>
                                <FileText size={16} /> Nueva Consulta
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    <div className="atencion-workspace__entry-card atencion-workspace__entry-card--new">
                      <FileText size={24} />
                      <h3>Nueva Consulta</h3>
                      <p>Este paciente no tiene tratamientos activos</p>
                      <button className="btn btn--primary" onClick={handleNewConsulta}>
                        <FileText size={16} /> Registrar Consulta
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* MOTIVO: Consulta form */}
              {atencionView === 'motivo' && (
                <div>
                  <div className="atencion-workspace__back">
                    <button className="btn btn--ghost btn--sm" onClick={() => setAtencionView('entry')}>
                      <ArrowLeft size={14} /> Volver
                    </button>
                  </div>
                  <AtencionForm
                    paciente={paciente}
                    onSave={handleSaveMotivo}
                    onSchedule={handleScheduleFromMotivo}
                  />
                </div>
              )}

              {/* SESION: Treatment workboard */}
              {atencionView === 'sesion' && (
                <div>
                  <div className="atencion-workspace__back">
                    <button className="btn btn--ghost btn--sm" onClick={() => setAtencionView('entry')}>
                      <ArrowLeft size={14} /> Volver
                    </button>
                  </div>
                  <SesionTratamientoView
                    paciente={paciente}
                    tratamientos={tratamientos}
                    tratamientosBloqueados={tratamientosBloqueados}
                    onNewSession={handleNewSession}
                    onFinalize={handleFinalize}
                    onSchedule={handleSchedule}
                    onCreateTratamiento={handleCreateTratamiento}
                    onPausar={handlePausarTratamiento}
                    onReanudar={handleReanudarTratamiento}
                    onCancelar={handleCancelarTratamiento}
                    onAmpliar={handleAmpliarTratamiento}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB: Resumen */}
          {activeTab === 'resumen' && (
            <div className="atencion-workspace__resumen">
              <div className="atencion-workspace__section">
                <h3 className="atencion-workspace__section-title">
                  <User size={16} /> Datos Personales
                </h3>
                <div className="atencion-workspace__data-grid">
                  <div className="atencion-workspace__data-item">
                    <span className="atencion-workspace__data-label">Nombre completo</span>
                    <span className="atencion-workspace__data-value">{fullName}</span>
                  </div>
                  <div className="atencion-workspace__data-item">
                    <span className="atencion-workspace__data-label">Fecha de nacimiento</span>
                    <span className="atencion-workspace__data-value">{formatDate(paciente.fechaNacimiento)}</span>
                  </div>
                  <div className="atencion-workspace__data-item">
                    <span className="atencion-workspace__data-label">Edad</span>
                    <span className="atencion-workspace__data-value">{edad ? `${edad} años` : '-'}</span>
                  </div>
                  <div className="atencion-workspace__data-item">
                    <span className="atencion-workspace__data-label">Sexo</span>
                    <span className="atencion-workspace__data-value">{sexoLabel || '-'}</span>
                  </div>
                  <div className="atencion-workspace__data-item">
                    <span className="atencion-workspace__data-label">Peso</span>
                    <span className="atencion-workspace__data-value">{paciente.peso ? `${paciente.peso} kg` : '-'}</span>
                  </div>
                  <div className="atencion-workspace__data-item">
                    <span className="atencion-workspace__data-label">Estatura</span>
                    <span className="atencion-workspace__data-value">{paciente.estatura ? `${paciente.estatura} cm` : '-'}</span>
                  </div>
                  <div className="atencion-workspace__data-item">
                    <span className="atencion-workspace__data-label">Teléfono</span>
                    <span className="atencion-workspace__data-value">{paciente.telefono || '-'}</span>
                  </div>
                  <div className="atencion-workspace__data-item">
                    <span className="atencion-workspace__data-label">Correo</span>
                    <span className="atencion-workspace__data-value">{paciente.email || '-'}</span>
                  </div>
                  <div className="atencion-workspace__data-item">
                    <span className="atencion-workspace__data-label">Contacto emergencia</span>
                    <span className="atencion-workspace__data-value">{paciente.contactoEmergencia || '-'}</span>
                  </div>
                </div>
              </div>

              {historia && (
                <div className="workspace-card">
                  <div className="resumen-tab__antecedentes-header">
                    <h3 className="resumen-tab__antecedentes-title">
                      <FileText size={16} /> Antecedentes Médicos
                    </h3>
                    <div className="workspace-card__actions">
                      {savedAntecedentes && <span className="resumen-tab__saved">Guardado ✓</span>}
                      {errorAntecedentes && <span className="resumen-tab__error">{errorAntecedentes}</span>}
                      {!editingAntecedentes ? (
                        <button className="btn btn--ghost btn--sm" onClick={startEditAntecedentes}>
                          <Edit2 size={14} /> Editar
                        </button>
                      ) : (
                        <>
                          <button className="btn btn--ghost btn--sm" onClick={cancelEditAntecedentes}>
                            <X size={14} /> Cancelar
                          </button>
                          <button className="btn btn--primary btn--sm" onClick={saveAntecedentes} disabled={savingAntecedentes}>
                            {savingAntecedentes ? <Loader2 size={14} className="spinner" /> : <Save size={14} />}
                            {savingAntecedentes ? 'Guardando...' : 'Guardar'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {editingAntecedentes ? (
                    <div className="resumen-tab__antecedentes-edit">
                      <AntecedentesEditor
                        values={antecedentesValues}
                        onChange={(key, val) => setAntecedentesValues(prev => ({ ...prev, [key]: val }))}
                        compact
                      />
                      <div className="resumen-tab__antecedentes-actions">
                        <button className="btn btn--ghost btn--sm" onClick={cancelEditAntecedentes}>
                          <X size={14} /> Cancelar
                        </button>
                        <button className="btn btn--primary btn--sm" onClick={saveAntecedentes} disabled={savingAntecedentes}>
                          {savingAntecedentes ? <Loader2 size={14} className="spinner" /> : <Save size={14} />}
                          {savingAntecedentes ? 'Guardando...' : 'Guardar'}
                        </button>
                      </div>
                    </div>
                  ) : getActiveAntecedentes(historia).length === 0 ? (
                    <p className="resumen-tab__empty">Sin antecedentes registrados</p>
                  ) : (
                    <div className="resumen-tab__antecedentes-list">
                      {getActiveAntecedentes(historia).map(({ key, label, value }) => (
                        <div key={key} className="resumen-tab__antecedente-card">
                          <AlertCircle size={14} className="resumen-tab__antecedente-icon" />
                          <div className="resumen-tab__antecedente-content">
                            <div className="resumen-tab__antecedente-row">
                              <span className="resumen-tab__antecedente-label">{label}</span>
                              <span className={`resumen-tab__antecedente-badge ${value === 'Si' ? 'resumen-tab__antecedente-badge--si' : 'resumen-tab__antecedente-badge--info'}`}>
                                {value === 'Si' ? 'Si' : 'Presenta'}
                              </span>
                            </div>
                            {value !== 'Si' && (
                              <p className="resumen-tab__antecedente-detail">{value}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: Tratamientos */}
          {activeTab === 'tratamientos' && (
            <TabTratamientos pacienteId={id} historiaId={historia?.id} />
          )}

          {/* TAB: Historia */}
          {activeTab === 'historia' && (
            <TabClinico pacienteId={id} historiaId={historia?.id} />
          )}
        </div>

        {/* RIGHT: Sidebar per tab */}
        <div className="workspace__sidebar-right">
          {activeTab === 'resumen' && <ResumenSidebar pacienteId={id} />}
          {activeTab === 'atencion' && <AtencionSidebar paciente={paciente} historia={historia} signosVitales={signosVitales} onSignosVitalesChange={setSignosVitales} onPacienteUpdated={(u) => setPaciente(u)} pacienteId={id} />}
          {activeTab !== 'resumen' && activeTab !== 'atencion' && (
            <WorkspaceTimeline pacienteId={id} />
          )}
        </div>
      </div>
    </div>
  );
}

// === Helpers ===

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const mes = hoy.getMonth() - nac.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function toLocalDateTime() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}
