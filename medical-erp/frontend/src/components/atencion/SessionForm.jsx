import { useState, useRef, useEffect } from 'react';
import { Save, Camera, CheckCircle, Loader2, MoreHorizontal, X, Calendar } from 'lucide-react';
import { TREATMENT_CATEGORIES, getTreatmentLabel } from '../../config/attentionTypes';

// ============================================
// SessionForm — Register treatment session
// Modes:
//   new            → Brand new treatment (creates treatment)
//   first-session  → First session on existing treatment
//   continuing     → Session N on existing treatment
//   last           → Second-to-last session (1 remaining after this)
//   completed      → All sessions done, show finalize
// ============================================

export default function SessionForm({ mode, tratamiento, onSave, onFinalize, onPausar, onReanudar, onCancelar, onAmpliar }) {
  const [evolucion, setEvolucion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [costoSesion, setCostoSesion] = useState('');

  // Treatment creation state (only for mode='new')
  const [tipoTratamiento, setTipoTratamiento] = useState(tratamiento?.tipoTratamiento || '');
  const [sesionesPlaneadas, setSesionesPlaneadas] = useState(tratamiento?.sesionesPlaneadas || '');

  // Photo
  const [foto, setFoto] = useState(null);

  // Finalize state
  const [sessionSaved, setSessionSaved] = useState(false);
  const [showFinalizeOptions, setShowFinalizeOptions] = useState(false);
  const [resultadoFinal, setResultadoFinal] = useState('');
  const [quiereOtroTratamiento, setQuiereOtroTratamiento] = useState(false);

  // ⋯ Menu state
  const [showMenu, setShowMenu] = useState(false);
  const [menuMotivo, setMenuMotivo] = useState('');
  const [menuAction, setMenuAction] = useState(null); // 'pausar' | 'cancelar' | 'ampliar'
  const [menuAmpliarCount, setMenuAmpliarCount] = useState(0);
  const menuRef = useRef(null);

  const [saving, setSaving] = useState(false);

  const isNew = mode === 'new';
  const isFirstSession = mode === 'first-session';
  const isContinuing = mode === 'continuing';
  const isLastSession = mode === 'last';
  const isCompleted = mode === 'completed';
  const isSessionMode = isFirstSession || isContinuing || isLastSession;

  const sesionActual = tratamiento?.sesionesRealizadas ? tratamiento.sesionesRealizadas + 1 : 1;
  const totalSesiones = tratamiento?.sesionesPlaneadas || 0;
  const sesionesRestantes = Math.max(0, totalSesiones - (tratamiento?.sesionesRealizadas || 0));
  const progreso = totalSesiones > 0 ? Math.min(1, (tratamiento?.sesionesRealizadas || 0) / totalSesiones) : 0;

  const costoPromedio = (tratamiento?.costoTotal && tratamiento?.sesionesRealizadas > 0)
    ? (tratamiento.costoTotal / tratamiento.sesionesRealizadas).toFixed(2)
    : null;

  // Close ⋯ menu on click outside
  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
        setMenuAction(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  const handleSave = async (postAction) => {
    setSaving(true);
    try {
      const data = {
        fecha: new Date().toISOString(),
        evolucion,
        observaciones,
        foto,
        postAction, // 'schedule' | 'finalize' | undefined
        ...(costoSesion && { costoSesion: parseFloat(costoSesion) }),
        // For mode='new', also include treatment creation fields
        ...(isNew && {
          tipoTratamiento,
          sesionesPlaneadas: sesionesPlaneadas ? parseInt(sesionesPlaneadas) : null,
        }),
      };
      await onSave?.(data);
      setSessionSaved(true);
      setEvolucion('');
      setObservaciones('');
      setCostoSesion('');
      setFoto(null);
    } catch (err) {
      console.error('Error saving session:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!sessionSaved && !isCompleted) return;
    setSaving(true);
    try {
      await onFinalize?.({
        resultadoFinal,
        quiereOtroTratamiento,
      });
    } catch (err) {
      console.error('Error finalizing:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleMenuAction = async () => {
    if (!menuAction) return;
    setSaving(true);
    try {
      if (menuAction === 'pausar') {
        await onPausar?.(tratamiento, menuMotivo || 'Pausado por la doctora');
      } else if (menuAction === 'cancelar') {
        await onCancelar?.(tratamiento, menuMotivo || 'Cancelado por la doctora');
      } else if (menuAction === 'ampliar') {
        await onAmpliar?.(tratamiento, menuAmpliarCount, menuMotivo || null);
      }
      setShowMenu(false);
      setMenuAction(null);
      setMenuMotivo('');
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setSaving(false);
    }
  };

  // ---- COMPLETED MODE: All sessions done ----
  if (isCompleted) {
    return (
      <div className="session-form">
        <div className="session-form__completed-banner">
          <CheckCircle size={20} />
          <div className="session-form__completed-info">
            <strong>Todas las sesiones completadas</strong>
            <span>{totalSesiones} de {totalSesiones} sesiones realizadas</span>
          </div>
        </div>

        <div className="session-form__section session-form__section--finalize">
          <h4 className="session-form__section-title">
            <CheckCircle size={14} /> Finalizar Tratamiento
          </h4>
          {!showFinalizeOptions ? (
            <button
              className="btn btn--primary"
              onClick={() => setShowFinalizeOptions(true)}
            >
              <CheckCircle size={16} /> Finalizar Tratamiento
            </button>
          ) : (
            <>
              <div className="session-form__fields">
                <div className="session-form__field">
                  <label className="session-form__label">Resultado final *</label>
                  <textarea
                    className="session-form__textarea"
                    placeholder="Resultado del tratamiento..."
                    value={resultadoFinal}
                    onChange={(e) => setResultadoFinal(e.target.value)}
                  />
                </div>
                <div className="session-form__field">
                  <label className="session-form__checkbox-label">
                    <input
                      type="checkbox"
                      checked={quiereOtroTratamiento}
                      onChange={(e) => setQuiereOtroTratamiento(e.target.checked)}
                    />
                    <span>El paciente desea iniciar otro tratamiento</span>
                  </label>
                </div>
              </div>
              <div className="session-form__actions">
                <button className="btn btn--secondary" onClick={() => setShowFinalizeOptions(false)}>
                  Cancelar
                </button>
                <button
                  className="btn btn--primary"
                  onClick={handleFinalize}
                  disabled={saving || !resultadoFinal.trim()}
                >
                  {saving ? <Loader2 size={16} className="spinner" /> : <CheckCircle size={16} />}
                  {quiereOtroTratamiento ? 'Finalizar y Nuevo Tratamiento' : 'Finalizar Tratamiento'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="session-form">
      {/* Progress bar */}
      {!isNew && totalSesiones > 0 && (
        <div className="session-form__progress">
          <div className="session-form__progress-header">
            <span className="session-form__progress-label">
              {isFirstSession ? 'Sesión 1' : `Sesión ${sesionActual}`} de {totalSesiones}
              {sesionesRestantes > 0 && <span className="session-form__progress-remaining"> · {sesionesRestantes} restante{sesionesRestantes !== 1 ? 's' : ''}</span>}
            </span>
            <span className="session-form__progress-pct">
              {Math.round(progreso * 100)}%
            </span>
          </div>
          <div className="session-form__progress-bar">
            <div
              className="session-form__progress-fill"
              style={{ width: `${progreso * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* NEW TREATMENT: Full creation form */}
      {isNew && (
        <div className="session-form__section">
          <h4 className="session-form__section-title">Nuevo Tratamiento</h4>
          <div className="session-form__fields">
            <div className="session-form__field">
              <label className="session-form__label">Tipo de tratamiento *</label>
              <select
                className="session-form__select"
                value={tipoTratamiento}
                onChange={(e) => setTipoTratamiento(e.target.value)}
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
            <div className="session-form__row">
              <div className="session-form__field">
                <label className="session-form__label">Sesiones *</label>
                <input
                  type="number"
                  className="session-form__input"
                  placeholder="Ej: 4"
                  min="1"
                  value={sesionesPlaneadas}
                  onChange={(e) => setSesionesPlaneadas(e.target.value)}
                />
              </div>
              <div className="session-form__field">
                <label className="session-form__label">Costo por sesión</label>
                <input
                  type="number"
                  className="session-form__input"
                  placeholder="S/ 0.00"
                  step="0.01"
                  value={costoSesion}
                  onChange={(e) => setCostoSesion(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SESSION FORM: first-session / continuing / last */}
      {isSessionMode && (
        <div className="session-form__section">
          <h4 className="session-form__section-title">
            {isFirstSession ? 'Sesión 1' : isLastSession ? 'Última Sesión' : `Sesión ${sesionActual}`}
          </h4>
          <div className="session-form__fields">
            <div className="session-form__field">
              <label className="session-form__label">Tipo de tratamiento</label>
              <div className="session-form__input session-form__input--readonly">
                {getTreatmentLabel(tratamiento?.tipoTratamiento) || '—'}
              </div>
            </div>
            {costoPromedio && (
              <div className="session-form__field">
                <label className="session-form__label">Costo promedio</label>
                <div className="session-form__input session-form__input--readonly">
                  S/ {costoPromedio}
                </div>
              </div>
            )}
            <div className="session-form__field">
              <label className="session-form__label">Evolución *</label>
              <textarea
                className="session-form__textarea"
                placeholder="Describa la evolución del paciente..."
                value={evolucion}
                onChange={(e) => setEvolucion(e.target.value)}
              />
            </div>
            <div className="session-form__field">
              <label className="session-form__label">Observaciones</label>
              <textarea
                className="session-form__textarea"
                placeholder="Observaciones de la sesión..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>
            <div className="session-form__field">
              <label className="session-form__label">Costo de esta sesión</label>
              <input
                type="number"
                className="session-form__input"
                placeholder={costoPromedio ? `Promedio: S/ ${costoPromedio}` : 'S/ 0.00'}
                step="0.01"
                value={costoSesion}
                onChange={(e) => setCostoSesion(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Photo upload */}
      <div className="session-form__section">
        <h4 className="session-form__section-title">
          <Camera size={14} /> Registro Fotográfico
        </h4>
        <div className="session-form__photo">
          {foto ? (
            <div className="session-form__photo-preview">
              <img src={URL.createObjectURL(foto)} alt="Foto sesión" />
              <button className="btn btn--ghost btn--sm" onClick={() => setFoto(null)}>
                Cambiar
              </button>
            </div>
          ) : (
            <label className="session-form__photo-upload">
              <input type="file" accept="image/*" hidden onChange={(e) => setFoto(e.target.files[0])} />
              <Camera size={24} />
              <span>
                {isNew ? 'Foto antes del tratamiento' :
                 isLastSession ? 'Foto final' :
                 'Foto de evolución'}
              </span>
            </label>
          )}
        </div>
      </div>

      {/* ACTIONS */}
      <div className="session-form__actions-row">
        {/* ⋯ More options button — visible for any active treatment session */}
        {!isNew && (
          <div className="session-form__menu-container" ref={menuRef}>
            <button
              className="session-form__menu-btn"
              onClick={() => setShowMenu(!showMenu)}
              title="Más opciones"
            >
              <MoreHorizontal size={18} />
            </button>
            {showMenu && (
              <div className="session-form__menu session-form__menu--up">
                {!menuAction ? (
                  <>
                    <button className="session-form__menu-item" onClick={() => setMenuAction('pausar')}>
                      ⏸ Pausar Tratamiento
                    </button>
                    <button className="session-form__menu-item" onClick={() => setMenuAction('ampliar')}>
                      📋 Ampliar Plan
                    </button>
                    <button className="session-form__menu-item session-form__menu-item--danger" onClick={() => setMenuAction('cancelar')}>
                      ❌ Cancelar Tratamiento
                    </button>
                  </>
                ) : menuAction === 'pausar' ? (
                  <>
                    <div className="session-form__menu-header">
                      <button className="session-form__menu-back" onClick={() => setMenuAction(null)}>←</button>
                      <span>Pausar Tratamiento</span>
                      <button className="session-form__menu-close" onClick={() => { setShowMenu(false); setMenuAction(null); }}><X size={14} /></button>
                    </div>
                    <input
                      className="session-form__menu-input"
                      placeholder="Motivo de pausa (opcional)"
                      value={menuMotivo}
                      onChange={(e) => setMenuMotivo(e.target.value)}
                    />
                    <button className="btn btn--primary btn--sm session-form__menu-confirm" onClick={handleMenuAction} disabled={saving}>
                      {saving ? <Loader2 size={14} className="spinner" /> : '⏸ Pausar'}
                    </button>
                  </>
                ) : menuAction === 'cancelar' ? (
                  <>
                    <div className="session-form__menu-header">
                      <button className="session-form__menu-back" onClick={() => setMenuAction(null)}>←</button>
                      <span>Cancelar Tratamiento</span>
                      <button className="session-form__menu-close" onClick={() => { setShowMenu(false); setMenuAction(null); }}><X size={14} /></button>
                    </div>
                    <input
                      className="session-form__menu-input"
                      placeholder="Motivo de cancelación *"
                      value={menuMotivo}
                      onChange={(e) => setMenuMotivo(e.target.value)}
                    />
                    <button className="btn btn--danger btn--sm session-form__menu-confirm" onClick={handleMenuAction} disabled={saving || !menuMotivo.trim()}>
                      {saving ? <Loader2 size={14} className="spinner" /> : '❌ Cancelar'}
                    </button>
                  </>
                ) : menuAction === 'ampliar' ? (
                  <>
                    <div className="session-form__menu-header">
                      <button className="session-form__menu-back" onClick={() => setMenuAction(null)}>←</button>
                      <span>Ampliar Plan</span>
                      <button className="session-form__menu-close" onClick={() => { setShowMenu(false); setMenuAction(null); }}><X size={14} /></button>
                    </div>
                    <div className="session-form__menu-field">
                      <label>Nuevas sesiones totales</label>
                      <input
                        type="number"
                        className="session-form__menu-input"
                        min={totalSesiones + 1}
                        value={menuAmpliarCount || ''}
                        onChange={(e) => setMenuAmpliarCount(parseInt(e.target.value) || 0)}
                        placeholder={`Actual: ${totalSesiones}`}
                      />
                    </div>
                    <input
                      className="session-form__menu-input"
                      placeholder="Motivo (opcional)"
                      value={menuMotivo}
                      onChange={(e) => setMenuMotivo(e.target.value)}
                    />
                    <button
                      className="btn btn--primary btn--sm session-form__menu-confirm"
                      onClick={handleMenuAction}
                      disabled={saving || !menuAmpliarCount || menuAmpliarCount <= totalSesiones}
                    >
                      {saving ? <Loader2 size={14} className="spinner" /> : '📋 Ampliar'}
                    </button>
                  </>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* Spacer pushes save button to the right */}
        {!isNew && <div className="session-form__actions-spacer" />}

        {isNew ? (
          <button
            className="btn btn--primary"
            onClick={handleSave}
            disabled={saving || !tipoTratamiento}
          >
            {saving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
            Crear Tratamiento
          </button>
        ) : isSessionMode ? (
          <>
            <button
              className="btn btn--primary"
              onClick={() => handleSave('schedule')}
              disabled={saving}
            >
              {saving ? <Loader2 size={16} className="spinner" /> : <Calendar size={16} />}
              Guardar y Agendar
            </button>
            {(isLastSession || sesionesRestantes <= 1) && (
              <button
                className="btn btn--secondary"
                onClick={() => handleSave('finalize')}
                disabled={saving}
              >
                {saving ? <Loader2 size={16} className="spinner" /> : <CheckCircle size={16} />}
                Guardar y Finalizar
              </button>
            )}
          </>
        ) : null}
      </div>

    </div>
  );
}
