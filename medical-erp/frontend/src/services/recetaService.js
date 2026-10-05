import apiClient from './apiClient';

export const recetaService = {
  async create(data) {
    return apiClient('/api/v1/recetas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getByPaciente(pacienteId) {
    return apiClient(`/api/v1/recetas/paciente/${pacienteId}`);
  },

  async getBySesion(sesionId) {
    return apiClient(`/api/v1/recetas/sesion/${sesionId}`);
  },

  async getByTratamiento(tratamientoId) {
    return apiClient(`/api/v1/recetas/tratamiento/${tratamientoId}`);
  },

  getPdfUrl(recetaId) {
    return `/api/v1/recetas/${recetaId}/pdf`;
  },

  async enviarPorEmail(recetaId, asunto, mensaje) {
    return apiClient(`/api/v1/recetas/${recetaId}/enviar`, {
      method: 'POST',
      body: JSON.stringify({ asunto, mensaje }),
    });
  },
};
