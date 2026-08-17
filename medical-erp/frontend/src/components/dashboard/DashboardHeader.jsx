import { useState, useEffect } from 'react';
import { CalendarDays, Clock } from 'lucide-react';

function useCurrentTime() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  return time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export default function DashboardHeader({ config, fecha }) {
  const currentTime = useCurrentTime();

  const fechaLabel = fecha
    ? new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : '';

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
        {currentTime}
      </div>
    </div>
  );
}
