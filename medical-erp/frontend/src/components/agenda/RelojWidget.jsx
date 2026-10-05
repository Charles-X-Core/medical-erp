import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Calendar } from 'lucide-react';
import { zonaIANA } from '../../utils/zonaHoraria';

const DAY_KEYS = ['day_sunday', 'day_monday', 'day_tuesday', 'day_wednesday', 'day_thursday', 'day_friday', 'day_saturday'];
const MONTH_KEYS = ['month_enero', 'month_febrero', 'month_marzo', 'month_abril', 'month_mayo', 'month_junio', 'month_julio', 'month_agosto', 'month_septiembre', 'month_octubre', 'month_noviembre', 'month_diciembre'];

export default function RelojWidget() {
  const { t } = useTranslation('agenda');
  const [hora, setHora] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setHora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const laTime = new Date(hora.toLocaleString('en-US', { timeZone: zonaIANA() }));
  const timeStr = laTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const parts = timeStr.split(':');

  return (
    <div className="reloj-widget">
      <div className="reloj-widget__icon"><Clock size={24} /></div>
      <div className="reloj-widget__time">
        <span className="reloj-widget__hours">{parts[0]}:{parts[1]}</span>
        <span className="reloj-widget__seconds">:{parts[2]}</span>
      </div>
      <div className="reloj-widget__date">
        <Calendar size={14} />
        <span>{t(DAY_KEYS[laTime.getDay()])} {laTime.getDate()} de {t(MONTH_KEYS[laTime.getMonth()])}</span>
      </div>
    </div>
  );
}
