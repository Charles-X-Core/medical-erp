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

  async getByPaciente(pacienteId) {
    return apiClient(`/api/v1/consultas/paciente/${pacienteId}`);
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

  // ==================== HISTORIA CLINICA ====================
  async createHistoria(data) {
    return apiClient('/api/v1/historias', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getHistoriaByPaciente(pacienteId) {
    return apiClient(`/api/v1/historias/paciente/${pacienteId}`);
  },

  // ==================== TRATAMIENTOS ====================
  async createTratamientosBatch(data) {
    return apiClient('/api/v1/tratamientos/batch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async listTratamientosByConsulta(consultaId) {
    return apiClient(`/api/v1/tratamientos/consulta/${consultaId}`);
  },

  // ==================== RECETAS ====================
  async createRecetasBatch(data) {
    return apiClient('/api/v1/recetas/batch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async listRecetasByConsulta(consultaId) {
    return apiClient(`/api/v1/recetas/consulta/${consultaId}`);
  },

  // ==================== EVIDENCIAS ====================
  async uploadEvidencia(formData) {
    return apiClient('/api/v1/evidencias/upload', {
      method: 'POST',
      body: formData,
      isFormData: true,
    });
  },

  async listEvidenciasByConsulta(consultaId) {
    return apiClient(`/api/v1/evidencias/consulta/${consultaId}`);
  },

  async listEvidenciasByPaciente(pacienteId) {
    return apiClient(`/api/v1/evidencias/paciente/${pacienteId}`);
  },
};
