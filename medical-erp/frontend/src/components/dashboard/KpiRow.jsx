import { CalendarCheck, Loader, Activity, AlertTriangle, Users } from 'lucide-react';

function KpiCard({ icon: Icon, label, value, hint, tone }) {
  return (
    <div className={`kpi-card kpi-card--${tone || 'blue'}`}>
      <div className="kpi-card__icon">
        <Icon size={20} />
      </div>
      <div className="kpi-card__body">
        <span className="kpi-card__value">{value}</span>
        <span className="kpi-card__label">{label}</span>
        {hint && <span className="kpi-card__hint">{hint}</span>}
      </div>
    </div>
  );
}

export default function KpiRow({ stats, citasHoy, tratamientos, alertas, pacientesNuevos7d, loading }) {
  if (loading) {
    return (
      <div className="kpi-row">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="kpi-card kpi-card--skeleton">
            <Loader size={20} className="spinner" />
          </div>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      icon: CalendarCheck,
      label: 'Citas hoy',
      value: citasHoy?.total ?? 0,
      hint: `${citasHoy?.esperando ?? 0} en espera`,
      tone: 'blue',
    },
    {
      icon: Activity,
      label: 'Tratamientos activos',
      value: tratamientos?.activos ?? 0,
      hint: `${tratamientos?.total ?? 0} en total`,
      tone: 'teal',
    },
    {
      icon: Users,
      label: 'Clientes nuevos (7d)',
      value: pacientesNuevos7d ?? 0,
      hint: 'última semana',
      tone: 'purple',
    },
    {
      icon: AlertTriangle,
      label: 'Alertas clínicas',
      value: alertas?.length ?? 0,
      hint: 'requieren revisión',
      tone: 'red',
    },
  ];

  return (
    <div className="kpi-row">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.label} {...kpi} />
      ))}
    </div>
  );
}
