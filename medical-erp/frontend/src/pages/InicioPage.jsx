import { useState, useEffect, useCallback } from 'react';
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

export default function InicioPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resumen, setResumen] = useState(null);

  const primaryRole = getPrimaryRole(user);
  const config = dashboardRoleConfig[primaryRole] || dashboardRoleConfig.enfermera;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await dashboardService.getResumen();
      setResumen(data);
    } catch (err) {
      setError('Error al cargar el resumen del día');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !resumen) {
    return (
      <div className="dashboard-page">
        <DashboardHeader config={config} fecha={null} />
        <div className="dashboard-page__loading">
          <Loader2 size={32} className="spinner" />
          <p>Cargando panel...</p>
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
          <button onClick={loadData}>Reintentar</button>
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
        {sections.proximas.show && (
          <div className="dashboard-page__sidebar">
            <ProximasCitas citas={resumen?.citasProximas || []} loading={loading} />
          </div>
        )}
      </div>
    </div>
  );
}
