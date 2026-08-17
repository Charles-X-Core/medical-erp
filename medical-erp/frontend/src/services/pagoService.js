import apiClient from './apiClient';

export const pagoService = {
  async listByPaciente(pacienteId, params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/api/v1/pagos/paciente/${pacienteId}${query ? `?${query}` : ''}`);
  },

  async listByHistoria(historiaId, params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/api/v1/pagos/historia/${historiaId}${query ? `?${query}` : ''}`);
  },
};