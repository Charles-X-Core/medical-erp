import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays, ChevronLeft, ChevronRight, Loader2, Clock, Users,
  AlertTriangle, LayoutGrid, List, Settings, Plus, Trash2, Save,
  ChevronDown, ChevronUp, Bell, CheckCheck, Eye, GripVertical,
  X, AlertCircle,
} from 'lucide-react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import agendaService from '../services/agendaService';
import notificacionService from '../services/notificacionService';
import { useAuth } from '../hooks/useAuth';
import { getPrimaryRole } from '../utils/roleUtils';
import CitaSchedulerModal from '../components/agenda/CitaSchedulerModal';
import RelojWidget from '../components/agenda/RelojWidget';
import CitaDetalleModal from '../components/agenda/CitaDetalleModal';
import MiniCalendar from '../components/agenda/MiniCalendar';
import NowLine from '../components/agenda/NowLine';
import CitaPopover from '../components/agenda/CitaPopover';
import AgendaOnboardingModal from '../components/agenda/AgendaOnboardingModal';
import CitaBlock, { DragCitaCtx } from '../components/agenda/CitaBlock';
import AvisoZonaCalifornia from '../components/common/AvisoZonaCalifornia';
import QuickFilters from '../components/agenda/QuickFilters';
import { getLADateString } from '../utils/laTimezone';
import { horaMostrar, horaMostrarMin, rangoHoras } from '../utils/zonaHoraria';
import { useToast } from '../context/ToastContext';

const HORA_INICIO = 8;
const HORA_FIN = 23;
const SLOT_DURACION = 30;
const PX_PER_MIN_WEEKLY = 2;
const PX_PER_MIN_DAILY = 2.67;
const DIAS_LABORALES = [1, 2, 3, 4, 5, 6, 0];

function getDiasLabels(t) {
  return [t('dia_label_dom'), t('dia_label_lun'), t('dia_label_mar'), t('dia_label_mie'), t('dia_label_jue'), t('dia_label_vie'), t('dia_label_sab')];
}

function getDiasLabelsFull(t) {
  return [t('day_sunday'), t('day_monday'), t('day_tuesday'), t('day_wednesday'), t('day_thursday'), t('day_friday'), t('day_saturday')];
}

function getMesesLabels(t) {
  return [t('month_enero'), t('month_febrero'), t('month_marzo'), t('month_abril'), t('month_mayo'), t('month_junio'), t('month_julio'), t('month_agosto'), t('month_septiembre'), t('month_octubre'), t('month_noviembre'), t('month_diciembre')];
}

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(12, 0, 0, 0);
  return d;
}

function formatDateKey(date) {
  return date.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
}

function formatTime(timeStr, fecha) {
  if (!timeStr) return '';
  return horaMostrar(timeStr, fecha).substring(0, 5);
}

function parseTime(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function getCitaColor(estado) {
  const map = { solicitada: '#F59E0B', pendiente: '#3B82F6', programada: '#06B6D4', confirmada: '#22C55E', asistio: '#F59E0B', llegada: '#F59E0B', completada: '#6B7D95', cancelada: '#EF4444', reprogramada: '#A78BFA', no_show: '#EF4444' };
  return map[estado] || '#3B82F6';
}

function getCitaBg(estado) {
  const map = { solicitada: 'rgba(245,158,11,0.12)', pendiente: 'rgba(59,130,246,0.12)', programada: 'rgba(6,182,212,0.12)', confirmada: 'rgba(34,197,94,0.12)', asistio: 'rgba(245,158,11,0.12)', llegada: 'rgba(245,158,11,0.12)', completada: 'rgba(107,125,149,0.12)', cancelada: 'rgba(239,68,68,0.08)', reprogramada: 'rgba(167,139,250,0.12)', no_show: 'rgba(239,68,68,0.08)' };
  return map[estado] || 'rgba(59,130,246,0.12)';
}

function getSlotBg(estado) {
  const map = { DISPONIBLE: 'rgba(34,197,94,0.08)', OCUPADO: 'rgba(239,68,68,0.06)', BLOQUEADO: 'rgba(100,116,139,0.1)', EN_BUFFER: 'rgba(245,158,11,0.08)', INSUFICIENTE: 'rgba(100,116,139,0.05)' };
  return map[estado] || 'transparent';
}

function getSlotBorder(estado) {
  const map = { DISPONIBLE: '1px solid rgba(34,197,94,0.2)', OCUPADO: '1px solid rgba(239,68,68,0.15)', BLOQUEADO: '1px dashed rgba(100,116,139,0.25)', EN_BUFFER: '1px solid rgba(245,158,11,0.2)', INSUFICIENTE: '1px dashed rgba(100,116,139,0.15)' };
  return map[estado] || 'none';
}

function getSlotLabel(estado, t) {
  const map = { DISPONIBLE: t('disponible'), OCUPADO: t('ocupado_label'), BLOQUEADO: t('bloqueado_label'), EN_BUFFER: t('buffer_label'), INSUFICIENTE: t('insuficiente_label') };
  return map[estado] || estado;
}

function getSlotLabelColor(estado) {
  const map = { DISPONIBLE: '#22C55E', OCUPADO: '#EF4444', BLOQUEADO: '#6B7D95', EN_BUFFER: '#F59E0B', INSUFICIENTE: '#94A3B8' };
  return map[estado] || '#6B7D95';
}

function getEstadoLabel(estado, t) {
  const map = { solicitada: t('solicitada'), pendiente: t('pendiente'), programada: t('programada'), confirmada: t('confirmada'), asistio: t('asistio'), llegada: t('status_llegada'), completada: t('completada'), cancelada: t('cancelada'), reprogramada: t('reprogramada'), no_show: t('no_asistio') };
  return map[estado] || estado;
}

function generateHours() {
  const hours = [];
  for (let h = HORA_INICIO; h <= HORA_FIN; h++) hours.push(h);
  return hours;
}

function generateDaySlots() {
  const slots = [];
  for (let h = HORA_INICIO; h < HORA_FIN; h++) {
    for (let m = 0; m < 60; m += SLOT_DURACION) {
      slots.push({
        hora: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        minutos: h * 60 + m,
      });
    }
  }
  return slots;
}

function layoutOverlappingCitas(citas, slotDuracion = 30) {
  if (!citas.length) return [];
  const sorted = [...citas].sort((a, b) => {
    const diff = parseTime(a.hora) - parseTime(b.hora);
    if (diff !== 0) return diff;
    return (b.duracionMinutos || slotDuracion) - (a.duracionMinutos || slotDuracion);
  });

  const clusters = [];
  let current = null;

  for (const cita of sorted) {
    const start = parseTime(cita.hora);
    const end = start + (cita.duracionMinutos || slotDuracion);

    if (!current || start >= current.endMax) {
      current = { citas: [], endMax: end };
      clusters.push(current);
    }
    current.citas.push(cita);
    current.endMax = Math.max(current.endMax, end);
  }

  for (const cluster of clusters) {
    const columns = [];
    for (const cita of cluster.citas) {
      let placed = false;
      for (let col = 0; col < columns.length; col++) {
        const lastInCol = columns[col][columns[col].length - 1];
        const lastEnd = parseTime(lastInCol.hora) + (lastInCol.duracionMinutos || slotDuracion);
        if (parseTime(cita.hora) >= lastEnd) {
          columns[col].push(cita);
          cita._col = col;
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([cita]);
        cita._col = columns.length - 1;
      }
    }
    const numCols = columns.length;
    for (const cita of cluster.citas) {
      cita._numCols = numCols;
    }
  }

  return sorted;
}

// --- Draggable Cita (context provider, no wrapper div) ---
function DraggableCita({ cita, children, index = 0, canDrag = true }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `cita-${cita.id}`,
    data: { cita },
    disabled: !canDrag,
  });
  const dragStyle = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : {};
  const zIndex = isDragging ? 100 : 10 - index;
  const value = useMemo(() => ({
    setNodeRef, listeners, attributes, dragStyle, zIndex, isDragging
  }), [setNodeRef, listeners, attributes, dragStyle, zIndex, isDragging]);
  return (
    <DragCitaCtx.Provider value={value}>
      {children}
    </DragCitaCtx.Provider>
  );
}

