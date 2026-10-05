import apiClient from './apiClient';

export const tratamientoService = {
  async listTipos() {
    return apiClient('/api/v1/tipos-sesion-tratamiento');
  },

  async listByPaciente(pacienteId, params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/api/v1/tratamientos/paciente/${pacienteId}${query ? `?${query}` : ''}`);
  },

  async getById(id) {
    return apiClient(`/api/v1/tratamientos/${id}`);
  },

  async getSesiones(tratamientoId) {
    return apiClient(`/api/v1/sesiones-tratamiento/tratamiento/${tratamientoId}`);
  },

  async create(data) {
    return apiClient('/api/v1/tratamientos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async createSession(tratamientoId, data) {
    return apiClient(`/api/v1/sesiones-tratamiento?tratamientoId=${tratamientoId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async programar(id) {
    return apiClient(`/api/v1/tratamientos/${id}/programar`, {
      method: 'PATCH',
    });
  },

  async iniciar(id) {
    return apiClient(`/api/v1/tratamientos/${id}/iniciar`, {
      method: 'PATCH',
    });
  },

  async finalizar(id, resultado) {
    const params = resultado ? `?resultadoFinal=${encodeURIComponent(resultado)}` : '';
    return apiClient(`/api/v1/tratamientos/${id}/finalizar${params}`, {
      method: 'PATCH',
    });
  },

  async pausar(id, motivo) {
    const params = motivo ? `?motivo=${encodeURIComponent(motivo)}` : '';
    return apiClient(`/api/v1/tratamientos/${id}/pausar${params}`, {
      method: 'PATCH',
    });
  },

  async reanudar(id) {
    return apiClient(`/api/v1/tratamientos/${id}/reanudar`, {
      method: 'PATCH',
    });
  },

  async cancelar(id, motivo) {
    return apiClient(`/api/v1/tratamientos/${id}/cancelar?motivo=${encodeURIComponent(motivo)}`, {
      method: 'PATCH',
    });
  },

  async ampliarPlan(id, nuevasSesiones, motivo) {
    const params = new URLSearchParams({ nuevasSesiones: String(nuevasSesiones) });
    if (motivo) params.set('motivo', motivo);
    return apiClient(`/api/v1/tratamientos/${id}/ampliar?${params}`, {
      method: 'PATCH',
    });
  },

  async getHistorialClinico(id) {
    return apiClient(`/api/v1/tratamientos/${id}/historial/clinico`);
  },

  async getHistorialAdministrativo(id) {
    return apiClient(`/api/v1/tratamientos/${id}/historial/administrativo`);
  },
};