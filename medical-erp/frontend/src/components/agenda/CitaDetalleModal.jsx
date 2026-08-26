import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Clock, User, AlertTriangle, Minus, Plus, Trash2, CalendarClock, Play, Square, CheckCircle, Timer, UserX } from 'lucide-react';
import agendaService from '../../services/agendaService';
import { getCitaEstado } from '../../utils/citaEstados';
import { useAuth } from '../../hooks/useAuth';
import { getPrimaryRole } from '../../utils/roleUtils';
import ConfirmModal from '../ConfirmModal';

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
  const { t } = useTranslation('agenda');
  const role = getPrimaryRole(user);
  const isDoctora = role === 'doctora';

  const [duracion, setDuracion] = useState(cita?.duracionMinutos || 30);
  const [extensionInfo, setExtensionInfo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);
  const [confirmAction, setConfirmAction] = useState(null);
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

  const handleStartAttention = useCallback(async () => {
    setSaving(true);
    try {
      if (cita.estado === 'confirmada') {
        await agendaService.marcarLlegada(cita.id);
      }
      await agendaService.iniciarAtencion(cita.id);
      if (onRefresh) onRefresh();
      onClose();
      navigate(`/pacientes/${cita.pacienteId}/workspace`);
    } catch {
      setMsg({ type: 'error', text: t('error_starting') });
    }
    setSaving(false);
  }, [cita, navigate, onRefresh, onClose, t]);

  const handleMarkArrival = useCallback(async () => {
    setSaving(true);
    try {
      await agendaService.marcarLlegada(cita.id);
      setMsg({ type: 'success', text: t('llegada_registrada') });
      if (onRefresh) onRefresh();
    } catch {
      setMsg({ type: 'error', text: t('error_arrival') });
    }
    setSaving(false);
  }, [cita, onRefresh, t]);

  const handleReject = useCallback(async () => {
    if (!window.confirm(t('confirm_reject'))) return;
    setSaving(true);
    try {
      await agendaService.rechazarCita(cita.id, t('solicitud_rechazada'));
      setMsg({ type: 'success', text: t('solicitud_rechazada') });
      if (onRefresh) onRefresh();
      setTimeout(onClose, 1000);
    } catch {
      setMsg({ type: 'error', text: t('error_reject') });
    }
    setSaving(false);
  }, [cita, onRefresh, onClose, t]);

  const stopTimer = useCallback(() => {
    setTimerRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleComplete = async () => {
    if (!window.confirm(t('confirm_complete'))) return;
    setSaving(true);
    try {
      stopTimer();
      await agendaService.completarCita(cita.id);
      setMsg({ type: 'success', text: t('status_completada') });
      if (onRefresh) onRefresh();
      setTimeout(onClose, 1000);
    } catch {
      setMsg({ type: 'error', text: t('error_complete') });
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
          text: t('sesion_extendida', { duration: newDuracion, affected })
        });
        setMinutosExtra('');
        if (onRefresh) onRefresh();
      }
    } catch {
      setMsg({ type: 'error', text: t('error_extend') });
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
      setMsg({ type: 'success', text: t('duracion_actualizada') });
      if (onRefresh) onRefresh();
    } catch {
      setMsg({ type: 'error', text: t('error_saving') });
    }
    setSaving(false);
  };

  const handleCancel = () => setConfirmAction('cancel');

  const handleNoShow = () => setConfirmAction('noshow');

  const handleConfirmAction = async () => {
    if (confirmAction === 'cancel') {
      setSaving(true);
      try {
        stopTimer();
        await agendaService.cancelarCita(cita.id, t('cancelada_detalle'));
        setMsg({ type: 'success', text: t('status_cancelada') });
        if (onRefresh) onRefresh();
        setTimeout(onClose, 1000);
      } catch {
        setMsg({ type: 'error', text: t('error_cancel') });
      }
      setSaving(false);
    } else if (confirmAction === 'noshow') {
      setSaving(true);
      try {
        await agendaService.marcarNoShow(cita.id);
        setMsg({ type: 'success', text: t('status_no_show') });
        if (onRefresh) onRefresh();
        setTimeout(onClose, 1000);
      } catch {
        setMsg({ type: 'error', text: t('error_no_show') });
      }
      setSaving(false);
    } else if (confirmAction === 'unmark_noshow') {
      setSaving(true);
      try {
        await agendaService.desmarcarNoShow(cita.id);
        setMsg({ type: 'success', text: t('no_show_desmarcado') });
        if (onRefresh) onRefresh();
        setTimeout(onClose, 1000);
      } catch {
        setMsg({ type: 'error', text: t('error_desmarcar_no_show') });
      }
      setSaving(false);
    }
    setConfirmAction(null);
  };

  if (!cita) return null;

  const estado = getCitaEstado(cita.estado);
  const horaInicio = cita.hora?.substring(0, 5) || '—';
  const h = parseInt(horaInicio.split(':')[0], 10);
  const m = parseInt(horaInicio.split(':')[1], 10);
  const finMin = h * 60 + duracion;
  const horaFin = `${String(Math.floor(finMin / 60)).padStart(2, '0')}:${String(finMin % 60).padStart(2, '0')}`;

  const isEnAtencion = cita.estado === 'en_atencion';
  const isConfirmada = cita.estado === 'confirmada';
  const isAsistio = cita.estado === 'asistio' || cita.estado === 'llegada';
  const isPendiente = cita.estado === 'pendiente' || cita.estado === 'programada';
  const isSolicitada = cita.estado === 'solicitada';
  const isFinal = cita.estado === 'completada' || cita.estado === 'cancelada' || cita.estado === 'no_show';

  const doctoraCanStart = isDoctora && (isConfirmada || isAsistio);
  const doctoraCanComplete = isDoctora && isEnAtencion;
  const doctoraCanExtend = isDoctora && (isEnAtencion || isConfirmada);
  const doctoraCanConfirm = isDoctora && (isPendiente || isSolicitada);
  const canCancel = !isFinal;

  const isNoShow = cita.estado === 'no_show';
  const noShowLocked = isNoShow && (() => {
    const finCita = new Date(cita.fecha + 'T' + cita.hora);
    finCita.setMinutes(finCita.getMinutes() + duracion + 30);
    return new Date() > finCita;
  })();
  const canMarkNoShow = !isFinal && !isNoShow;
  const canUnmarkNoShow = isNoShow && !noShowLocked;
  const canSaveDuration = !isEnAtencion && !isFinal;

  return (
    <div className="cita-detalle-overlay" onClick={onClose}>
      <div className="cita-detalle-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cita-detalle-modal__header">
          <h3>{t('appointment_detail')}</h3>
          <button className="cita-detalle-modal__close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="cita-detalle-modal__body">
          <div className="cita-detalle-modal__field">
            <User size={14} />
            <div>
              <label>{t('client', { ns: 'common' })}</label>
              <span>{cita.pacienteNombre || '—'}</span>
            </div>
          </div>

          <div className="cita-detalle-modal__row">
            <div className="cita-detalle-modal__field">
              <CalendarClock size={14} />
              <div>
                <label>{t('date', { ns: 'common' })}</label>
                <span>{cita.fecha || '—'}</span>
              </div>
            </div>
            <div className="cita-detalle-modal__field">
              <Clock size={14} />
              <div>
                <label>{t('time', { ns: 'common' })}</label>
                <span>{horaInicio} - {horaFin}</span>
              </div>
            </div>
          </div>

          <div className="cita-detalle-modal__row">
            <div className="cita-detalle-modal__field">
              <label>{t('status', { ns: 'common' })}</label>
              <span className={`cita-detalle-modal__estado cita-detalle-modal__estado--${estado.tone}`}>{estado.label}</span>
            </div>
            {cita.tipoCitaNombre && (
              <div className="cita-detalle-modal__field">
                <label>{t('type', { ns: 'common' })}</label>
                <span>{cita.tipoCitaNombre}</span>
              </div>
            )}
          </div>

          {cita.usuarioNombre && (
            <div className="cita-detalle-modal__field">
              <User size={14} />
              <div>
                <label>{t('doctor', { ns: 'common' })}</label>
                <span>{cita.usuarioNombre}</span>
              </div>
            </div>
          )}

          {cita.motivo && (
            <div className="cita-detalle-modal__field">
              <label>{t('motivo', { ns: 'patients' })}</label>
              <span>{cita.motivo}</span>
            </div>
          )}

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
                    <Play size={14} /> {saving ? t('iniciando') : t('start_attention')}
                  </button>
                )}
                {timerRunning && (
                  <button className="cita-detalle-modal__timer-btn cita-detalle-modal__timer-btn--stop" onClick={stopTimer}>
                    <Square size={14} /> {t('pausar')}
                  </button>
                )}
                {timerRunning && (
                  <span className="cita-detalle-modal__timer-duracion">
                    {t('duracion_label', { duration: duracion })}
                  </span>
                )}
              </div>
            </div>
          )}

          {doctoraCanExtend && (
            <div className="cita-detalle-modal__extend">
              <label><Timer size={14} /> {t('extender_sesion')}</label>
              <div className="cita-detalle-modal__extend-row">
                <input
                  type="number"
                  min="0"
                  max="120"
                  step="5"
                  placeholder={t('minutos_extra')}
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
                  {extending ? '...' : t('extender')}
                </button>
              </div>
              <span className="cita-detalle-modal__extend-hint">
                {t('citas_reacomodadas')}
              </span>
            </div>
          )}

          {canSaveDuration && (
            <div className="cita-detalle-modal__duration">
              <label>{t('duracion_minutos')}</label>
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
                <strong>{t('conflicto_detectado')}</strong>
                <p>{t('extender_afecta', { duration: duracion })}</p>
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
          {doctoraCanComplete && (
            <button
              className="cita-detalle-modal__btn cita-detalle-modal__btn--complete"
              onClick={handleComplete}
              disabled={saving}
            >
              <CheckCircle size={14} /> {saving ? t('completando') : t('complete')}
            </button>
          )}

          {doctoraCanConfirm && (
            <button
              className="cita-detalle-modal__btn cita-detalle-modal__btn--confirm"
              onClick={async () => {
                setSaving(true);
                try {
                  await agendaService.confirmarCita(cita.id);
                  setMsg({ type: 'success', text: t('status_confirmada') });
                  if (onRefresh) onRefresh();
                } catch {
                  setMsg({ type: 'error', text: t('error_confirm') });
                }
                setSaving(false);
              }}
              disabled={saving}
            >
              {t('confirm')}
            </button>
          )}

          {canSaveDuration && (
            <button
              className="cita-detalle-modal__btn cita-detalle-modal__btn--save"
              onClick={handleSaveDuration}
              disabled={saving || duracion === cita.duracionMinutos}
            >
              {saving ? t('guardando') : t('guardar_cambios')}
            </button>
          )}

          {canMarkNoShow && (
            <button className="cita-detalle-modal__btn cita-detalle-modal__btn--noshow" onClick={handleNoShow} disabled={saving}>
              <UserX size={14} /> {t('no_asistio_btn')}
            </button>
          )}

          {canUnmarkNoShow && (
            <button className="cita-detalle-modal__btn cita-detalle-modal__btn--confirm" onClick={() => setConfirmAction('unmark_noshow')} disabled={saving}>
              <CheckCircle size={14} /> {t('desmarcar_no_show')}
            </button>
          )}

          {canCancel && (
            <button className="cita-detalle-modal__btn cita-detalle-modal__btn--cancel" onClick={handleCancel} disabled={saving}>
              <Trash2 size={14} /> {t('cancel')}
            </button>
          )}
        </div>
      </div>

      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction === 'cancel' ? t('cancel') : confirmAction === 'unmark_noshow' ? t('desmarcar_no_show') : t('no_asistio_btn')}
        message={confirmAction === 'cancel' ? t('confirm_cancel') : confirmAction === 'unmark_noshow' ? t('confirm_desmarcar_no_show') : t('confirm_no_show')}
        variant={confirmAction === 'unmark_noshow' ? 'activate' : 'danger'}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
