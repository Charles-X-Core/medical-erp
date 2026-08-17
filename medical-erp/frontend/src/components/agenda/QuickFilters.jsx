import { Sunrise, Sunset, Calendar, Clock } from 'lucide-react';

const filters = [
  { id: 'manana', label: 'Mañana', icon: Sunrise, hour: 8 },
  { id: 'tarde', label: 'Tarde', icon: Sunset, hour: 13 },
  { id: 'hoy', label: 'Hoy', icon: Calendar, hour: null },
];

export default function QuickFilters({ onFilter }) {
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
