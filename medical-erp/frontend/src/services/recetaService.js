import apiClient from './apiClient';

export const recetaService = {
  async listByPaciente(pacienteId, params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/api/v1/recetas/paciente/${pacienteId}${query ? `?${query}` : ''}`);
  },
};