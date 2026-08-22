import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Clock } from 'lucide-react';

function useCurrentTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return time;
}

export default function DashboardHeader({ config, fecha }) {
  const currentTime = useCurrentTime();
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('es') ? 'es-ES' : 'en-US';

  const fechaLabel = fecha
    ? new Date(fecha + 'T00:00:00').toLocaleDateString(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : '';

  const timeStr = currentTime.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="dashboard-header">
      <div className="dashboard-header__title-group">
        <div className="dashboard-header__icon">
          <CalendarDays size={26} />
        </div>
        <div>
          <h2 className="dashboard-header__title">{config.title}</h2>
          <p className="dashboard-header__subtitle">
            {config.subtitle}
            {fechaLabel ? ` · ${fechaLabel}` : ''}
          </p>
        </div>
      </div>
      <div className="dashboard-header__time-badge">
        <Clock size={16} />
        {timeStr}
      </div>
    </div>
  );
}
