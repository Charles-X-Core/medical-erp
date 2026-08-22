import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getPrimaryRole } from '../utils/roleUtils';
import { dashboardRoleConfig } from '../config/dashboardRoleConfig';
import dashboardService from '../services/dashboard/dashboardService';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import KpiRow from '../components/dashboard/KpiRow';
import ProximoPaciente from '../components/dashboard/ProximoPaciente';
import CitasHoyList from '../components/dashboard/CitasHoyList';
import TratamientosActivos from '../components/dashboard/TratamientosActivos';
import AlertasPanel from '../components/dashboard/AlertasPanel';
import ProximasCitas from '../components/dashboard/ProximasCitas';
import ColaPacientes from '../components/dashboard/ColaPacientes';
import NotificacionesDashboard from '../components/dashboard/NotificacionesDashboard';

const POLL_INTERVAL = 30000;

export default function InicioPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resumen, setResumen] = useState(null);
  const { t } = useTranslation('dashboard');

  const primaryRole = getPrimaryRole(user);
  const config = dashboardRoleConfig[primaryRole] || dashboardRoleConfig.doctora;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await dashboardService.getResumen();
      if (!data) {
        setError(t('error_no_connection'));
      }
      setResumen(data);
    } catch (err) {
      setError(t('error_loading_summary'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const poll = await dashboardService.getPoll();
        if (poll) {
          setResumen((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              citasHoy: poll.citasHoyStats || prev.citasHoy,
              citasHoyList: poll.citasHoy || prev.citasHoyList,
              cola: poll.cola || prev.cola,
              proximoPaciente: poll.proximoPaciente !== undefined ? poll.proximoPaciente : prev.proximoPaciente,
            };
          });
        }
      } catch {
        // Silent fail for poll
      }
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  if (loading && !resumen) {
    return (
      <div className="dashboard-page">
        <DashboardHeader config={config} fecha={null} />
        <div className="dashboard-page__loading">
          <Loader2 size={32} className="spinner" />
          <p>{t('loading_panel')}</p>
        </div>
      </div>
    );
  }

  const sections = config.sections;

  return (
    <div className="dashboard-page">
      <DashboardHeader config={config} fecha={resumen?.fecha} />

      {error && (
        <div className="dashboard-page__error">
          {error}
          <button onClick={loadData}>{t('retry')}</button>
        </div>
      )}

      <ProximoPaciente
        cita={resumen?.proximoPaciente}
        hero={config.hero}
        loading={loading}
      />

      <KpiRow
        citasHoy={resumen?.citasHoy}
        tratamientos={resumen?.tratamientos}
        alertas={resumen?.alertas}
        pacientesNuevos7d={resumen?.pacientesNuevos7d}
        loading={loading}
      />

      <div className="dashboard-page__body">
        <div className="dashboard-page__main">
          {sections.citasHoy.show && (
            <CitasHoyList citas={resumen?.citasHoyList || []} loading={loading} />
          )}
          {sections.tratamientos.show && (
            <TratamientosActivos tratamientos={resumen?.tratamientosActivos || []} loading={loading} />
          )}
          {sections.alertas.show && (
            <AlertasPanel alertas={resumen?.alertas || []} loading={loading} />
          )}
        </div>
        <div className="dashboard-page__sidebar">
          {sections.cola.show && (
            <ColaPacientes citas={resumen?.cola || []} loading={loading} />
          )}
          {sections.proximas.show && (
            <ProximasCitas citas={resumen?.citasProximas || []} loading={loading} />
          )}
          {sections.notificaciones.show && (
            <NotificacionesDashboard />
          )}
        </div>
      </div>
    </div>
  );
}
