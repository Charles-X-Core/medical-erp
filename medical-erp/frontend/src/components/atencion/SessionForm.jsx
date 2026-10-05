import { useState, useRef, useEffect } from 'react';
import { Save, Camera, CheckCircle, Loader2, MoreHorizontal, X, Calendar, Scale, Ruler, Activity, HeartPulse, Edit2, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TREATMENT_CATEGORIES, getTreatmentLabel } from '../../config/attentionTypes';
import { formatCurrency } from '../../utils/currency';
import { pacienteService } from '../../services/pacienteService';
import { historiaClinicaService } from '../../services/historiaClinicaService';
import { tratamientoService } from '../../services/tratamientoService';
import { evidenciaService } from '../../services/evidenciaService';
import { getActiveAntecedentes } from '../ui/AntecedentesEditor';
import { toLocalDateTime } from '../../utils/laTimezone';
import { useUnitSystem } from '../../context/UnitContext';
import { calcularIMC, pesoAUS, tallaAUS, LBS_TO_KG, IN_TO_CM } from '../../utils/units';

// ============================================
// SessionForm — Register treatment session
// Modes:
//   new            → Brand new treatment (creates treatment)
//   first-session  → First session on existing treatment
//   continuing     → Session N on existing treatment
//   last           → Second-to-last session (1 remaining after this)
//   completed      → All sessions done, show finalize
// ============================================

