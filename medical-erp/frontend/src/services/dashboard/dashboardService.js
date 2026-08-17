import apiClient from '../apiClient';

const ESTADOS_EN_ESPERA = ['pendiente', 'confirmada'];

const dashboardService = {
  async getResumen() {
    const data = await apiClient('/api/v1/dashboard/resumen');
    return data.success ? data.data : null;
  },

  async getCitasHoy() {
    const data = await apiClient('/api/v1/citas/hoy');
    return data.success ? data.data : [];
  },

  async getCitasProximas() {
    const data = await apiClient('/api/v1/citas/proximas');
    return data.success ? data.data : [];
  },

  async getEstadisticas() {
    const [citasHoy, citasProximas] = await Promise.all([
      this.getCitasHoy(),
      this.getCitasProximas(),
    ]);

    return {
      totalHoy: citasHoy.length,
      pendientes: citasHoy.filter(
        (c) => c.estado !== 'completada' && c.estado !== 'cancelada'
      ).length,
      completadas: citasHoy.filter((c) => c.estado === 'completada').length,
      proximas: citasProximas.length,
    };
  },

  async getPacientesEsperando() {
    const citas = await this.getCitasHoy();
    return citas.filter((c) => ESTADOS_EN_ESPERA.includes(c.estado));
  },

  async getTratamientosActivos(pacienteId) {
    const data = await apiClient(`/api/v1/tratamientos/paciente/${pacienteId}`);
    return data.success ? data.data : [];
  },
};

export default dashboardService;
