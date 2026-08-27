import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Calendar, Clock, User, FileText, CheckCircle, AlertCircle, Loader2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import agendaService from '../../services/agendaService';
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

function getWeekDates(baseDate) {
  const d = new Date(baseDate);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const fd = new Date(monday);
    fd.setDate(monday.getDate() + i);
    dates.push(fd);
  }
  return dates;
}

const DIAS_CORTOS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function formatDiaLargo(date) {
  return `${DIAS_CORTOS[(date.getDay() + 6) % 7]} ${date.getDate()} de ${MESES[date.getMonth()]}`;
}

export default function AgendarCitaModal({ isOpen, onClose, paciente, onCitaCreada }) {
  const { t } = useTranslation('agenda');
  const { t: tPatients } = useTranslation('patients');
  const [doctoras, setDoctoras] = useState([]);
  const [doctoraId, setDoctoraId] = useState('');
  const [doctoraName, setDoctoraName] = useState('');
  const [tiposCita, setTiposCita] = useState([]);
  const [tipoCitaId, setTipoCitaId] = useState('');
  const [tipoSugerido, setTipoSugerido] = useState(false);

  const [weekOffset, setWeekOffset] = useState(0);
  const [slotsPorDia, setSlotsPorDia] = useState({});
  const [loading, setLoading] = useState(false);

  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [slotSeleccionado, setSlotSeleccionado] = useState(null);

  const [notas, setNotas] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);

  const weekDates = getWeekDates(new Date(Date.now() + weekOffset * 7 * 24 * 60 * 60 * 1000));

  const tipoSeleccionado = useMemo(() => {
    return tiposCita.find(tipo => tipo.id?.toString() === tipoCitaId?.toString()) || null;
  }, [tiposCita, tipoCitaId]);

  const duracion = tipoSeleccionado?.duracionMinutos || 30;

  useEffect(() => {
    if (isOpen) {
      loadDoctoras();
      loadTiposCita();
      detectarTipoPaciente();
      setWeekOffset(0);
      setDoctoraId('');
      setDoctoraName('');
      setTipoCitaId('');
      setTipoSugerido(false);
      setDiaSeleccionado(null);
      setSlotSeleccionado(null);
      setNotas('');
      setError('');
      setExito(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (doctoraId && isOpen) loadWeekData();
  }, [doctoraId, weekOffset, isOpen, duracion]);

  useEffect(() => {
    setDiaSeleccionado(null);
    setSlotSeleccionado(null);
  }, [doctoraId]);

  useEffect(() => {
    setSlotSeleccionado(null);
    if (diaSeleccionado && doctoraId && isOpen) loadWeekData();
  }, [tipoCitaId]);

  const loadDoctoras = async () => {
    try {
      const res = await agendaService.getDoctores();
      const list = extractList(res);
      if (list.length > 0) {
        setDoctoras(list);
        setDoctoraId(list[0].id?.toString() || '');
        setDoctoraName(list[0].nombre || t('doctora_number', { id: list[0].id }));
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

  const detectarTipoPaciente = async () => {
    if (!paciente?.id) return;
    try {
      const res = await agendaService.getCitasPorPaciente(paciente.id);
      const citas = extractList(res);
      const tieneCitasPrevias = citas.length > 0;
      if (!tieneCitasPrevias) {
        const tipos = extractList(await agendaService.getTiposCita());
        const primeraVisita = tipos.find(tipo => tipo.nombre?.toLowerCase().includes('primera'));
        const consultaGeneral = tipos.find(tipo => tipo.nombre?.toLowerCase().includes('consulta general'));
        const sugerido = primeraVisita || consultaGeneral;
        if (sugerido) {
          setTipoCitaId(sugerido.id?.toString() || '');
          setTipoSugerido(true);
        }
      }
    } catch {
      // Silently fail - tipo manual
    }
  };

  const loadWeekData = useCallback(async () => {
    setLoading(true);
    setSlotsPorDia({});
    try {
      const inicio = weekDates[0].toISOString().split('T')[0];
      const fin = weekDates[6].toISOString().split('T')[0];
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
  }, [doctoraId, weekOffset, duracion]);

  const slotsDelDia = useMemo(() => {
    if (!diaSeleccionado) return [];
    return (slotsPorDia[diaSeleccionado] || [])
      .filter(slot => !isPastSlot(diaSeleccionado, slot.inicio))
      .filter(slot => slot.estado === 'DISPONIBLE')
      .sort((a, b) => normalizeTime(a.inicio).localeCompare(normalizeTime(b.inicio)));
  }, [diaSeleccionado, slotsPorDia]);

  const handleSelectTipoCita = (e) => {
    const id = e.target.value;
    setTipoCitaId(id);
    setTipoSugerido(false);
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
        motivo: notas || tipoSeleccionado?.nombre || t('consulta'),
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

  const fullName = paciente ? `${paciente.apellidoPaterno || ''} ${paciente.nombres || ''}`.trim() : '';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content agendar-v2" onClick={e => e.stopPropagation()}>
        <div className="agendar-v2__header">
          <h3><Calendar size={20} /> {t('agendar_cita')}</h3>
          <button className="agendar-v2__close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="agendar-v2__body">
          {exito ? (
            <div className="agendar-v2__exito">
              <CheckCircle size={48} />
              <h4>{t('cita_agendada_correctamente')}</h4>
              <p>{fullName} — {diaSeleccionado} {slotSeleccionado ? `${t('a_las')} ${normalizeTime(slotSeleccionado.inicio)}` : ''}</p>
            </div>
          ) : (
            <>
              <div className="agendar-v2__paciente">
                <User size={16} />
                <span>{fullName}</span>
              </div>

              {doctoras.length > 1 && (
                <div className="agendar-v2__field">
                  <label>{t('doctora')}</label>
                  <select value={doctoraId} onChange={e => {
                    const d = doctoras.find(x => x.id?.toString() === e.target.value);
                    setDoctoraId(e.target.value);
                    setDoctoraName(d?.nombre || '');
                  }}>
                    {doctoras.map(d => (
                      <option key={d.id} value={d.id}>{d.nombre || t('doctora_number', { id: d.id })}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="agendar-v2__field">
                <label>
                  <FileText size={14} /> {t('tipo_cita')}
                  {tipoSugerido && <span className="agendar-v2__badge-sugerido"><Sparkles size={10} /> {t('sugerido')}</span>}
                </label>
                <select value={tipoCitaId} onChange={handleSelectTipoCita}>
                  <option value="">{t('seleccionar_tipo')}</option>
                  {tiposCita.map(tipo => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre} — {tipo.duracionMinutos} {t('min')}
                    </option>
                  ))}
                </select>
              </div>

              {tipoSeleccionado && (
                <div className="agendar-v2__tipo-info">
                  <Clock size={14} />
                  <span>{tipoSeleccionado.nombre} — {tipoSeleccionado.duracionMinutos} {t('minutos')}</span>
                </div>
              )}

              <div className="agendar-v2__seccion">
                <div className="agendar-v2__week-nav">
                  <button onClick={() => setWeekOffset(w => w - 1)} className="agendar-v2__week-btn"><ChevronLeft size={16} /></button>
                  <span>{t('semana_del')} {weekDates[0].getDate()} {MESES[weekDates[0].getMonth()]} — {weekDates[6].getDate()} {MESES[weekDates[6].getMonth()]}</span>
                  <button onClick={() => setWeekOffset(w => w + 1)} className="agendar-v2__week-btn"><ChevronRight size={16} /></button>
                </div>

                <div className="agendar-v2__dias">
                  {weekDates.map((d, i) => {
                    const fechaStr = d.toISOString().split('T')[0];
                    const slots = slotsPorDia[fechaStr] || [];
                    const disponibles = slots.filter(s => s.estado === 'DISPONIBLE' && !isPastSlot(fechaStr, s.inicio)).length;
                    const esHoy = (() => {
                      const parts = fechaStr.split('-').map(Number);
                      const laParts = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }).split('-').map(Number);
                      return parts[0] === laParts[0] && parts[1] === laParts[1] && parts[2] === laParts[2];
                    })();
                    const esPasado = isPastDate(fechaStr);
                    const seleccionado = diaSeleccionado === fechaStr;
                    const sinAgenda = slots.length === 0;
                    const lleno = slots.length > 0 && disponibles === 0;
                    return (
                      <button
                        key={i}
                        className={`agendar-v2__dia ${seleccionado ? 'agendar-v2__dia--selected' : ''} ${esPasado ? 'agendar-v2__dia--pasado' : ''} ${lleno ? 'agendar-v2__dia--lleno' : ''} ${esHoy ? 'agendar-v2__dia--hoy' : ''}`}
                        onClick={() => { setDiaSeleccionado(fechaStr); setSlotSeleccionado(null); }}
                        disabled={sinAgenda || esPasado}
                      >
                        <span className="agendar-v2__dia-nombre">{DIAS_CORTOS[i]}</span>
                        <span className="agendar-v2__dia-num">{d.getDate()}</span>
                        <span className="agendar-v2__dia-count">
                          {sinAgenda ? t('sin_agenda') : lleno ? t('lleno') : t('disponibles_count', { count: disponibles })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {loading ? (
                <div className="agendar-v2__loading">
                  <Loader2 size={20} className="spinner" /> {t('cargando_disponibilidad')}
                </div>
              ) : diaSeleccionado ? (
                <div className="agendar-v2__seccion">
                  <h4 className="agendar-v2__seccion-titulo">
                    {t('horarios')} — {formatDiaLargo(new Date(diaSeleccionado + 'T12:00:00'))}
                  </h4>

                  {slotsDelDia.length === 0 ? (
                    <div className="agendar-v2__empty">
                      <AlertCircle size={20} />
                      <p>{t('sin_horarios_disponibles')}</p>
                    </div>
                  ) : (
                    <div className="agendar-v2__slots">
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
                            className={`agendar-v2__slot agendar-v2__slot--${estado.toLowerCase()} ${esSeleccionado ? 'agendar-v2__slot--selected' : ''} ${esPasado ? 'agendar-v2__slot--pasado' : ''}`}
                            disabled={deshabilitado}
                            onClick={() => !deshabilitado && setSlotSeleccionado(slot)}
                            style={deshabilitado ? { pointerEvents: 'none' } : undefined}
                          >
                            <span className="agendar-v2__slot-hora">{inicio} — {fin}</span>
                            <span className="agendar-v2__slot-estado">
                              {esDisponible ? t('disponible') :
                               estado === 'OCUPADO' ? t('ocupado_descripcion', { descripcion: slot.descripcion || '' }) :
                               estado === 'BLOQUEADO' ? t('bloqueado_descripcion', { descripcion: slot.descripcion || '' }) :
                               estado === 'EN_BUFFER' ? t('preparacion') : t('no_disponible')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="agendar-v2__hint">
                  <Calendar size={20} />
                  <p>{!tipoCitaId ? t('seleccionar_tipo_primero') : t('seleccionar_dia_horarios')}</p>
                </div>
              )}

              <div className="agendar-v2__field agendar-v2__field--full">
                <label><FileText size={14} /> {t('notas_opcional')}</label>
                <textarea
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  placeholder={t('motivo_consulta')}
                  rows={2}
                />
              </div>

              {error && (
                <div className="agendar-v2__error">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              {slotSeleccionado && diaSeleccionado && (
                <div className="agendar-v2__resumen">
                  <div className="agendar-v2__resumen-linea">
                    <strong>{tipoSeleccionado?.nombre || t('consulta')}</strong>
                    <span>·</span>
                    <span>{formatDiaLargo(new Date(diaSeleccionado + 'T12:00:00'))}</span>
                    <span>·</span>
                    <span>{normalizeTime(slotSeleccionado.inicio)}</span>
                  </div>
                  <div className="agendar-v2__resumen-linea agendar-v2__resumen-linea--sub">
                    {doctoraName} · {duracion} {t('minutos')}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {!exito && (
          <div className="agendar-v2__footer">
            <button className="btn btn--ghost" onClick={onClose}>{t('cancelar')}</button>
            <button
              className="btn btn--primary"
              onClick={handleConfirmar}
              disabled={!slotSeleccionado || sending}
            >
              {sending ? t('agendando') : t('agendar_cita')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
