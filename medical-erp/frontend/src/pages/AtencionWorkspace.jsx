import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, User, FileText, Activity, ArrowLeft, Stethoscope, AlertCircle, Calendar, CalendarClock, Clock, Edit2, Save, X, Play, Shield, CheckCircle, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { getPrimaryRole } from '../utils/roleUtils';
import CitaSchedulerModal from '../components/agenda/CitaSchedulerModal';
import FirmaContratoModal from '../components/paciente360/FirmaContratoModal';
import { pacienteService } from '../services/pacienteService';
import { historiaClinicaService } from '../services/historiaClinicaService';
import { consultasService } from '../services/consultasService';
import { tratamientoService } from '../services/tratamientoService';
import { contratoPwaService } from '../services/contratoPwaService';
import agendaService from '../services/agendaService';
import { evidenciaService } from '../services/evidenciaService';
import { membresiaService } from '../services/membresiaService';
import { formatNombre } from '../utils/fullName';
import ResumenSidebar from '../components/paciente360/ResumenSidebar';
import ConfirmModal from '../components/ConfirmModal';
import { getLADateString, parseLADateTime, nowLA, formatLADate, toLocalDateTime } from '../utils/laTimezone';
import { horaMostrar } from '../utils/zonaHoraria';
import { useUnitSystem } from '../context/UnitContext';
import { pesoAUS, tallaAUS } from '../utils/units';
import { useSessionTimer } from '../context/SessionTimerProvider';
import { getTreatmentLabel } from '../config/attentionTypes';
import WorkspaceTimeline from '../components/paciente360/WorkspaceTimeline';
import TabClinico from '../components/paciente360/TabClinico';
import TabTratamientos from '../components/paciente360/TabTratamientos';
import AtencionForm from '../components/atencion/AtencionForm';
import SesionTratamientoView from '../components/atencion/SesionTratamientoView';
import SmartTimerBar from '../components/atencion/SmartTimerBar';
import { useAtencionType } from '../hooks/useAtencionType';
import { getActiveAntecedentes } from '../components/ui/AntecedentesEditor';
import AntecedentesEditor from '../components/ui/AntecedentesEditor';

// Margen para poder iniciar una cita antes de su hora (recibir temprano).
const VENTANA_MINUTOS = 60;

function getEstadoClass(estado) {
  switch (estado) {
    case 'EN_CURSO': return 'tratamiento-badge--activo';
    case 'PROGRAMADO': return 'tratamiento-badge--programado';
    case 'FINALIZADO': return 'tratamiento-badge--finalizado';
    case 'PAUSADO': return 'tratamiento-badge--pausado';
    case 'CANCELADO': return 'tratamiento-badge--cancelado';
    default: return '';
  }
}

function getEstadoLabel(estado, t) {
  switch (estado) {
    case 'EN_CURSO': return t('en_curso');
    case 'PROGRAMADO': return 'Programado';
    case 'FINALIZADO': return 'Finalizado';
    case 'PAUSADO': return 'Pausado';
    case 'CANCELADO': return 'Cancelado';
    default: return estado;
  }
}

