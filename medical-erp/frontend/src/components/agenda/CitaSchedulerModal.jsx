import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Calendar, Clock, User, FileText, CheckCircle, AlertCircle, Loader2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import agendaService from '../../services/agendaService';
import { pacienteService } from '../../services/pacienteService';

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
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  if (fechaStr !== today) return false;
  const [h, m] = normalizeTime(horaInicio).split(':').map(Number);
  const slotStart = new Date();
  slotStart.setHours(h, m, 0, 0);
  return slotStart <= now;
}

function isPastDate(fechaStr) {
  const today = new Date().toISOString().split('T')[0];
  return fechaStr < today;
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const DIAS_LARGOS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function formatDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function formatDiaLargo(fechaStr) {
  const d = new Date(fechaStr + 'T12:00:00');
  return `${DIAS_LARGOS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

export default function CitaSchedulerModal({ isOpen, onClose, paciente: initialPaciente, tratamientoId, onCitaCreada }) {
  const [doctoras, setDoctoras] = useState([]);
  const [doctoraId, setDoctoraId] = useState('');
  const [doctoraName, setDoctoraName] = useState('');
  const [tiposCita, setTiposCita] = useState([]);
  const [tipoCitaId, setTipoCitaId] = useState('');

  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());
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
    return tiposCita.find(t => t.id?.toString() === tipoCitaId?.toString()) || null;
  }, [tiposCita, tipoCitaId]);

  const duracion = tipoSeleccionado?.duracionMinutos || 30;

  useEffect(() => {
    if (isOpen) {
      loadDoctoras();
      loadTiposCita();
      setCalMonth(today.getMonth());
      setCalYear(today.getFullYear());
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
    if (doctoraId && isOpen) loadMonthData();
  }, [doctoraId, calMonth, calYear, isOpen, duracion]);

  useEffect(() => {
    setDiaSeleccionado(null);
    setSlotSeleccionado(null);
  }, [doctoraId]);

  useEffect(() => {
    setSlotSeleccionado(null);
  }, [tipoCitaId]);

  const loadDoctoras = async () => {
    try {
      const res = await agendaService.getDoctores();
      const list = extractList(res);
      if (list.length > 0) {
        setDoctoras(list);
        setDoctoraId(list[0].id?.toString() || '');
        setDoctoraName(list[0].nombre || `Doctora #${list[0].id}`);
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
      const grouped = {};
      allSlots.forEach(slot => {
        const fecha = slot.fecha;
        if (!grouped[fecha]) grouped[fecha] = [];
        grouped[fecha].push(slot);
      });
      setSlotsPorDia(grouped);
    } catch {
      setSlotsPorDia({});
    } finally {
      setLoading(false);
    }
  }, [doctoraId, calMonth, calYear, duracion]);

  const slotsDelDia = useMemo(() => {
    if (!diaSeleccionado) return [];
    return (slotsPorDia[diaSeleccionado] || [])
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
      await agendaService.crearCita({
        pacienteId: paciente.id,
        usuarioId: parseInt(doctoraId),
        fecha: diaSeleccionado,
        hora: fullTime(slotSeleccionado.inicio),
        duracionMinutos: duracion,
        tipoCitaId: tipoCitaId || undefined,
        tratamientoId: tratamientoId || undefined,
        motivo: notas || tipoSeleccionado?.nombre || 'Consulta',
        notas: notas || undefined,
        prioridad: 'NORMAL',
      });
      setExito(true);
      setTimeout(() => {
        onCitaCreada?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Error al crear la cita');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const fullName = paciente ? `${paciente.apellidoPaterno || ''} ${paciente.apellidoMaterno || ''}, ${paciente.nombres || ''}`.trim() : '';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content cita-scheduler" onClick={e => e.stopPropagation()}>
        <div className="cita-scheduler__header">
          <h3><Calendar size={20} /> Agendar Próxima Cita</h3>
          <button className="cita-scheduler__close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="cita-scheduler__body">
          {exito ? (
            <div className="cita-scheduler__exito">
              <CheckCircle size={48} />
              <h4>Cita agendada correctamente</h4>
              <p>{fullName} — {formatDiaLargo(diaSeleccionado)} a las {normalizeTime(slotSeleccionado.inicio)}</p>
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
                        Cambiar
                      </button>
                    )}
                  </>
                ) : (
                  <span className="cita-scheduler__paciente-placeholder">Seleccionar cliente</span>
                )}
              </div>

              {showPacienteSearch && !paciente && (
                <div className="cita-scheduler__field">
                  <label><Search size={14} /> Buscar cliente</label>
                  <input
                    type="text"
                    value={pacienteQuery}
                    onChange={e => { setPacienteQuery(e.target.value); searchPaciente(e.target.value); }}
                    placeholder="Nombre, apellido o documento..."
                    autoFocus
                  />
                  {searchingPaciente && <span className="cita-scheduler__search-hint"><Loader2 size={12} className="spinner" /> Buscando...</span>}
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
                    <span className="cita-scheduler__search-hint">Sin resultados</span>
                  )}
                </div>
              )}

              {doctoras.length > 1 && (
                <div className="cita-scheduler__field">
                  <label>Doctora</label>
                  <select value={doctoraId} onChange={e => {
                    const d = doctoras.find(x => x.id?.toString() === e.target.value);
                    setDoctoraId(e.target.value);
                    setDoctoraName(d?.nombre || '');
                  }}>
                    {doctoras.map(d => (
                      <option key={d.id} value={d.id}>{d.nombre || `Doctora #${d.id}`}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="cita-scheduler__field">
                <label><FileText size={14} /> Tipo de cita</label>
                <select value={tipoCitaId} onChange={e => setTipoCitaId(e.target.value)}>
                  <option value="">Seleccionar tipo...</option>
                  {tiposCita.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre} — {t.duracionMinutos} min</option>
                  ))}
                </select>
              </div>

              {tipoSeleccionado && (
                <div className="cita-scheduler__tipo-info">
                  <Clock size={14} />
                  <span>{tipoSeleccionado.nombre} — {tipoSeleccionado.duracionMinutos} minutos</span>
                </div>
              )}

              <div className="cita-scheduler__layout">
                <div className="cita-scheduler__calendario">
                  <div className="cita-scheduler__cal-nav">
                    <button onClick={handlePrevMonth} className="cita-scheduler__cal-btn"><ChevronLeft size={16} /></button>
                    <span className="cita-scheduler__cal-title">{MESES[calMonth]} {calYear}</span>
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
                      const esHoy = today.toISOString().split('T')[0] === fechaStr;
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
                    <span><span className="cita-scheduler__legend-dot cita-scheduler__legend-dot--ok" /> Con cupos</span>
                    <span><span className="cita-scheduler__legend-dot cita-scheduler__legend-dot--full" /> Lleno</span>
                    <span><span className="cita-scheduler__legend-dot cita-scheduler__legend-dot--empty" /> Sin agenda</span>
                  </div>
                </div>

                <div className="cita-scheduler__horarios">
                  {loading ? (
                    <div className="cita-scheduler__loading">
                      <Loader2 size={20} className="spinner" /> Cargando...
                    </div>
                  ) : diaSeleccionado ? (
                    <>
                      <h4 className="cita-scheduler__horarios-titulo">
                        {formatDiaLargo(diaSeleccionado)}
                      </h4>
                      {slotsDelDia.length === 0 ? (
                        <div className="cita-scheduler__empty">
                          <AlertCircle size={20} />
                          <p>Sin horarios disponibles</p>
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
                                  {esDisponible ? 'Disponible' :
                                   estado === 'OCUPADO' ? `Ocupado${slot.descripcion ? ` (${slot.descripcion})` : ''}` :
                                   estado === 'BLOQUEADO' ? 'Bloqueado' :
                                   estado === 'EN_BUFFER' ? 'Preparación' : 'No disponible'}
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
                      <p>Selecciona un día en el calendario</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="cita-scheduler__field cita-scheduler__field--full">
                <label><FileText size={14} /> Notas (opcional)</label>
                <textarea
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  placeholder="Motivo de la consulta..."
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
                    <strong>{tipoSeleccionado?.nombre || 'Consulta'}</strong>
                    <span>·</span>
                    <span>{formatDiaLargo(diaSeleccionado)}</span>
                    <span>·</span>
                    <span>{normalizeTime(slotSeleccionado.inicio)}</span>
                  </div>
                  <div className="cita-scheduler__resumen-linea cita-scheduler__resumen-linea--sub">
                    {doctoraName} · {duracion} minutos
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {!exito && (
          <div className="cita-scheduler__footer">
            <button className="btn btn--ghost" onClick={onClose}>Cancelar</button>
            <button
              className="btn btn--primary"
              onClick={handleConfirmar}
              disabled={!slotSeleccionado || sending}
            >
              {sending ? 'Agendando...' : 'Agendar Cita'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
