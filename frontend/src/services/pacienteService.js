import apiClient from './apiClient';

export const pacienteService = {
  async list(params = {}) {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.set('page', params.page);
    if (params.size !== undefined) query.set('size', params.size);
    if (params.sort) query.set('sort', params.sort);
    
    const q = query.toString();
    return apiClient(`/api/v1/pacientes${q ? '?' + q : ''}`);
  },

  async getById(id) {
    return apiClient(`/api/v1/pacientes/${id}`);
  },

  async create(data) {
    return apiClient('/api/v1/pacientes/full', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async createSimple(data) {
    return apiClient('/api/v1/pacientes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id, data) {
    return apiClient(`/api/v1/pacientes/full/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async updateSimple(id, data) {
    return apiClient(`/api/v1/pacientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id) {
    return apiClient(`/api/v1/pacientes/${id}`, {
      method: 'DELETE',
    });
  },

  async search(query) {
    return apiClient(`/api/v1/pacientes/buscar?q=${encodeURIComponent(query)}`);
  },

  async filterByEstado(estado) {
    return apiClient(`/api/v1/pacientes/estado/${estado}`);
  },
};
