import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Calendar, Clock, User, FileText, CheckCircle, AlertCircle, Loader2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import agendaService from '../../services/agendaService';
import { pacienteService } from '../../services/pacienteService';
import { tratamientoService } from '../../services/tratamientoService';
import { getLADateString, nowLA } from '../../utils/laTimezone';
import { formatNombre } from '../../utils/fullName';
import { zonaIANA, horaMostrar, horaMostrarMin } from '../../utils/zonaHoraria';
import { getTreatmentLabel } from '../../config/attentionTypes';

function extractList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.content && Array.isArray(data.content)) return data.content;
  if (data.data) return extractList(data.data);
  return [];
}

function normalizeTime(t) {
  if (!t) return '';
  return String(t).substring(0, 5);
}

function fullTime(t) {
  if (!t) return '';
  const s = String(t);
  return s.length >= 5 ? s.substring(0, 8) : s;
}

function isPastSlot(fechaStr, horaInicio) {
  const today = getLADateString();
  if (fechaStr !== today) return false;
  const [h, m] = normalizeTime(horaInicio).split(':').map(Number);
  const laStr = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit', hour12: true });
  const match = laStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return false;
  let laH = parseInt(match[1]);
  const laM = parseInt(match[2]);
  if (match[3].toUpperCase() === 'PM' && laH !== 12) laH += 12;
  if (match[3].toUpperCase() === 'AM' && laH === 12) laH = 0;
  const nowMin = laH * 60 + laM;
  return (h * 60 + m) <= nowMin;
}