export default function AtencionWorkspace() {
  const { t } = useTranslation('patients');
  const { t: tc } = useTranslation('clinical');
  const { t: td } = useTranslation('dashboard');
  const { t: tco } = useTranslation('common');
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { registerActiva, clearActiva, citaVersion, citaActiva: citaTimer } = useSessionTimer();
  const primaryRole = getPrimaryRole(user);
  const isDoctora = primaryRole === 'doctora';

  const { system: unitSystem } = useUnitSystem();
  const isUS = unitSystem === 'us';
  const pesoUnidad = isUS ? 'lbs' : 'kg';
  const tallaUnidad = isUS ? 'in' : 'cm';
  const pesoMostrar = (v) => (isUS ? pesoAUS(v) : v);
  const tallaMostrar = (v) => (isUS ? tallaAUS(v) : v);
  const [activeTab, setActiveTab] = useState('resumen');
  const [atencionView, setAtencionView] = useState('entry');
  const [paciente, setPaciente] = useState(null);
  const [historia, setHistoria] = useState(null);
  const [tratamientos, setTratamientos] = useState([]);
  const [citasHoy, setCitasHoy] = useState([]);
  const [citasFuturas, setCitasFuturas] = useState([]);
  const [citasPendientes, setCitasPendientes] = useState([]);
  const [tratamientosBloqueados, setTratamientosBloqueados] = useState(new Set());
  const [tratamientoParaReagendar, setTratamientoParaReagendar] = useState(null);
  const [consultaOrigenId, setConsultaOrigenId] = useState(null);
  const [signosVitales, setSignosVitales] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingAntecedentes, setEditingAntecedentes] = useState(false);
  const [antecedentesValues, setAntecedentesValues] = useState({});
  const [savingAntecedentes, setSavingAntecedentes] = useState(false);
  const [savedAntecedentes, setSavedAntecedentes] = useState(false);
  const [errorAntecedentes, setErrorAntecedentes] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);
  const [startingAttention, setStartingAttention] = useState(false);
  const [startError, setStartError] = useState('');
  const [contratoFirmado, setContratoFirmado] = useState(null);
  const [showFirmaContrato, setShowFirmaContrato] = useState(false);
  const [showContratoWarning, setShowContratoWarning] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showScheduleAfterComplete, setShowScheduleAfterComplete] = useState(false);
  const [noShowCita, setNoShowCita] = useState(null);
  const [showNoShowModal, setShowNoShowModal] = useState(false);
  const [citaRecienCreada, setCitaRecienCreada] = useState(null);
  const [membresias, setMembresias] = useState([]);
  const membresiaActiva = membresias.find(m => m.estado === 'activa' || m.vigente);

  const WORKSPACE_TABS = [
    { id: 'resumen', label: t('tab_resumen'), icon: User },
    { id: 'atencion', label: t('workspace_attention'), icon: Activity },
    { id: 'tratamientos', label: t('workspace_treatments'), icon: Stethoscope },
    { id: 'historia', label: t('workspace_history'), icon: FileText },
  ];

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [pRes, hRes, tRes, cRes, cfRes, contratoRes, memRes] = await Promise.allSettled([
        pacienteService.getById(id),
        historiaClinicaService.getByPaciente(id),
        tratamientoService.listByPaciente(id),
        agendaService.getCitasHoy(),
        agendaService.getCitasPorPaciente(id),
        contratoPwaService.checkFirmado(id),
        membresiaService.getByPaciente(id).catch(() => []),
      ]);

      if (pRes.status === 'fulfilled' && pRes.value?.success) setPaciente(pRes.value.data);
      if (hRes.status === 'fulfilled' && hRes.value?.success) setHistoria(hRes.value.data);
      if (memRes.status === 'fulfilled') {
        const mems = Array.isArray(memRes.value) ? memRes.value : [];
        setMembresias(mems);
      }
      if (contratoRes.status === 'fulfilled') {
        const ck = contratoRes.value?.data || contratoRes.value;
        const firmado = ck?.status === 'FIRMADO';
        setContratoFirmado(firmado);
        if (!firmado) setShowContratoWarning(true);
      } else {
        setContratoFirmado(false);
        setShowContratoWarning(true);
      }
      if (tRes.status === 'fulfilled' && tRes.value?.success) {
        const list = Array.isArray(tRes.value.data) ? tRes.value.data : tRes.value.data?.content || [];
        setTratamientos(list);

        const activos = list.filter(
          (t) => t.estado === 'EN_CURSO' || t.estado === 'PROGRAMADO' || t.estado === 'PENDIENTE'
        );
        if (cfRes.status === 'fulfilled' && cfRes.value?.success) {
          const todas = Array.isArray(cfRes.value.data) ? cfRes.value.data : [];
          const hoyStr = getLADateString();
          const ahoraMin = nowLA().getHours() * 60 + nowLA().getMinutes();

          const esCitaFutura = (c) => {
            if (c.fecha > hoyStr) return true;
            if (c.fecha < hoyStr) return false;
            if (c.hora) {
              const [h, m] = c.hora.split(':').map(Number);
              return (h * 60 + m) > ahoraMin;
            }
            return true;
          };

          const pendientes = todas.filter((c) =>
            (c.estado === 'pendiente' || c.estado === 'solicitada') && esCitaFutura(c)
          );
          setCitasPendientes(pendientes);

          // Bloquear el tratamiento si existe CUALQUIER cita futura vinculada
          // (pendiente/solicitada/programada/confirmada). Se desbloquea cuando la cita
          // pasa a en_atencion (el doctor inicia la sesión), no al confirmar el cliente.
          // Ademas: si la ultima cita quedo en no_show o cancelada (la sesion no se hizo),
          // el tratamiento sigue bloqueado hasta reprogramar una nueva cita.
          const bloqueados = new Set(
            todas
              .filter((c) =>
                c.tratamientoId &&
                ['pendiente', 'solicitada', 'programada', 'confirmada'].includes(c.estado) &&
                esCitaFutura(c)
              )
              .map((c) => c.tratamientoId)
          );
          todas
            .filter((c) => c.tratamientoId && ['no_show', 'cancelada'].includes(c.estado))
            .forEach((c) => {
              const tieneCitaFutura = todas.some((o) =>
                o.tratamientoId === c.tratamientoId &&
                ['pendiente', 'solicitada', 'programada', 'confirmada'].includes(o.estado) &&
                esCitaFutura(o)
              );
              if (!tieneCitaFutura) bloqueados.add(c.tratamientoId);
            });
          setTratamientosBloqueados(bloqueados);

          const futuras = todas.filter((c) =>
            (c.estado === 'pendiente' || c.estado === 'solicitada' || c.estado === 'confirmada' || c.estado === 'programada') && esCitaFutura(c)
          );
          setCitasFuturas(futuras);

          // Detectar una cita en no_show SOLO de HOY para avisar al doctor (y poder reprogramar).
          // Las citas no_show de días anteriores ya fueron gestionadas; no deben re-disparar el aviso.
          // Además, si el paciente ya está en atención (en_atencion hoy) no avisar: ya está siendo atendido.
          // El aviso solo es relevante dentro de 1 hora desde el horario de la cita; después no molesta.
          const RETRASO_MAXIMO_MIN = 60;
          const hayEnAtencionHoy = todas.some((c) =>
            String(c.pacienteId) === String(id) && c.estado === 'en_atencion' && c.fecha === hoyStr
          );
          const citaNoShow = todas.find((c) => {
            if (String(c.pacienteId) !== String(id) || c.estado !== 'no_show' || c.fecha !== hoyStr) return false;
            const inicio = parseLADateTime(`${c.fecha}T${c.hora}`);
            if (!inicio) return false;
            const retrasoMin = Math.floor((nowLA() - inicio) / 60000);
            return retrasoMin >= 0 && retrasoMin <= RETRASO_MAXIMO_MIN;
          });
          if (citaNoShow && !hayEnAtencionHoy && !showNoShowModal) {
            setNoShowCita(citaNoShow);
            setShowNoShowModal(true);
          }
        }
      }

      if (cRes.status === 'fulfilled' && cRes.value?.success) {
        const hoy = Array.isArray(cRes.value.data) ? cRes.value.data : [];
        setCitasHoy(hoy.filter((c) => String(c.pacienteId) === String(id)));
      }
    } catch (err) {
      setError(err.message || tco('error_loading'));
    } finally {
      setLoading(false);
    }
  }, [id, t, tco]);

  useEffect(() => { load(); }, [load]);

  const { attentionType } = useAtencionType({ historia, tratamientos, citasHoy });

  const activeTreatments = tratamientos.filter(
    (t) =>
      t.estado !== 'FINALIZADO' && t.estado !== 'CANCELADO' &&
      (
        t.estado === 'EN_CURSO' || t.estado === 'PROGRAMADO' || t.estado === 'PENDIENTE'
        || citasHoy.some((c) => c.tratamientoId === t.id && ['en_atencion', 'confirmada', 'pendiente', 'solicitada', 'programada'].includes(c.estado))
        || citasFuturas.some((c) => c.tratamientoId === t.id && ['confirmada', 'pendiente', 'solicitada', 'programada'].includes(c.estado))
      )
  );
  const hasActiveTreatment = activeTreatments.length > 0;

  // Tratamientos activos SIN cita programada vigente (para el modal de agendar):
  // no estan bloqueados (sin cita futura activa ni no_show/cancelada sin reprogramar)
  // y no estan en atencion ahora mismo.
  const tratamientosSinCita = activeTreatments.filter(
    (t) =>
      !tratamientosBloqueados.has(t.id) &&
      !citasHoy.some((c) => c.tratamientoId === t.id && c.estado === 'en_atencion')
  );

  const citaActiva = citasHoy.find(c => c.estado === 'en_atencion')
    || (citaTimer?.estado === 'en_atencion' ? citaTimer : null);

  // Registrar la cita activa en el cronómetro global (en vivo, persistente).
  // No se limpia aquí: si la cita en atención cruza la medianoche y no está en "citas de hoy",
  // el cronómetro global restaurado (por ID) debe mantenerse.
  useEffect(() => {
    if (citaActiva) {
      registerActiva(citaActiva);
    }
  }, [citaActiva, registerActiva]);

  // Cuando se extiende la sesión (citaVersion cambia), recargar citas para reflejar
  // la nueva duración en el cronómetro y en el bloqueo, sin recargar la página.
  const citaVersionRef = useRef(0);
  useEffect(() => {
    if (citaVersionRef.current !== 0 && citaVersionRef.current !== citaVersion) {
      load();
    }
    citaVersionRef.current = citaVersion;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citaVersion]);

  useEffect(() => {
    if (!citaActiva) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [citaActiva]);

  const ahoraLA = nowLA();
  const nowMin = ahoraLA.getHours() * 60 + ahoraLA.getMinutes();

  // Rótulo de la hora de la cita en la zona activa (CA o PE).
  const horaLabel = (cita) =>
    (horaMostrar(cita?.hora, cita?.fecha) || '--:--').substring(0, 5);

  const siguienteCita = [...citasHoy, ...citasFuturas].find(c => {
    if (c.estado === 'en_atencion') return false;
    if (!c.hora) return false;
    const [h, m] = c.hora.split(':').map(Number);
    return (h * 60 + m) > nowMin;
  }) || null;

  // Sort active treatments: en_atencion cita first, then by nearest cita, then no-cita last
  const sortedTreatments = [...activeTreatments].sort((a, b) => {
    const aCitaActiva = citasHoy.find(c => c.tratamientoId === a.id && c.estado === 'en_atencion');
    const bCitaActiva = citasHoy.find(c => c.tratamientoId === b.id && c.estado === 'en_atencion');
    if (aCitaActiva && !bCitaActiva) return -1;
    if (!aCitaActiva && bCitaActiva) return 1;
    const aCita = [...citasHoy, ...citasFuturas].find(c => c.tratamientoId === a.id && c.estado !== 'en_atencion' && c.estado !== 'completada' && c.estado !== 'cancelada');
    const bCita = [...citasHoy, ...citasFuturas].find(c => c.tratamientoId === b.id && c.estado !== 'en_atencion' && c.estado !== 'completada' && c.estado !== 'cancelada');
    if (aCita && !bCita) return -1;
    if (!aCita && bCita) return 1;
    if (aCita && bCita) return (aCita.fecha + (aCita.hora || '')).localeCompare(bCita.fecha + (bCita.hora || ''));
    return 0;
  });

  // Check if a cita's time has arrived (for highlighting the button)
  const isCitaReady = (tratamientoId) => {
    const cita = citasHoy.find(c => c.tratamientoId === tratamientoId && c.estado !== 'en_atencion' && c.estado !== 'completada');
    if (!cita?.hora) return false;
    const [h, m] = cita.hora.split(':').map(Number);
    return nowMin >= (h * 60 + m);
  };

  // Mantiene la ficha del paciente (Resumen) sincronizada con la última medición
  // tomada en el flujo de atención. Fallas aquí no deben romper el guardado de la consulta.
  const syncMedidasPaciente = async (peso, talla) => {
    if (peso == null && talla == null) return;
    try {
      await pacienteService.updateSignosVitales(id, { peso, estatura: talla });
    } catch (err) {
      console.error('Error sync medidas al paciente:', err);
    }
  };

  const handleSaveMotivo = async (formData) => {
    try {
      if (!historia?.id) {
        const hRes = await historiaClinicaService.create({ pacienteId: id });
        if (hRes.success) setHistoria(hRes.data);
      }
      const sv = formData.signosVitales || {};
      const svFiltrados = { peso: sv.peso, talla: sv.talla };
      const signosVitalesToSend = { ...signosVitales, ...svFiltrados };
      if (Object.keys(svFiltrados).some((k) => svFiltrados[k] != null)) setSignosVitales(signosVitalesToSend);
      const consultaRes = await consultasService.create({
        historiaId: historia?.id,
        fecha: toLocalDateTime(),
        motivo: formData.motivo || t('atencion_directa'),
        motivoInicial: formData.motivoInicial || null,
        tiempoEnfermedad: formData.tiempoEnfermedad || null,
        signosSintomas: formData.signosSintomas || null,
        relatoCronologico: formData.relatoCronologico || null,
        examenClinicoGeneral: formData.examenClinicoGeneral || null,
        diagnosticoLista: formData.diagnosticoLista?.length > 0 ? formData.diagnosticoLista : null,
        planTratamiento: formData.planTratamiento?.medicamentos?.length > 0 ? formData.planTratamiento : null,
        notas: formData.notas || null,
        signosVitales: Object.keys(signosVitalesToSend).some((k) => signosVitalesToSend[k] != null) ? signosVitalesToSend : null,
      });
      if (consultaRes?.data?.id) setConsultaOrigenId(consultaRes.data.id);
      await syncMedidasPaciente(svFiltrados.peso, svFiltrados.talla);
      if (formData.antecedentes && historia?.id) {
        try {
          await historiaClinicaService.updateAntecedentes(historia.id, formData.antecedentes);
          const refreshed = await historiaClinicaService.getByPaciente(id);
          if (refreshed.success) setHistoria(refreshed.data);
        } catch (err) {
          console.error('Error saving antecedentes:', err);
        }
      }
      setAtencionView('sesion');
      await load();
    } catch (err) {
      console.error('Error saving motivo:', err);
    }
  };

  const handleScheduleFromMotivo = async () => { setShowScheduler(true); };

  const obtenerConsultaOrigen = async () => {
    if (consultaOrigenId) return consultaOrigenId;
    try {
      const res = await consultasService.getByPaciente(id).catch(() => ({ success: false, data: [] }));
      const consultas = res?.success ? (res.data || []) : [];
      if (consultas.length > 0) {
        const sorted = [...consultas].sort((a, b) => {
          const fa = a.fecha || a.createdAt || '';
          const fb = b.fecha || b.createdAt || '';
          return fa > fb ? -1 : fa < fb ? 1 : 0;
        });
        return sorted[0].id;
      }
    } catch { /* silencio */ }
    return null;
  };

  const handleNewSession = async (tratamiento, mode, data) => {
    let sesionId = null;
    try {
      if (mode === 'new') {
        const consultaOrigen = await obtenerConsultaOrigen();
        const res = await tratamientoService.create({
          pacienteId: id,
          historiaClinicaId: historia?.id,
          consultaOrigenId: consultaOrigen || undefined,
          tipoTratamiento: data.tipoTratamiento,
          sesionesPlaneadas: data.sesionesPlaneadas,
          costoEstimado: data.costoSesion ? parseFloat(data.costoSesion) : null,
          modoCosto: data.modoCosto || 'DIFERENTE',
          objetivo: t('tratamiento_indicado'),
        });
        if (res?.success) {
          const nuevoId = res.data.id;
          await tratamientoService.programar(nuevoId);
          await tratamientoService.iniciar(nuevoId);
          sesionId = null;
          if (data.fotos?.length) {
            for (const foto of data.fotos) {
              if (foto?.file) {
                await evidenciaService.uploadTratamiento(nuevoId, 'FOTO_INICIO', foto.descripcion || '', [foto.file]).catch(() => {});
              }
            }
          }
        }
      } else {
        const tipoSesionId = mode === 'last' ? 5 : mode === 'first-session' ? 1 : 3;
        const ses = await tratamientoService.createSession(tratamiento.id, {
          tipoSesionId, fecha: toLocalDateTime(),
          evolucion: data.evolucion || null, observaciones: data.observaciones || null,
          signosVitales: Object.keys(signosVitales).length > 0 ? signosVitales : null,
          costoSesion: data.costoSesion ? parseFloat(data.costoSesion) : null,
        });
        sesionId = ses?.data?.id ?? null;
      }
      if (signosVitales?.peso != null || signosVitales?.talla != null) {
        await syncMedidasPaciente(signosVitales.peso, signosVitales.talla);
      }
      await subirFotosSesion(sesionId, data.fotos);
      if (data.postAction === 'finalize') {
        await tratamientoService.finalizar(tratamiento?.id, t('tratamiento_indicado'));
        // Si el tratamiento se finalizó, completar la cita en atención vinculada para cerrar el cronómetro.
        const citaEnAtencion = citasHoy.find(c => c.tratamientoId === tratamiento?.id && c.estado === 'en_atencion')
          || (citaTimer?.id ? citasHoy.find(c => c.id === citaTimer.id && c.estado === 'en_atencion') : null);
        if (citaEnAtencion?.id) {
          try { await agendaService.completarCita(citaEnAtencion.id); } catch (e) { console.error('Error completando cita al finalizar:', e); }
        }
        setAtencionView('entry');
        await load();
      } else if (data.postAction !== 'schedule') {
        await load();
      }
      return sesionId;
    } catch (err) {
      console.error('Error saving session:', err);
      return null;
    }
  };

  // Sube las fotos de una sesión como evidencias de tratamiento.
  const subirFotosSesion = async (sesionId, fotos) => {
    if (!sesionId || !fotos?.length) return;
    for (const f of fotos) {
      if (!f?.file) continue;
      try {
        await evidenciaService.uploadBatch(sesionId, 'FOTO', f.descripcion || f.file.name || '', [f.file]);
      } catch (err) {
        console.error('Error subiendo foto de sesión:', err);
      }
    }
  };

  const handleFinalize = async (tratamiento, data) => {
    try {
      await tratamientoService.finalizar(tratamiento.id, data?.resultadoFinal || t('tratamiento_indicado'));
      navigate('/pacientes');
    } catch (err) { console.error('Error finalizing:', err); }
  };

  const handleSchedule = async () => {
    // Mantenerse en Atención (no rebotar a entrada): recargar para reflejar el bloqueo.
    try { await load(); }
    catch (err) { console.error('Error scheduling:', err); await load(); }
  };

  const handleCompleteCita = async () => {
    setShowCompleteConfirm(false);
    const activeId = (citaActiva || citaTimer)?.id;
    if (!activeId) return;
    try {
      const citaTratamientoId = (citaActiva || citaTimer)?.tratamientoId || null;
      await agendaService.completarCita(activeId);
      clearActiva();
      await load();
      setTratamientoParaReagendar(citaTratamientoId);
      setShowScheduleAfterComplete(true);
    } catch (err) {
      console.error('Error completing:', err);
    }
  };

  const handleScheduleAfterComplete = () => {
    setShowScheduleAfterComplete(false);
    setShowScheduler(true);
  };

  const handleFinishAfterComplete = () => {
    setShowScheduleAfterComplete(false);
    navigate('/pacientes');
  };

  const handleCreateTratamiento = async (formData) => {
    try {
      const createRes = await tratamientoService.create({
        pacienteId: parseInt(id), tipoTratamiento: formData.tipoTratamiento,
        consultaOrigenId: consultaOrigenId || undefined,
        sesionesPlaneadas: formData.sesionesPlaneadas,
        costoEstimado: formData.costoEstimado ? parseFloat(formData.costoEstimado) : null,
        objetivo: formData.objetivo || t('tratamiento_indicado'),
      });
      if (!createRes?.success) throw new Error(createRes?.message || t('error_crear_tratamiento'));
      const tId = createRes.data?.id;
      if (!tId) throw new Error(t('tratamiento_creado_sin_id'));
      await tratamientoService.programar(tId);
      await tratamientoService.iniciar(tId);
      await load();
      setAtencionView('sesion');
    } catch (err) { console.error('Error creando tratamiento:', err); throw err; }
  };

  const handlePausarTratamiento = async (tratamiento, motivo) => {
    try { await tratamientoService.pausar(tratamiento.id, motivo || t('pausado_por_doctora')); await load(); }
    catch (err) { console.error('Error pausing treatment:', err); }
  };

  const handleReanudarTratamiento = async (tratamiento) => {
    try { await tratamientoService.reanudar(tratamiento.id); await load(); }
    catch (err) { console.error('Error resuming treatment:', err); }
  };

  const handleCancelarTratamiento = async (tratamiento, motivo) => {
    try { await tratamientoService.cancelar(tratamiento.id, motivo); setAtencionView('entry'); await load(); }
    catch (err) { console.error('Error canceling treatment:', err); }
  };

  const handleAmpliarTratamiento = async (tratamiento, nuevasSesiones, motivo) => {
    try { await tratamientoService.ampliarPlan(tratamiento.id, nuevasSesiones, motivo); await load(); }
    catch (err) { console.error('Error expanding plan:', err); }
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
    setEditingAntecedentes(true); setSavedAntecedentes(false); setErrorAntecedentes('');
  };

  const cancelEditAntecedentes = () => { setEditingAntecedentes(false); setErrorAntecedentes(''); };

  const saveAntecedentes = async (valuesOverride) => {
    if (!historia?.id) return;
    const valores = valuesOverride || antecedentesValues;
    setSavingAntecedentes(true); setErrorAntecedentes('');
    try {
      const result = await historiaClinicaService.updateAntecedentes(historia.id, valores);
      if (!result.success) throw new Error(result.message || tco('error_saving'));
      const refreshed = await historiaClinicaService.getByPaciente(id);
      if (refreshed.success) setHistoria(refreshed.data);
      setSavedAntecedentes(true); setEditingAntecedentes(false);
      setTimeout(() => setSavedAntecedentes(false), 2000);
    } catch (err) { setErrorAntecedentes(err.message); }
    finally { setSavingAntecedentes(false); }
  };

  const handleContinueTreatment = () => { setAtencionView('sesion'); };
  const handleContinueSpecificTreatment = () => { setAtencionView('sesion'); };
  const handleUnlockTreatment = () => { setShowScheduler(true); };

  /**
   * "Atención con cita": respeta la hora agendada. NUNCA crea una cita a la hora
   * actual ni salta la cola del día.
   *   1) Ya estamos en atención → abrir el motivo de la cita en curso.
   *   2) Cita viva de hoy dentro de la ventana → iniciarla.
   *   3) Hay cita viva de hoy pero todavía no es su hora → avisar y esperar.
   *   4) No hay cita de hoy → abrir el agendador para que la doctora elija día y hora.
   */
  const handleAtencionConCita = async () => {
    if (contratoFirmado === false) { setShowFirmaContrato(true); setStartingAttention(false); return; }

    // 1) Ya estamos atendiendo al paciente → registrar la consulta de la cita actual.
    if (citaActiva) { setAtencionView('motivo'); return; }

    setStartingAttention(true); setStartError('');
    try {
      // 2) Si la doctora acaba de agendar, iniciar ESE cita.
      if (citaRecienCreada) {
        const reciente = citasHoy.find(c => String(c.id) === String(citaRecienCreada));
        if (reciente) {
          await agendaService.iniciarAtencion(reciente.id);
          setCitaRecienCreada(null);
          await load(); setAtencionView('motivo'); return;
        }
      }

      const vivas = citasHoy
        .filter(c => !['cancelada', 'completada', 'no_show', 'reprogramada'].includes(c.estado))
        .filter(c => ['confirmada', 'asistio', 'llegada', 'en_atencion', 'pendiente', 'programada'].includes(c.estado))
        .sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));

      if (vivas.length === 0) {
        // 4) Sin cita de hoy → agendar.
        setShowScheduler(true);
        return;
      }

      // Ya en atención: no hay nada que iniciar.
      if (vivas.some(c => c.estado === 'en_atencion')) {
        await load(); setAtencionView('motivo'); return;
      }

      // 2) Cita de hoy cuya hora ya está dentro de la ventana (buffer de 60 min
      //    hacia atrás, para poder recibir temprano). La más próxima gana.
      const enVentana = vivas
        .filter(c => {
          if (!c.hora) return true;
          const [h, m] = c.hora.split(':').map(Number);
          return (h * 60 + m) >= (nowMin - VENTANA_MINUTOS);
        })[0];

      if (enVentana) {
        await agendaService.iniciarAtencion(enVentana.id);
        await load(); setAtencionView('motivo'); return;
      }

      // 3) Hay cita de hoy pero todavía no se puede entrar.
      setStartError(t('cita_aun_no_es_hora', { hora: horaLabel(vivas[0]) }));
    } catch (err) {
      setStartError(err.message || t('error_iniciar_atencion'));
    } finally {
      setStartingAttention(false);
    }
  };

  /**
   * "Consulta instantánea": entra de frente. El backend crea la cita en
   * "en_atencion" con la hora actual, sin validar agenda. Si el paciente ya
   * tiene una cita viva hoy, no se permite: debe usarse "Atención con cita".
   */
  const handleConsultaInstantanea = async () => {
    if (contratoFirmado === false) { setShowFirmaContrato(true); setStartingAttention(false); return; }

    if (citaActiva) { setAtencionView('motivo'); return; }

    // Guarda en el frontend (respuesta rápida). El backend valida igual y
    // responde 422 si el paciente ya tiene cita hoy.
    const viva = citasHoy.find(c =>
      ['confirmada', 'asistio', 'llegada', 'en_atencion', 'pendiente', 'programada'].includes(c.estado));
    if (viva) {
      setStartError(t('walk_in_bloqueado_con_cita', { hora: horaLabel(viva) }));
      return;
    }

    setStartingAttention(true); setStartError('');
    try {
      await agendaService.crearWalkIn(id, t('atencion_directa'));
      await load();
      setAtencionView('motivo');
    } catch (err) {
      setStartError(err.message || t('error_iniciar_atencion'));
    } finally {
      setStartingAttention(false);
    }
  };

  if (loading) return (<div className="workspace workspace--compact"><div className="workspace__loading"><Loader2 size={32} className="spinner" /><p>{t('loading_workspace')}</p></div></div>);
  if (!paciente) return (<div className="workspace workspace--compact"><div className="workspace__error">{error || t('no_found')}</div></div>);

  const fullName = formatNombre(paciente);
  const edad = calcularEdad(paciente.fechaNacimiento);
  const sexoLabel = paciente.sexo === 'M' ? t('gender_male') : paciente.sexo === 'F' ? t('gender_female') : '';

  return (
    <div className="workspace workspace--compact">
      <div className="workspace__header">
        <div className="workspace__patient-info">
          <h1 className="workspace__patient-name">{fullName}</h1>
          <div className="workspace__patient-meta">
            {sexoLabel && <span className="workspace__patient-badge workspace__patient-badge--gender">{sexoLabel} {edad ? `${edad} ${t('anos')}` : ''}</span>}
            {!sexoLabel && edad && <span>{edad} {t('anos')}</span>}
            {paciente.licenciaConducir && <span>ID: {paciente.licenciaConducir}</span>}
          </div>
        </div>
        <div className="workspace__header-actions">
          <button className="btn btn--secondary btn--sm" onClick={() => { if (citaActiva && !window.confirm(t('confirmar_salida_sesion'))) return; navigate('/pacientes'); }}>
            <ArrowLeft size={16} /> {t('back_to_clients')}
          </button>
        </div>
      </div>

      {<SmartTimerBar citaActiva={citaActiva} siguienteCita={siguienteCita} onComplete={() => setShowCompleteConfirm(true)} />}

      <div className="workspace__tabs-bar">
        {WORKSPACE_TABS.map((tab) => {
          const Icon = tab.icon;
          return (<button key={tab.id} className={`workspace__tab ${activeTab === tab.id ? 'workspace__tab--active' : ''}`} onClick={() => setActiveTab(tab.id)}><Icon size={16} /><span>{tab.label}</span></button>);
        })}
      </div>

      <div className={`workspace__body ${activeTab === 'atencion' ? 'workspace__body--1col' : 'workspace__body--2col'}`}>
        <div className="workspace__content workspace__content--full">
          {activeTab === 'atencion' && (
            <div className="atencion-workspace">
              {atencionView === 'entry' && (
                <div className="atencion-workspace__entry">
                  {contratoFirmado === false && (
                    <div className="atencion-workspace__contrato-alert">
                      <div className="atencion-workspace__contrato-alert-icon"><AlertCircle size={18} /></div>
                      <div className="atencion-workspace__contrato-alert-text">
                        <span className="atencion-workspace__contrato-alert-title">{t('consentimiento_admision_pendiente')}</span>
                        <span className="atencion-workspace__contrato-alert-desc">{t('workspace_warning_no_contract')}</span>
                      </div>
                      <div className="atencion-workspace__contrato-alert-actions">
                        <button className="btn btn--primary btn--sm" onClick={() => setShowFirmaContrato(true)}><Shield size={14} /> {t('workspace_sign_contract')}</button>
                      </div>
                    </div>
                  )}
                  {contratoFirmado === true && <div className="atencion-workspace__contrato-alert atencion-workspace__contrato-alert--firmado"><CheckCircle size={16} /><span>{t('consentimiento_admision_firmado')}</span></div>}

                  {hasActiveTreatment ? (
                    <div className="atencion-workspace__queue">
                      <h3 className="atencion-workspace__queue-title"><Activity size={16} /> {t('tratamientos_activos')}</h3>
                      {sortedTreatments.map((tr) => {
                        const isBlocked = tratamientosBloqueados.has(tr.id);
                        const citaActivaTr = citasHoy.find(c => c.tratamientoId === tr.id && c.estado === 'en_atencion');
                        const citaFuturaTr = [...citasHoy, ...citasFuturas].find(c => c.tratamientoId === tr.id && c.estado !== 'en_atencion' && c.estado !== 'completada' && c.estado !== 'cancelada');
                        const ready = isCitaReady(tr.id);
                        const sesiones = tr.sesionesRealizadas || 0;
                        const total = tr.sesionesPlaneadas || 0;
                        const progreso = total > 0 ? sesiones / total : 0;

                        return (
                          <div key={tr.id} className={`atencion-workspace__queue-card ${citaActivaTr ? 'atencion-workspace__queue-card--active' : ''} ${isBlocked ? 'atencion-workspace__queue-card--blocked' : ''} ${ready && !citaActivaTr ? 'atencion-workspace__queue-card--ready' : ''}`}>
                            <div className="atencion-workspace__queue-card-top">
                              <div className="atencion-workspace__queue-card-info">
                                <span className="atencion-workspace__queue-card-name">{getTreatmentLabel(tr.tipoTratamiento)}</span>
                                <div className="atencion-workspace__queue-card-meta">
                                  <span className={`tratamiento-badge ${getEstadoClass(tr.estado)}`}>{getEstadoLabel(tr.estado, t)}</span>
                                  <span>{t('sesion_de_n', { real: sesiones || 0, total: total || 0 })}</span>
                                </div>
                              </div>
                              <div className="atencion-workspace__queue-card-progress">
                                <div className="atencion-workspace__progress-track">
                                  <div className="atencion-workspace__progress-fill" style={{ width: `${progreso * 100}%` }} />
                                </div>
                                <span className="atencion-workspace__progress-text">{Math.round(progreso * 100)}%</span>
                              </div>
                            </div>

                            {citaActivaTr && (
                              <div className="atencion-workspace__queue-cita atencion-workspace__queue-cita--active">
                                <Clock size={14} />
                                <span>{t('sesion_enCurso')} — {horaMostrar(citaActivaTr.hora, citaActivaTr.fecha)?.substring(0, 5) || ''}</span>
                              </div>
                            )}
                            {!citaActivaTr && citaFuturaTr && (
                              <div className={`atencion-workspace__queue-cita ${ready ? 'atencion-workspace__queue-cita--ready' : ''}`}>
                                <Calendar size={14} />
                                <span>{formatDate(citaFuturaTr.fecha)}{citaFuturaTr.hora ? ` — ${horaMostrar(citaFuturaTr.hora, citaFuturaTr.fecha).substring(0, 5)}` : ''}</span>
                              </div>
                            )}

                            <div className="atencion-workspace__queue-card-actions">
                              {citaActivaTr ? (
                                <button className="btn btn--primary atencion-workspace__queue-btn atencion-workspace__queue-btn--pulse" onClick={handleContinueTreatment}>
                                  <Activity size={16} /> {t('continuar_sesion')}
                                </button>
                              ) : isBlocked ? (
                                <button className="btn btn--secondary atencion-workspace__queue-btn atencion-workspace__queue-btn--unlock" onClick={handleUnlockTreatment}>
                                  <AlertCircle size={16} /> {t('desbloquear_tratamiento')}
                                </button>
                              ) : (
                                <button className={`btn btn--primary atencion-workspace__queue-btn ${ready ? 'atencion-workspace__queue-btn--pulse' : ''}`} onClick={handleContinueTreatment}>
                                  <Activity size={16} /> {t('continuar_tratamiento')}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="atencion-workspace__entry-card atencion-workspace__entry-card--new">
                      <FileText size={24} />
                      <h3>{tc('nueva_consulta')}</h3>
                      <p>{t('no_tiene_tratamientos_activos')}</p>
                      {startError && <div className="atencion-workspace__entry-error"><AlertCircle size={14} /> {startError}</div>}
                      <div className="atencion-workspace__entry-actions">
                        <button
                          className="btn btn--primary"
                          onClick={handleAtencionConCita}
                          disabled={startingAttention || !isDoctora}
                          title={!isDoctora ? t('solo_profesional_puede_iniciar') : ''}
                        >
                          {startingAttention ? <Loader2 size={16} className="spinner" /> : <CalendarClock size={16} />}
                          {startingAttention ? t('iniciando') : t('atencion_con_cita')}
                        </button>
                        <button
                          className="btn btn--secondary"
                          onClick={handleConsultaInstantanea}
                          disabled={startingAttention || !isDoctora}
                          title={!isDoctora ? t('solo_profesional_puede_iniciar') : ''}
                        >
                          <Zap size={16} /> {t('consulta_instantanea')}
                        </button>
                        <button className="btn btn--secondary" onClick={() => setShowScheduler(true)}><Calendar size={16} /> {t('agendar_cita')}</button>
                      </div>
                    </div>
                  )}
                  {hasActiveTreatment && (
                    <div className="atencion-workspace__entry-footer">
                      {startError && <div className="atencion-workspace__entry-error"><AlertCircle size={14} /> {startError}</div>}
                      <div className="atencion-workspace__entry-footer-actions">
                        <button className="btn btn--secondary" onClick={() => setShowScheduler(true)}><Calendar size={16} /> {t('agendar_cita')}</button>
                        <button
                          className="btn btn--primary"
                          onClick={handleAtencionConCita}
                          disabled={startingAttention || !isDoctora}
                          title={!isDoctora ? t('solo_profesional_puede_iniciar') : ''}
                        >
                          {startingAttention ? <Loader2 size={16} className="spinner" /> : <CalendarClock size={16} />}
                          {startingAttention ? t('iniciando') : t('atencion_con_cita')}
                        </button>
                        <button
                          className="btn btn--secondary"
                          onClick={handleConsultaInstantanea}
                          disabled={startingAttention || !isDoctora}
                          title={!isDoctora ? t('solo_profesional_puede_iniciar') : ''}
                        >
                          <Zap size={16} /> {t('consulta_instantanea')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {atencionView === 'motivo' && (<div><div className="atencion-workspace__back"><button className="btn btn--ghost btn--sm" onClick={() => setAtencionView('entry')}><ArrowLeft size={14} /> {tco('back')}</button></div><AtencionForm paciente={paciente} motivoInicial={citaActiva?.motivo} onSave={handleSaveMotivo} onSchedule={handleScheduleFromMotivo} /></div>)}
              {atencionView === 'sesion' && (<div><div className="atencion-workspace__back"><button className="btn btn--ghost btn--sm" onClick={() => setAtencionView('entry')}><ArrowLeft size={14} /> {tco('back')}</button></div><SesionTratamientoView paciente={paciente} tratamientos={tratamientos} tratamientosBloqueados={tratamientosBloqueados} citasFuturas={citasFuturas} membresiaActiva={membresiaActiva} onNewSession={handleNewSession} onFinalize={handleFinalize} onSchedule={handleSchedule} onCreateTratamiento={handleCreateTratamiento} onPausar={handlePausarTratamiento} onReanudar={handleReanudarTratamiento} onCancelar={handleCancelarTratamiento} onAmpliar={handleAmpliarTratamiento} /></div>)}
            </div>
          )}

          {activeTab === 'resumen' && (
            <div className="atencion-workspace__resumen">
              <div className="atencion-workspace__section">
                <h3 className="atencion-workspace__section-title"><User size={16} /> {t('personal_data')}</h3>
                <div className="atencion-workspace__data-grid">
                  <div className="atencion-workspace__data-item"><span className="atencion-workspace__data-label">{t('nombre_completo')}</span><span className="atencion-workspace__data-value">{fullName}</span></div>
                  <div className="atencion-workspace__data-item"><span className="atencion-workspace__data-label">{t('birth_date')}</span><span className="atencion-workspace__data-value">{formatDate(paciente.fechaNacimiento)}</span></div>
                  <div className="atencion-workspace__data-item"><span className="atencion-workspace__data-label">{t('edad')}</span><span className="atencion-workspace__data-value">{edad ? `${edad} ${t('anos')}` : '-'}</span></div>
                  <div className="atencion-workspace__data-item"><span className="atencion-workspace__data-label">{t('gender')}</span><span className="atencion-workspace__data-value">{sexoLabel || '-'}</span></div>
                  <div className="atencion-workspace__data-item"><span className="atencion-workspace__data-label">{t('peso')}</span><span className="atencion-workspace__data-value">{paciente.peso ? `${pesoMostrar(paciente.peso)} ${pesoUnidad}` : '-'}</span></div>
                  <div className="atencion-workspace__data-item"><span className="atencion-workspace__data-label">{t('estatura')}</span><span className="atencion-workspace__data-value">{paciente.estatura ? `${tallaMostrar(paciente.estatura)} ${tallaUnidad}` : '-'}</span></div>
                  <div className="atencion-workspace__data-item"><span className="atencion-workspace__data-label">{tco('phone')}</span><span className="atencion-workspace__data-value">{paciente.telefono || '-'}</span></div>
                  <div className="atencion-workspace__data-item"><span className="atencion-workspace__data-label">{tco('email')}</span><span className="atencion-workspace__data-value">{paciente.email || '-'}</span></div>
                  <div className="atencion-workspace__data-item"><span className="atencion-workspace__data-label">{t('contacto_emergencia')}</span><span className="atencion-workspace__data-value">{paciente.contactoEmergencia || '-'}</span></div>
                </div>
              </div>
              {historia && (
                <div className="workspace-card">
                  <div className="resumen-tab__antecedentes-header">
                    <h3 className="resumen-tab__antecedentes-title"><FileText size={16} /> {t('medical_history_title')}</h3>
                    <div className="workspace-card__actions">
                      {savedAntecedentes && <span className="resumen-tab__saved">{t('guardado')}</span>}
                      {errorAntecedentes && <span className="resumen-tab__error">{errorAntecedentes}</span>}
                      {!editingAntecedentes ? (<button className="btn btn--ghost btn--sm" onClick={startEditAntecedentes}><Edit2 size={14} /> {tco('edit')}</button>) : (<>
                        <button className="btn btn--ghost btn--sm" onClick={cancelEditAntecedentes}><X size={14} /> {tco('cancel')}</button>
                        <button className="btn btn--primary btn--sm" onClick={saveAntecedentes} disabled={savingAntecedentes}>{savingAntecedentes ? <Loader2 size={14} className="spinner" /> : <Save size={14} />} {savingAntecedentes ? tco('saving') : tco('save')}</button>
                      </>)}
                    </div>
                  </div>
                  {editingAntecedentes ? (
                    <div className="resumen-tab__antecedentes-edit">
                      <AntecedentesEditor values={antecedentesValues} onChange={(key, val) => setAntecedentesValues(prev => ({ ...prev, [key]: val }))} compact />
                      <div className="resumen-tab__antecedentes-actions">
                        <button className="btn btn--ghost btn--sm" onClick={cancelEditAntecedentes}><X size={14} /> {tco('cancel')}</button>
                        <button className="btn btn--primary btn--sm" onClick={saveAntecedentes} disabled={savingAntecedentes}>{savingAntecedentes ? <Loader2 size={14} className="spinner" /> : <Save size={14} />} {savingAntecedentes ? tco('saving') : tco('save')}</button>
                      </div>
                    </div>
                  ) : getActiveAntecedentes(historia).length === 0 ? (
                    <p className="resumen-tab__empty">{t('sin_antecedentes_registrados')}</p>
                  ) : (
                    <div className="resumen-tab__antecedentes-list">
                      {getActiveAntecedentes(historia).map(({ key, label, value }) => (
                        <div key={key} className="resumen-tab__antecedente-card">
                          <AlertCircle size={14} className="resumen-tab__antecedente-icon" />
                          <div className="resumen-tab__antecedente-content">
                            <div className="resumen-tab__antecedente-row">
                              <span className="resumen-tab__antecedente-label">{t(label)}</span>
                              <span className={`resumen-tab__antecedente-badge ${value === 'Si' || value === 'Yes' ? 'resumen-tab__antecedente-badge--si' : 'resumen-tab__antecedente-badge--info'}`}>{value === 'Si' || value === 'Yes' ? tc('si') : t('si_presents')}</span>
                            </div>
                            {value !== 'Si' && value !== 'Yes' && <p className="resumen-tab__antecedente-detail">{value}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tratamientos' && <TabTratamientos pacienteId={id} historiaId={historia?.id} />}
          {activeTab === 'historia' && <TabClinico pacienteId={id} historiaId={historia?.id} />}
        </div>

        <div className="workspace__sidebar-right">
          {activeTab === 'resumen' && <ResumenSidebar pacienteId={id} onFirmarContrato={() => setShowFirmaContrato(true)} contratoFirmado={contratoFirmado} />}
          {activeTab !== 'resumen' && activeTab !== 'atencion' && <WorkspaceTimeline pacienteId={id} />}
        </div>
      </div>

      {showContratoWarning && contratoFirmado === false && (
        <div className="modal-overlay" onClick={() => setShowContratoWarning(false)}>
          <div className="modal" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <div className="modal__title"><AlertCircle size={20} style={{ color: '#F97316' }} /><span>{t('consentimiento_pendiente')}</span></div>
              <button className="modal__close" onClick={() => setShowContratoWarning(false)}><X size={18} /></button>
            </div>
            <div className="modal__body" style={{ textAlign: 'center' }}>
              <Shield size={48} style={{ color: '#F97316', marginBottom: 16 }} />
              <p style={{ fontSize: '1rem', fontWeight: 600, color: '#9A3412', marginBottom: 8 }}>{t('consentimiento_admision_pendiente')}</p>
              <p style={{ fontSize: '0.875rem', color: '#C2410C', marginBottom: 24, lineHeight: 1.5 }}>{t('workspace_warning_no_contract')}</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn btn--primary" onClick={() => { setShowContratoWarning(false); setShowFirmaContrato(true); }}><Shield size={16} /> {t('firmar_ahora')}</button>
                <button className="btn btn--ghost" onClick={() => setShowContratoWarning(false)}>{t('ahora_no')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CitaSchedulerModal isOpen={showScheduler} onClose={() => { setShowScheduler(false); setTratamientoParaReagendar(null); }} paciente={paciente} tratamientoId={tratamientoParaReagendar} tratamientosSinCita={tratamientosSinCita} initialMotivo={tratamientoParaReagendar ? getTreatmentLabel(tratamientos.find(t => t.id === tratamientoParaReagendar)?.tipoTratamiento) : ''} onCitaCreada={(cita) => { setCitaRecienCreada(cita?.id || null); setShowScheduler(false); setTratamientoParaReagendar(null); }} />
      {showNoShowModal && noShowCita && (
        <div className="onboarding-modal" onClick={(e) => { if (e.target === e.currentTarget) setShowNoShowModal(false); }}>
          <div className="onboarding-modal__box">
            <div className="onboarding-modal__icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
              <AlertCircle size={40} />
            </div>
            <h3 className="onboarding-modal__title">{t('cita_no_asistida')}</h3>
            <p className="onboarding-modal__subtitle">{t('no_show_delay_info')}</p>
            <div style={{ background: '#FEF2F2', color: '#DC2626', borderRadius: 8, padding: '8px 12px', fontSize: 13, margin: '12px 0 20px', textAlign: 'center' }}>
              {t('retraso_paciente')}: {formatMinutos(noShowCita)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                className="onboarding-modal__btn onboarding-modal__btn--save"
                onClick={() => { setShowNoShowModal(false); setShowScheduler(true); }}
              >
                <Calendar size={16} /> {t('reprogramar_cita')}
              </button>
              <button
                className="onboarding-modal__btn onboarding-modal__btn--skip"
                onClick={() => { setShowNoShowModal(false); navigate('/pacientes'); }}
              >
                {tco('back_to_clients')}
              </button>
            </div>
          </div>
        </div>
      )}
      <FirmaContratoModal open={showFirmaContrato} onClose={() => setShowFirmaContrato(false)} pacienteId={parseInt(id)} pacienteNombre={paciente ? `${paciente.nombres} ${paciente.apellidos}` : ''} onSigned={() => { setContratoFirmado(true); setShowFirmaContrato(false); setShowContratoWarning(false); }} />
      <ConfirmModal
        open={showCompleteConfirm}
        title={tco('confirmar')}
        message={t('confirmar_completar_cita')}
        variant="activate"
        onConfirm={handleCompleteCita}
        onCancel={() => setShowCompleteConfirm(false)}
      />
      {showScheduleAfterComplete && (
        <div className="onboarding-modal" onClick={() => setShowScheduleAfterComplete(false)}>
          <div className="onboarding-modal__box" onClick={e => e.stopPropagation()}>
            <CheckCircle size={48} style={{ color: '#22C55E', margin: '0 auto 16px' }} />
            <h3 className="onboarding-modal__title">{tc('cita_completada')}</h3>
            <p className="onboarding-modal__subtitle">{tc('desea_agendar_nueva')}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
              <button className="onboarding-modal__btn onboarding-modal__btn--save" onClick={handleScheduleAfterComplete}>
                <Calendar size={16} /> {tc('agendar_nueva_cita')}
              </button>
              <button className="onboarding-modal__btn onboarding-modal__btn--skip" onClick={handleFinishAfterComplete}>
                {tco('finalizar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  return formatLADate(dateStr);
}

// Calcula en minutos el retraso de una cita en no_show respecto a su hora de inicio.
function formatMinutos(cita) {
  if (!cita?.fecha || !cita?.hora) return '--';
  const inicio = parseLADateTime(`${cita.fecha}T${cita.hora}`);
  if (!inicio) return '--';
  const ahora = nowLA();
  const diffMin = Math.max(0, Math.floor((ahora - inicio) / 60000));
  return diffMin >= 60 ? `${Math.floor(diffMin / 60)}h ${diffMin % 60}m` : `${diffMin} min`;
}


