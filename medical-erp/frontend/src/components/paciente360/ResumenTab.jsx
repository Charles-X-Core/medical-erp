import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, Save, X, Loader2, User, Activity, Calendar, ClipboardList, ChevronDown, ChevronUp, Clock, DollarSign, AlertTriangle } from 'lucide-react';
import { tratamientoService } from '../../services/tratamientoService';
import { historiaClinicaService } from '../../services/historiaClinicaService';
import agendaService from '../../services/agendaService';
import { consultasService } from '../../services/consultasService';
import { pacienteService } from '../../services/pacienteService';
import AntecedentesEditor, { getActiveAntecedentes } from '../ui/AntecedentesEditor';
import { formatCurrency } from '../../utils/currency';
import { getTreatmentLabel } from '../../config/attentionTypes';
import { parseLADateTime, formatLADate, getLADateString } from '../../utils/laTimezone';
import { zonaIANA, horaMostrar } from '../../utils/zonaHoraria';
import { useUnitSystem } from '../../context/UnitContext';
import { pesoAUS, tallaAUS, LBS_TO_KG, IN_TO_CM } from '../../utils/units';

function formatFecha(fecha) {
  if (!fecha) return '-';
  return formatLADate(fecha, 'es-ES');
}

function formatHora(hora, fecha) {
  if (!hora) return '-';
  return horaMostrar(hora, fecha).substring(0, 5);
}

function formatFechaHora(fecha) {
  if (!fecha) return '-';
  const d = typeof fecha === 'string' ? parseLADateTime(fecha) || new Date(fecha) : new Date(fecha);
    return d.toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: zonaIANA() });
}

function formatSesionFecha(fechaStr) {
  if (!fechaStr) return '-';
  const d = typeof fechaStr === 'string' ? parseLADateTime(fechaStr) || new Date(fechaStr) : new Date(fechaStr);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: zonaIANA() });
}

