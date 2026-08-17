import apiClient from './apiClient';

export const evidenciaService = {
  async listByPaciente(pacienteId, params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/api/v1/evidencias/paciente/${pacienteId}${query ? `?${query}` : ''}`);
  },
};