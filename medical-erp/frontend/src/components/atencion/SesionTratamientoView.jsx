import { useState } from 'react';
import { Stethoscope, CheckCircle, AlertCircle, Loader2, Plus, ArrowLeft, Clock, Pill } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SessionForm from './SessionForm';
import CitaSchedulerModal from '../agenda/CitaSchedulerModal';
import RecetarioModal from './RecetarioModal';
import agendaService from '../../services/agendaService';
import { formatLADate } from '../../utils/laTimezone';
import { horaMostrar } from '../../utils/zonaHoraria';
import { TREATMENT_CATEGORIES, getTreatmentLabel } from '../../config/attentionTypes';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return formatLADate(dateStr);
}

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

// ============================================
// SesionTratamientoView — Treatment Workboard
// Vertical layout: treatments list → session form
// Doctora-centric: she fills everything
// ============================================

export default function SesionTratamientoView({
  paciente,
  tratamientos,
  tratamientosBloqueados = new Set(),
  citasFuturas = [],
  membresiaActiva,
  onNewSession,
  onFinalize,
  onSchedule,
  onCreateTratamiento,
  onPausar,
  onReanudar,
  onCancelar,
  onAmpliar,
  onBack,
}) {
  const { t } = useTranslation('patients');
  const { t: tClinical } = useTranslation('clinical');
  const { t: tCommon } = useTranslation('common');
  const { t: tDashboard } = useTranslation('dashboard');
  const { t: tConf } = useTranslation('clinical');

  const [selectedTratamiento, setSelectedTratamiento] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showPostSchedule, setShowPostSchedule] = useState(false);
  const [citaCreada, setCitaCreada] = useState(null);
  const [sesionParaAgendar, setSesionParaAgendar] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Treatment creation form state
  const [formTipo, setFormTipo] = useState('');
  const [formSesiones, setFormSesiones] = useState(1);
  const [formCosto, setFormCosto] = useState('');
  const [formObjetivo, setFormObjetivo] = useState('');
  const [formRequiereMedicacion, setFormRequiereMedicacion] = useState(false);
  const [showRecetario, setShowRecetario] = useState(false);

  const activeTreatments = tratamientos.filter(
    (t) => t.estado === 'EN_CURSO' || t.estado === 'PROGRAMADO' || t.estado === 'PENDIENTE'
  );
  const finishedTreatments = tratamientos.filter(
    (t) => t.estado === 'FINALIZADO'
  );

  // Determine which treatment to work on
  const workingTratamiento = selectedTratamiento ||
    (activeTreatments.length === 1 && !creatingNew ? activeTreatments[0] : null);

  // Check if the working treatment is blocked
  const isWorkingBlocked = workingTratamiento && tratamientosBloqueados.has(workingTratamiento.id);

  // Cita futura vinculada al tratamiento en edición (para mostrar programación del bloque).
  const citaTratamiento = workingTratamiento
    ? citasFuturas.find((c) => c.tratamientoId === workingTratamiento.id)
    : null;

  // Determine session mode
  const getSessionMode = () => {
    if (!workingTratamiento) return 'new';
    const realizado = workingTratamiento?.sesionesRealizadas || 0;
    const planeado = workingTratamiento?.sesionesPlaneadas || 0;
    if (realizado >= planeado && planeado > 0) return 'completed';
    if (realizado === 0 && workingTratamiento?.id) return 'first-session';
    if (realizado >= planeado - 1) return 'last';
    return 'continuing';
  };

  const sessionMode = workingTratamiento ? getSessionMode() : 'new';

  const getEstadoLabel = (estado) => {
    switch (estado) {
      case 'EN_CURSO': return tDashboard('panel_status_en_curso');
      case 'PROGRAMADO': return tDashboard('panel_status_programado');
      case 'FINALIZADO': return tDashboard('panel_status_finalizado');
      case 'PAUSADO': return tDashboard('panel_status_pausado');
      case 'PENDIENTE': return tDashboard('panel_status_pendiente');
      case 'CANCELADO': return tDashboard('panel_status_cancelado');
      default: return estado;
    }
  };

  const handleStartCreate = () => {
    setCreatingNew(true);
    setSelectedTratamiento(null);
    setFormTipo('');
    setFormSesiones(1);
    setFormCosto('');
    setFormObjetivo('');
    setError('');
  };

  const handleCancelCreate = () => {
    setCreatingNew(false);
    setFormTipo('');
  };

  const handleSubmitCreate = async () => {
    if (!formTipo || !formSesiones) return;
    setSaving(true);
    setError('');
    try {
      await onCreateTratamiento?.({
        tipoTratamiento: formTipo,
        sesionesPlaneadas: parseInt(formSesiones) || 1,
        costoEstimado: null,
        objetivo: formObjetivo || t('tratamiento_indicado_por_consulta'),
        requiereMedicacion: formRequiereMedicacion,
      });
      setCreatingNew(false);
    } catch (err) {
      setError(err.message || t('error_crear_tratamiento'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSession = async (data) => {
    setSaving(true);
    try {
      const nuevoSesionId = await onNewSession?.(workingTratamiento, sessionMode, data);
      if (sessionMode === 'new') setCreatingNew(false);
      // Si post-action es schedule, guardar la sesión creada para vincularla a la cita.
      if (data.postAction === 'schedule') {
        setSesionParaAgendar(nuevoSesionId || null);
        setShowSchedule(true);
      }
    } catch (err) {
      console.error('Error saving session:', err);
      setError(err.message || t('error_guardar_sesion'));
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async (data) => {
    setSaving(true);
    try {
      await onFinalize?.(workingTratamiento, data);
    } finally {
      setSaving(false);
    }
  };

  const handleSchedule = async (scheduleData) => {
    await onSchedule?.(workingTratamiento, scheduleData);
  };

  return (
    <div className="sesion-tratamiento">
      {/* Treatment list */}
      <div className="sesion-tratamiento__list">
        <h3 className="sesion-tratamiento__list-title">
          <Stethoscope size={16} /> {t('tratamientos_de', { name: paciente?.nombres })}
        </h3>

        {activeTreatments.length === 0 && finishedTreatments.length === 0 ? (
          <div className="sesion-tratamiento__empty">
            <AlertCircle size={20} />
            <p>{t('sin_tratamientos_registrados')}</p>
            <span>{t('seleccione_nuevo_para_comenzar')}</span>
          </div>
        ) : (
          <>
            {/* Active treatments */}
            {activeTreatments.map((treat) => {
              const sesiones = treat.sesionesRealizadas || 0;
              const total = treat.sesionesPlaneadas || 0;
              const progreso = total > 0 ? sesiones / total : 0;
              const isSelected = workingTratamiento?.id === treat.id && !creatingNew;
              const isBlocked = tratamientosBloqueados.has(treat.id);

              return (
                <div
                  key={treat.id}
                  className={[
                    'sesion-tratamiento__item',
                    isSelected ? 'sesion-tratamiento__item--selected' : '',
                    isBlocked ? 'sesion-tratamiento__item--blocked' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => {
                    if (isBlocked) return;
                    setSelectedTratamiento(treat);
                    setCreatingNew(false);
                  }}
                >
                  <div className="sesion-tratamiento__item-header">
                    <span className="sesion-tratamiento__item-name">
                      {getTreatmentLabel(treat.tipoTratamiento)}
                    </span>
                    <div className="sesion-tratamiento__item-badges">
                      {isBlocked && (
                        <span className="tratamiento-badge tratamiento-badge--pendiente">
                          <Clock size={12} /> {t('pendiente_confirmacion')}
                        </span>
                      )}
                      <span className={`tratamiento-badge ${getEstadoClass(treat.estado)}`}>
                        {getEstadoLabel(treat.estado)}
                      </span>
                    </div>
                  </div>
                  <div className="sesion-tratamiento__item-progress">
                    <div className="sesion-tratamiento__progress-bar">
                      <div
                        className="sesion-tratamiento__progress-fill"
                        style={{ width: `${progreso * 100}%` }}
                      />
                    </div>
                    <span className="sesion-tratamiento__progress-text">
                      {sesiones}/{total} {t('sesiones_label')}
                    </span>
                  </div>
                  {treat.fechaInicio && (
                    <span className="sesion-tratamiento__item-date">
                      {t('inicio')}: {formatDate(treat.fechaInicio)}
                    </span>
                  )}
                  {isBlocked && (
                    <span className="sesion-tratamiento__item-blocked-hint">
                      {t('cita_siendo_coordinada')}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Finished treatments */}
            {finishedTreatments.length > 0 && (
              <div className="sesion-tratamiento__finished">
                <span className="sesion-tratamiento__finished-label">{t('finalizados')}</span>
                {finishedTreatments.map((treat) => (
                  <div key={treat.id} className="sesion-tratamiento__item sesion-tratamiento__item--finished">
                    <div className="sesion-tratamiento__item-header">
                      <span className="sesion-tratamiento__item-name">
                        {getTreatmentLabel(treat.tipoTratamiento)}
                      </span>
                      <span className={`tratamiento-badge ${getEstadoClass(treat.estado)}`}>
                        {getEstadoLabel(treat.estado)}
                      </span>
                    </div>
                    {treat.fechaFin && (
                      <span className="sesion-tratamiento__item-date">
                        {t('finalizado')}: {formatDate(treat.fechaFin)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* New treatment button */}
        <button
          className="btn btn--primary sesion-tratamiento__new-btn"
          onClick={handleStartCreate}
        >
          <Plus size={16} /> {t('nuevo_tratamiento')}
        </button>
      </div>

      {/* Form area */}
      <div className="sesion-tratamiento__form">
        {/* === CREATE MODE === */}
        {creatingNew ? (
          <div className="session-form">
            <div className="session-form__section session-form__section--create">
              <h4 className="session-form__section-title">
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={handleCancelCreate}
                  style={{ marginRight: '4px' }}
                >
                  <ArrowLeft size={14} />
                </button>
                {t('nuevo_tratamiento')}
              </h4>
            </div>
            <SessionForm
              mode="new"
              tratamiento={null}
              paciente={paciente}
              onSave={handleSaveSession}
              onFinalize={handleFinalize}
              onPausar={onPausar}
              onReanudar={onReanudar}
              onCancelar={onCancelar}
              onAmpliar={onAmpliar}
              membresiaActiva={membresiaActiva}
            />
          </div>
          ) : workingTratamiento ? (
            isWorkingBlocked ? (
              <div className="sesion-tratamiento__form-blocked">
                <Clock size={32} />
                <h3>{t('esperando_confirmacion_fecha')}</h3>
                <p>{t('fecha_coordinada_cliente')}</p>
                {citaTratamiento && (
                  <span className="sesion-tratamiento__form-blocked-cita">
                    {t('programada_para', { fecha: formatDate(citaTratamiento.fecha), hora: horaMostrar(citaTratamiento.hora, citaTratamiento.fecha)?.substring(0, 5) || '--:--' })}
                  </span>
                )}
                <span className="sesion-tratamiento__form-blocked-hint">
                  {t('confirmada_fecha_continuar')}
                </span>
              </div>
            ) : (
              <>
                <div className="sesion-tratamiento__form-header">
                  <h3>
                    {sessionMode === 'new' && t('nuevo_tratamiento')}
                    {sessionMode === 'first-session' && t('sesion_de', { number: 1, total: workingTratamiento.sesionesPlaneadas || '?' })}
                    {sessionMode === 'continuing' && t('sesion_de', { number: (workingTratamiento.sesionesRealizadas || 0) + 1, total: workingTratamiento.sesionesPlaneadas || '?' })}
                    {sessionMode === 'last' && t('ultima_sesion_de', { current: workingTratamiento.sesionesRealizadas || 0, total: workingTratamiento.sesionesPlaneadas || '?' })}
                    {sessionMode === 'completed' && t('tratamiento_completado')}
                  </h3>
                  <span className="sesion-tratamiento__form-subtitle">
                    {getTreatmentLabel(workingTratamiento.tipoTratamiento) || t('tratamiento')}
                  </span>
                </div>
                <SessionForm
                  mode={sessionMode}
                  tratamiento={workingTratamiento}
                  paciente={paciente}
                  onSave={handleSaveSession}
                  onFinalize={handleFinalize}
                  onPausar={onPausar}
                  onReanudar={onReanudar}
                  onCancelar={onCancelar}
                  onAmpliar={onAmpliar}
                  membresiaActiva={membresiaActiva}
                />
                {workingTratamiento?.requiereMedicacion && sessionMode !== 'new' && (
                  <button className="btn btn--secondary sesion-tratamiento__receta-btn" onClick={() => setShowRecetario(true)}>
                    <Pill size={16} /> {t('abrir_recetario')}
                  </button>
                )}
              </>
            )
          ) : (
          <div className="sesion-tratamiento__form-placeholder">
            <Stethoscope size={32} />
            <p>{t('seleccione_o_cree')}</p>
          </div>
        )}
      </div>

      {/* Schedule modal */}
      <CitaSchedulerModal
        isOpen={showSchedule}
        onClose={() => setShowSchedule(false)}
        paciente={paciente}
        tratamientoId={workingTratamiento?.id}
        sesionId={sesionParaAgendar}
        initialMotivo={workingTratamiento ? getTreatmentLabel(workingTratamiento.tipoTratamiento) : ''}
        onCitaCreada={(cita) => {
          setShowSchedule(false);
          setCitaCreada(cita || null);
          setShowPostSchedule(false);
          if (workingTratamiento?.sesionesRealizadas >= (workingTratamiento?.sesionesPlaneadas || 0)) {
            // Última sesión → no preguntar más tiempo, solo avisar
            onSchedule?.(workingTratamiento, {});
          } else {
            setShowPostSchedule(true);
          }
        }}
      />

      {/* Modal post-agendamiento: ¿+5 min o finalizar? */}
      {showPostSchedule && (
        <div className="onboarding-modal" onClick={(e) => { if (e.target === e.currentTarget) setShowPostSchedule(false); }}>
          <div className="onboarding-modal__box">
            <h3 className="onboarding-modal__title">{tClinical('sesion_guardada_agendada')}</h3>
            <p className="onboarding-modal__subtitle">{tConf('pregunta_extender_o_finalizar')}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
              <button
                className="onboarding-modal__btn onboarding-modal__btn--save"
                onClick={async () => {
                  setShowPostSchedule(false);
                  if (citaCreada?.id) {
                    try { await agendaService.extenderSesion(citaCreada.id, 5); } catch (e) { /* sin bloqueo */ }
                  }
                  onSchedule?.(workingTratamiento, { extender: 5 });
                }}
              >
                + {tConf('extender_5_min')}
              </button>
              <button
                className="onboarding-modal__btn onboarding-modal__btn--save"
                onClick={async () => {
                  setShowPostSchedule(false);
                  await onFinalize?.(workingTratamiento, { resultadoFinal: null });
                }}
              >
                {tConf('finalizar_sesion')}
              </button>
              <button
                className="onboarding-modal__btn onboarding-modal__btn--skip"
                onClick={() => { setShowPostSchedule(false); onSchedule?.(workingTratamiento, {}); }}
              >
                {tCommon('continue')}
              </button>
            </div>
          </div>
        </div>
      )}
      {showRecetario && (
        <RecetarioModal
          open={showRecetario}
          onClose={() => setShowRecetario(false)}
          paciente={paciente}
          tratamientoId={workingTratamiento?.id}
          sesionId={null}
          clinicaId={workingTratamiento?.clinicaId || 1}
          onSaved={() => setShowRecetario(false)}
        />
      )}
    </div>
  );
}
