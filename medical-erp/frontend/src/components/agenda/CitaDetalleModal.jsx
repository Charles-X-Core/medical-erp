import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Clock, User, FileText, AlertTriangle, Minus, Plus, Trash2, CalendarClock, Play, Square } from 'lucide-react';
import agendaService from '../../services/agendaService';
import { getCitaEstado } from '../../utils/citaEstados';

const DURACIONES = [15, 20, 30, 45, 60, 90, 120];

function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function CitaDetalleModal({ cita, onClose, onRefresh }) {
  const [duracion, setDuracion] = useState(cita?.duracionMinutos || 30);
  const [extensionInfo, setExtensionInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (cita) {
      setDuracion(cita.duracionMinutos || 30);
      setExtensionInfo(null);
      setMsg({ type: '', text: '' });
      setTimerRunning(false);
      setElapsedSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [cita]);

  useEffect(() => {
    if (cita && duracion !== cita.duracionMinutos) {
      const timer = setTimeout(async () => {
        const res = await agendaService.verificarExtension(cita.id, duracion);
        if (res.success) setExtensionInfo(res.data);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setExtensionInfo(null);
    }
  }, [duracion, cita]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = useCallback(() => {
    setTimerRunning(true);
    startTimeRef.current = Date.now() - elapsedSeconds * 1000;
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedSeconds(elapsed);
      const newDuracion = Math.max(15, Math.ceil(elapsed / 60));
      setDuracion(newDuracion);
    }, 1000);
  }, [elapsedSeconds]);

  const stopTimer = useCallback(() => {
    setTimerRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  if (!cita) return null;

  const estado = getCitaEstado(cita.estado);
  const horaInicio = cita.hora?.substring(0, 5) || '—';
  const h = parseInt(horaInicio.split(':')[0], 10);
  const m = parseInt(horaInicio.split(':')[1], 10);
  const finMin = h * 60 + duracion;
  const horaFin = `${String(Math.floor(finMin / 60)).padStart(2, '0')}:${String(finMin % 60).padStart(2, '0')}`;

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
      setMsg({ type: 'success', text: 'Duracion actualizada' });
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
      await agendaService.cancelarCita(cita.id, 'Cancelada desde detalle');
      setMsg({ type: 'success', text: 'Cita cancelada' });
      if (onRefresh) onRefresh();
      setTimeout(onClose, 1000);
    } catch {
      setMsg({ type: 'error', text: 'Error al cancelar' });
    }
    setSaving(false);
  };

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
              <label>Paciente</label>
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

          {/* Timer */}
          <div className={`cita-detalle-modal__timer ${timerRunning ? 'cita-detalle-modal__timer--active' : ''}`}>
            <div className="cita-detalle-modal__timer-display">
              <Clock size={16} />
              <span className="cita-detalle-modal__timer-elapsed">{formatElapsed(elapsedSeconds)}</span>
              {timerRunning && <span className="cita-detalle-modal__timer-dot" />}
            </div>
            <div className="cita-detalle-modal__timer-actions">
              {!timerRunning ? (
                <button className="cita-detalle-modal__timer-btn cita-detalle-modal__timer-btn--start" onClick={startTimer}>
                  <Play size={14} /> Iniciar
                </button>
              ) : (
                <button className="cita-detalle-modal__timer-btn cita-detalle-modal__timer-btn--stop" onClick={stopTimer}>
                  <Square size={14} /> Detener
                </button>
              )}
              {timerRunning && (
                <span className="cita-detalle-modal__timer-duracion">
                  Duración: {duracion} min
                </span>
              )}
            </div>
          </div>

          {/* Duration control */}
          <div className="cita-detalle-modal__duration">
            <label>Duracion (minutos)</label>
            <div className="cita-detalle-modal__duration-control">
              <button
                className="cita-detalle-modal__duration-btn"
                onClick={() => setDuracion(Math.max(15, duracion - 5))}
                disabled={duracion <= 15 || timerRunning}
              >
                <Minus size={14} />
              </button>
              <select
                value={duracion}
                onChange={(e) => setDuracion(parseInt(e.target.value))}
                className="cita-detalle-modal__duration-select"
                disabled={timerRunning}
              >
                {DURACIONES.map((d) => (
                  <option key={d} value={d}>{d} min</option>
                ))}
              </select>
              <button
                className="cita-detalle-modal__duration-btn"
                onClick={() => setDuracion(Math.min(120, duracion + 5))}
                disabled={duracion >= 120 || timerRunning}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

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
          <button className="cita-detalle-modal__btn cita-detalle-modal__btn--save" onClick={handleSaveDuration} disabled={saving || duracion === cita.duracionMinutos || timerRunning}>
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          <button className="cita-detalle-modal__btn cita-detalle-modal__btn--cancel" onClick={handleCancel} disabled={saving || timerRunning}>
            <Trash2 size={14} /> Cancelar Cita
          </button>
        </div>
      </div>
    </div>
  );
}
