import { Sunrise, Sunset, Calendar, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function QuickFilters({ onFilter }) {
  const { t } = useTranslation('agenda');
  const filters = [
    { id: 'manana', label: t('manana'), icon: Sunrise, hour: 8 },
    { id: 'tarde', label: t('tarde'), icon: Sunset, hour: 13 },
    { id: 'hoy', label: t('today'), icon: Calendar, hour: null },
  ];

  return (
    <div className="agenda-quick-filters">
      {filters.map((f) => (
        <button key={f.id} className="agenda-quick-filters__btn" onClick={() => onFilter(f)}>
          <f.icon size={14} />
          <span>{f.label}</span>
        </button>
      ))}
    </div>
  );
}