export default function SessionForm({ mode, tratamiento, paciente, onSave, onFinalize, onPausar, onReanudar, onCancelar, onAmpliar, membresiaActiva }) {
  const { t } = useTranslation('patients');
  const { t: tClinical } = useTranslation('clinical');
  const { t: tCommon } = useTranslation('common');
  const { t: tDashboard } = useTranslation('dashboard');
  const { system, toggle } = useUnitSystem();

  const [evolucion, setEvolucion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [costoSesion, setCostoSesion] = useState(
    tratamiento?.modoCosto === 'igual' && tratamiento?.costoEstimado ? String(tratamiento.costoEstimado) : ''
  );
  const [modoCosto, setModoCosto] = useState(
    tratamiento?.modoCosto || (membresiaActiva ? 'membresia' : 'igual')
  );
  const [confirmarMembresia, setConfirmarMembresia] = useState(false);
  const [confirmarEditarGlobal, setConfirmarEditarGlobal] = useState(false);
  const [costoOculto, setCostoOculto] = useState('');

  // Vital signs
  const [peso, setPeso] = useState('');
  const [estatura, setEstatura] = useState('');
  const [vitalSource, setVitalSource] = useState('');

  // Antecedentes state
  const [historia, setHistoria] = useState(null);
  const [editingAntecedentes, setEditingAntecedentes] = useState(false);
  const [antecedentesValues, setAntecedentesValues] = useState({});
  const [savingAntecedentes, setSavingAntecedentes] = useState(false);

  // Treatment creation state (only for mode='new')
  const [tipoTratamiento, setTipoTratamiento] = useState(tratamiento?.tipoTratamiento || '');
  const [sesionesPlaneadas, setSesionesPlaneadas] = useState(tratamiento?.sesionesPlaneadas || '');

  // Photo (múltiples fotos con descripción por foto)
  const [fotos, setFotos] = useState([]);

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

  // Pre-fill vital signs from latest measurement
  useEffect(() => {
    if (!paciente?.id) return;
    pacienteService.getUltimosSignosVitales(paciente.id).then((res) => {
      const data = res?.data || res;
      if (data?.peso != null) {
        setPeso(data.peso);
      } else if (paciente?.peso != null) {
        setPeso(paciente.peso);
      }
      if (data?.talla != null) {
        setEstatura(data.talla);
      } else if (paciente?.estatura != null) {
        setEstatura(paciente.estatura);
      }
      if (data?.fuente) {
        const fechaStr = data.fecha ? ` (${new Date(data.fecha).toLocaleDateString()})` : '';
        setVitalSource(data.fuente === 'sesion' ? `Tratamiento${fechaStr}` : `Consulta${fechaStr}`);
      }
    }).catch(() => {
      if (paciente?.peso != null) setPeso(paciente.peso);
      if (paciente?.estatura != null) setEstatura(paciente.estatura);
    });
  }, [paciente?.id]);

  // Load historia clínica for antecedentes
  useEffect(() => {
    if (!paciente?.id) return;
    historiaClinicaService.getByPaciente(paciente.id).then((res) => {
      if (res?.success) setHistoria(res.data);
    }).catch(() => {});
  }, [paciente?.id]);

  const handleSave = async (postAction) => {
    setSaving(true);
    try {
      const data = {
        fecha: toLocalDateTime(),
        evolucion,
        observaciones,
        fotos,
        postAction, // 'schedule' | 'finalize' | undefined
        signosVitales: {
          peso: peso !== '' ? parseFloat(peso) : null,
          talla: estatura !== '' ? Math.round(parseFloat(estatura)) : null,
        },
        ...(modoCosto !== 'membresia' && costoSesion && { costoSesion: parseFloat(costoSesion) }),
        ...(modoCosto === 'membresia' && { costoSesion: 0, membresiaActiva: true }),
        modoCosto,
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
      setFotos([]);
    } catch (err) {
      console.error('Error saving session:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePesoChange = (v) => {
    if (v === '' || v === null || v === undefined) { setPeso(''); return; }
    setPeso(system === 'us' ? parseFloat((parseFloat(v) * LBS_TO_KG).toFixed(1)) : v);
  };

  const handleTallaChange = (v) => {
    if (v === '' || v === null || v === undefined) { setEstatura(''); return; }
    setEstatura(system === 'us' ? Math.round(parseFloat(v) * IN_TO_CM) : v);
  };

  const [showResumen, setShowResumen] = useState(false);
  const [resumenAction, setResumenAction] = useState('save');
  const [historialSesiones, setHistorialSesiones] = useState([]);
  const [fotosSesiones, setFotosSesiones] = useState([]);
  const [loadingResumen, setLoadingResumen] = useState(false);

  const abrirResumen = (action) => {
    setResumenAction(action);
    setShowResumen(true);
    if (action === 'finalize' && paciente?.id && tratamiento?.id) {
      setLoadingResumen(true);
      Promise.all([
        tratamientoService.getHistorialClinico(tratamiento.id).catch(() => ({ success: false })),
        evidenciaService.listByPaciente(paciente.id).catch(() => ({ success: false })),
      ]).then(([hRes, eRes]) => {
        const hist = hRes?.success ? (hRes.data || []) : [];
        setHistorialSesiones(Array.isArray(hist) ? hist : []);
        const ev = eRes?.success ? (eRes.data || []) : [];
        setFotosSesiones(Array.isArray(ev) ? ev : []);
      }).finally(() => setLoadingResumen(false));
    }
  };

  const confirmarResumen = () => {
    setShowResumen(false);
    handleSave(resumenAction);
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
            <strong>{t('todas_sesiones_completadas')}</strong>
            <span>{t('sesiones_realizadas_de', { current: totalSesiones, total: totalSesiones })}</span>
          </div>
        </div>

        <div className="session-form__section session-form__section--finalize">
          <h4 className="session-form__section-title">
            <CheckCircle size={14} /> {t('finalizar_tratamiento')}
          </h4>
          {!showFinalizeOptions ? (
            <button
              className="btn btn--primary"
              onClick={() => setShowFinalizeOptions(true)}
            >
              <CheckCircle size={16} /> {t('finalizar_tratamiento')}
            </button>
          ) : (
            <>
              <div className="session-form__fields">
                <div className="session-form__field">
                  <label className="session-form__label">{tClinical('resultado_final')}</label>
                  <textarea
                    className="session-form__textarea"
                    placeholder={tClinical('resultado_del_tratamiento_placeholder')}
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
                    <span>{t('cliente_desea_otro_tratamiento')}</span>
                  </label>
                </div>
              </div>
              <div className="session-form__actions">
                <button className="btn btn--secondary" onClick={() => setShowFinalizeOptions(false)}>
                  {tCommon('cancel')}
                </button>
                <button
                  className="btn btn--primary"
                  onClick={handleFinalize}
                  disabled={saving || !resultadoFinal.trim()}
                >
                  {saving ? <Loader2 size={16} className="spinner" /> : <CheckCircle size={16} />}
                  {quiereOtroTratamiento ? t('finalizar_y_nuevo_tratamiento') : t('finalizar_tratamiento')}
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
      <div className="session-form__layout">
        {/* ─── LEFT: Main Content ─── */}
        <div className="session-form__main">
          {/* Progress bar */}
          {!isNew && totalSesiones > 0 && (
            <div className="session-form__progress">
              <div className="session-form__progress-header">
                <span className="session-form__progress-label">
                  {isFirstSession ? t('sesion_numero', { number: 1 }) : t('sesion_numero', { number: sesionActual })} {t('de_total', { total: totalSesiones })}
                  {sesionesRestantes > 0 && <span className="session-form__progress-remaining"> · {t('restantes', { count: sesionesRestantes })}</span>}
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
              <h4 className="session-form__section-title">{t('nuevo_tratamiento')}</h4>
              <div className="session-form__fields">
                <div className="session-form__field">
                  <label className="session-form__label">{t('tipo_tratamiento')} *</label>
                  <select
                    className="session-form__select"
                    value={tipoTratamiento}
                    onChange={(e) => setTipoTratamiento(e.target.value)}
                  >
                    <option value="">{t('seleccionar_tratamiento')}</option>
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
                  <label className="session-form__label">{t('sesiones')} *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="session-form__input"
                    placeholder={t('ejemplo_4')}
                    value={sesionesPlaneadas}
                    onChange={(e) => setSesionesPlaneadas(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* SHARED COST OPTIONS */}
          {(isNew || isSessionMode) && (
            <div className="session-form__section">
              <h4 className="session-form__section-title">{t('tipo_costeo')}</h4>
              <div className="session-form__fields">
                <div className="session-form__field">
                  <label className="session-form__label">{t('tipo_costeo')}</label>
                  <select
                    className="session-form__select"
                    value={modoCosto}
                    disabled={!isNew}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'membresia') {
                        setConfirmarMembresia(true);
                      } else {
                        setModoCosto(val);
                      }
                    }}
                  >
                    <option value="igual">{t('costeo_igual')}</option>
                    <option value="diferente">{t('costeo_diferente')}</option>
                    <option value="membresia">{t('costeo_membresia')}</option>
                  </select>
                </div>
                {confirmarMembresia && (
                  <div className="onboarding-modal" onClick={(e) => { if (e.target === e.currentTarget) setConfirmarMembresia(false); }}>
                    <div className="onboarding-modal__box" onClick={(e) => e.stopPropagation()}>
                      <p className="onboarding-modal__subtitle">{t('confirmar_membresia_msg')}</p>
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
                        <button
                          className="btn btn--secondary"
                          onClick={() => { setConfirmarMembresia(false); setModoCosto('membresia'); }}
                        >
                          {tCommon('si_confirmar')}
                        </button>
                        <button className="btn btn--ghost" onClick={() => { setConfirmarMembresia(false); setModoCosto('igual'); }}>
                          {tCommon('cancelar')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {modoCosto !== 'diferente' && (
                  <div className="session-form__field">
                    <label className="session-form__label">{modoCosto === 'igual' ? t('costo_por_sesion') : t('costo_por_sesion')}</label>
                    {modoCosto === 'membresia' ? (
                      <input
                        className="session-form__input session-form__input--readonly"
                        placeholder={t('membresia_aplica')}
                        disabled
                        value={`${t('membresia')}: $10`}
                      />
                    ) : (
                      <input
                        type="text"
                        inputMode="decimal"
                        className="session-form__input"
                        placeholder="$ 0.00"
                        value={costoSesion}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.,]/g, '');
                          if (!isNew && modoCosto === 'igual' && String(val) !== String(costoSesion)) {
                            setCostoOculto(val);
                            setConfirmarEditarGlobal(true);
                          } else {
                            setCostoSesion(val);
                          }
                        }}
                      />
                    )}
                  </div>
                )}
                {modoCosto === 'diferente' && !isNew && (
                  <div className="session-form__field">
                    <label className="session-form__label">{t('costo_esta_sesion')}</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="session-form__input"
                      placeholder="$ 0.00"
                      value={costoSesion}
                      onChange={(e) => setCostoSesion(e.target.value.replace(/[^0-9.,]/g, ''))}
                    />
                  </div>
                )}
                {isLastSession && (
                  <div className="session-form__field">
                    <label className="session-form__label">{t('total_tratamiento')}</label>
                    <div className="session-form__input session-form__input--readonly session-form__total">
                      {formatCurrency((parseFloat(tratamiento?.costoTotal) || 0) + (parseFloat(costoSesion) || 0))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {confirmarEditarGlobal && (
            <div className="onboarding-modal" onClick={(e) => { if (e.target === e.currentTarget) setConfirmarEditarGlobal(false); }}>
              <div className="onboarding-modal__box" onClick={(e) => e.stopPropagation()}>
                <p className="onboarding-modal__subtitle">{t('editar_costos_todos_msg')}</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
                  <button
                    className="btn btn--primary"
                    onClick={() => { setCostoSesion(costoOculto); setConfirmarEditarGlobal(false); }}
                  >
                    {tCommon('si_confirmar')}
                  </button>
                  <button className="btn btn--ghost" onClick={() => setConfirmarEditarGlobal(false)}>
                    {tCommon('cancelar')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SESSION FORM: first-session / continuing / last */}
          {isSessionMode && (
            <div className="session-form__section">
              <h4 className="session-form__section-title">
                {isFirstSession ? t('sesion_numero', { number: 1 }) : isLastSession ? t('ultima_sesion') : t('sesion_numero', { number: sesionActual })}
              </h4>
              <div className="session-form__fields">
                <div className="session-form__field">
                  <label className="session-form__label">{t('tipo_tratamiento')}</label>
                  <div className="session-form__input session-form__input--readonly">
                    {getTreatmentLabel(tratamiento?.tipoTratamiento) || '—'}
                  </div>
                </div>
                {costoPromedio && (
                  <div className="session-form__field">
                    <label className="session-form__label">{t('costo_promedio')}</label>
                    <div className="session-form__input session-form__input--readonly">
                      {formatCurrency(costoPromedio)}
                    </div>
                  </div>
                )}
                <div className="session-form__field">
                  <label className="session-form__label">{tClinical('evolucion')} *</label>
                  <textarea
                    className="session-form__textarea"
                    placeholder={tClinical('describa_evolucion_placeholder')}
                    value={evolucion}
                    onChange={(e) => setEvolucion(e.target.value)}
                  />
                </div>
                <div className="session-form__field">
                  <label className="session-form__label">{tClinical('observaciones')}</label>
                  <textarea
                    className="session-form__textarea"
                    placeholder={tClinical('observaciones_sesion_placeholder')}
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Photo upload */}
          <div className="session-form__section">
            <h4 className="session-form__section-title">
              <Camera size={14} /> {tClinical('registro_fotografico')}
            </h4>
            <div className="session-form__fotos">
              {fotos.map((f, i) => (
                <div key={i} className="session-form__foto-item">
                  <img src={URL.createObjectURL(f.file)} alt={f.descripcion || tClinical('foto_sesion')} />
                  <input
                    className="session-form__foto-desc"
                    type="text"
                    placeholder={tClinical('descripcion_foto_placeholder')}
                    value={f.descripcion}
                    onChange={(e) => setFotos(prev => prev.map((p, j) => j === i ? { ...p, descripcion: e.target.value } : p))}
                  />
                  <button className="btn btn--ghost btn--sm" onClick={() => setFotos(prev => prev.filter((_, j) => j !== i))}>
                    <X size={14} /> {tCommon('quitar')}
                  </button>
                </div>
              ))}
              <label className="session-form__photo-upload">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setFotos(prev => [...prev, ...files.map(file => ({ file, descripcion: '' }))]);
                    e.target.value = '';
                  }}
                />
                <Camera size={24} />
                <span>
                  {isNew ? tClinical('foto_antes_tratamiento') :
                   isLastSession ? tClinical('foto_final') :
                   tClinical('foto_evolucion')} +
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Sidebar ─── */}
        {isSessionMode && (
          <div className="session-form__sidebar">
            {/* Vital Signs */}
            <div className="vital-sidebar">
              <div className="vital-sidebar__header-row" style={{ marginBottom: 0, paddingBottom: 0, border: 'none' }}>
                <h4 className="vital-sidebar__title" style={{ margin: 0, border: 'none', padding: 0, paddingBottom: 0 }}><HeartPulse size={15} /> {t('signos_vitales')}</h4>
                <div className="unit-toggle">
                  <button className={`unit-toggle__btn ${system === 'metric' ? 'unit-toggle__btn--active' : ''}`}
                    onClick={() => system !== 'metric' && toggle()}>Metric</button>
                  <button className={`unit-toggle__btn ${system === 'us' ? 'unit-toggle__btn--active' : ''}`}
                    onClick={() => system !== 'us' && toggle()}>US</button>
                </div>
              </div>
              {vitalSource && (
                <span className="vital-sidebar__source">{t('ultima_medicion')}: {vitalSource}</span>
              )}

              <div className="vital-sidebar__cards">
                <div className="vital-card vital-card--blue">
                  <div className="vital-card__icon"><Scale size={18} /></div>
                  <div className="vital-card__info">
                    <span className="vital-card__label">{t('peso')}</span>
                    <input type="tel" inputMode="decimal" className="vital-card__input" placeholder="—"
                      step="0.1" min="0" value={system === 'us' ? pesoAUS(peso) : peso} onChange={(e) => handlePesoChange(e.target.value)} />
                    <span className="vital-card__unit">{system === 'us' ? 'lbs' : 'kg'}</span>
                  </div>
                </div>

                <div className="vital-card vital-card--green">
                  <div className="vital-card__icon"><Ruler size={18} /></div>
                  <div className="vital-card__info">
                    <span className="vital-card__label">{t('estatura')}</span>
                    <input type="tel" inputMode="decimal" className="vital-card__input" placeholder="—"
                      step="1" min="0" value={system === 'us' ? tallaAUS(estatura) : estatura} onChange={(e) => handleTallaChange(e.target.value)} />
                    <span className="vital-card__unit">{system === 'us' ? 'in' : 'cm'}</span>
                  </div>
                </div>

                {(() => {
                  const imcVal = calcularIMC(peso, estatura, system);
                  if (!imcVal) {
                    return (
                      <div className="vital-card vital-card--imc vital-card--empty">
                        <div className="vital-card__icon"><Activity size={18} /></div>
                        <div className="vital-card__info">
                          <span className="vital-card__label">{t('imc')}</span>
                          <span className="vital-card__placeholder">{t('peso')} + {t('estatura')}</span>
                        </div>
                      </div>
                    );
                  }
                  const n = parseFloat(imcVal);
                  let imcLabel, imcColor;
                  if (n < 18.5) { imcLabel = 'Underweight'; imcColor = '#3B82F6'; }
                  else if (n < 25) { imcLabel = 'Normal'; imcColor = '#22C55E'; }
                  else if (n < 30) { imcLabel = 'Overweight'; imcColor = '#F59E0B'; }
                  else { imcLabel = 'Obese'; imcColor = '#EF4444'; }
                  return (
                    <div className="vital-card vital-card--imc" style={{ borderLeftColor: imcColor }}>
                      <div className="vital-card__icon" style={{ color: imcColor }}><Activity size={18} /></div>
                      <div className="vital-card__info">
                        <span className="vital-card__label">{t('imc')}</span>
                        <div className="vital-card__imc-row">
                          <span className="vital-card__value" style={{ color: imcColor }}>{imcVal}</span>
                          <span className="vital-card__tag" style={{ background: imcColor + '18', color: imcColor }}>{imcLabel}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Antecedentes */}
            <div className="vital-sidebar vital-sidebar--antecedentes">
              <div className="vital-sidebar__header-row">
                <h4 className="vital-sidebar__title" style={{ margin: 0, border: 'none', padding: 0 }}>{t('medical_history_title')}</h4>
                {!editingAntecedentes ? (
                  <button className="vital-sidebar__edit-btn" onClick={() => {
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
                  }} disabled={!historia}>
                    <Edit2 size={13} />
                  </button>
                ) : (
                  <div className="vital-sidebar__edit-actions">
                    <button className="vital-sidebar__edit-btn" onClick={() => setEditingAntecedentes(false)}>
                      <X size={13} />
                    </button>
                    <button className="vital-sidebar__edit-btn vital-sidebar__edit-btn--save" onClick={async () => {
                      if (!historia?.id) return;
                      setSavingAntecedentes(true);
                      try {
                        const result = await historiaClinicaService.updateAntecedentes(historia.id, antecedentesValues);
                        if (result?.success) {
                          const refreshed = await historiaClinicaService.getByPaciente(paciente.id);
                          if (refreshed?.success) setHistoria(refreshed.data);
                        }
                        setEditingAntecedentes(false);
                      } catch (err) {
                        console.error('Error saving antecedentes:', err);
                      } finally {
                        setSavingAntecedentes(false);
                      }
                    }} disabled={savingAntecedentes}>
                      {savingAntecedentes ? <span className="spinner spinner--xs" /> : <Check size={13} />}
                    </button>
                  </div>
                )}
              </div>

              {editingAntecedentes ? (
                <div className="vital-sidebar__antecedentes-edit">
                  {[
                    { key: 'alergiaMedicamentos', label: t('alergia_medicamentos') },
                    { key: 'propensionHemorragias', label: t('propension_hemorragias') },
                    { key: 'complicacionesAnestesia', label: t('complicaciones_anestesia') },
                    { key: 'presionArterialMedicacion', label: t('presion_arterial_medicacion') },
                    { key: 'cardiopatiasPersonales', label: t('cardiopatias_personales') },
                    { key: 'cardiopatiasFamiliares', label: t('cardiopatias_familiares') },
                    { key: 'diabetesPersonal', label: t('diabetes_personal') },
                    { key: 'diabetesFamiliar', label: t('diabetes_familiar') },
                    { key: 'hepatitis', label: t('hepatitis') },
                    { key: 'otrasEnfermedades', label: t('otras_enfermedades') },
                    { key: 'enfermedadActualMedicacion', label: t('enfermedad_actual_medicacion') },
                  ].map(({ key, label }) => {
                    const val = antecedentesValues[key] || '';
                    const isYes = val && val !== 'No' && val !== '';
                    const isNo = val === 'No';
                    return (
                      <div key={key} className="vital-sidebar__ant-row">
                        <span className="vital-sidebar__ant-label">{label}</span>
                        <div className="vital-sidebar__ant-btns">
                          <button type="button" className={`antecedente-btn antecedente-btn--sm ${isYes ? 'si-activo' : ''}`}
                            onClick={() => setAntecedentesValues(prev => ({ ...prev, [key]: isYes ? '' : 'Si' }))}>
                            {tCommon('yes')}
                          </button>
                          <button type="button" className={`antecedente-btn antecedente-btn--sm ${isNo ? 'no-activo' : ''}`}
                            onClick={() => setAntecedentesValues(prev => ({ ...prev, [key]: isNo ? '' : 'No' }))}>
                            {tCommon('no')}
                          </button>
                        </div>
                        {isYes && (
                          <textarea className="vital-sidebar__ant-detail" rows={2}
                            value={val === 'Si' ? '' : val}
                            placeholder={tCommon('details') + '...'}
                            onChange={(e) => setAntecedentesValues(prev => ({ ...prev, [key]: e.target.value || 'Si' }))} />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : getActiveAntecedentes(historia).length === 0 ? (
                <p className="vital-sidebar__empty">{t('sin_historia_clinica')}</p>
              ) : (
                <div className="vital-sidebar__antecedentes-list">
                  {getActiveAntecedentes(historia).map(({ key, labelKey, value }) => (
                    <div key={key} className="vital-sidebar__ant-item">
                      <span className="vital-sidebar__ant-dot" />
                      <span className="vital-sidebar__ant-name">{t(labelKey)}</span>
                      {value !== 'Si' && value !== 'Yes' && <span className="vital-sidebar__ant-value">{value}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ACTIONS */}
      <div className="session-form__actions-row">
        {/* ⋯ More options button — visible for any active treatment session */}
        {!isNew && (
          <div className="session-form__menu-container" ref={menuRef}>
            <button
              className="session-form__menu-btn"
              onClick={() => setShowMenu(!showMenu)}
              title={tCommon('mas_opciones')}
            >
              <MoreHorizontal size={18} />
            </button>
            {showMenu && (
              <div className="session-form__menu session-form__menu--up">
                {!menuAction ? (
                  <>
                    <button className="session-form__menu-item" onClick={() => setMenuAction('pausar')}>
                      ⏸ {t('pausar_tratamiento')}
                    </button>
                    <button className="session-form__menu-item" onClick={() => setMenuAction('ampliar')}>
                      📋 {t('ampliar_plan')}
                    </button>
                    <button className="session-form__menu-item session-form__menu-item--danger" onClick={() => setMenuAction('cancelar')}>
                      ❌ {t('cancelar_tratamiento')}
                    </button>
                  </>
                ) : menuAction === 'pausar' ? (
                  <>
                    <div className="session-form__menu-header">
                      <button className="session-form__menu-back" onClick={() => setMenuAction(null)}>←</button>
                      <span>{t('pausar_tratamiento')}</span>
                      <button className="session-form__menu-close" onClick={() => { setShowMenu(false); setMenuAction(null); }}><X size={14} /></button>
                    </div>
                    <input
                      className="session-form__menu-input"
                      placeholder={t('motivo_pausa_opcional')}
                      value={menuMotivo}
                      onChange={(e) => setMenuMotivo(e.target.value)}
                    />
                    <button className="btn btn--primary btn--sm session-form__menu-confirm" onClick={handleMenuAction} disabled={saving}>
                      {saving ? <Loader2 size={14} className="spinner" /> : `⏸ ${t('pausar')}`}
                    </button>
                  </>
                ) : menuAction === 'cancelar' ? (
                  <>
                    <div className="session-form__menu-header">
                      <button className="session-form__menu-back" onClick={() => setMenuAction(null)}>←</button>
                      <span>{t('cancelar_tratamiento')}</span>
                      <button className="session-form__menu-close" onClick={() => { setShowMenu(false); setMenuAction(null); }}><X size={14} /></button>
                    </div>
                    <input
                      className="session-form__menu-input"
                      placeholder={t('motivo_cancelacion')}
                      value={menuMotivo}
                      onChange={(e) => setMenuMotivo(e.target.value)}
                    />
                    <button className="btn btn--danger btn--sm session-form__menu-confirm" onClick={handleMenuAction} disabled={saving || !menuMotivo.trim()}>
                      {saving ? <Loader2 size={14} className="spinner" /> : `❌ ${t('cancelar')}`}
                    </button>
                  </>
                ) : menuAction === 'ampliar' ? (
                  <>
                    <div className="session-form__menu-header">
                      <button className="session-form__menu-back" onClick={() => setMenuAction(null)}>←</button>
                      <span>{t('ampliar_plan')}</span>
                      <button className="session-form__menu-close" onClick={() => { setShowMenu(false); setMenuAction(null); }}><X size={14} /></button>
                    </div>
                    <div className="session-form__menu-field">
                      <label>{t('nuevas_sesiones_totales')}</label>
                      <input
                        type="number"
                        className="session-form__menu-input"
                        min={totalSesiones + 1}
                        value={menuAmpliarCount || ''}
                        onChange={(e) => setMenuAmpliarCount(parseInt(e.target.value) || 0)}
                        placeholder={t('actual_sesiones', { actual: totalSesiones })}
                      />
                    </div>
                    <input
                      className="session-form__menu-input"
                      placeholder={t('motivo_opcional')}
                      value={menuMotivo}
                      onChange={(e) => setMenuMotivo(e.target.value)}
                    />
                    <button
                      className="btn btn--primary btn--sm session-form__menu-confirm"
                      onClick={handleMenuAction}
                      disabled={saving || !menuAmpliarCount || menuAmpliarCount <= totalSesiones}
                    >
                      {saving ? <Loader2 size={14} className="spinner" /> : `📋 ${t('ampliar')}`}
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
            {t('crear_tratamiento')}
          </button>
        ) : isSessionMode ? (
          <>
            <button
              className="btn btn--primary"
              onClick={() => abrirResumen('schedule')}
              disabled={saving}
            >
              {saving ? <Loader2 size={16} className="spinner" /> : <Calendar size={16} />}
              {t('guardar_y_agendar')}
            </button>
            {(isLastSession || sesionesRestantes <= 1) && (
              <button
                className="btn btn--secondary"
                onClick={() => abrirResumen('finalize')}
                disabled={saving}
              >
                {saving ? <Loader2 size={16} className="spinner" /> : <CheckCircle size={16} />}
                {t('guardar_y_finalizar')}
              </button>
            )}
          </>
        ) : null}
      </div>

      {showResumen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowResumen(false); }}>
          <div className={`modal-content session-resumen-modal ${resumenAction === 'finalize' ? 'session-resumen-modal--final' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="session-resumen-modal__header">
              <h3><CheckCircle size={20} /> {resumenAction === 'finalize' ? t('resumen_final_title') : t('resumen_sesion_title')}</h3>
              <button className="session-resumen-modal__close" onClick={() => setShowResumen(false)}><X size={20} /></button>
            </div>
            <div className="session-resumen-modal__body">
              <div className="session-resumen-modal__grid">
                <div className="session-resumen-modal__item">
                  <span className="session-resumen-modal__label">{t('tipo_tratamiento')}</span>
                  <span className="session-resumen-modal__value">{getTreatmentLabel(tratamiento?.tipoTratamiento) || '—'}</span>
                </div>
                <div className="session-resumen-modal__item">
                  <span className="session-resumen-modal__label">{t('sesion')}</span>
                  <span className="session-resumen-modal__value">{isLastSession ? t('ultima_sesion') : `${sesionActual} / ${totalSesiones || '?'}`}</span>
                </div>
                <div className="session-resumen-modal__item session-resumen-modal__item--full">
                  <span className="session-resumen-modal__label">{tClinical('evolucion')}</span>
                  <span className="session-resumen-modal__value">{evolucion || '-'}</span>
                </div>
                <div className="session-resumen-modal__item session-resumen-modal__item--full">
                  <span className="session-resumen-modal__label">{t('observaciones')}</span>
                  <span className="session-resumen-modal__value">{observaciones || '-'}</span>
                </div>
                <div className="session-resumen-modal__item">
                  <span className="session-resumen-modal__label">{t('costo_por_sesion')}</span>
                  <span className="session-resumen-modal__value">{costoSesion ? formatCurrency(parseFloat(costoSesion)) : '-'}</span>
                </div>
                <div className="session-resumen-modal__item">
                  <span className="session-resumen-modal__label">{t('total_tratamiento')}</span>
                  <span className="session-resumen-modal__value session-resumen-modal__value--total">{formatCurrency((parseFloat(tratamiento?.costoTotal) || 0) + (parseFloat(costoSesion) || 0))}</span>
                </div>
              </div>

              {resumenAction === 'finalize' && (
                <div className="session-resumen-modal__final">
                  <h4 className="session-resumen-modal__subtitle">{t('progreso_sesiones')}</h4>
                  <div className="session-resumen-modal__historial">
                    {loadingResumen ? (
                      <Loader2 size={16} className="spinner" />
                    ) : historialSesiones.length === 0 ? (
                      <span className="session-resumen-modal__empty">{t('sin_sesiones_registradas')}</span>
                    ) : historialSesiones.map((h, i) => (
                      <div key={i} className="session-resumen-modal__hist-item">
                        <span className="session-resumen-modal__hist-num">{h.campoModificado || `Sesión ${i + 1}`}</span>
                        <span className="session-resumen-modal__hist-val">{h.valorNuevo || h.motivo || '-'}</span>
                      </div>
                    ))}
                  </div>

                  <h4 className="session-resumen-modal__subtitle">{t('fotos_sesiones')}</h4>
                  <div className="session-resumen-modal__carousel">
                    {fotosSesiones.length === 0 ? (
                      <span className="session-resumen-modal__empty">{t('sin_fotos')}</span>
                    ) : fotosSesiones.map((tr) => (
                      tr.sesiones.map((s, i) => (
                        s.evidencias.map((ev) => (
                          <img key={`${s.sesionId}-${ev.id}`} className="session-resumen-modal__foto" src={evidenciaService.getFileUrl(ev.archivoRuta)} alt={`Sesión ${s.numeroSesion}`} />
                        ))
                      ))
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="session-resumen-modal__footer">
              <button className="btn btn--ghost" onClick={() => setShowResumen(false)}>{t('cancelar')}</button>
              <button className="btn btn--primary" onClick={confirmarResumen} disabled={saving}>
                {saving ? <Loader2 size={16} className="spinner" /> : <CheckCircle size={16} />}
                {resumenAction === 'finalize' ? t('finalizar_guardar') : t('conf_guardar_agendar')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