// --- Droppable Cell ---
function DroppableCell({ dateKey, hour, children }) {
  const id = `cell::${dateKey}::${hour}`;
  const { isOver, setNodeRef } = useDroppable({ id, data: { dateKey, hour } });
  return (
    <div ref={setNodeRef} className={`agenda-week__cell ${isOver ? 'agenda-week__cell--over' : ''}`}>
      {children}
    </div>
  );
}

// --- Notifications Panel (dropdown) ---
function NotificationsPanel() {
  const { t } = useTranslation('agenda');
  const [notificaciones, setNotificaciones] = useState([]);
  const [conteo, setConteo] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const [noLeidas, c] = await Promise.all([
      notificacionService.getNoLeidas(),
      notificacionService.getConteo(),
    ]);
    setNotificaciones(noLeidas.data || []);
    setConteo(c.data?.noLeidas || 0);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const interval = setInterval(load, 30000); return () => clearInterval(interval); }, [load]);

  const handleMarcarTodas = async () => {
    await notificacionService.marcarTodasLeidas();
    load();
  };

  return (
    <div className="notificaciones-panel">
      <button className="notificaciones-panel__btn" onClick={() => setOpen(!open)}>
        <Bell size={20} />
        {conteo > 0 && <span className="notificaciones-panel__badge">{conteo}</span>}
      </button>
      {open && (
        <div className="notificaciones-panel__dropdown">
          <div className="notificaciones-panel__header">
            <span>{t('notificaciones')}</span>
            {conteo > 0 && (
              <button className="notificaciones-panel__mark-all" onClick={handleMarcarTodas}>
                <CheckCheck size={14} /> {t('marcar_todas_leidas')}
              </button>
            )}
          </div>
          <div className="notificaciones-panel__list">
            {notificaciones.length === 0 ? (
              <div className="notificaciones-panel__empty">{t('sin_notificaciones')}</div>
            ) : (
              notificaciones.map((n) => (
                <div key={n.id} className="notificaciones-panel__item">
                  <div className="notificaciones-panel__item-dot" />
                  <div className="notificaciones-panel__item-content">
                    <span className="notificaciones-panel__item-titulo">{n.titulo}</span>
                    <span className="notificaciones-panel__item-mensaje">{n.mensaje}</span>
                    <span className="notificaciones-panel__item-time">{n.createdAt ? new Date(n.createdAt).toLocaleString('es-PE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : ''}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Config Tab ---
function ConfigTab({ agendaId, usuarioId, onSaved }) {
  const { t } = useTranslation('agenda');
  const toast = useToast();
  const [activeConfigTab, setActiveConfigTab] = useState('disponibilidad');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [disponibilidades, setDisponibilidades] = useState([]);
  const [tiposCita, setTiposCita] = useState([]);
  const [newTipo, setNewTipo] = useState({ nombre: '', duracionMinutos: 30, bufferMinutos: 0, prioridadDefault: 'NORMAL', requiereTratamiento: false, descripcion: '' });

  const DIAS_LABELS_SHORT = useMemo(() => getDiasLabels(t), [t]);
  const DIAS_LABELS_FULL = useMemo(() => getDiasLabelsFull(t), [t]);

  const todayDay = new Date(getLADateString() + 'T12:00:00').getDay();

  const showMsg = (type, text) => {
    toast(type, text);
  };

  const loadData = useCallback(async () => {
    if (!agendaId) return;
    setLoading(true);
    try {
      const [agRes, tipRes] = await Promise.all([
        agendaService.getAgendaByUsuario(usuarioId),
        agendaService.getTiposCita(),
      ]);
      if (agRes.success && agRes.data?.disponibilidades) setDisponibilidades(agRes.data.disponibilidades);
      if (tipRes.success) setTiposCita(tipRes.data || []);
    } catch { /* */ }
    setLoading(false);
  }, [agendaId, usuarioId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSaveDisponibilidades = async () => {
    setSaving(true);
    try {
      const normalized = disponibilidades.map((d) => ({
        diaSemana: d.diaSemana,
        horaInicio: String(d.horaInicio).substring(0, 5),
        horaFin: String(d.horaFin).substring(0, 5),
      }));

      for (const d of normalized) {
        if (d.horaInicio >= d.horaFin) {
          const diaLabel = DIAS_LABELS_SHORT[d.diaSemana];
          showMsg('error', `${t('en_dia', { dia: diaLabel })} ${t('hora_fin_posterior', { horaInicio: d.horaInicio, horaFin: d.horaFin })}`);
          setSaving(false);
          return;
        }
      }
      for (let i = 0; i < normalized.length; i++) {
        for (let j = i + 1; j < normalized.length; j++) {
          if (normalized[i].diaSemana === normalized[j].diaSemana) {
            if (normalized[i].horaInicio < normalized[j].horaFin && normalized[j].horaInicio < normalized[i].horaFin) {
              const diaLabel = DIAS_LABELS_SHORT[normalized[i].diaSemana];
              showMsg('error', `${t('en_dia', { dia: diaLabel })} ${t('horas_superponen')}`);
              setSaving(false);
              return;
            }
          }
        }
      }

      const res = await agendaService.updateDisponibilidades(agendaId, normalized);
      if (res.success) {
        showMsg('success', t('disponibilidades_guardadas'));
        await loadData();
        onSaved?.();
      } else showMsg('error', res.message || t('error_guardar_slot'));
    } catch { showMsg('error', t('error_conexion')); }
    setSaving(false);
  };

  const addSlot = (dia) => {
    const existing = disponibilidades.filter((d) => d.diaSemana === dia);
    const lastEnd = existing.length > 0 ? existing[existing.length - 1].horaFin : '09:00';
    setDisponibilidades([...disponibilidades, { diaSemana: dia, horaInicio: lastEnd, horaFin: lastEnd.length >= 5 ? `${String(parseInt(lastEnd.split(':')[0]) + 1).padStart(2, '0')}:00` : '10:00' }]);
  };

  const removeSlot = (idx) => {
    setDisponibilidades(disponibilidades.filter((_, i) => i !== idx));
  };

  const updateSlot = (idx, field, value) => {
    const updated = [...disponibilidades];
    updated[idx] = { ...updated[idx], [field]: value };
    setDisponibilidades(updated);
  };

  const handleCreateTipo = async () => {
    const nombre = (newTipo.nombre || '').trim();
    if (!nombre) return;
    const duracion = Number(newTipo.duracionMinutos);
    const buffer = Number(newTipo.bufferMinutos) || 0;
    if (!duracion || duracion < 15 || duracion > 480) {
      showMsg('error', t('duracion_invalida'));
      return;
    }
    if (buffer < 0 || buffer > 60) {
      showMsg('error', t('buffer_invalido'));
      return;
    }
    try {
      const res = await agendaService.crearTipoCita({
        ...newTipo,
        nombre,
        duracionMinutos: Math.trunc(duracion),
        bufferMinutos: Math.trunc(buffer),
      });
      if (res.success) {
        setTiposCita([...tiposCita, res.data]);
        setNewTipo({ nombre: '', duracionMinutos: 30, bufferMinutos: 0, prioridadDefault: 'NORMAL', requiereTratamiento: false, descripcion: '' });
        showMsg('success', t('tipo_cita_creado'));
      }
    } catch { /* */ }
  };

  const handleDeleteTipo = async (id) => {
    await agendaService.eliminarTipoCita(id);
    setTiposCita(tiposCita.filter((tipo) => tipo.id !== id));
  };

  const getPrioridadColor = (p) => {
    if (p === 'URGENTE') return { bg: 'rgba(239,68,68,0.1)', border: '#EF4444', text: '#EF4444' };
    if (p === 'ALTA') return { bg: 'rgba(249,115,22,0.1)', border: '#F97316', text: '#F97316' };
    return { bg: 'rgba(59,130,246,0.1)', border: '#3B82F6', text: '#3B82F6' };
  };

  if (loading) return <div className="agenda-page__loading"><Loader2 size={24} className="spinner" /><p>{t('cargando_config')}</p></div>;

  return (
    <div className="agenda-config">
      <div className="agenda-config__tabs">
        <button className={`agenda-config__tab ${activeConfigTab === 'disponibilidad' ? 'agenda-config__tab--active' : ''}`} onClick={() => setActiveConfigTab('disponibilidad')}>
          <Clock size={15} /> {t('mi_disponibilidad')}
        </button>
        <button className={`agenda-config__tab ${activeConfigTab === 'tipos' ? 'agenda-config__tab--active' : ''}`} onClick={() => setActiveConfigTab('tipos')}>
          <CalendarDays size={15} /> {t('mis_tipos_cita')}
        </button>
      </div>

      {activeConfigTab === 'disponibilidad' && (
        <div className="agenda-config__section">
          <AvisoZonaCalifornia />
          <div className="agenda-config__section-header">
            <h3>{t('horario_semanal')}</h3>
            <button className="agenda-config__save-btn" onClick={handleSaveDisponibilidades} disabled={saving}>
              <Save size={16} /> {saving ? t('guardando') : t('guardar')}
            </button>
          </div>
          <div className="agenda-config__day-list">
            {DIAS_LABORALES.map((dia) => {
              const daySlots = disponibilidades.filter((d) => d.diaSemana === dia);
              const isToday = dia === todayDay;
              return (
                <div key={dia} className={`agenda-config__day-row ${isToday ? 'agenda-config__day-row--today' : ''}`}>
                  <div className="agenda-config__day-label">
                    <span className="agenda-config__day-name">{DIAS_LABELS_FULL[dia]}</span>
                    {isToday && <span className="agenda-config__today-badge">{t('today')}</span>}
                  </div>
                  <div className="agenda-config__day-content">
                    {daySlots.length === 0 ? (
                      <span className="agenda-config__day-empty">{t('sin_horario')}</span>
                    ) : (
                      <div className="agenda-config__pills">
                        {daySlots.map((slot, idx) => {
                          const globalIdx = disponibilidades.indexOf(slot);
                          return (
                            <div key={idx} className="agenda-config__time-pill">
                              <Clock size={12} />
                              <input type="time" value={slot.horaInicio} onChange={(e) => updateSlot(globalIdx, 'horaInicio', e.target.value)} className="agenda-config__pill-input" />
                              <span className="agenda-config__pill-sep">—</span>
                              <input type="time" value={slot.horaFin} onChange={(e) => updateSlot(globalIdx, 'horaFin', e.target.value)} className="agenda-config__pill-input" />
                              <button className="agenda-config__pill-remove" onClick={() => removeSlot(globalIdx)}><Trash2 size={12} /></button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <button className="agenda-config__add-pill" onClick={() => addSlot(dia)}>
                      <Plus size={13} /> {t('agregar')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeConfigTab === 'tipos' && (
        <div className="agenda-config__section">
          <div className="agenda-config__section-header">
            <h3>{t('mis_tipos_cita')}</h3>
          </div>
          <div className="agenda-config__tipo-form">
            <div className="agenda-config__tipo-form-grid">
              <div className="agenda-config__field">
                <label>{t('nombre')}</label>
                <input type="text" value={newTipo.nombre} onChange={(e) => setNewTipo({ ...newTipo, nombre: e.target.value })} placeholder={t('ej_consulta_general')} className="agenda-config__input" />
              </div>
              <div className="agenda-config__field">
                <label>{t('duracion_min')}</label>
                <input type="number" value={newTipo.duracionMinutos} onChange={(e) => setNewTipo({ ...newTipo, duracionMinutos: parseInt(e.target.value) || 30 })} min="15" max="480" className="agenda-config__input" />
              </div>
              <div className="agenda-config__field">
                <label>{t('buffer_min')}</label>
                <input type="number" value={newTipo.bufferMinutos} onChange={(e) => setNewTipo({ ...newTipo, bufferMinutos: parseInt(e.target.value) || 0 })} min="0" max="60" className="agenda-config__input" />
              </div>
              <div className="agenda-config__field">
                <label>{t('prioridad')}</label>
                <select value={newTipo.prioridadDefault} onChange={(e) => setNewTipo({ ...newTipo, prioridadDefault: e.target.value })} className="agenda-config__input">
                  <option value="NORMAL">{t('normal')}</option>
                  <option value="ALTA">{t('alta')}</option>
                  <option value="URGENTE">{t('urgente')}</option>
                </select>
              </div>
            </div>
            <div className="agenda-config__field">
              <label>{t('descripcion')}</label>
              <input type="text" value={newTipo.descripcion} onChange={(e) => setNewTipo({ ...newTipo, descripcion: e.target.value })} placeholder={t('descripcion_placeholder')} className="agenda-config__input" />
            </div>
            <button className="agenda-config__save-btn" onClick={handleCreateTipo}><Plus size={16} /> {t('crear_tipo')}</button>
          </div>

          {tiposCita.length === 0 ? (
            <div className="agenda-config__empty-state">
              <CalendarDays size={40} />
              <p>{t('sin_tipos_cita')}</p>
            </div>
          ) : (
            <div className="agenda-config__tipo-grid">
              {tiposCita.map((tipo) => {
                const pc = getPrioridadColor(tipo.prioridadDefault);
                return (
                  <div key={tipo.id} className="agenda-config__tipo-card" style={{ borderLeftColor: pc.border }}>
                    <div className="agenda-config__tipo-header">
                      <span className="agenda-config__tipo-name">{tipo.nombre}</span>
                      <button className="agenda-config__tipo-delete" onClick={() => handleDeleteTipo(tipo.id)} title={t('eliminar')}><Trash2 size={14} /></button>
                    </div>
                    <div className="agenda-config__tipo-badges">
                      <span className="agenda-config__tipo-badge agenda-config__tipo-badge--duration"><Clock size={12} /> {tipo.duracionMinutos} min</span>
                      {tipo.bufferMinutos > 0 && <span className="agenda-config__tipo-badge agenda-config__tipo-badge--buffer">+{tipo.bufferMinutos} min {t('buffer_min_label')}</span>}
                      <span className="agenda-config__tipo-badge" style={{ background: pc.bg, color: pc.text }}>{tipo.prioridadDefault || t('normal')}</span>
                    </div>
                    {tipo.descripcion && <p className="agenda-config__tipo-desc">{tipo.descripcion}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Ajuste de hora del movimiento (unificado: prevé conflictos y ofrece horarios libres) ---
function AjusteHoraModal({ cita, fecha, horaBase, duracion = 30, todasLasCitas = [], error, onConfirm, onCancel }) {
  const { t } = useTranslation('agenda');
  const [minuto, setMinuto] = useState(0);
  const MINUTOS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const horaFinal = `${horaBase}:${String(minuto).padStart(2, '0')}`;
  const fechaLabel = `${fecha} · ${horaMostrarMin(parseInt(horaBase, 10) * 60, fecha)}`;

  const hayConflicto = (m) => {
    const startMin = parseTime(`${horaBase}:${String(m).padStart(2, '0')}`);
    const endMin = startMin + duracion;
    return (todasLasCitas || []).some((c) => {
      if (c.id === cita.id) return false;
      if (c.fecha !== fecha) return false;
      if (c.estado === 'cancelada') return false;
      const cStart = parseTime(c.hora);
      const cEnd = cStart + (c.duracionMinutos || 30);
      return startMin < cEnd && endMin > cStart;
    });
  };

  const conflictoMinimo = hayConflicto(minuto);
  const horariosLibres = MINUTOS.filter((m) => !hayConflicto(m));
  const conflictos = (todasLasCitas || []).filter((c) => {
    if (c.id === cita.id || c.fecha !== fecha || c.estado === 'cancelada') return false;
    const startMin = parseTime(horaFinal);
    const endMin = startMin + duracion;
    const cStart = parseTime(c.hora);
    const cEnd = cStart + (c.duracionMinutos || 30);
    return startMin < cEnd && endMin > cStart;
  });

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content ajuste-hora-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ajuste-hora-modal__header">
          <h3><Clock size={20} /> {t('ajustar_hora')}</h3>
          <button className="ajuste-hora-modal__close" onClick={onCancel}><X size={20} /></button>
        </div>
        <div className="ajuste-hora-modal__body">
          <div className="ajuste-hora-modal__info">
            <span className="ajuste-hora-modal__paciente">{cita.pacienteNombre}</span>
            <span className="ajuste-hora-modal__fecha">{t('ajustar_hora_para', { fecha: fechaLabel })}</span>
          </div>
          <label className="ajuste-hora-modal__label">{t('elegir_hora')}</label>
          <div className="ajuste-hora-modal__minutos">
            {MINUTOS.map((m) => {
              const conflicto = hayConflicto(m);
              const clase = m === minuto
                ? (conflicto ? 'ajuste-hora-modal__minuto--active-conflicto' : 'ajuste-hora-modal__minuto--active')
                : (conflicto ? 'ajuste-hora-modal__minuto--conflicto' : '');
              return (
                <button
                  key={m}
                  className={`ajuste-hora-modal__minuto ${clase}`}
                  onClick={() => setMinuto(m)}
                >
                  {horaMostrarMin(parseInt(horaBase, 10) * 60 + m, fecha)}
                </button>
              );
            })}
          </div>
          <div className="ajuste-hora-modal__preview">
            <span>{horaMostrar(horaFinal, fecha)} · {duracion} {t('min')}</span>
          </div>

          {conflictoMinimo && (
            <div className="ajuste-hora-modal__conflictos">
              <div className="ajuste-hora-modal__conflictos-title">
                <AlertTriangle size={15} /> {t('conflicto_cita', { count: conflictos.length })}
              </div>
              {conflictos.map((c) => (
                <div key={c.id} className="ajuste-hora-modal__conflicto">
                  <span>{c.pacienteNombre}</span>
                  <span>{rangoHoras(c.hora, c.duracionMinutos, c.fecha)}</span>
                </div>
              ))}
              <label className="ajuste-hora-modal__label">{t('horarios_libres')}</label>
              <div className="ajuste-hora-modal__libres">
                {horariosLibres.length === 0 ? (
                  <span className="ajuste-hora-modal__sin-libres">{t('sin_horarios_disp_celda')}</span>
                ) : horariosLibres.map((m) => (
                  <button
                    key={m}
                    className={`ajuste-hora-modal__libre ${m === minuto ? 'ajuste-hora-modal__libre--active' : ''}`}
                    onClick={() => setMinuto(m)}
                  >
                    {horaMostrarMin(parseInt(horaBase, 10) * 60 + m, fecha)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="ajuste-hora-modal__error"><AlertCircle size={15} /> {error}</div>
          )}
        </div>
        <div className="ajuste-hora-modal__footer">
          <button className="btn btn--ghost" onClick={onCancel}>{t('cancelar')}</button>
          <button className="btn btn--primary" disabled={conflictoMinimo} onClick={() => onConfirm(minuto)}>{t('confirmar')}</button>
        </div>
      </div>
    </div>
  );
}

// --- Ajuste de hora del movimiento (unificado: prevé conflictos y ofrece horarios libres) ---
// --- Main AgendaPage ---
export default function AgendaPage() {
  const { t } = useTranslation('agenda');
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ajusteHoraError, setAjusteHoraError] = useState('');
  const [view, setView] = useState('semanal');
  const [currentDate, setCurrentDate] = useState(() => {
    const s = getLADateString().split('-').map(Number);
    return new Date(s[0], s[1] - 1, s[2], 12, 0, 0);
  });
  const [citas, setCitas] = useState([]);
  const [slots, setSlots] = useState([]);
  const [weekSlots, setWeekSlots] = useState([]);
  const [agendaData, setAgendaData] = useState(null);
  const [selectedCita, setSelectedCita] = useState(null);
  const [activeCita, setActiveCita] = useState(null);
  const [resizeCita, setResizeCita] = useState(null);
  const [ajusteHora, setAjusteHora] = useState(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [schedulerPaciente, setSchedulerPaciente] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const timelineRef = useRef(null);

  const primaryRole = getPrimaryRole(user);
  const hours = useMemo(() => generateHours(), []);
  const daySlots = useMemo(() => generateDaySlots(), []);

  const DIAS_LABELS = useMemo(() => getDiasLabels(t), [t]);
  const DIAS_LABELS_FULL = useMemo(() => getDiasLabelsFull(t), [t]);
  const MESES_LABELS = useMemo(() => getMesesLabels(t), [t]);

  const weekStart = useMemo(() => getStartOfWeek(currentDate), [currentDate]);
  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
  }, [weekStart]);
  const weekDays = useMemo(() => {
    return DIAS_LABORALES.map((dia, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const weekLabel = useMemo(() => {
    const start = weekDays[0]; const end = weekDays[4];
    const sm = MESES_LABELS[start.getMonth()]; const em = MESES_LABELS[end.getMonth()];
    const de = t('de');
    if (start.getMonth() === end.getMonth()) return `${start.getDate()} - ${end.getDate()} ${de} ${sm} ${start.getFullYear()}`;
    return `${start.getDate()} ${sm} - ${end.getDate()} ${em} ${start.getFullYear()}`;
  }, [weekDays, MESES_LABELS, t]);

  const dayLabel = useMemo(() => {
    const d = currentDate;
    return `${DIAS_LABELS[d.getDay()]} ${d.getDate()} ${t('de')} ${MESES_LABELS[d.getMonth()]} ${d.getFullYear()}`;
  }, [currentDate, DIAS_LABELS, MESES_LABELS, t]);

  const loadWeek = useCallback(async () => {
    try {
      setLoading(true); setError('');
      const [citasResults, slotsResult] = await Promise.allSettled([
        Promise.allSettled(weekDays.map((day) => agendaService.getCitasPorFecha(formatDateKey(day)))),
        agendaService.getDisponibilidadSemana(user?.id, formatDateKey(weekStart), formatDateKey(weekEnd)),
      ]);
      const allCitas = (citasResults.status === 'fulfilled' ? citasResults.value : [])
        .filter((r) => r.status === 'fulfilled' && r.value?.success)
        .flatMap((r) => r.value.data?.content || r.value.data || []);
      setCitas(allCitas);
      if (slotsResult.status === 'fulfilled') {
        const slotsData = slotsResult.value;
        if (slotsData?.timeout) {
          toast('error', t('timeout_slots'));
          setWeekSlots([]);
        } else if (slotsData?.success) {
          setWeekSlots(slotsData.data || []);
        }
      }
    } catch { toast('error', t('error_agenda')); }
    finally { setLoading(false); }
  }, [weekDays, weekStart, weekEnd, user?.id, t]);

  const loadSlots = useCallback(async () => {
    try {
      if (!user?.id) return;
      const result = await agendaService.getSlots(user.id, formatDateKey(currentDate), 30).catch(() => ({ success: false, data: [] }));
      if (result.success) setSlots(result.data || []);
    } catch { /* */ }
  }, [currentDate, user?.id]);

  const loadAgenda = useCallback(async () => {
    try {
      const res = await agendaService.getAgendaByUsuario(user?.id);
      if (res.success) {
        setAgendaData(res.data);
      } else {
        setShowOnboarding(true);
      }
    } catch {
      setShowOnboarding(true);
    }
  }, [user?.id]);

  useEffect(() => { loadWeek(); loadAgenda(); }, [loadWeek, loadAgenda]);
  useEffect(() => { if (view === 'diaria') loadSlots(); }, [view, loadSlots]);

  const goToPrevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); };
  const goToNextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); };
  const goToPrevDay = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 1); setCurrentDate(d); };
  const goToNextDay = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 1); setCurrentDate(d); };
  const goToToday = () => {
    const s = getLADateString().split('-').map(Number);
    setCurrentDate(new Date(s[0], s[1] - 1, s[2], 12, 0, 0));
  };

  const scrollToHour = useCallback((hour) => {
    if (!timelineRef.current) return;
    const pxPerMin = 2.67;
    const offsetPx = (hour - HORA_INICIO) * 60 * pxPerMin;
    timelineRef.current.scrollTo({ top: Math.max(0, offsetPx - 20), behavior: 'smooth' });
  }, []);

  const getCitasForDay = useCallback((date) => {
    const dateKey = formatDateKey(date);
    return citas.filter((c) => c.fecha === dateKey && c.estado !== 'cancelada' && c.estado !== 'solicitada');
  }, [citas]);

  const getSlotForCell = useCallback((dateKey, hour) => {
    return weekSlots.find((s) => {
      if (s.fecha !== dateKey) return false;
      const sHour = parseInt(s.inicio?.split(':')[0], 10);
      return sHour === hour;
    });
  }, [weekSlots]);

  const stats = useMemo(() => ({
    total: citas.length,
    pendientes: citas.filter((c) => c.estado === 'pendiente' || c.estado === 'solicitada').length,
    confirmadas: citas.filter((c) => c.estado === 'confirmada' || c.estado === 'programada').length,
  }), [citas]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = (event) => {
    const { active } = event;
    const cita = active.data?.current?.cita;
    if (cita) setActiveCita(cita);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveCita(null);
    if (!over || !active.data?.current?.cita) return;
    const cita = active.data.current.cita;
    const [_, newDateKey, newHour] = over.id.split('::');
    const horaBase = String(newHour).padStart(2, '0');
    const newHora = `${horaBase}:00`;
    if (cita.fecha === newDateKey && cita.hora === newHora) return;

    const today = getLADateString();
    if (newDateKey < today) { toast('error', t('fecha_pasada_label')); return; }

    setAjusteHoraError('');
    setAjusteHora({ cita, nuevaFecha: newDateKey, horaBase });
  };

  const handleAjusteConfirm = async (minuto) => {
    if (!ajusteHora) return;
    const { cita, nuevaFecha, horaBase } = ajusteHora;
    const nuevaHora = `${horaBase}:${String(minuto).padStart(2, '0')}`;

    const today = getLADateString();
    if (nuevaFecha < today) { setAjusteHoraError(t('fecha_pasada_label')); return; }

    const duracion = cita.duracionMinutos || 30;
    const newStartMin = parseTime(nuevaHora);
    const newEndMin = newStartMin + duracion;

    const conflictos = citas.filter(c => {
      if (c.id === cita.id) return false;
      if (c.fecha !== nuevaFecha) return false;
      if (c.estado === 'cancelada') return false;
      const cStart = parseTime(c.hora);
      const cEnd = cStart + (c.duracionMinutos || 30);
      return newStartMin < cEnd && newEndMin > cStart;
    });

    if (conflictos.length > 0) {
      setAjusteHoraError(t('conflicto_existe'));
      return;
    }

    try {
      await agendaService.updateCita(cita.id, {
        pacienteId: cita.pacienteId, usuarioId: cita.usuarioId,
        fecha: nuevaFecha, hora: nuevaHora + ':00',
        duracionMinutos: duracion, motivo: cita.motivo || t('reprogramada'),
        tipoCitaId: cita.tipoCitaId, prioridad: cita.prioridad, notas: cita.notas,
      });
      setAjusteHora(null);
      setAjusteHoraError('');
      toast('success', t('cita_movida'));
      loadWeek();
    } catch { setAjusteHoraError(t('error_mover')); }
  };

  const handleResizeCita = async (cita, nuevaDuracion) => {
    try {
      await agendaService.updateCita(cita.id, {
        pacienteId: cita.pacienteId,
        usuarioId: cita.usuarioId,
        fecha: cita.fecha,
        hora: cita.hora,
        duracionMinutos: nuevaDuracion,
        motivo: cita.motivo,
        tipoCitaId: cita.tipoCitaId,
        prioridad: cita.prioridad,
        notas: cita.notas,
      });
      loadWeek();
      toast('success', t('duracion_actualizada'));
    } catch { toast('error', t('error_duracion')); }
  };

  const handleCitaClick = (cita) => {
    setSelectedCita(cita);
  };

  const handleRefreshAfterModal = () => {
    loadWeek();
  };

  return (
    <div className="agenda-page">
      {error && <div className="agenda-page__error">{error}</div>}

      {/* Top Bar: 2 rows */}
      <div className="agenda-topbar">
        <div className="agenda-topbar__row">
          <div className="agenda-topbar__left">
            <RelojWidget />
          </div>
          <div className="agenda-topbar__right">
            {view !== 'config' && (
              <div className="agenda-stats">
                <span className="agenda-stat"><Users size={14} /> {stats.total}</span>
                <span className="agenda-stat agenda-stat--pendiente"><Clock size={14} /> {stats.pendientes}</span>
                <span className="agenda-stat agenda-stat--confirmada"><AlertTriangle size={14} /> {stats.confirmadas}</span>
              </div>
            )}
            <NotificationsPanel />
            {primaryRole === 'doctora' && (
              <button
                className="agenda-view-toggle__btn"
                onClick={() => setShowScheduler(true)}
                title={t('agendar_cita')}
              >
                <Plus size={16} />
              </button>
            )}
            <div className="agenda-view-toggle">
              <button className={`agenda-view-toggle__btn ${view === 'semanal' ? 'agenda-view-toggle__btn--active' : ''}`} onClick={() => setView('semanal')} title={t('vista_semanal')}><LayoutGrid size={16} /></button>
              <button className={`agenda-view-toggle__btn ${view === 'diaria' ? 'agenda-view-toggle__btn--active' : ''}`} onClick={() => setView('diaria')} title={t('vista_diaria')}><List size={16} /></button>
              <button className={`agenda-view-toggle__btn ${view === 'config' ? 'agenda-view-toggle__btn--active' : ''}`} onClick={() => setView('config')} title={t('configuracion')}><Settings size={16} /></button>
            </div>
          </div>
        </div>
        {view !== 'config' && (
          <div className="agenda-topbar__row">
            <div className="agenda-topbar__center">
              <MiniCalendar
                currentDate={currentDate}
                onDateSelect={(date) => setCurrentDate(date)}
                weekStart={weekStart}
              />
              <button className="agenda-nav__btn" onClick={view === 'semanal' ? goToPrevWeek : goToPrevDay}><ChevronLeft size={18} /></button>
              <button className="agenda-nav__today" onClick={goToToday}>{t('today')}</button>
              <button className="agenda-nav__btn" onClick={view === 'semanal' ? goToNextWeek : goToNextDay}><ChevronRight size={18} /></button>
              <QuickFilters onFilter={(f) => {
                if (f.id === 'hoy') { goToToday(); return; }
                const s = getLADateString().split('-').map(Number);
                const d = new Date(s[0], s[1] - 1, s[2], 12, 0, 0);
                setView('diaria');
                setCurrentDate(d);
                setTimeout(() => scrollToHour(f.hour), 100);
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {view !== 'config' && (
        <div className="agenda-legend">
          <span className="agenda-legend__item"><span className="agenda-legend__dot" style={{ background: '#F59E0B' }} /> {t('solicitada')}</span>
          <span className="agenda-legend__item"><span className="agenda-legend__dot" style={{ background: '#3B82F6' }} /> {t('pendiente')}</span>
          <span className="agenda-legend__item"><span className="agenda-legend__dot" style={{ background: '#06B6D4' }} /> {t('programada')}</span>
          <span className="agenda-legend__item"><span className="agenda-legend__dot" style={{ background: '#22C55E' }} /> {t('confirmada')}</span>
          <span className="agenda-legend__item"><span className="agenda-legend__dot" style={{ background: '#22C55E', opacity: 0.3 }} /> {t('disponible')}</span>
          <span className="agenda-legend__item"><span className="agenda-legend__dot" style={{ background: '#EF4444', opacity: 0.3 }} /> {t('ocupado_label')}</span>
          <span className="agenda-legend__item"><span className="agenda-legend__dot" style={{ background: '#6B7D95', opacity: 0.3 }} /> {t('bloqueado_label')}</span>
        </div>
      )}

      {/* Main content - full width */}
      <div className="agenda-page__main">
        <div className="agenda-page__content">
        {/* Config Tab */}
        {view === 'config' && <ConfigTab agendaId={agendaData?.id} usuarioId={user?.id} onSaved={loadWeek} />}

        {/* Weekly View with Drag & Drop */}
        {view === 'semanal' && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className={`agenda-week ${loading ? 'agenda-week--loading' : ''}`}>
              {loading && <div className="agenda-loading-overlay"><Loader2 size={24} className="spinner" /></div>}
              <div className="agenda-week__header">
                <div className="agenda-week__time-col" />
                {weekDays.map((day) => {
                  const isToday = formatDateKey(day) === formatDateKey(new Date());
                  return (
                    <div key={formatDateKey(day)} className={`agenda-week__day-header ${isToday ? 'agenda-week__day-header--today' : ''}`}>
                      <span className="agenda-week__day-name">{DIAS_LABELS[day.getDay()]}</span>
                      <span className="agenda-week__day-num">{day.getDate()}</span>
                    </div>
                  );
                })}
              </div>

              <div className="agenda-week__body" style={{ position: 'relative' }}>
                <NowLine horaInicio={HORA_INICIO} pxPerMin={PX_PER_MIN_WEEKLY} />
                {hours.map((hour) => (
                  <div key={hour} className="agenda-week__row">
                    <div className="agenda-week__time-label">{String(hour).padStart(2, '0')}:00</div>
                    {weekDays.map((day) => {
                      const dateKey = formatDateKey(day);
                      const dayCitas = getCitasForDay(day).filter((c) => {
                        const cHour = parseInt(c.hora?.split(':')[0], 10);
                        return cHour === hour;
                      });
                      const slotData = getSlotForCell(dateKey, hour);
                      const layouted = layoutOverlappingCitas(dayCitas, SLOT_DURACION);

                      return (
                        <DroppableCell key={dateKey} dateKey={dateKey} hour={hour}>
                          {slotData && (
                            <div className="agenda-week__slot-bg" style={{ backgroundColor: getSlotBg(slotData.estado), border: getSlotBorder(slotData.estado) }}>
                              <span className="agenda-week__slot-label" style={{ color: getSlotLabelColor(slotData.estado) }}>{getSlotLabel(slotData.estado, t)}</span>
                            </div>
                          )}
                          {layouted.map((cita, idx) => (
                            <DraggableCita key={cita.id} cita={cita} index={idx} canDrag={primaryRole === 'doctora' && !['no_show', 'cancelada', 'completada', 'reprogramada'].includes(cita.estado)}>
                              <CitaPopover cita={cita} col={cita._col || 0} numCols={cita._numCols || 1}>
                                <CitaBlock
                                  cita={cita}
                                  hour={hour}
                                  pxPerMin={PX_PER_MIN_WEEKLY}
                                  slotDuracion={SLOT_DURACION}
                                  col={cita._col || 0}
                                  numCols={cita._numCols || 1}
                                  onClick={handleCitaClick}
                                  onResize={handleResizeCita}
                                />
                              </CitaPopover>
                            </DraggableCita>
                          ))}
                        </DroppableCell>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <DragOverlay>
              {activeCita ? (
                <div className="agenda-week__cita agenda-week__cita--dragging" style={{ backgroundColor: getCitaBg(activeCita.estado), borderLeft: `3px solid ${getCitaColor(activeCita.estado)}`, width: '120px', height: '30px', opacity: 0.9, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                  <span className="agenda-week__cita-time">{formatTime(activeCita.hora, activeCita.fecha)}</span>
                  <span className="agenda-week__cita-name">{activeCita.pacienteNombre}</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Daily View */}
        {view === 'diaria' && (
          <div className={`agenda-day ${loading ? 'agenda-day--loading' : ''}`}>
            {loading && <div className="agenda-loading-overlay"><Loader2 size={24} className="spinner" /></div>}
            <div ref={timelineRef} className="agenda-day__timeline" style={{ position: 'relative' }}>
              <NowLine horaInicio={HORA_INICIO} pxPerMin={PX_PER_MIN_DAILY} />
              {daySlots.map((slot) => {
                const citasHoy = getCitasForDay(currentDate);
                const slotCita = citasHoy.find((c) => parseTime(c.hora) === slot.minutos);
                const slotData = slots.find((s) => parseTime(s.inicio) === slot.minutos);

                return (
                  <div key={slot.minutos} className="agenda-day__slot">
                    <div className="agenda-day__slot-time">{horaMostrar(slot.hora, formatDateKey(currentDate))}</div>
                    <div className="agenda-day__slot-content">
                      {slotData && !slotCita && (
                        <div className="agenda-day__slot-bg" style={{ backgroundColor: getSlotBg(slotData.estado), border: getSlotBorder(slotData.estado) }}>
                          <span className="agenda-day__slot-label" style={{ color: getSlotLabelColor(slotData.estado) }}>{getSlotLabel(slotData.estado, t)}</span>
                          {slotData.descripcion && <span className="agenda-day__slot-desc">{slotData.descripcion}</span>}
                        </div>
                      )}
                      {slotCita && (
                        <div
                          className="agenda-day__cita"
                          style={{ minHeight: `${Math.max(((slotCita.duracionMinutos || 30) / 30) * 80 - 4, 52)}px`, backgroundColor: getCitaBg(slotCita.estado), borderLeft: `4px solid ${getCitaColor(slotCita.estado)}` }}
                          onClick={() => handleCitaClick(slotCita)}
                        >
                          <div className="agenda-day__cita-header">
                            <span className="agenda-day__cita-time">{formatTime(slotCita.hora, slotCita.fecha)}</span>
                            <span className="agenda-day__cita-estado" style={{ color: getCitaColor(slotCita.estado), backgroundColor: getCitaBg(slotCita.estado) }}>{getEstadoLabel(slotCita.estado, t)}</span>
                          </div>
                          <div className="agenda-day__cita-body">
                            <span className="agenda-day__cita-name">{slotCita.pacienteNombre}</span>
                            {slotCita.tipoCitaNombre && <span className="agenda-day__cita-type">{slotCita.tipoCitaNombre}</span>}
                            {slotCita.motivo && <span className="agenda-day__cita-motivo">{slotCita.motivo}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && citas.length === 0 && view === 'semanal' && (
          <div className="agenda-page__empty"><CalendarDays size={48} /><h3>{t('sin_citas_semana')}</h3><p>{t('agenda_libre_semana')}</p></div>
        )}
        </div>
      </div>

      {/* Cita Detail Modal */}
      {selectedCita && (
        <CitaDetalleModal
          cita={selectedCita}
          onClose={() => setSelectedCita(null)}
          onRefresh={handleRefreshAfterModal}
        />
      )}

      {/* Ajuste de hora al mover cita (unificado: prevé conflicto y lista horarios libres) */}
      {ajusteHora && (
        <AjusteHoraModal
          cita={ajusteHora.cita}
          fecha={ajusteHora.nuevaFecha}
          horaBase={ajusteHora.horaBase}
          duracion={ajusteHora.cita.duracionMinutos || 30}
          todasLasCitas={citas}
          error={ajusteHoraError}
          onConfirm={handleAjusteConfirm}
          onCancel={() => { setAjusteHora(null); setAjusteHoraError(''); }}
        />
      )}

      {/* Agendar Cita Modal - Doctora only */}
      {showScheduler && (
        <CitaSchedulerModal
          isOpen={showScheduler}
          onClose={() => { setShowScheduler(false); setSchedulerPaciente(null); }}
          paciente={schedulerPaciente}
          onCitaCreada={loadWeek}
        />
      )}

      {/* Onboarding Modal - No agenda configured */}
      <AgendaOnboardingModal
        open={showOnboarding}
        usuarioId={user?.id}
        onSaved={() => { setShowOnboarding(false); loadAgenda(); loadWeek(); }}
        onSkip={() => setShowOnboarding(false)}
      />
    </div>
  );
}