export default function ResumenTab({ paciente, historia: historiaInicial, pacienteId, onPacienteUpdated }) {
  const { t } = useTranslation('patients');
  const [historia, setHistoria] = useState(historiaInicial);
  const [tratamientosActivos, setTratamientosActivos] = useState([]);
  const [proximaCita, setProximaCita] = useState(null);
  const [ultimaConsulta, setUltimaConsulta] = useState(null);
  const [editingAntecedentes, setEditingAntecedentes] = useState(false);
  const [antecedentesValues, setAntecedentesValues] = useState({});
  const [savingAntecedentes, setSavingAntecedentes] = useState(false);
  const [savedAntecedentes, setSavedAntecedentes] = useState(false);
  const [errorAntecedentes, setErrorAntecedentes] = useState('');
  const [expandedTratamiento, setExpandedTratamiento] = useState(null);
  const [sesionesTratamiento, setSesionesTratamiento] = useState({});
  const [loadingSesiones, setLoadingSesiones] = useState(null);
  const [ultimaCitaInfo, setUltimaCitaInfo] = useState(null);
  const [editingMedidas, setEditingMedidas] = useState(false);
  const [pesoEdit, setPesoEdit] = useState('');
  const [estaturaEdit, setEstaturaEdit] = useState('');
  const [savingMedidas, setSavingMedidas] = useState(false);
  const [savedMedidas, setSavedMedidas] = useState(false);
  const [errorMedidas, setErrorMedidas] = useState('');

  // Peso y estatura se guardan en métrico (kg / cm); aquí se muestran según
  // el sistema de unidades activo.
  const { system: unitSystem } = useUnitSystem();
  const isUS = unitSystem === 'us';
  const pesoUnidad = isUS ? 'lbs' : 'kg';
  const tallaUnidad = isUS ? 'in' : 'cm';
  const pesoEnUnidad = (v) => (isUS ? pesoAUS(v) : v);
  const tallaEnUnidad = (v) => (isUS ? tallaAUS(v) : v);

  useEffect(() => { setHistoria(historiaInicial); }, [historiaInicial]);
  useEffect(() => { loadData(); }, [pacienteId]);

  const loadData = async () => {
    try {
      const [tratRes, citaRes, consulRes] = await Promise.allSettled([
        tratamientoService.listByPaciente(pacienteId),
        agendaService.getCitasPorPaciente(pacienteId),
        consultasService.getByPaciente(pacienteId),
      ]);

      if (tratRes.status === 'fulfilled' && tratRes.value?.data) {
        const list = Array.isArray(tratRes.value.data) ? tratRes.value.data : tratRes.value.data?.content || [];
        setTratamientosActivos(
          list.filter((tr) => tr.estado !== 'FINALIZADO' && tr.estado !== 'CANCELADO').slice(0, 3)
        );
      }

      if (citaRes.status === 'fulfilled' && citaRes.value?.data) {
        const citas = Array.isArray(citaRes.value.data) ? citaRes.value.data : [];
        const hoy = getLADateString();
        const futuras = citas.filter((c) => c.fecha >= hoy && c.estado !== 'CANCELADA');
        futuras.sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.hora || '').localeCompare(b.hora || ''));
        setProximaCita(futuras[0] || null);
      }

      if (consulRes.status === 'fulfilled' && consulRes.value?.data) {
        const consultas = Array.isArray(consulRes.value.data) ? consulRes.value.data : [];
        if (consultas.length > 0) {
          consultas.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
          setUltimaConsulta(consultas[0]);
          // Load cita info for last consultation
          if (consultas[0].citaId) {
            try {
              const citaRes = await agendaService.getCitasPorPaciente(pacienteId);
              if (citaRes?.success) {
                const citas = Array.isArray(citaRes.data) ? citaRes.data : [];
                setUltimaCitaInfo(citas.find(c => c.id === consultas[0].citaId) || null);
              }
            } catch { /* silent */ }
          }
        }
      }
    } catch (err) {
      console.error('Error loading resumen data:', err);
    }
  };

  const toggleExpandTratamiento = async (trId) => {
    if (expandedTratamiento === trId) {
      setExpandedTratamiento(null);
      return;
    }
    setExpandedTratamiento(trId);
    if (!sesionesTratamiento[trId]) {
      setLoadingSesiones(trId);
      try {
        const res = await tratamientoService.getHistorialClinico(trId);
        if (res?.success) {
          const list = Array.isArray(res.data) ? res.data : res.data?.content || [];
          list.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
          setSesionesTratamiento(prev => ({ ...prev, [trId]: list }));
        }
      } catch { /* silent */ }
      finally { setLoadingSesiones(null); }
    }
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
      if (!result.success) throw new Error(result.message || t('error_saving'));
      const refreshed = await historiaClinicaService.getByPaciente(pacienteId);
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

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return '-';
    const hoy = new Date();
    const nac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const mes = hoy.getMonth() - nac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
    return t('edad_anios', { edad });
  };

  const getSexoLabel = (sexo) => {
    if (sexo === 'M') return t('masculino');
    if (sexo === 'F') return t('femenino');
    return '-';
  };

  const activeAntecedentes = getActiveAntecedentes(historia);

  const startEditMedidas = () => {
    setPesoEdit(paciente?.peso ?? '');
    setEstaturaEdit(paciente?.estatura ?? '');
    setErrorMedidas('');
    setSavedMedidas(false);
    setEditingMedidas(true);
  };

  const cancelEditMedidas = () => {
    setEditingMedidas(false);
    setErrorMedidas('');
    setSavedMedidas(false);
  };

  // Los inputs muestran lbs / in si el sistema está en US; se convierte a
  // métrico antes de enviar.
  const changePesoEdit = (v) => {
    if (v === '') { setPesoEdit(''); return; }
    const n = parseFloat(v);
    if (Number.isNaN(n)) return;
    setPesoEdit(isUS ? parseFloat((n * LBS_TO_KG).toFixed(1)) : n);
  };

  const changeEstaturaEdit = (v) => {
    if (v === '') { setEstaturaEdit(''); return; }
    const n = parseFloat(v);
    if (Number.isNaN(n)) return;
    setEstaturaEdit(isUS ? Math.round(n * IN_TO_CM) : n);
  };

  const saveMedidas = async () => {
    if (!pacienteId) return;
    setSavingMedidas(true);
    setErrorMedidas('');
    try {
      const pesoNum = pesoEdit === '' || pesoEdit === null ? null : parseFloat(pesoEdit);
      const estaturaNum = estaturaEdit === '' || estaturaEdit === null ? null : parseFloat(estaturaEdit);
      const pesoLimpio = isNaN(pesoNum) ? null : pesoNum;
      const estaturaLimpia = isNaN(estaturaNum) ? null : estaturaNum;

      const res = await pacienteService.updateSignosVitales(pacienteId, {
        peso: pesoLimpio,
        estatura: estaturaLimpia,
      });
      if (res?.success) {
        onPacienteUpdated?.({
          ...paciente,
          peso: pesoLimpio,
          estatura: estaturaLimpia,
        });
        setEditingMedidas(false);
        setSavedMedidas(true);
        setTimeout(() => setSavedMedidas(false), 2500);
      } else {
        setErrorMedidas(res?.message || t('error_guardar'));
      }
    } catch (err) {
      setErrorMedidas(err?.message || t('error_guardar'));
    } finally {
      setSavingMedidas(false);
    }
  };

  const fichaFields = [
    { label: t('edad'), value: calcularEdad(paciente.fechaNacimiento) },
    { label: t('gender'), value: getSexoLabel(paciente.sexo) },
    { label: t('estado_civil_short'), value: paciente.estadoCivil || '-' },
    { label: t('occupation'), value: paciente.ocupacion || '-' },
  ];

  return (
    <div className="rsum">
      {typeof paciente?.licenciaConducir === 'string' && paciente.licenciaConducir.startsWith('AUTO') && (
        <div className="rsum__warning">
          <AlertTriangle size={16} />
          <span>{t('id_auto_warning')}</span>
        </div>
      )}

      {/* ── Ficha del Paciente ── */}
      <div className="workspace-card">
        <div className="rsum__card-header">
          <h3 className="workspace-card__title"><User size={16} /> {t('identificacion_cliente')}</h3>
          {!editingMedidas ? (
            <button type="button" className="btn btn--ghost btn--sm" onClick={startEditMedidas}>
              <Edit2 size={14} /> {t('editar_medidas', 'Editar medidas')}
            </button>
          ) : (
            <div className="rsum__medidas-actions">
              <button type="button" className="btn btn--secondary btn--sm" onClick={cancelEditMedidas} disabled={savingMedidas}>
                <X size={14} /> {t('cancel', 'Cancelar')}
              </button>
              <button type="button" className="btn btn--primary btn--sm" onClick={saveMedidas} disabled={savingMedidas}>
                {savingMedidas ? <Loader2 size={14} className="spinner" /> : <Save size={14} />} {t('save', 'Guardar')}
              </button>
            </div>
          )}
        </div>

        {savedMedidas && <div className="rsum__medidas-ok">{t('guardado', 'Guardado')}</div>}
        {errorMedidas && <div className="rsum__medidas-error">{errorMedidas}</div>}

        <div className="rsum__grid">
          {editingMedidas ? (
            <>
              <div className="rsum__field">
                <span className="rsum__label">{t('peso')}</span>
                <div className="rsum__medidas-input">
                  <input
                    type="tel"
                    inputMode="decimal"
                    className="form-input"
                    value={pesoEnUnidad(pesoEdit)}
                    onChange={(e) => changePesoEdit(e.target.value)}
                    placeholder="0"
                  />
                  <span className="rsum__medidas-unit">{pesoUnidad}</span>
                </div>
              </div>
              <div className="rsum__field">
                <span className="rsum__label">{t('estatura')}</span>
                <div className="rsum__medidas-input">
                  <input
                    type="tel"
                    inputMode="decimal"
                    className="form-input"
                    value={tallaEnUnidad(estaturaEdit)}
                    onChange={(e) => changeEstaturaEdit(e.target.value)}
                    placeholder="0"
                  />
                  <span className="rsum__medidas-unit">{tallaUnidad}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="rsum__field">
                <span className="rsum__label">{t('peso')}</span>
                <span className="rsum__value">{paciente.peso ? `${pesoEnUnidad(paciente.peso)} ${pesoUnidad}` : '-'}</span>
              </div>
              <div className="rsum__field">
                <span className="rsum__label">{t('estatura')}</span>
                <span className="rsum__value">{paciente.estatura ? `${tallaEnUnidad(paciente.estatura)} ${tallaUnidad}` : '-'}</span>
              </div>
            </>
          )}
          {fichaFields.map((f) => (
            <div key={f.label} className="rsum__field">
              <span className="rsum__label">{f.label}</span>
              <span className="rsum__value">{f.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Última Consulta ── */}
      <div className="workspace-card">
        <h3 className="workspace-card__title"><ClipboardList size={16} /> {t('ultima_consulta')}</h3>
        {ultimaConsulta ? (
          <div className="rsum__fields">
            <div className="rsum__row">
              <span className="rsum__label">{t('fecha_label')}</span>
              <span className="rsum__value">{formatFechaHora(ultimaConsulta.fecha)}</span>
            </div>
            {ultimaCitaInfo && (
              <div className="rsum__row">
                <span className="rsum__label">{t('cita', { ns: 'common' })}</span>
                <span className="rsum__value">{ultimaCitaInfo.tipoCitaNombre || ultimaCitaInfo.motivo || '-'}</span>
              </div>
            )}
            <div className="rsum__row">
              <span className="rsum__label">{t('motivo')}</span>
              <span className="rsum__value">{ultimaConsulta.motivo || '-'}</span>
            </div>
            {ultimaConsulta.diagnosticoLista && (
              <div className="rsum__row">
                <span className="rsum__label">{t('diagnostico')}</span>
                <span className="rsum__value">
                  {typeof ultimaConsulta.diagnosticoLista === 'string'
                    ? ultimaConsulta.diagnosticoLista
                    : Array.isArray(ultimaConsulta.diagnosticoLista)
                      ? ultimaConsulta.diagnosticoLista.map((d) => d.descripcion || d).join(', ')
                      : '-'}
                </span>
              </div>
            )}
            {ultimaConsulta.evolucionMejoria && (
              <div className="rsum__row">
                <span className="rsum__label">{t('evolucion')}</span>
                <span className="rsum__value rsum__value--muted">{ultimaConsulta.evolucionMejoria}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="rsum__empty">{t('sin_consultas')}</p>
        )}
      </div>

      {/* ── Antecedentes Médicos ── */}
      <div className="workspace-card">
        <div className="rsum__header">
          <h3 className="workspace-card__title" style={{ margin: 0, border: 'none', padding: 0 }}>{t('medical_history_title')}</h3>
          <div className="rsum__actions">
            {savedAntecedentes && <span className="rsum__saved">{t('saving')} ✓</span>}
            {errorAntecedentes && <span className="rsum__error">{errorAntecedentes}</span>}
            {!editingAntecedentes ? (
              <button className="btn btn--ghost btn--sm" onClick={startEditAntecedentes} disabled={!historia}>
                <Edit2 size={14} /> {t('editar')}
              </button>
            ) : (
              <>
                <button className="btn btn--ghost btn--sm" onClick={cancelEditAntecedentes}>
                  <X size={14} /> {t('cancel', { ns: 'common' })}
                </button>
                <button className="btn btn--primary btn--sm" onClick={saveAntecedentes} disabled={savingAntecedentes}>
                  {savingAntecedentes ? <Loader2 size={14} className="spinner" /> : <Save size={14} />}
                  {savingAntecedentes ? t('saving') : t('save', { ns: 'common' })}
                </button>
              </>
            )}
          </div>
        </div>

        {historia ? (
          editingAntecedentes ? (
            <AntecedentesEditor
              values={antecedentesValues}
              onChange={(key, val) => setAntecedentesValues((prev) => ({ ...prev, [key]: val }))}
              compact
            />
          ) : activeAntecedentes.length === 0 ? (
            <p className="rsum__empty">{t('sin_historia_clinica')}</p>
          ) : (
            <div className="rsum__list">
              {activeAntecedentes.map(({ key, labelKey, label, value }) => (
                <div key={key} className="rsum__item">
                  <span className="rsum__dot" />
                  <span className="rsum__item-label">{t(labelKey)}</span>
                  {value !== 'Si' && value !== 'Yes' && <span className="rsum__item-detail">{value}</span>}
                </div>
              ))}
            </div>
          )
        ) : (
          <p className="rsum__empty">{t('sin_historia_clinica')}</p>
        )}
      </div>

      {/* ── Footer: 2 columnas ── */}
      <div className="rsum__footer">
        {/* Tratamientos Activos */}
        <div className="workspace-card">
          <h3 className="workspace-card__title"><Activity size={16} /> {t('tab_tratamientos')}</h3>
          {tratamientosActivos.length === 0 ? (
            <p className="rsum__empty">{t('sin_tratamientos_registrados')}</p>
          ) : (
            <div className="rsum__tratamientos-list">
              {tratamientosActivos.map((tr) => {
                const sesiones = tr.sesionesRealizadas || 0;
                const total = tr.sesionesPlaneadas || 0;
                const progreso = total > 0 ? sesiones / total : 0;
                const isExpanded = expandedTratamiento === tr.id;
                const sesionesTr = sesionesTratamiento[tr.id] || [];
                const isLoading = loadingSesiones === tr.id;

                return (
                  <div key={tr.id} className={`rsum__tratamiento-card ${isExpanded ? 'rsum__tratamiento-card--expanded' : ''}`}>
                    <div className="rsum__tratamiento-header" onClick={() => toggleExpandTratamiento(tr.id)}>
                      <div className="rsum__tratamiento-info">
                        <span className="rsum__tratamiento-name">{getTreatmentLabel(tr.tipoTratamiento) || tr.tipoSesionTratamiento?.nombre || t('tratamiento')}</span>
                        <div className="rsum__tratamiento-meta">
                          <span className={`rsum__badge rsum__badge--${tr.estado === 'EN_CURSO' ? 'active' : tr.estado === 'FINALIZADO' ? 'completed' : 'pending'}`}>
                            {tr.estado?.replace('_', ' ')}
                          </span>
                          {tr.costoTotal > 0 && (
                            <span className="rsum__tratamiento-costo"><DollarSign size={12} /> {formatCurrency(tr.costoTotal)}</span>
                          )}
                        </div>
                      </div>
                      <div className="rsum__tratamiento-right">
                        <div className="rsum__tratamiento-progress">
                          <div className="rsum__tratamiento-progress-bar">
                            <div className="rsum__tratamiento-progress-fill" style={{ width: `${progreso * 100}%` }} />
                          </div>
                          <span className="rsum__tratamiento-progress-text">{sesiones}/{total}</span>
                        </div>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="rsum__tratamiento-detail">
                        {isLoading ? (
                          <div className="rsum__tratamiento-loading"><Loader2 size={16} className="spinner" /> {t('loading', { ns: 'common' })}</div>
                        ) : sesionesTr.length > 0 ? (
                          <div className="rsum__sesiones-list">
                            {sesionesTr.map((s) => (
                              <div key={s.id} className="rsum__sesion-item">
                                <div className="rsum__sesion-header">
                                  <span className="rsum__sesion-num">{t('sesion_numero', { number: s.numeroSesion || '?' })}</span>
                                  <span className="rsum__sesion-fecha"><Clock size={12} /> {formatSesionFecha(s.fecha)}</span>
                                  {s.costoSesion > 0 && <span className="rsum__sesion-costo">{formatCurrency(s.costoSesion)}</span>}
                                </div>
                                {s.evolucion && <p className="rsum__sesion-evolucion">{s.evolucion}</p>}
                                {s.observaciones && <p className="rsum__sesion-obs">{s.observaciones}</p>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="rsum__empty">{t('sin_sesiones')}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Próxima Cita */}
        <div className="workspace-card">
          <h3 className="workspace-card__title"><Calendar size={16} /> {t('agendar_cita')}</h3>
          <div className="rsum__fields">
            {proximaCita ? (
              <>
                <div className="rsum__row">
                  <span className="rsum__label">{t('fecha_label')}</span>
                  <span className="rsum__value">{formatFecha(proximaCita.fecha)}</span>
                </div>
                <div className="rsum__row">
                  <span className="rsum__label">{t('time', { ns: 'common' })}</span>
                  <span className="rsum__value">{formatHora(proximaCita.hora, proximaCita.fecha)}</span>
                </div>
                <div className="rsum__row">
                  <span className="rsum__label">{t('type', { ns: 'common' })}</span>
                  <span className="rsum__value">{proximaCita.tipoCitaNombre || proximaCita.tipo?.nombre || '-'}</span>
                </div>
                {proximaCita.motivo && (
                  <div className="rsum__row">
                    <span className="rsum__label">{t('motivo')}</span>
                    <span className="rsum__value rsum__value--muted">{proximaCita.motivo}</span>
                  </div>
                )}
              </>
            ) : (
              <p className="rsum__empty">{t('sin_agenda')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
