import apiClient from './apiClient';

export const evidenciaService = {
  async listByPaciente(pacienteId, params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiClient(`/api/v1/evidencias/paciente/${pacienteId}${query ? `?${query}` : ''}`);
  },

  async getById(id) {
    return apiClient(`/api/v1/evidencias/${id}`);
  },

  async delete(id) {
    return apiClient(`/api/v1/evidencias/${id}`, { method: 'DELETE' });
  },

  async uploadBatch(sesionId, tipo, descripcion, files) {
    const formData = new FormData();
    formData.append('tipo', tipo);
    if (descripcion) formData.append('descripcion', descripcion);
    for (const file of files) {
      formData.append('files', file);
    }
    return apiClient(`/api/v1/evidencias/sesion/${sesionId}`, {
      method: 'POST',
      body: formData,
      isFormData: true,
    });
  },

  async uploadTratamiento(tratamientoId, tipo, descripcion, files) {
    const formData = new FormData();
    formData.append('tipo', tipo);
    if (descripcion) formData.append('descripcion', descripcion);
    for (const file of files) {
      formData.append('files', file);
    }
    return apiClient(`/api/v1/evidencias/tratamiento/${tratamientoId}`, {
      method: 'POST',
      body: formData,
      isFormData: true,
    });
  },

  async sendToPatient(evidenciaId, asunto, mensaje) {
    return apiClient(`/api/v1/evidencias/${evidenciaId}/enviar-paciente`, {
      method: 'POST',
      body: JSON.stringify({ asunto, mensaje }),
    });
  },

  getFileUrl(fileName) {
    return `/api/v1/evidencias/file/${fileName}`;
  },

  getDownloadUrl(fileName) {
    return `/api/v1/evidencias/download/${fileName}`;
  },
};
