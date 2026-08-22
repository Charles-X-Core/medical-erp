import apiClient from './apiClient';

export const recetaService = {
  async listByPaciente(pacienteId, params = {}) {
    const query = new URLSearchParams(params).toString();
    try {
      return await apiClient(`/api/v1/recetas/paciente/${pacienteId}${query ? `?${query}` : ''}`);
    } catch {
      return { success: false, data: [] };
    }
  },
};