function isPastDate(fechaStr) {
  return fechaStr < getLADateString();
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function formatDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function formatDiaLargo(fechaStr, t) {
  const d = new Date(fechaStr + 'T12:00:00');
  const dayKeys = ['day_sunday', 'day_monday', 'day_tuesday', 'day_wednesday', 'day_thursday', 'day_friday', 'day_saturday'];
  const monthKeys = ['month_enero', 'month_febrero', 'month_marzo', 'month_abril', 'month_mayo', 'month_junio', 'month_julio', 'month_agosto', 'month_septiembre', 'month_octubre', 'month_noviembre', 'month_diciembre'];
  return `${t(dayKeys[d.getDay()], { ns: 'agenda' })} ${d.getDate()} de ${t(monthKeys[d.getMonth()], { ns: 'agenda' })}`;
}

// Agrupa los slots por hora para mostrarlos como una grilla de chips ordenada.
function agruparPorHora(slots) {
  const grupos = [];
  const mapa = new Map();
  for (const slot of slots) {
    const hora = normalizeTime(slot.inicio).substring(0, 2);
    if (!mapa.has(hora)) {
      mapa.set(hora, []);
      grupos.push(hora);
    }
    mapa.get(hora).push(slot);
  }
  return grupos.map(hora => ({ hora, slots: mapa.get(hora) }));
}

export default function CitaSchedulerModal({ isOpen, onClose, paciente: initialPaciente, tratamientoId, sesionId, tratamientosSinCita = [], onCitaCreada, initialMotivo }) {
  const { t } = useTranslation('agenda');
  const [laTime, setLaTime] = useState(() => new Date(new Date().toLocaleString('en-US', { timeZone: zonaIANA() })));
  const [doctoras, setDoctoras] = useState([]);
  const [doctoraId, setDoctoraId] = useState('');
  const [doctoraName, setDoctoraName] = useState('');
  const [tiposCita, setTiposCita] = useState([]);
  const [tipoCitaId, setTipoCitaId] = useState('');

  const todayStr = getLADateString();
  const [todayYear, todayMonth] = todayStr.split('-').map(Number);
  const [calMonth, setCalMonth] = useState(todayMonth - 1);
  const [calYear, setCalYear] = useState(todayYear);
  const [slotsPorDia, setSlotsPorDia] = useState({});
  const [loadingDay, setLoadingDay] = useState(false);
  const [monthLoading, setMonthLoading] = useState(false);

  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [slotSeleccionado, setSlotSeleccionado] = useState(null);

  const [notas, setNotas] = useState('');
  const [motivo, setMotivo] = useState(initialMotivo || '');
  const [tratamientoSel, setTratamientoSel] = useState(tratamientoId || null);
  const [tratamientosLocal, setTratamientosLocal] = useState(tratamientosSinCita || []);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  const [paciente, setPaciente] = useState(initialPaciente || null);
  const [pacienteQuery, setPacienteQuery] = useState('');
  const [pacienteResults, setPacienteResults] = useState([]);
  const [searchingPaciente, setSearchingPaciente] = useState(false);
  const [showPacienteSearch, setShowPacienteSearch] = useState(false);

  const calDays = useMemo(() => {
    const total = getDaysInMonth(calYear, calMonth);
    const firstDay = getFirstDayOfMonth(calYear, calMonth);
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= total; d++) days.push(d);
    return days;
  }, [calYear, calMonth]);

  const tipoSeleccionado = useMemo(() => {
    return tiposCita.find(tipo => tipo.id?.toString() === tipoCitaId?.toString()) || null;
  }, [tiposCita, tipoCitaId]);

  const duracion = tipoSeleccionado?.duracionMinutos || 30;
  // Grilla de inicios de turno cada 5 min (independiente de la duración de la cita).
  const paso = 5;

  useEffect(() => {
    if (isOpen) {
      loadDoctoras();
      loadTiposCita();
      setCalMonth(todayMonth - 1);
      setCalYear(todayYear);
      setDoctoraId('');
      setDoctoraName('');
      setTipoCitaId('');
      setDiaSeleccionado(null);
      setSlotSeleccionado(null);
      setNotas('');
      setMotivo(initialMotivo || '');
      setTratamientoSel(tratamientoId || null);
      setError('');
      setExito(false);
      setPaciente(initialPaciente || null);
      setPacienteQuery('');
      setPacienteResults([]);
      setShowPacienteSearch(!initialPaciente);
      setLoadingDay(false);
    }
  }, [isOpen, initialPaciente]);

  // Tratamientos del paciente SIN cita programada vigente. Si vienen por prop (workspace)
  // los usa; si no, los carga y calcula aquí para que funcione en todos los modales.
  const calcSinCita = (tratamientos, citas) => {
    const hoy = getLADateString();
    const ahoraMin = nowLA().getHours() * 60 + nowLA().getMinutes();
    const esCitaFutura = (c) => {
      if (c.fecha > hoy) return true;
      if (c.fecha < hoy) return false;
      if (c.hora) { const [h, m] = c.hora.split(':').map(Number); return (h * 60 + m) > ahoraMin; }
      return true;
    };
    const activos = (tratamientos || []).filter((tr) => ['EN_CURSO', 'PROGRAMADO', 'PENDIENTE'].includes(tr.estado));
    return activos.filter((tr) => {
      const citaFutura = citas.some((c) =>
        c.tratamientoId === tr.id && ['pendiente', 'solicitada', 'programada', 'confirmada'].includes(c.estado) && esCitaFutura(c)
      );
      if (citaFutura) return false;
      const sinReprogramar = citas.some((c) => c.tratamientoId === tr.id && ['no_show', 'cancelada'].includes(c.estado));
      return !sinReprogramar;
    });
  };

  useEffect(() => {
    if (!paciente?.id) return;
    if (tratamientosSinCita.length > 0) { setTratamientosLocal(tratamientosSinCita); return; }
    Promise.all([
      tratamientoService.listByPaciente(paciente.id).catch(() => ({ success: false })),
      agendaService.getCitasPorPaciente(paciente.id).catch(() => ({ success: false })),
    ]).then(([tRes, cRes]) => {
      const trat = tRes?.success ? (tRes.data?.content || tRes.data || []) : [];
      const citas = cRes?.success ? (cRes.data || []) : [];
      setTratamientosLocal(calcSinCita(trat, citas));
    }).catch(() => setTratamientosLocal([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paciente?.id]);

  const listaTratamientos = tratamientosSinCita.length > 0 ? tratamientosSinCita : tratamientosLocal;

  const loadDayData = useCallback(async (fechaStr) => {
    if (!doctoraId || !fechaStr) return;
    setLoadingDay(true);
    try {
      const res = await agendaService.getDisponibilidadDia(doctoraId, fechaStr, duracion, true, paso);
      const allSlots = extractList(res);
      console.log('[Scheduler] Day API:', { fechaStr, doctoraId, duracion, paso, totalSlots: allSlots.length });
      setSlotsPorDia(prev => ({ ...prev, [fechaStr]: allSlots }));
    } catch (err) {
      console.error('[Scheduler] Error:', err);
      setSlotsPorDia(prev => ({ ...prev, [fechaStr]: [] }));
    } finally {
      setLoadingDay(false);
    }
  }, [doctoraId, duracion, paso]);

  // Precarga la disponibilidad de todo el mes visible cuando cambia doctora/duración/mes.
  const preloadMonth = useCallback(async (year, month) => {
    if (!doctoraId) return {};
    const total = getDaysInMonth(year, month);
    const requests = [];
    for (let d = 1; d <= total; d++) {
      const fechaStr = formatDateStr(year, month, d);
      if (isPastDate(fechaStr)) continue;
      requests.push(
        agendaService.getDisponibilidadDia(doctoraId, fechaStr, duracion, true, paso)
          .then(res => ({ fecha: fechaStr, res }))
          .catch(() => ({ fecha: fechaStr, res: { success: false, data: [] } }))
      );
    }
    const results = await Promise.all(requests);
    const map = {};
    for (const { fecha, res } of results) {
      map[fecha] = extractList(res);
    }
    setSlotsPorDia(prev => ({ ...prev, ...map }));
    return map;
  }, [doctoraId, duracion, paso]);

  useEffect(() => {
    if (!doctoraId || !isOpen) return;
    let cancelled = false;
    const startPreload = async () => {
      setMonthLoading(true);
      const map = await preloadMonth(calYear, calMonth);
      if (cancelled) return;
      const today = getLADateString();
      let candidato = null;
      for (let d = 1; d <= getDaysInMonth(calYear, calMonth); d++) {
        const fechaStr = formatDateStr(calYear, calMonth, d);
        if (fechaStr < today) continue;
        if (map[fechaStr] && map[fechaStr].length > 0) { candidato = fechaStr; break; }
      }
      if (candidato) {
        setDiaSeleccionado(candidato);
        setSlotSeleccionado(null);
      }
      setMonthLoading(false);
    };
    startPreload();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctoraId, isOpen, duracion, calYear, calMonth]);

  useEffect(() => {
    setSlotSeleccionado(null);
  }, [tipoCitaId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setLaTime(new Date(new Date().toLocaleString('en-US', { timeZone: zonaIANA() })));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const laTimeStr = laTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const loadDoctoras = async () => {
    try {
      const res = await agendaService.getDoctores();
      const list = extractList(res);
      if (list.length > 0) {
        setDoctoras(list);
        setDoctoraId(list[0].id?.toString() || '');
        setDoctoraName(list[0].nombre || `${t('doctora_id', { id: list[0].id })}`);
      }
    } catch {
      setDoctoras([]);
    }
  };

  const loadTiposCita = async () => {
    try {
      const res = await agendaService.getTiposCita();
      setTiposCita(extractList(res));
    } catch {
      setTiposCita([]);
    }
  };

  const slotsDelDia = useMemo(() => {
    if (!diaSeleccionado) return [];
    const forDay = slotsPorDia[diaSeleccionado] || [];
    console.log('[Scheduler] Slots for day:', { diaSeleccionado, total: forDay.length });
    return forDay
      .filter(slot => !isPastSlot(diaSeleccionado, slot.inicio))
      .sort((a, b) => normalizeTime(a.inicio).localeCompare(normalizeTime(b.inicio)));
  }, [diaSeleccionado, slotsPorDia]);

  const searchPaciente = async (query) => {
    if (!query || query.length < 2) { setPacienteResults([]); return; }
    setSearchingPaciente(true);
    try {
      const res = await pacienteService.search(query);
      setPacienteResults(extractList(res));
    } catch {
      setPacienteResults([]);
    } finally {
      setSearchingPaciente(false);
    }
  };

  const handlePrevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };

  const handleNextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const handleConfirmar = async () => {
    if (!slotSeleccionado || !doctoraId || !diaSeleccionado || !paciente?.id) return;
    setSending(true);
    setError('');
    try {
      const res = await agendaService.crearCita({
        pacienteId: paciente.id,
        usuarioId: parseInt(doctoraId),
        fecha: diaSeleccionado,
        hora: fullTime(slotSeleccionado.inicio),
        duracionMinutos: duracion,
        tipoCitaId: tipoCitaId || undefined,
        tratamientoId: tratamientoId || tratamientoSel || undefined,
        sesionId: sesionId || undefined,
        motivo: motivo || ((tratamientoId || tratamientoSel) ? undefined : (tipoSeleccionado?.nombre || t('consulta_default'))),
        notas: notas || undefined,
        prioridad: 'NORMAL',
      });
      const citaCreada = res?.data || res;
      setExito(true);
      setTimeout(() => {
        onCitaCreada?.(citaCreada);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || t('error_crear_cita'));
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const fullName = paciente ? formatNombre(paciente) : '';

  const monthKeys = ['month_enero', 'month_febrero', 'month_marzo', 'month_abril', 'month_mayo', 'month_junio', 'month_julio', 'month_agosto', 'month_septiembre', 'month_octubre', 'month_noviembre', 'month_diciembre'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content cita-scheduler" onClick={e => e.stopPropagation()}>
        <div className="cita-scheduler__header">
          <h3><Calendar size={20} /> {t('agendar_proxima')}</h3>
          <div className="cita-scheduler__clock">
            <Clock size={14} />
            <span>{laTimeStr}</span>
          </div>
          <button className="cita-scheduler__close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="cita-scheduler__body">
          {exito ? (
            <div className="cita-scheduler__exito">
              <CheckCircle size={48} />
              <h4>{t('cita_agendada')}</h4>
              <p>{fullName} — {formatDiaLargo(diaSeleccionado, t)} a las {horaMostrar(normalizeTime(slotSeleccionado.inicio), slotSeleccionado.fecha || diaSeleccionado)}</p>
            </div>
          ) : (
            <>
              <div className="cita-scheduler__paciente">
                <User size={16} />
                {paciente ? (
                  <>
                    <span>{formatNombre(paciente)}</span>
                    {!initialPaciente && (
                      <button className="cita-scheduler__paciente-change" onClick={() => { setPaciente(null); setShowPacienteSearch(true); }}>
                        {t('cambiar', { ns: 'common' })}
                      </button>
                    )}
                  </>
                ) : (
                  <span className="cita-scheduler__paciente-placeholder">{t('seleccionar_cliente')}</span>
                )}
              </div>

              {showPacienteSearch && !paciente && (
                <div className="cita-scheduler__field">
                  <label><Search size={14} /> {t('buscar_cliente')}</label>
                  <input
                    type="text"
                    value={pacienteQuery}
                    onChange={e => { setPacienteQuery(e.target.value); searchPaciente(e.target.value); }}
                    placeholder={t('buscar_placeholder')}
                    autoFocus
                  />
                  {searchingPaciente && <span className="cita-scheduler__search-hint"><Loader2 size={12} className="spinner" /> {t('cargando')}</span>}
                  {pacienteResults.length > 0 && (
                    <div className="cita-scheduler__paciente-results">
                      {pacienteResults.slice(0, 5).map(p => (
                        <button
                          key={p.id}
                          className="cita-scheduler__paciente-option"
                          onClick={() => { setPaciente(p); setShowPacienteSearch(false); setPacienteResults([]); setPacienteQuery(''); }}
                        >
                          <User size={14} />
                          <span>{formatNombre(p)}</span>
                          <span className="cita-scheduler__paciente-doc">{p.numeroDocumento || ''}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {pacienteQuery.length >= 2 && !searchingPaciente && pacienteResults.length === 0 && (
                    <span className="cita-scheduler__search-hint">{t('sin_resultados')}</span>
                  )}
                </div>
              )}

              {doctoras.length > 1 && (
                <div className="cita-scheduler__field">
                  <label>{t('scheduler_doctor')}</label>
                  <select value={doctoraId} onChange={e => {
                    const d = doctoras.find(x => x.id?.toString() === e.target.value);
                    setDoctoraId(e.target.value);
                    setDoctoraName(d?.nombre || '');
                  }}>
                    {doctoras.map(d => (
                      <option key={d.id} value={d.id}>{d.nombre || t('doctora_id', { id: d.id })}</option>
                    ))}
                  </select>
                </div>
              )}

              {!tratamientoId && !tratamientoSel && (
                <div className="cita-scheduler__field">
                  <label><FileText size={14} /> {t('tipo_cita', { ns: 'patients' })}</label>
                  <select value={tipoCitaId} onChange={e => setTipoCitaId(e.target.value)}>
                    <option value="">{t('seleccionar_tipo')}</option>
                    {tiposCita.map(tipo => (
                      <option key={tipo.id} value={tipo.id}>{tipo.nombre} — {tipo.duracionMinutos} min</option>
                    ))}
                  </select>
                </div>
              )}

              {tipoSeleccionado && (
                <div className="cita-scheduler__tipo-info">
                  <Clock size={14} />
                  <span>{tipoSeleccionado.nombre} — {tipoSeleccionado.duracionMinutos} {t('minutos', { ns: 'common' })}</span>
                </div>
              )}

              <div className="cita-scheduler__field cita-scheduler__field--full">
                <label><FileText size={14} /> {t('motivo_consulta')} *</label>
                <textarea
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  placeholder={t('motivo_placeholder')}
                  rows={2}
                  required
                />
              </div>

              {!tratamientoId && listaTratamientos.length > 0 && (
                <div className="cita-scheduler__tratamientos">
                  <label className="cita-scheduler__tratamientos-label">{t('tratamientos_sin_cita')}</label>
                  <div className="cita-scheduler__tratamientos-list">
                    <button
                      type="button"
                      className={`cita-scheduler__tratamiento-opt ${!tratamientoSel ? 'cita-scheduler__tratamiento-opt--active' : ''}`}
                      onClick={() => { setTratamientoSel(null); if (tratamientoSel) setMotivo(''); }}
                    >
                      <FileText size={14} /> {t('nueva_consulta')}
                    </button>
                    {listaTratamientos.map((tr) => {
                      const activo = tratamientoSel === tr.id;
                      return (
                        <button
                          type="button"
                          key={tr.id}
                          className={`cita-scheduler__tratamiento-opt ${activo ? 'cita-scheduler__tratamiento-opt--active' : ''}`}
                          onClick={() => { setTratamientoSel(tr.id); setMotivo(t('tratamiento_sesion_motivo', { nombre: getTreatmentLabel(tr.tipoTratamiento) })); }}
                        >
                          <Calendar size={14} /> {getTreatmentLabel(tr.tipoTratamiento)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="cita-scheduler__layout">
                <div className="cita-scheduler__calendario">
                  <div className="cita-scheduler__cal-nav">
                    <button onClick={handlePrevMonth} className="cita-scheduler__cal-btn"><ChevronLeft size={16} /></button>
                    <span className="cita-scheduler__cal-title">{t(monthKeys[calMonth])} {calYear}</span>
                    <button onClick={handleNextMonth} className="cita-scheduler__cal-btn"><ChevronRight size={16} /></button>
                  </div>

                  <div className="cita-scheduler__cal-header">
                    {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map(d => (
                      <div key={d} className="cita-scheduler__cal-dia-nombre">{d}</div>
                    ))}
                  </div>

                  <div className="cita-scheduler__cal-body">
                    <div className="cita-scheduler__cal-grid">
                      {calDays.map((day, i) => {
                        if (day === null) return <div key={`empty-${i}`} className="cita-scheduler__cal-dia cita-scheduler__cal-dia--empty" />;
                        const fechaStr = formatDateStr(calYear, calMonth, day);
                        const slots = slotsPorDia[fechaStr];
                        const loaded = slots !== undefined;
                        const disponibles = loaded ? slots.filter(s => !isPastSlot(fechaStr, s.inicio)).length : 0;
                        const esHoy = todayStr === fechaStr;
                        const esPasado = isPastDate(fechaStr);
                        const seleccionado = diaSeleccionado === fechaStr;
                        const sinAgenda = loaded && slots.length === 0;
                        const tieneCupos = disponibles > 0;

                        let className = 'cita-scheduler__cal-dia';
                        if (esPasado) className += ' cita-scheduler__cal-dia--pasado';
                        else if (seleccionado) className += ' cita-scheduler__cal-dia--selected';
                        else if (tieneCupos) className += ' cita-scheduler__cal-dia--disponible';
                        else if (sinAgenda) className += ' cita-scheduler__cal-dia--lleno';
                        else className += ' cita-scheduler__cal-dia--sin-agenda';
                        if (esHoy) className += ' cita-scheduler__cal-dia--hoy';

                        return (
                          <button
                            key={i}
                            className={className}
                            onClick={() => {
                              setDiaSeleccionado(fechaStr);
                              setSlotSeleccionado(null);
                              if (!loaded && !esPasado) loadDayData(fechaStr);
                            }}
                            disabled={esPasado}
                          >
                            <span className="cita-scheduler__cal-num">{day}</span>
                            {!esPasado && loaded && (
                              <span className={`cita-scheduler__cal-dot ${tieneCupos ? 'cita-scheduler__cal-dot--ok' : 'cita-scheduler__cal-dot--full'}`} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {monthLoading && (
                      <div className="cita-scheduler__cal-loading">
                        <Loader2 size={22} className="spinner" />
                        <span>{t('cargando')}</span>
                      </div>
                    )}
                  </div>

                  <div className="cita-scheduler__cal-legend">
                    <span><span className="cita-scheduler__legend-dot cita-scheduler__legend-dot--ok" /> {t('con_cupos')}</span>
                    <span><span className="cita-scheduler__legend-dot cita-scheduler__legend-dot--full" /> {t('lleno')}</span>
                    <span><span className="cita-scheduler__legend-dot cita-scheduler__legend-dot--empty" /> {t('sin_agenda')}</span>
                  </div>
                </div>

                <div className="cita-scheduler__horarios">
                  {loadingDay && diaSeleccionado && !slotsPorDia[diaSeleccionado] ? (
                    <div className="cita-scheduler__loading">
                      <Loader2 size={20} className="spinner" /> {t('cargando')}
                    </div>
                  ) : diaSeleccionado ? (
                    <>
                      <h4 className="cita-scheduler__horarios-titulo">
                        {formatDiaLargo(diaSeleccionado, t)}
                      </h4>
                      {slotsDelDia.length === 0 ? (
                        <div className="cita-scheduler__empty">
                          <AlertCircle size={20} />
                          <p>{t('sin_horarios_disp')}</p>
                        </div>
                      ) : (
                        <div className="cita-scheduler__slots">
                          {agruparPorHora(slotsDelDia).map(({ hora, slots }) => (
                            <div key={hora} className="cita-scheduler__hora-grupo">
                              <span className="cita-scheduler__hora-titulo">{horaMostrarMin(parseInt(hora, 10) * 60, diaSeleccionado)}</span>
                              <div className="cita-scheduler__hora-chips">
                                {slots.map((slot, i) => {
                                  const estado = slot.estado;
                                  const esDisponible = estado === 'DISPONIBLE';
                                  const esSeleccionado = slotSeleccionado?.inicio === slot.inicio && slotSeleccionado?.fecha === slot.fecha;
                                  const inicio = normalizeTime(slot.inicio);
                                  const fin = normalizeTime(slot.fin);
                                  const esPasado = isPastSlot(diaSeleccionado, slot.inicio);
                                  const deshabilitado = !esDisponible || esPasado;
                                  return (
                                    <button
                                      key={i}
                                      className={`cita-scheduler__slot cita-scheduler__slot--${estado.toLowerCase()} ${esSeleccionado ? 'cita-scheduler__slot--selected' : ''} ${esPasado ? 'cita-scheduler__slot--pasado' : ''}`}
                                      disabled={deshabilitado}
                                      onClick={() => !deshabilitado && setSlotSeleccionado(slot)}
                                      title={`${horaMostrar(inicio, slot.fecha || diaSeleccionado)} — ${horaMostrar(fin, slot.fecha || diaSeleccionado)}`}
                                    >
                                      <span className="cita-scheduler__slot-hora">{horaMostrar(inicio, slot.fecha || diaSeleccionado)}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="cita-scheduler__hint">
                      <Calendar size={20} />
                      <p>{t('seleccionar_fecha')}</p>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="cita-scheduler__error">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              {slotSeleccionado && diaSeleccionado && (
                <div className="cita-scheduler__resumen">
                  <div className="cita-scheduler__resumen-linea">
                    <strong>{tipoSeleccionado?.nombre || t('consulta_default')}</strong>
                    <span>·</span>
                    <span>{formatDiaLargo(diaSeleccionado, t)}</span>
                    <span>·</span>
                    <span>{horaMostrar(slotSeleccionado.inicio, slotSeleccionado.fecha || diaSeleccionado)}</span>
                  </div>
                  <div className="cita-scheduler__resumen-linea cita-scheduler__resumen-linea--sub">
                    {doctoraName} · {duracion} {t('minutos', { ns: 'common' })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {!exito && (
          <div className="cita-scheduler__footer">
            <button className="btn btn--ghost" onClick={onClose}>{t('cancel', { ns: 'common' })}</button>
            <button
              className="btn btn--primary"
              onClick={handleConfirmar}
              disabled={!slotSeleccionado || !motivo.trim() || sending}
            >
              {sending ? t('agendando') : t('agendar_cita_btn')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
