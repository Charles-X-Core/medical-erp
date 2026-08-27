import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Calendar, Clock, User, FileText, CheckCircle, AlertCircle, Loader2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import agendaService from '../../services/agendaService';
import { pacienteService } from '../../services/pacienteService';
import { getLADateString } from '../../utils/laTimezone';

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
  const nowLA = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const nowMin = nowLA.getHours() * 60 + nowLA.getMinutes();
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

export default function CitaSchedulerModal({ isOpen, onClose, paciente: initialPaciente, tratamientoId, onCitaCreada }) {
  const { t } = useTranslation('agenda');
  const [laTime, setLaTime] = useState(() => new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })));
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
  const [loading, setLoading] = useState(false);

  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [slotSeleccionado, setSlotSeleccionado] = useState(null);

  const [notas, setNotas] = useState('');
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
      setError('');
      setExito(false);
      setPaciente(initialPaciente || null);
      setPacienteQuery('');
      setPacienteResults([]);
      setShowPacienteSearch(!initialPaciente);
    }
  }, [isOpen, initialPaciente]);

  useEffect(() => {
    console.log('[Scheduler] useEffect:', { doctoraId, calMonth, calYear, isOpen, duracion });
    if (doctoraId && isOpen) loadMonthData();
  }, [doctoraId, calMonth, calYear, isOpen, duracion]);

  useEffect(() => {
    setDiaSeleccionado(null);
    setSlotSeleccionado(null);
  }, [doctoraId]);

  useEffect(() => {
    setSlotSeleccionado(null);
  }, [tipoCitaId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setLaTime(new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })));
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

  const loadMonthData = useCallback(async () => {
    setLoading(true);
    setSlotsPorDia({});
    try {
      const totalDays = getDaysInMonth(calYear, calMonth);
      const inicio = formatDateStr(calYear, calMonth, 1);
      const fin = formatDateStr(calYear, calMonth, totalDays);
      const res = await agendaService.getDisponibilidadSemana(doctoraId, inicio, fin, duracion);
      const allSlots = extractList(res);
      console.log('[Scheduler] API:', { doctoraId, inicio, fin, duracion, totalSlots: allSlots.length, sample: allSlots.slice(0, 2) });
      const grouped = {};
      allSlots.forEach(slot => {
        const fecha = slot.fecha;
        if (!grouped[fecha]) grouped[fecha] = [];
        grouped[fecha].push(slot);
      });
      console.log('[Scheduler] Grouped:', Object.keys(grouped));
      setSlotsPorDia(grouped);
    } catch (err) {
      console.error('[Scheduler] Error:', err);
      setSlotsPorDia({});
    } finally {
      setLoading(false);
    }
  }, [doctoraId, calMonth, calYear, duracion]);

  const slotsDelDia = useMemo(() => {
    if (!diaSeleccionado) return [];
    const forDay = slotsPorDia[diaSeleccionado] || [];
    const estadoCount = {};
    forDay.forEach(s => { estadoCount[s.estado] = (estadoCount[s.estado] || 0) + 1; });
    console.log('[Scheduler] Estado distribution:', { diaSeleccionado, total: forDay.length, estadoCount });
    const result = forDay
      .filter(slot => !isPastSlot(diaSeleccionado, slot.inicio))
      .filter(slot => slot.estado === 'DISPONIBLE')
      .sort((a, b) => normalizeTime(a.inicio).localeCompare(normalizeTime(b.inicio)));
    console.log('[Scheduler] after filters:', { pastFiltered: forDay.filter(s => !isPastSlot(diaSeleccionado, s.inicio)).length, dispForDay: result.length });
    return result;
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
      await agendaService.crearCita({
        pacienteId: paciente.id,
        usuarioId: parseInt(doctoraId),
        fecha: diaSeleccionado,
        hora: fullTime(slotSeleccionado.inicio),
        duracionMinutos: duracion,
        tipoCitaId: tipoCitaId || undefined,
        tratamientoId: tratamientoId || undefined,
        motivo: notas || tipoSeleccionado?.nombre || t('consulta_default'),
        notas: notas || undefined,
        prioridad: 'NORMAL',
      });
      setExito(true);
      setTimeout(() => {
        onCitaCreada?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || t('error_crear_cita'));
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const fullName = paciente ? `${paciente.apellidoPaterno || ''} ${paciente.apellidoMaterno || ''}, ${paciente.nombres || ''}`.trim() : '';

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
              <p>{fullName} — {formatDiaLargo(diaSeleccionado, t)} a las {normalizeTime(slotSeleccionado.inicio)}</p>
            </div>
          ) : (
            <>
              <div className="cita-scheduler__paciente">
                <User size={16} />
                {paciente ? (
                  <>
                    <span>{`${paciente.apellidoPaterno || ''} ${paciente.apellidoMaterno || ''}, ${paciente.nombres || ''}`.trim()}</span>
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
                          <span>{`${p.apellidoPaterno || ''} ${p.apellidoMaterno || ''}, ${p.nombres || ''}`.trim()}</span>
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

              <div className="cita-scheduler__field">
                <label><FileText size={14} /> {t('tipo_cita', { ns: 'patients' })}</label>
                <select value={tipoCitaId} onChange={e => setTipoCitaId(e.target.value)}>
                  <option value="">{t('seleccionar_tipo')}</option>
                  {tiposCita.map(tipo => (
                    <option key={tipo.id} value={tipo.id}>{tipo.nombre} — {tipo.duracionMinutos} min</option>
                  ))}
                </select>
              </div>

              {tipoSeleccionado && (
                <div className="cita-scheduler__tipo-info">
                  <Clock size={14} />
                  <span>{tipoSeleccionado.nombre} — {tipoSeleccionado.duracionMinutos} {t('minutos', { ns: 'common' })}</span>
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

                  <div className="cita-scheduler__cal-grid">
                    {calDays.map((day, i) => {
                      if (day === null) return <div key={`empty-${i}`} className="cita-scheduler__cal-dia cita-scheduler__cal-dia--empty" />;
                      const fechaStr = formatDateStr(calYear, calMonth, day);
                      const slots = slotsPorDia[fechaStr] || [];
                      const disponibles = slots.filter(s => s.estado === 'DISPONIBLE' && !isPastSlot(fechaStr, s.inicio)).length;
                      const esHoy = todayStr === fechaStr;
                      const esPasado = isPastDate(fechaStr);
                      const seleccionado = diaSeleccionado === fechaStr;
                      const sinAgenda = slots.length === 0;
                      const tieneCupos = disponibles > 0;

                      let className = 'cita-scheduler__cal-dia';
                      if (esPasado) className += ' cita-scheduler__cal-dia--pasado';
                      else if (seleccionado) className += ' cita-scheduler__cal-dia--selected';
                      else if (tieneCupos) className += ' cita-scheduler__cal-dia--disponible';
                      else if (sinAgenda) className += ' cita-scheduler__cal-dia--sin-agenda';
                      else className += ' cita-scheduler__cal-dia--lleno';
                      if (esHoy) className += ' cita-scheduler__cal-dia--hoy';

                      return (
                        <button
                          key={i}
                          className={className}
                          onClick={() => { setDiaSeleccionado(fechaStr); setSlotSeleccionado(null); }}
                          disabled={sinAgenda || esPasado}
                        >
                          <span className="cita-scheduler__cal-num">{day}</span>
                          {!esPasado && !sinAgenda && (
                            <span className={`cita-scheduler__cal-dot ${tieneCupos ? 'cita-scheduler__cal-dot--ok' : 'cita-scheduler__cal-dot--full'}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="cita-scheduler__cal-legend">
                    <span><span className="cita-scheduler__legend-dot cita-scheduler__legend-dot--ok" /> {t('con_cupos')}</span>
                    <span><span className="cita-scheduler__legend-dot cita-scheduler__legend-dot--full" /> {t('lleno')}</span>
                    <span><span className="cita-scheduler__legend-dot cita-scheduler__legend-dot--empty" /> {t('sin_agenda')}</span>
                  </div>
                </div>

                <div className="cita-scheduler__horarios">
                  {loading ? (
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
                          {slotsDelDia.map((slot, i) => {
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
                              >
                                <span className="cita-scheduler__slot-hora">{inicio} — {fin}</span>
                                <span className="cita-scheduler__slot-estado">
                                  {esDisponible ? t('disponible', { ns: 'patients' }) :
                                   estado === 'OCUPADO' ? `${t('ocupado', { ns: 'patients' })}${slot.descripcion ? ` (${slot.descripcion})` : ''}` :
                                   estado === 'BLOQUEADO' ? t('bloqueado', { ns: 'patients' }) :
                                   estado === 'EN_BUFFER' ? t('preparacion', { ns: 'patients' }) : t('no_disponible', { ns: 'patients' })}
                                </span>
                              </button>
                            );
                          })}
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

              <div className="cita-scheduler__field cita-scheduler__field--full">
                <label><FileText size={14} /> {t('notas_opcional')}</label>
                <textarea
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  placeholder={t('motivo_placeholder')}
                  rows={2}
                />
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
                    <span>{normalizeTime(slotSeleccionado.inicio)}</span>
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
              disabled={!slotSeleccionado || sending}
            >
              {sending ? t('agendando') : t('agendar_cita_btn')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
