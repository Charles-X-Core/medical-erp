import { useTranslation } from 'react-i18next';
import { CalendarCheck, Loader, Activity, AlertTriangle, Users, UserX } from 'lucide-react';

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
  const { t } = useTranslation('dashboard');

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
      label: t('kpi_appointments_today'),
      value: citasHoy?.total ?? 0,
      hint: t('kpi_waiting', { count: citasHoy?.esperando ?? 0 }),
      tone: 'blue',
    },
    {
      icon: Activity,
      label: t('kpi_active_treatments'),
      value: tratamientos?.activos ?? 0,
      hint: t('kpi_total', { count: tratamientos?.total ?? 0 }),
      tone: 'teal',
    },
    {
      icon: Users,
      label: t('kpi_new_clients_7d'),
      value: pacientesNuevos7d ?? 0,
      hint: t('kpi_last_week'),
      tone: 'purple',
    },
    ...(citasHoy?.noShow > 0 ? [{
      icon: UserX,
      label: t('kpi_no_show'),
      value: citasHoy.noShow,
      hint: t('kpi_today'),
      tone: 'red',
    }] : []),
    {
      icon: AlertTriangle,
      label: t('kpi_clinical_alerts'),
      value: alertas?.length ?? 0,
      hint: t('kpi_requires_review'),
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
