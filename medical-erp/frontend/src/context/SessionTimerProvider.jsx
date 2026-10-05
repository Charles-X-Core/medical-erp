import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import agendaService from '../services/agendaService';
import SmartTimerBar from '../components/atencion/SmartTimerBar';
import { parseLADateTime, nowLA, getLADateString } from '../utils/laTimezone';
import { zonaIANA, horaMostrar } from '../utils/zonaHoraria';

const SessionTimerContext = createContext(null);

const ACTIVE_CITA_KEY = 'active_cita_id';

export function useSessionTimer() {
  return useContext(SessionTimerContext);
}

// Format helpers (duplicated locally to avoid circular deps)
function formatTime(date) {
  if (!date) return '--:--';
  return date.toLocaleTimeString('en-US', { timeZone: zonaIANA(), hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDuration(ms) {
  if (ms < 0) ms = 0;
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export default function SessionTimerProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [citaActiva, setCitaActiva] = useState(null);
  const [now, setNow] = useState(() => nowLA());
  const [expiredShown, setExpiredShown] = useState(false);
  const [extending, setExtending] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [extendError, setExtendError] = useState('');
  const [extendWarning, setExtendWarning] = useState('');
  const [allowExtend, setAllowExtend] = useState(true);
  const [citaVersion, setCitaVersion] = useState(0); // se incrementa al extender/completar

  // Live tick every second
  useEffect(() => {
    const interval = setInterval(() => setNow(nowLA()), 1000);
    return () => clearInterval(interval);
  }, []);

  const registerActiva = useCallback((cita) => {
    setCitaActiva(cita);
    setExpiredShown(false);
    setExtendError('');
    setExtendWarning('');
    if (cita?.id) {
      try { localStorage.setItem(ACTIVE_CITA_KEY, String(cita.id)); } catch { /* ignore */ }
    }
  }, []);

  const clearActiva = useCallback(() => {
    setCitaActiva(null);
    setExpiredShown(false);
    setExtendError('');
    setExtendWarning('');
    try { localStorage.removeItem(ACTIVE_CITA_KEY); } catch { /* ignore */ }
  }, []);

  // Restaurar el cronómetro al recargar: recuperar la cita activa por ID (sin depender
  // de la fecha de hoy, para no perderla si la sesión cruzó la medianoche).
  useEffect(() => {
    let id = null;
    try { id = localStorage.getItem(ACTIVE_CITA_KEY); } catch { /* ignore */ }
    if (!id) return;
    agendaService.getCitaById(id).then((res) => {
      const cita = res?.data || res;
      if (cita && cita.estado === 'en_atencion') {
        registerActiva(cita);
      } else {
        try { localStorage.removeItem(ACTIVE_CITA_KEY); } catch { /* ignore */ }
      }
    }).catch(() => {
      try { localStorage.removeItem(ACTIVE_CITA_KEY); } catch { /* ignore */ }
    });
  }, [registerActiva]);

  const inicioAtencion = citaActiva?.inicioAtencion
    ? parseLADateTime(citaActiva.inicioAtencion)
    : null;
  const duracion = citaActiva?.duracionMinutos || 30;
  const finSesion = inicioAtencion ? new Date(inicioAtencion.getTime() + duracion * 60000) : null;
  const sessionRemainingMs = finSesion ? finSesion - now : null;
  const sessionExpired = sessionRemainingMs !== null && sessionRemainingMs <= 0;

  // When a session expires, verify extension availability once
  useEffect(() => {
    if (!sessionExpired || expiredShown || !citaActiva) return;
    setExpiredShown(true);
    setExtendError('');
    setExtendWarning('');
    setAllowExtend(true);

    if (citaActiva.id) {
      const nuevaDuracion = (citaActiva.duracionMinutos || 30) + 15;
      agendaService.verificarExtension(citaActiva.id, nuevaDuracion).then((res) => {
        const d = res?.data || res;
        if (d?.conflicto) {
          setAllowExtend(false);
          const afectada = d.citasAfectadas && d.citasAfectadas[0];
          setExtendWarning(
            `You have another appointment at ${horaMostrar(afectada?.horaInicio, citaActiva.fecha) || 'an hour that conflicts'}. ` +
            'It is recommended to finalize the session instead.'
          );
        }
      }).catch(() => {});
    }
  }, [sessionExpired, expiredShown, citaActiva]);

  const handleFinalize = useCallback(async () => {
    if (!citaActiva) return;
    setFinalizing(true);
    try {
      await agendaService.completarCita(citaActiva.id);
      setExpiredShown(false);
      clearActiva();
      // Finalizar dentro del workspace o ver-detalles → /pacientes; en otro lado → quedarse
      if (location.pathname.includes('/workspace') || location.pathname.includes('/detalle')) {
        navigate('/pacientes');
      } else {
        // quedarse en la página actual
        if (typeof window !== 'undefined') window.location.reload();
      }
    } catch (err) {
      setExtendError(err.message || 'Error');
    } finally {
      setFinalizing(false);
    }
  }, [citaActiva, location.pathname, navigate, clearActiva]);

  const handleExtend = useCallback(async () => {
    if (!citaActiva) return;
    if (!allowExtend) return;
    setExtending(true);
    setExtendError('');
    setExtendWarning('');
    try {
      const res = await agendaService.extenderSesion(citaActiva.id, 15);
      const nuevaDuracion = res?.data?.citaExtendida?.duracionMinutos;
      setExpiredShown(false);
      setCitaActiva((prev) => (prev ? { ...prev, duracionMinutos: nuevaDuracion || prev.duracionMinutos + 15 } : prev));
      setExtendWarning('');
      setCitaVersion((v) => v + 1); // notifica al workspace para refrescar el cronómetro
    } catch (err) {
      // Conflicto con otra cita → avisar y NO extender (recomendado finalizar).
      setExtendError('');
      setExtendWarning(err?.message || 'No se pudo extender: conflicto con otra cita. Se recomienda finalizar.');
      setAllowExtend(false);
    } finally {
      setExtending(false);
    }
  }, [citaActiva, allowExtend]);

  const handleDismiss = useCallback(() => {
    setExpiredShown(false);
  }, []);

  const citaLabel = citaActiva
    ? {
        id: citaActiva.id,
        hora: citaActiva.hora,
        doctoraNombre: citaActiva.usuarioNombre || '',
        pacienteNombre: citaActiva.pacienteNombre || '',
        tipoCitaNombre: citaActiva.tipoCitaNombre || '',
        duracionMinutos: citaActiva.duracionMinutos || 30,
        inicioAtencion: citaActiva.inicioAtencion,
        horaInicio: horaMostrar(citaActiva.hora, citaActiva.fecha)?.substring(0, 5) || '--:--',
      }
    : null;

  return (
    <SessionTimerContext.Provider
      value={{
        citaActiva: citaLabel,
        registerActiva,
        clearActiva,
        citaVersion,
      }}
    >
      {children}

      {/* Barra de cronómetro global: solo fuera del workspace (ahí ya se muestra la local) */}
      {citaActiva && !location.pathname.includes('/workspace') && (
        <div className="session-timer-global">
          <SmartTimerBar
            citaActiva={citaActiva}
            siguienteCita={null}
            onComplete={handleFinalize}
          />
        </div>
      )}

      {/* Modal global de tiempo agotado */}
      {sessionExpired && expiredShown && citaLabel && (
        <div className="onboarding-modal" onClick={(e) => { if (e.target === e.currentTarget) handleDismiss(); }}>
          <div className="onboarding-modal__box">
            <button className="onboarding-modal__close" onClick={handleDismiss}>×</button>
            <div className="onboarding-modal__icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
              <AlertTriangleIcon size={40} />
            </div>
            <h3 className="onboarding-modal__title">Session time elapsed</h3>
            <p className="onboarding-modal__subtitle">The session time for this appointment has run out.</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 14, color: '#64748b' }}>
              <ClockIcon size={14} />
              <span>{citaLabel.horaInicio} — {formatTime(finSesion || new Date())} · {citaLabel.duracionMinutos} min</span>
            </div>

            {extendWarning && (
              <div style={{ background: '#FEF2F2', color: '#DC2626', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
                {extendWarning}
              </div>
            )}
            {extendError && (
              <div style={{ background: '#FEF2F2', color: '#DC2626', borderRadius: 8, padding: '8px 12px', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
                {extendError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                className="onboarding-modal__btn onboarding-modal__btn--save"
                onClick={handleFinalize}
                disabled={finalizing}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <CheckCircleIcon size={16} />
                {finalizing ? '...' : 'Finalize'}
              </button>
              {allowExtend ? (
                <button
                  className="onboarding-modal__btn onboarding-modal__btn--save"
                  onClick={handleExtend}
                  disabled={extending}
                  style={{ width: '100%', justifyContent: 'center', background: '#F59E0B' }}
                >
                  <PlusIcon size={16} />
                  {extending ? '...' : 'Extend +15 min'}
                </button>
              ) : null}
              <button
                className="onboarding-modal__btn onboarding-modal__btn--skip"
                onClick={handleDismiss}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </SessionTimerContext.Provider>
  );
}

function AlertTriangleIcon({ size }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
}
function ClockIcon({ size }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}
function CheckCircleIcon({ size }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
}
function PlusIcon({ size }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}
