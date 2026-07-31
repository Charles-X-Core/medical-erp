import apiClient from './apiClient';

export const historiaClinicaService = {
  async getByPaciente(pacienteId) {
    return apiClient(`/api/v1/historias/paciente/${pacienteId}`);
  },

  async getById(id) {
    return apiClient(`/api/v1/historias/${id}`);
  },

  async create(data) {
    return apiClient('/api/v1/historias', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id, data) {
    return apiClient(`/api/v1/historias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
