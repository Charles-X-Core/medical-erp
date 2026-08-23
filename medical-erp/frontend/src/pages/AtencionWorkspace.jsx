import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, User, FileText, Activity, ArrowLeft, Stethoscope, AlertCircle, Calendar, Edit2, Save, X, Play, Shield, CheckCircle } from 'lucide-react';
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
import ResumenSidebar from '../components/paciente360/ResumenSidebar';
import AtencionSidebar from '../components/paciente360/AtencionSidebar';
import WorkspaceTimeline from '../components/paciente360/WorkspaceTimeline';
import TabClinico from '../components/paciente360/TabClinico';
import TabTratamientos from '../components/paciente360/TabTratamientos';
import AtencionForm from '../components/atencion/AtencionForm';
import SesionTratamientoView from '../components/atencion/SesionTratamientoView';
import SmartTimerBar from '../components/atencion/SmartTimerBar';
import { useAtencionType } from '../hooks/useAtencionType';
import { getActiveAntecedentes } from '../components/ui/AntecedentesEditor';
import AntecedentesEditor from '../components/ui/AntecedentesEditor';

export default function AtencionWorkspace() {
  const { t } = useTranslation('patients');
  const { t: tc } = useTranslation('clinical');
  const { t: td } = useTranslation('dashboard');
  const { t: tco } = useTranslation('common');
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const primaryRole = getPrimaryRole(user);
  const isDoctora = primaryRole === 'doctora';
  const [activeTab, setActiveTab] = useState('resumen');
  const [atencionView, setAtencionView] = useState('entry');
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
  const [showScheduler, setShowScheduler] = useState(false);
  const [startingAttention, setStartingAttention] = useState(false);
  const [startError, setStartError] = useState('');
  const [contratoFirmado, setContratoFirmado] = useState(null);
  const [showFirmaContrato, setShowFirmaContrato] = useState(false);
  const [showContratoWarning, setShowContratoWarning] = useState(false);

  const WORKSPACE_TABS = [
    { id: 'resumen', label: t('tab_resumen'), icon: User },
    { id: 'atencion', label: t('workspace_attention'), icon: Activity },
    { id: 'tratamientos', label: t('workspace_treatments'), icon: Stethoscope },
    { id: 'historia', label: t('workspace_history'), icon: FileText },
  ];

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [pRes, hRes, tRes, cRes, cfRes, contratoRes] = await Promise.allSettled([
        pacienteService.getById(id),
        historiaClinicaService.getByPaciente(id),
        tratamientoService.listByPaciente(id),
        agendaService.getCitasHoy(),
        agendaService.getCitasPorPaciente(id),
        contratoPwaService.checkFirmado(id),
      ]);

      if (pRes.status === 'fulfilled' && pRes.value?.success) setPaciente(pRes.value.data);
      if (hRes.status === 'fulfilled' && hRes.value?.success) setHistoria(hRes.value.data);
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
          const hoyStr = new Date().toISOString().split('T')[0];
          const ahora = new Date();
          const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes();

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

          const bloqueados = new Set(
            pendientes.filter((c) => c.tratamientoId).map((c) => c.tratamientoId)
          );
          setTratamientosBloqueados(bloqueados);

          const futuras = todas.filter((c) =>
            (c.estado === 'pendiente' || c.estado === 'solicitada' || c.estado === 'confirmada') && esCitaFutura(c)
          );
          setCitasFuturas(futuras);
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
    (t) => t.estado === 'EN_CURSO' || t.estado === 'PROGRAMADO' || t.estado === 'PENDIENTE'
  );
  const hasActiveTreatment = activeTreatments.length > 0;

  const citaActiva = citasHoy.find(c => c.estado === 'en_atencion') || null;

  useEffect(() => {
    if (!citaActiva) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [citaActiva]);

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const siguienteCita = citasHoy.find(c => {
    if (c.estado === 'en_atencion') return false;
    if (!c.hora) return false;
    const [h, m] = c.hora.split(':').map(Number);
    return (h * 60 + m) > nowMin;
  }) || null;

  const handleSaveMotivo = async (formData) => {
    try {
      if (!historia?.id) {
        const hRes = await historiaClinicaService.create({ pacienteId: id });
        if (hRes.success) setHistoria(hRes.data);
      }
      await consultasService.create({
        historiaId: historia?.id,
        fecha: toLocalDateTime(),
        motivo: formData.motivo || t('atencion_directa'),
        tiempoEnfermedad: formData.tiempoEnfermedad || null,
        signosSintomas: formData.signosSintomas || null,
        examenClinicoGeneral: formData.examenClinico || null,
        diagnosticoLista: formData.diagnostico ? [{ descripcion: formData.diagnostico, principal: true }] : null,
        signosVitales: Object.keys(signosVitales).length > 0 ? signosVitales : null,
      });
      setAtencionView('sesion');
      await load();
    } catch (err) {
      console.error('Error saving motivo:', err);
    }
  };

  const handleScheduleFromMotivo = async () => { setAtencionView('sesion'); };

  const handleNewSession = async (tratamiento, mode, data) => {
    try {
      if (mode === 'new') {
        const res = await tratamientoService.create({
          pacienteId: id,
          historiaClinicaId: historia?.id,
          tipoTratamiento: data.tipoTratamiento,
          sesionesPlaneadas: data.sesionesPlaneadas,
          costoEstimado: data.costoSesion ? parseFloat(data.costoSesion) : null,
          objetivo: t('tratamiento_indicado'),
        });
        if (res?.success) {
          const nuevoId = res.data.id;
          await tratamientoService.programar(nuevoId);
          await tratamientoService.iniciar(nuevoId);
          await tratamientoService.createSession(nuevoId, {
            tipoSesionId: 1, fecha: toLocalDateTime(),
            evolucion: data.evolucion || null, observaciones: data.observaciones || null,
            signosVitales: Object.keys(signosVitales).length > 0 ? signosVitales : null,
            costoSesion: data.costoSesion ? parseFloat(data.costoSesion) : null,
          });
        }
      } else {
        const tipoSesionId = mode === 'last' ? 5 : mode === 'first-session' ? 1 : 3;
        await tratamientoService.createSession(tratamiento.id, {
          tipoSesionId, fecha: toLocalDateTime(),
          evolucion: data.evolucion || null, observaciones: data.observaciones || null,
          signosVitales: Object.keys(signosVitales).length > 0 ? signosVitales : null,
          costoSesion: data.costoSesion ? parseFloat(data.costoSesion) : null,
        });
      }
      if (data.postAction === 'finalize') {
        await tratamientoService.finalizar(tratamiento?.id, t('tratamiento_indicado'));
        setAtencionView('entry');
        await load();
      } else if (data.postAction !== 'schedule') {
        await load();
      }
    } catch (err) {
      console.error('Error saving session:', err);
    }
  };

  const handleFinalize = async (tratamiento, data) => {
    try {
      await tratamientoService.finalizar(tratamiento.id, data.resultadoFinal || t('tratamiento_indicado'));
      navigate('/inicio');
    } catch (err) { console.error('Error finalizing:', err); }
  };

  const handleSchedule = async () => {
    try { setAtencionView('entry'); await load(); }
    catch (err) { console.error('Error scheduling:', err); setAtencionView('entry'); await load(); }
  };

  const handleCreateTratamiento = async (formData) => {
    try {
      const createRes = await tratamientoService.create({
        pacienteId: parseInt(id), tipoTratamiento: formData.tipoTratamiento,
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

  const saveAntecedentes = async () => {
    if (!historia?.id) return;
    setSavingAntecedentes(true); setErrorAntecedentes('');
    try {
      const result = await historiaClinicaService.updateAntecedentes(historia.id, antecedentesValues);
      if (!result.success) throw new Error(result.message || tco('error_saving'));
      const refreshed = await historiaClinicaService.getByPaciente(id);
      if (refreshed.success) setHistoria(refreshed.data);
      setSavedAntecedentes(true); setEditingAntecedentes(false);
      setTimeout(() => setSavedAntecedentes(false), 2000);
    } catch (err) { setErrorAntecedentes(err.message); }
    finally { setSavingAntecedentes(false); }
  };

  const handleContinueTreatment = () => { setAtencionView('sesion'); };
  const handleNewConsulta = () => { handleStartWithoutCita(); };

  const handleStartWithoutCita = async () => {
    if (contratoFirmado === false) { setShowFirmaContrato(true); setStartingAttention(false); return; }
    setStartingAttention(true); setStartError('');
    try {
      const existingCita = citasHoy.find(c =>
        c.estado === 'pendiente' || c.estado === 'confirmada' || c.estado === 'asistio' || c.estado === 'llegada' || c.estado === 'programada'
      );
      if (existingCita) {
        await agendaService.iniciarAtencion(existingCita.id);
        await load(); setAtencionView('motivo'); return;
      }
      const now = new Date();
      const fecha = now.toISOString().split('T')[0];
      const hora = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const dispRes = await agendaService.getDisponibilidad(fecha, user?.id, 30);
      if (!dispRes.success || !Array.isArray(dispRes.data) || !dispRes.data.length) {
        setStartError(t('no_agenda_configurada')); setStartingAttention(false); return;
      }
      const slots = dispRes.data;
      const [ch, cm] = hora.split(':').map(Number);
      const currentMin = ch * 60 + cm;
      const matchingSlot = slots.find(slot => {
        if (!slot.inicio || !slot.fin) return false;
        const [ih, im] = slot.inicio.split(':').map(Number);
        const [fh, fm] = slot.fin.split(':').map(Number);
        return currentMin >= (ih * 60 + im) && currentMin < (fh * 60 + fm);
      });
      if (!matchingSlot) { setStartError(t('horario_fuera_disponibilidad', { hora })); setStartingAttention(false); return; }
      const slotEstado = matchingSlot.estado;
      if (slotEstado === 'OCUPADO') { setStartError(t('horario_ocupado', { descripcion: matchingSlot.descripcion || t('profesional_ya_cita') })); setStartingAttention(false); return; }
      if (slotEstado === 'BLOQUEADO') { setStartError(t('horario_bloqueado', { descripcion: matchingSlot.descripcion || t('no_disponible') })); setStartingAttention(false); return; }
      if (slotEstado === 'EN_BUFFER') { setStartError(t('horario_preparacion', { descripcion: matchingSlot.descripcion || t('aun_no_disponible') })); setStartingAttention(false); return; }
      if (slotEstado === 'INSUFICIENTE') { setStartError(t('tiempo_insuficiente')); setStartingAttention(false); return; }
      const citaRes = await agendaService.crearCita({ pacienteId: parseInt(id), usuarioId: user?.id, fecha, hora, duracionMinutos: 30, motivo: t('atencion_directa') });
      if (!citaRes.success) throw new Error(citaRes.message || t('error_crear_cita'));
      const citaId = citaRes.data?.id;
      if (citaId) { await agendaService.iniciarAtencion(citaId); }
      await load(); setAtencionView('motivo');
    } catch (err) { setStartError(err.message || t('error_iniciar_atencion')); }
    finally { setStartingAttention(false); }
  };

  if (loading) return (<div className="workspace workspace--compact"><div className="workspace__loading"><Loader2 size={32} className="spinner" /><p>{t('loading_workspace')}</p></div></div>);
  if (!paciente) return (<div className="workspace workspace--compact"><div className="workspace__error">{error || t('no_found')}</div></div>);

  const fullName = `${paciente.apellidoPaterno || ''} ${paciente.apellidoMaterno || ''}, ${paciente.nombres || ''}`.trim();
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
          <button className="btn btn--ghost btn--sm" onClick={() => { if (citaActiva && !window.confirm(t('confirmar_salida_sesion'))) return; navigate('/pacientes'); }}>
            <ArrowLeft size={16} /> {tco('back')}
          </button>
          <button className="btn btn--secondary btn--sm" onClick={() => { if (citaActiva && !window.confirm(t('confirmar_salida_sesion'))) return; navigate('/pacientes'); }}>
            <ArrowLeft size={16} /> {t('back_to_clients')}
          </button>
        </div>
      </div>

      {citaActiva && <SmartTimerBar citaActiva={citaActiva} siguienteCita={siguienteCita} />}

      <div className="workspace__tabs-bar">
        {WORKSPACE_TABS.map((tab) => {
          const Icon = tab.icon;
          return (<button key={tab.id} className={`workspace__tab ${activeTab === tab.id ? 'workspace__tab--active' : ''}`} onClick={() => setActiveTab(tab.id)}><Icon size={16} /><span>{tab.label}</span></button>);
        })}
      </div>

      <div className="workspace__body workspace__body--2col">
        <div className="workspace__content workspace__content--full">
          {activeTab === 'atencion' && (
            <div className="atencion-workspace">
              {atencionView === 'entry' && (
                <div className="atencion-workspace__entry">
                  {hasActiveTreatment ? (
                    <>{(() => {
                      const mainTreatment = activeTreatments[0];
                      const isBlocked = mainTreatment && tratamientosBloqueados.has(mainTreatment.id);
                      const pendingCita = isBlocked ? citasPendientes.find((c) => c.tratamientoId === mainTreatment.id) : null;
                      const confirmedCitas = citasFuturas.filter((c) => c.tratamientoId === mainTreatment?.id && c.estado === 'confirmada');
                      return (
                        <div className={`atencion-workspace__entry-card atencion-workspace__entry-card--info ${isBlocked ? 'atencion-workspace__entry-card--blocked' : ''}`}>
                          <Stethoscope size={24} />
                          <h3>{isBlocked ? t('pendiente_confirmacion') : t('tiene_tratamiento_activo')}</h3>
                          <p>{activeTreatments.length === 1 ? `${activeTreatments[0].tipoSesionTratamiento?.nombre || activeTreatments[0].tipoTratamiento || t('tratamiento')} ${t('sesion')} ${(activeTreatments[0].sesionesRealizadas || 0) + 1} ${t('sesion_de')} ${activeTreatments[0].sesionesPlaneadas || '?'}` : `${activeTreatments.length} ${t('tratamientos')}`}</p>
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
                          <div className="atencion-workspace__entry-actions">
                            {isBlocked ? (<>
                              <div className="atencion-workspace__entry-info atencion-workspace__entry-info--pending"><Calendar size={14} /><span>{t('cita_pendiente_confirmacion')}</span>{pendingCita?.fecha && <span className="atencion-workspace__entry-hint">{t('fecha_sugerida')} {formatDate(pendingCita.fecha)}</span>}</div>
                              <button className="btn btn--primary" disabled><Activity size={16} /> {t('continuar_tratamiento')}</button>
                              <span className="atencion-workspace__entry-hint">{t('confirmar_fecha')}</span>
                            </>) : (<>
                              {confirmedCitas.length > 0 && <div className="atencion-workspace__entry-info"><Calendar size={14} /><span>{t('proxima_sesion')} {formatDate(confirmedCitas[0].fecha)}</span></div>}
                              <button className="btn btn--primary" onClick={handleContinueTreatment}><Activity size={16} /> {t('continuar_tratamiento')}</button>
                              <button className="btn btn--secondary" onClick={handleNewConsulta}><FileText size={16} /> {tc('nueva_consulta')}</button>
                            </>)}
                            {startError && <div className="atencion-workspace__entry-error"><AlertCircle size={14} /> {startError}</div>}
                            <button className="btn btn--secondary" onClick={handleStartWithoutCita} disabled={startingAttention || !isDoctora} title={!isDoctora ? t('solo_profesional_puede_iniciar') : ''}>
                              {startingAttention ? <Loader2 size={16} className="spinner" /> : <Play size={16} />} {startingAttention ? t('iniciando') : t('iniciar_atencion')}
                            </button>
                            <button className="btn btn--secondary" onClick={() => setShowScheduler(true)}><Calendar size={16} /> {t('agendar_cita')}</button>
                          </div>
                        </div>
                      );
                    })()}</>
                  ) : (
                    <div className="atencion-workspace__entry-card atencion-workspace__entry-card--new">
                      <FileText size={24} />
                      <h3>{tc('nueva_consulta')}</h3>
                      <p>{t('no_tiene_tratamientos_activos')}</p>
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
                      {startError && <div className="atencion-workspace__entry-error"><AlertCircle size={14} /> {startError}</div>}
                      <div className="atencion-workspace__entry-actions">
                        <button className="btn btn--primary" onClick={handleStartWithoutCita} disabled={startingAttention || !isDoctora} title={!isDoctora ? t('solo_profesional_puede_iniciar') : ''}>
                          {startingAttention ? <Loader2 size={16} className="spinner" /> : <Play size={16} />} {startingAttention ? t('iniciando') : t('iniciar_atencion')}
                        </button>
                        <button className="btn btn--secondary" onClick={() => setShowScheduler(true)}><Calendar size={16} /> {t('agendar_cita')}</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {atencionView === 'motivo' && (<div><div className="atencion-workspace__back"><button className="btn btn--ghost btn--sm" onClick={() => setAtencionView('entry')}><ArrowLeft size={14} /> {tco('back')}</button></div><AtencionForm paciente={paciente} onSave={handleSaveMotivo} onSchedule={handleScheduleFromMotivo} /></div>)}
              {atencionView === 'sesion' && (<div><div className="atencion-workspace__back"><button className="btn btn--ghost btn--sm" onClick={() => setAtencionView('entry')}><ArrowLeft size={14} /> {tco('back')}</button></div><SesionTratamientoView paciente={paciente} tratamientos={tratamientos} tratamientosBloqueados={tratamientosBloqueados} onNewSession={handleNewSession} onFinalize={handleFinalize} onSchedule={handleSchedule} onCreateTratamiento={handleCreateTratamiento} onPausar={handlePausarTratamiento} onReanudar={handleReanudarTratamiento} onCancelar={handleCancelarTratamiento} onAmpliar={handleAmpliarTratamiento} /></div>)}
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
                  <div className="atencion-workspace__data-item"><span className="atencion-workspace__data-label">{t('peso')}</span><span className="atencion-workspace__data-value">{paciente.peso ? `${paciente.peso} kg` : '-'}</span></div>
                  <div className="atencion-workspace__data-item"><span className="atencion-workspace__data-label">{t('estatura')}</span><span className="atencion-workspace__data-value">{paciente.estatura ? `${paciente.estatura} cm` : '-'}</span></div>
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
          {activeTab === 'atencion' && <AtencionSidebar paciente={paciente} historia={historia} signosVitales={signosVitales} onSignosVitalesChange={setSignosVitales} onPacienteUpdated={(u) => setPaciente(u)} pacienteId={id} />}
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

      <CitaSchedulerModal isOpen={showScheduler} onClose={() => setShowScheduler(false)} paciente={paciente} />
      <FirmaContratoModal open={showFirmaContrato} onClose={() => setShowFirmaContrato(false)} pacienteId={parseInt(id)} pacienteNombre={paciente ? `${paciente.nombres} ${paciente.apellidos}` : ''} onSigned={() => { setContratoFirmado(true); setShowFirmaContrato(false); setShowContratoWarning(false); }} />
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
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function toLocalDateTime() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}
