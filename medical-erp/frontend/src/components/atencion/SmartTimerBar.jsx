import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle, Timer } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function formatTime(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
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

function parseTimeToDate(timeStr, baseDate) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d;
}

export default function SmartTimerBar({ citaActiva, siguienteCita }) {
  const { t: tClinical } = useTranslation('clinical');
  const { t: tPatients } = useTranslation('patients');

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!citaActiva) return null;

  const inicioAtencion = citaActiva.inicioAtencion
    ? new Date(citaActiva.inicioAtencion)
    : null;

  const sessionDuration = inicioAtencion ? now - inicioAtencion : 0;
  const sessionStart = inicioAtencion ? formatTime(inicioAtencion) : '--:--';

  let nextCitaTime = null;
  let nextCitaLabel = '';
  let timeUntilNext = Infinity;

  if (siguienteCita) {
    nextCitaTime = parseTimeToDate(siguienteCita.hora, now);
    if (nextCitaTime && nextCitaTime <= now) {
      nextCitaTime.setDate(nextCitaTime.getDate() + 1);
    }
    if (nextCitaTime) {
      timeUntilNext = nextCitaTime - now;
      nextCitaLabel = formatTime(nextCitaTime);
    }
  }

  const remainingMs = nextCitaTime ? timeUntilNext : null;
  const remainingMin = remainingMs !== null ? Math.floor(remainingMs / 60000) : null;

  let status = 'normal';
  let statusLabel = tClinical('normal');
  let statusIcon = CheckCircle;
  if (remainingMin !== null) {
    if (remainingMin < 5) {
      status = 'urgent';
      statusLabel = tClinical('urgente');
      statusIcon = AlertTriangle;
    } else if (remainingMin < 15) {
      status = 'warning';
      statusLabel = tClinical('precaucion');
      statusIcon = AlertTriangle;
    }
  }

  const StatusIcon = statusIcon;

  return (
    <div className={`smart-timer smart-timer--${status}`}>
      <div className="smart-timer__section smart-timer__section--clock">
        <Clock size={16} />
        <span className="smart-timer__time">{formatTime(now)}</span>
        <span className="smart-timer__label">{tClinical('ahora')}</span>
      </div>

      <div className="smart-timer__divider" />

      <div className="smart-timer__section smart-timer__section--session">
        <Timer size={16} />
        <span className="smart-timer__time">{formatDuration(sessionDuration)}</span>
        <span className="smart-timer__label">{tPatients('sesion')} ({sessionStart})</span>
      </div>

      {nextCitaTime && (
        <>
          <div className="smart-timer__divider" />
          <div className="smart-timer__section smart-timer__section--next">
            <StatusIcon size={16} />
            <span className="smart-timer__time">{nextCitaLabel}</span>
            <span className="smart-timer__label">
              {tPatients('siguiente_cita_restantes', { tiempo: remainingMs !== null ? formatDuration(remainingMs) : '' })}
            </span>
          </div>
        </>
      )}

      <div className={`smart-timer__badge smart-timer__badge--${status}`}>
        <StatusIcon size={14} />
        <span>{statusLabel}</span>
      </div>
    </div>
  );
}
