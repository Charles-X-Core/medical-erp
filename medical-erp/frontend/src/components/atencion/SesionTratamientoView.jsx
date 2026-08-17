import { useState } from 'react';
import { Stethoscope, CheckCircle, AlertCircle, Loader2, Plus, ArrowLeft, Clock } from 'lucide-react';
import SessionForm from './SessionForm';
import ScheduleModal from './ScheduleModal';
import { TREATMENT_CATEGORIES, getTreatmentLabel } from '../../config/attentionTypes';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
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

function getEstadoLabel(estado) {
  switch (estado) {
    case 'EN_CURSO': return 'Activo';
    case 'PROGRAMADO': return 'Programado';
    case 'FINALIZADO': return 'Finalizado';
    case 'PAUSADO': return 'Pausado';
    case 'PENDIENTE': return 'Pendiente';
    case 'CANCELADO': return 'Cancelado';
    default: return estado;
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
  const [selectedTratamiento, setSelectedTratamiento] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Treatment creation form state
  const [formTipo, setFormTipo] = useState('');
  const [formSesiones, setFormSesiones] = useState(1);
  const [formCosto, setFormCosto] = useState('');
  const [formObjetivo, setFormObjetivo] = useState('');

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
        sesionesPlaneadas: formSesiones,
        costoEstimado: formCosto || null,
        objetivo: formObjetivo || 'Tratamiento indicado por consulta',
      });
      setCreatingNew(false);
    } catch (err) {
      setError(err.message || 'Error al crear tratamiento');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSession = async (data) => {
    setSaving(true);
    try {
      await onNewSession?.(workingTratamiento, sessionMode, data);
      // If post-action is schedule, open the schedule modal after save
      if (data.postAction === 'schedule') {
        setShowSchedule(true);
      }
    } catch (err) {
      console.error('Error saving session:', err);
      setError(err.message || 'Error al guardar la sesión');
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
          <Stethoscope size={16} /> Tratamientos de {paciente?.nombres}
        </h3>

        {activeTreatments.length === 0 && finishedTreatments.length === 0 ? (
          <div className="sesion-tratamiento__empty">
            <AlertCircle size={20} />
            <p>Sin tratamientos registrados</p>
            <span>Seleccione "Nuevo Tratamiento" para comenzar</span>
          </div>
        ) : (
          <>
            {/* Active treatments */}
            {activeTreatments.map((t) => {
              const sesiones = t.sesionesRealizadas || 0;
              const total = t.sesionesPlaneadas || 0;
              const progreso = total > 0 ? sesiones / total : 0;
              const isSelected = workingTratamiento?.id === t.id && !creatingNew;
              const isBlocked = tratamientosBloqueados.has(t.id);

              return (
                <div
                  key={t.id}
                  className={[
                    'sesion-tratamiento__item',
                    isSelected ? 'sesion-tratamiento__item--selected' : '',
                    isBlocked ? 'sesion-tratamiento__item--blocked' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => {
                    if (isBlocked) return;
                    setSelectedTratamiento(t);
                    setCreatingNew(false);
                  }}
                >
                  <div className="sesion-tratamiento__item-header">
                    <span className="sesion-tratamiento__item-name">
                      {getTreatmentLabel(t.tipoTratamiento)}
                    </span>
                    <div className="sesion-tratamiento__item-badges">
                      {isBlocked && (
                        <span className="tratamiento-badge tratamiento-badge--pendiente">
                          <Clock size={12} /> Pendiente confirmación
                        </span>
                      )}
                      <span className={`tratamiento-badge ${getEstadoClass(t.estado)}`}>
                        {getEstadoLabel(t.estado)}
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
                      {sesiones}/{total} sesiones
                    </span>
                  </div>
                  {t.fechaInicio && (
                    <span className="sesion-tratamiento__item-date">
                      Inicio: {formatDate(t.fechaInicio)}
                    </span>
                  )}
                  {isBlocked && (
                    <span className="sesion-tratamiento__item-blocked-hint">
                      La enfermera está confirmando la fecha de la próxima sesión
                    </span>
                  )}
                </div>
              );
            })}

            {/* Finished treatments */}
            {finishedTreatments.length > 0 && (
              <div className="sesion-tratamiento__finished">
                <span className="sesion-tratamiento__finished-label">Finalizados</span>
                {finishedTreatments.map((t) => (
                  <div key={t.id} className="sesion-tratamiento__item sesion-tratamiento__item--finished">
                    <div className="sesion-tratamiento__item-header">
                      <span className="sesion-tratamiento__item-name">
                        {getTreatmentLabel(t.tipoTratamiento)}
                      </span>
                      <span className={`tratamiento-badge ${getEstadoClass(t.estado)}`}>
                        {getEstadoLabel(t.estado)}
                      </span>
                    </div>
                    {t.fechaFin && (
                      <span className="sesion-tratamiento__item-date">
                        Finalizado: {formatDate(t.fechaFin)}
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
          <Plus size={16} /> Nuevo Tratamiento
        </button>
      </div>

      {/* Form area */}
      <div className="sesion-tratamiento__form">
        {/* === CREATE MODE === */}
        {creatingNew ? (
          <div className="session-form">
            <div className="session-form__section">
              <h4 className="session-form__section-title">
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={handleCancelCreate}
                  style={{ marginRight: '4px' }}
                >
                  <ArrowLeft size={14} />
                </button>
                Nuevo Tratamiento
              </h4>
              <div className="session-form__fields">
                <div className="session-form__field">
                  <label className="session-form__label">Tipo de tratamiento *</label>
                  <select
                    className="session-form__select"
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value)}
                  >
                    <option value="">Seleccionar tratamiento...</option>
                    {TREATMENT_CATEGORIES.map((cat) => (
                      <optgroup key={cat.id} label={cat.label}>
                        {cat.treatments.map((t) => (
                          <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="session-form__field">
                  <label className="session-form__label">Sesiones *</label>
                  <input
                    type="number"
                    className="session-form__input"
                    placeholder="Ej: 4"
                    min="1"
                    value={formSesiones}
                    onChange={(e) => setFormSesiones(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="session-form__field">
                  <label className="session-form__label">Costo por sesión</label>
                  <input
                    type="number"
                    className="session-form__input"
                    placeholder="S/ 0.00"
                    step="0.01"
                    value={formCosto}
                    onChange={(e) => setFormCosto(e.target.value)}
                  />
                </div>
                <div className="session-form__field">
                  <label className="session-form__label">Objetivo</label>
                  <input
                    type="text"
                    className="session-form__input"
                    placeholder="Objetivo del tratamiento"
                    value={formObjetivo}
                    onChange={(e) => setFormObjetivo(e.target.value)}
                  />
                </div>
              </div>
              {error && (
                <div className="session-form__error">
                  {error}
                </div>
              )}
            </div>
            <div className="session-form__actions">
              <button className="btn btn--secondary" onClick={handleCancelCreate}>
                Cancelar
              </button>
              <button
                className="btn btn--primary"
                onClick={handleSubmitCreate}
                disabled={!formTipo || saving}
              >
                {saving ? <Loader2 size={16} className="spinner" /> : <Plus size={16} />}
                Crear e Iniciar
              </button>
            </div>
          </div>
          ) : workingTratamiento ? (
            isWorkingBlocked ? (
              <div className="sesion-tratamiento__form-blocked">
                <Clock size={32} />
                <h3>Esperando confirmación de fecha</h3>
                <p>La enfermera está coordinando la fecha de la próxima sesión con el paciente.</p>
                <span className="sesion-tratamiento__form-blocked-hint">
                  Una vez confirmada la fecha, podrá continuar con el tratamiento.
                </span>
              </div>
            ) : (
              <>
                <div className="sesion-tratamiento__form-header">
                  <h3>
                    {sessionMode === 'new' && 'Nuevo Tratamiento'}
                    {sessionMode === 'first-session' && `Sesión 1 de ${workingTratamiento.sesionesPlaneadas || '?'}`}
                    {sessionMode === 'continuing' && `Sesión ${(workingTratamiento.sesionesRealizadas || 0) + 1} de ${workingTratamiento.sesionesPlaneadas || '?'}`}
                    {sessionMode === 'last' && `Última Sesión (${workingTratamiento.sesionesRealizadas || 0} de ${workingTratamiento.sesionesPlaneadas || '?'})`}
                    {sessionMode === 'completed' && 'Tratamiento Completado'}
                  </h3>
                  <span className="sesion-tratamiento__form-subtitle">
                    {getTreatmentLabel(workingTratamiento.tipoTratamiento) || 'Tratamiento'}
                  </span>
                </div>
                <SessionForm
                  mode={sessionMode}
                  tratamiento={workingTratamiento}
                  onSave={handleSaveSession}
                  onFinalize={handleFinalize}
                  onPausar={onPausar}
                  onReanudar={onReanudar}
                  onCancelar={onCancelar}
                  onAmpliar={onAmpliar}
                />
              </>
            )
          ) : (
          <div className="sesion-tratamiento__form-placeholder">
            <Stethoscope size={32} />
            <p>Seleccione un tratamiento o cree uno nuevo</p>
          </div>
        )}
      </div>

      {/* Schedule modal */}
      <ScheduleModal
        open={showSchedule}
        onClose={() => setShowSchedule(false)}
        onConfirm={handleSchedule}
        tratamiento={workingTratamiento}
      />
    </div>
  );
}
