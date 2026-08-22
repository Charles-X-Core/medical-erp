import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Clock, User, AlertTriangle, Minus, Plus, Trash2, CalendarClock, Play, Square, CheckCircle, Timer, UserX } from 'lucide-react';
import agendaService from '../../services/agendaService';
import { getCitaEstado } from '../../utils/citaEstados';
import { useAuth } from '../../hooks/useAuth';
import { getPrimaryRole } from '../../utils/roleUtils';

const DURACIONES = [15, 20, 30, 45, 60, 90, 120];

function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function CitaDetalleModal({ cita, onClose, onRefresh }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = getPrimaryRole(user);
  const isDoctora = role === 'doctora';

  const [duracion, setDuracion] = useState(cita?.duracionMinutos || 30);
  const [extensionInfo, setExtensionInfo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const [minutosExtra, setMinutosExtra] = useState('');
  const [extending, setExtending] = useState(false);

  useEffect(() => {
    if (cita) {
      setDuracion(cita.duracionMinutos || 30);
      setExtensionInfo(null);
      setMsg({ type: '', text: '' });
      setMinutosExtra('');
      setExtending(false);

      if (cita.estado === 'en_atencion' && cita.inicioAtencion) {
        const inicio = new Date(cita.inicioAtencion).getTime();
        const now = Date.now();
        const elapsed = Math.max(0, Math.floor((now - inicio) / 1000));
        setElapsedSeconds(elapsed);
        startTimerFromElapsed(elapsed);
      } else {
        setTimerRunning(false);
        setElapsedSeconds(0);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }
  }, [cita]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimerFromElapsed = useCallback((initialElapsed) => {
    setTimerRunning(true);
    startTimeRef.current = Date.now() - initialElapsed * 1000;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);
  }, []);

  // Doctora: unified start = registrar asistencia + iniciar atencion
  const handleStartAttention = useCallback(async () => {
    setSaving(true);
    try {
      // If cita is confirmada, register attendance first
      if (cita.estado === 'confirmada') {
        await agendaService.marcarLlegada(cita.id);
      }
      // Then start attention (works for confirmada->asistio or asistio)
      await agendaService.iniciarAtencion(cita.id);
      if (onRefresh) onRefresh();
      onClose();
      navigate(`/pacientes/${cita.pacienteId}/workspace`);
    } catch {
      setMsg({ type: 'error', text: 'Error al iniciar atención' });
    }
    setSaving(false);
  }, [cita, navigate, onRefresh, onClose]);

  // Register attendance (llegada)
  const handleMarkArrival = useCallback(async () => {
    setSaving(true);
    try {
      await agendaService.marcarLlegada(cita.id);
      setMsg({ type: 'success', text: 'Llegada registrada' });
      if (onRefresh) onRefresh();
    } catch {
      setMsg({ type: 'error', text: 'Error al registrar llegada' });
    }
    setSaving(false);
  }, [cita, onRefresh]);

  // Reject solicitud
  const handleReject = useCallback(async () => {
    if (!window.confirm('¿Rechazar esta solicitud?')) return;
    setSaving(true);
    try {
      await agendaService.rechazarCita(cita.id, 'Solicitud rechazada');
      setMsg({ type: 'success', text: 'Solicitud rechazada' });
      if (onRefresh) onRefresh();
      setTimeout(onClose, 1000);
    } catch {
      setMsg({ type: 'error', text: 'Error al rechazar' });
    }
    setSaving(false);
  }, [cita, onRefresh, onClose]);

  const stopTimer = useCallback(() => {
    setTimerRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleComplete = async () => {
    if (!window.confirm('¿Completar esta cita?')) return;
    setSaving(true);
    try {
      stopTimer();
      await agendaService.completarCita(cita.id);
      setMsg({ type: 'success', text: 'Cita completada' });
      if (onRefresh) onRefresh();
      setTimeout(onClose, 1000);
    } catch {
      setMsg({ type: 'error', text: 'Error al completar' });
    }
    setSaving(false);
  };

  const handleExtend = async () => {
    const extra = minutosExtra ? parseInt(minutosExtra) : 0;
    if (extra <= 0 && !minutosExtra) return;
    setExtending(true);
    try {
      const res = await agendaService.extenderSesion(cita.id, extra);
      if (res.success) {
        const newDuracion = (cita.duracionMinutos || 30) + extra;
        setDuracion(newDuracion);
        const affected = res.data?.citasAfectadas?.length || 0;
        setMsg({
          type: 'success',
          text: `Sesión extendida a ${newDuracion} min${affected > 0 ? `. ${affected} cita(s) afectada(s)` : ''}`
        });
        setMinutosExtra('');
        if (onRefresh) onRefresh();
      }
    } catch {
      setMsg({ type: 'error', text: 'Error al extender' });
    }
    setExtending(false);
  };

  const handleSaveDuration = async () => {
    setSaving(true);
    try {
      await agendaService.updateCita(cita.id, {
        pacienteId: cita.pacienteId,
        usuarioId: cita.usuarioId,
        fecha: cita.fecha,
        hora: cita.hora,
        duracionMinutos: duracion,
        motivo: cita.motivo,
        tipoCitaId: cita.tipoCitaId,
        prioridad: cita.prioridad,
        notas: cita.notas,
      });
      setMsg({ type: 'success', text: 'Duración actualizada' });
      if (onRefresh) onRefresh();
    } catch {
      setMsg({ type: 'error', text: 'Error al actualizar' });
    }
    setSaving(false);
  };

  const handleCancel = async () => {
    if (!window.confirm('¿Cancelar esta cita?')) return;
    setSaving(true);
    try {
      stopTimer();
      await agendaService.cancelarCita(cita.id, 'Cancelada desde detalle');
      setMsg({ type: 'success', text: 'Cita cancelada' });
      if (onRefresh) onRefresh();
      setTimeout(onClose, 1000);
    } catch {
      setMsg({ type: 'error', text: 'Error al cancelar' });
    }
    setSaving(false);
  };

  const handleNoShow = async () => {
    if (!window.confirm('¿Marcar como no asistida?')) return;
    setSaving(true);
    try {
      await agendaService.marcarNoShow(cita.id);
      setMsg({ type: 'success', text: 'Marcada como no asistida' });
      if (onRefresh) onRefresh();
      setTimeout(onClose, 1000);
    } catch {
      setMsg({ type: 'error', text: 'Error al marcar no show' });
    }
    setSaving(false);
  };

  if (!cita) return null;

  const estado = getCitaEstado(cita.estado);
  const horaInicio = cita.hora?.substring(0, 5) || '—';
  const h = parseInt(horaInicio.split(':')[0], 10);
  const m = parseInt(horaInicio.split(':')[1], 10);
  const finMin = h * 60 + duracion;
  const horaFin = `${String(Math.floor(finMin / 60)).padStart(2, '0')}:${String(finMin % 60).padStart(2, '0')}`;

  // State flags
  const isEnAtencion = cita.estado === 'en_atencion';
  const isConfirmada = cita.estado === 'confirmada';
  const isAsistio = cita.estado === 'asistio' || cita.estado === 'llegada';
  const isPendiente = cita.estado === 'pendiente' || cita.estado === 'programada';
  const isSolicitada = cita.estado === 'solicitada';
  const isFinal = cita.estado === 'completada' || cita.estado === 'cancelada' || cita.estado === 'no_show';

  // Role-based action flags
  const doctoraCanStart = isDoctora && (isConfirmada || isAsistio);
  const doctoraCanComplete = isDoctora && isEnAtencion;
  const doctoraCanExtend = isDoctora && (isEnAtencion || isConfirmada);
  const doctoraCanConfirm = isDoctora && (isPendiente || isSolicitada);
  const canCancel = !isFinal;
  const canSaveDuration = !isEnAtencion && !isFinal;

  return (
    <div className="cita-detalle-overlay" onClick={onClose}>
      <div className="cita-detalle-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cita-detalle-modal__header">
          <h3>Detalle de Cita</h3>
          <button className="cita-detalle-modal__close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="cita-detalle-modal__body">
          <div className="cita-detalle-modal__field">
            <User size={14} />
            <div>
              <label>Cliente</label>
              <span>{cita.pacienteNombre || '—'}</span>
            </div>
          </div>

          <div className="cita-detalle-modal__row">
            <div className="cita-detalle-modal__field">
              <CalendarClock size={14} />
              <div>
                <label>Fecha</label>
                <span>{cita.fecha || '—'}</span>
              </div>
            </div>
            <div className="cita-detalle-modal__field">
              <Clock size={14} />
              <div>
                <label>Hora</label>
                <span>{horaInicio} - {horaFin}</span>
              </div>
            </div>
          </div>

          <div className="cita-detalle-modal__row">
            <div className="cita-detalle-modal__field">
              <label>Estado</label>
              <span className={`cita-detalle-modal__estado cita-detalle-modal__estado--${estado.tone}`}>{estado.label}</span>
            </div>
            {cita.tipoCitaNombre && (
              <div className="cita-detalle-modal__field">
                <label>Tipo</label>
                <span>{cita.tipoCitaNombre}</span>
              </div>
            )}
          </div>

          {cita.usuarioNombre && (
            <div className="cita-detalle-modal__field">
              <User size={14} />
              <div>
                <label>Doctora</label>
                <span>{cita.usuarioNombre}</span>
              </div>
            </div>
          )}

          {cita.motivo && (
            <div className="cita-detalle-modal__field">
              <label>Motivo</label>
              <span>{cita.motivo}</span>
            </div>
          )}

          {/* Timer - Doctora only when en_atencion or can start */}
          {isDoctora && (isEnAtencion || doctoraCanStart) && (
            <div className={`cita-detalle-modal__timer ${timerRunning ? 'cita-detalle-modal__timer--active' : ''}`}>
              <div className="cita-detalle-modal__timer-display">
                <Clock size={16} />
                <span className="cita-detalle-modal__timer-elapsed">{formatElapsed(elapsedSeconds)}</span>
                {timerRunning && <span className="cita-detalle-modal__timer-dot" />}
              </div>
              <div className="cita-detalle-modal__timer-actions">
                {doctoraCanStart && !timerRunning && (
                  <button
                    className="cita-detalle-modal__timer-btn cita-detalle-modal__timer-btn--start"
                    onClick={handleStartAttention}
                    disabled={saving}
                  >
                    <Play size={14} /> {saving ? 'Iniciando...' : 'Iniciar Atención'}
                  </button>
                )}
                {timerRunning && (
                  <button className="cita-detalle-modal__timer-btn cita-detalle-modal__timer-btn--stop" onClick={stopTimer}>
                    <Square size={14} /> Pausar
                  </button>
                )}
                {timerRunning && (
                  <span className="cita-detalle-modal__timer-duracion">
                    Duración: {duracion} min
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Extension control - Doctora only */}
          {doctoraCanExtend && (
            <div className="cita-detalle-modal__extend">
              <label><Timer size={14} /> Extender sesión</label>
              <div className="cita-detalle-modal__extend-row">
                <input
                  type="number"
                  min="0"
                  max="120"
                  step="5"
                  placeholder="Minutos extra"
                  value={minutosExtra}
                  onChange={(e) => setMinutosExtra(e.target.value)}
                  className="cita-detalle-modal__extend-input"
                  disabled={extending}
                />
                <button
                  className="cita-detalle-modal__extend-btn"
                  onClick={handleExtend}
                  disabled={extending || (!minutosExtra || parseInt(minutosExtra) <= 0)}
                >
                  {extending ? '...' : 'Extender'}
                </button>
              </div>
              <span className="cita-detalle-modal__extend-hint">
                Las citas afectadas serán reacomodadas automáticamente
              </span>
            </div>
          )}

          {/* Duration control */}
          {canSaveDuration && (
            <div className="cita-detalle-modal__duration">
              <label>Duración (minutos)</label>
              <div className="cita-detalle-modal__duration-control">
                <button
                  className="cita-detalle-modal__duration-btn"
                  onClick={() => setDuracion(Math.max(15, duracion - 5))}
                  disabled={duracion <= 15}
                >
                  <Minus size={14} />
                </button>
                <select
                  value={duracion}
                  onChange={(e) => setDuracion(parseInt(e.target.value))}
                  className="cita-detalle-modal__duration-select"
                >
                  {DURACIONES.map((d) => (
                    <option key={d} value={d}>{d} min</option>
                  ))}
                </select>
                <button
                  className="cita-detalle-modal__duration-btn"
                  onClick={() => setDuracion(Math.min(120, duracion + 5))}
                  disabled={duracion >= 120}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          {extensionInfo?.conflicto && (
            <div className="cita-detalle-modal__warning">
              <AlertTriangle size={16} />
              <div>
                <strong>Conflicto detectado</strong>
                <p>Extender a {duracion}min afecta la siguiente cita:</p>
                {extensionInfo.citasAfectadas?.map((c) => (
                  <p key={c.citaId} className="cita-detalle-modal__conflict-detail">
                    {c.pacienteNombre} ({c.horaInicio} - {c.horaFin})
                  </p>
                ))}
              </div>
            </div>
          )}

          {msg.text && (
            <div className={`cita-detalle-modal__msg cita-detalle-modal__msg--${msg.type}`}>{msg.text}</div>
          )}
        </div>

        <div className="cita-detalle-modal__footer">
          {/* Doctora: Complete button */}
          {doctoraCanComplete && (
            <button
              className="cita-detalle-modal__btn cita-detalle-modal__btn--complete"
              onClick={handleComplete}
              disabled={saving}
            >
              <CheckCircle size={14} /> {saving ? 'Completando...' : 'Completar Cita'}
            </button>
          )}

          {/* Doctora: Confirm button */}
          {doctoraCanConfirm && (
            <button
              className="cita-detalle-modal__btn cita-detalle-modal__btn--confirm"
              onClick={async () => {
                setSaving(true);
                try {
                  await agendaService.confirmarCita(cita.id);
                  setMsg({ type: 'success', text: 'Cita confirmada' });
                  if (onRefresh) onRefresh();
                } catch {
                  setMsg({ type: 'error', text: 'Error al confirmar' });
                }
                setSaving(false);
              }}
              disabled={saving}
            >
              Confirmar
            </button>
          )}

          {/* Save duration */}
          {canSaveDuration && (
            <button
              className="cita-detalle-modal__btn cita-detalle-modal__btn--save"
              onClick={handleSaveDuration}
              disabled={saving || duracion === cita.duracionMinutos}
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          )}

          {/* No-show button */}
          {!isFinal && (
            <button className="cita-detalle-modal__btn cita-detalle-modal__btn--noshow" onClick={handleNoShow} disabled={saving}>
              <UserX size={14} /> No Asistió
            </button>
          )}

          {/* Cancel button */}
          {canCancel && (
            <button className="cita-detalle-modal__btn cita-detalle-modal__btn--cancel" onClick={handleCancel} disabled={saving}>
              <Trash2 size={14} /> Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
