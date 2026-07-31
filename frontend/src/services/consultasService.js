import apiClient from './apiClient';

export const consultasService = {
  async listByHistoria(historiaId, params = {}) {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.set('page', params.page);
    if (params.size !== undefined) query.set('size', params.size);
    if (params.sort) query.set('sort', params.sort);
    const q = query.toString();
    return apiClient(`/api/v1/consultas/historia/${historiaId}${q ? '?' + q : ''}`);
  },

  async getById(id) {
    return apiClient(`/api/v1/consultas/${id}`);
  },

  async create(data) {
    return apiClient('/api/v1/consultas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id, data) {
    return apiClient(`/api/v1/consultas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async firmar(id) {
    return apiClient(`/api/v1/consultas/${id}/firmar`, {
      method: 'PATCH',
    });
  },

  async delete(id) {
    return apiClient(`/api/v1/consultas/${id}`, {
      method: 'DELETE',
    });
  },
};
