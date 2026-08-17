import apiClient from './apiClient';

export const pacienteDocumentoService = {
  async list(pacienteId) {
    return apiClient(`/api/v1/pacientes/${pacienteId}/documentos`);
  },

  async create(pacienteId, data) {
    return apiClient(`/api/v1/pacientes/${pacienteId}/documentos`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(pacienteId, id, data) {
    return apiClient(`/api/v1/pacientes/${pacienteId}/documentos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(pacienteId, id) {
    return apiClient(`/api/v1/pacientes/${pacienteId}/documentos/${id}`, {
      method: 'DELETE',
    });
  },
};

export const pacienteSeguroService = {
  async list(pacienteId) {
    return apiClient(`/api/v1/pacientes/${pacienteId}/seguros`);
  },

  async create(pacienteId, data) {
    return apiClient(`/api/v1/pacientes/${pacienteId}/seguros`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(pacienteId, id, data) {
    return apiClient(`/api/v1/pacientes/${pacienteId}/seguros/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(pacienteId, id) {
    return apiClient(`/api/v1/pacientes/${pacienteId}/seguros/${id}`, {
      method: 'DELETE',
    });
  },
};

export const pacienteConsentimientoService = {
  async list(pacienteId) {
    return apiClient(`/api/v1/pacientes/${pacienteId}/consentimientos`);
  },

  async create(pacienteId, data) {
    return apiClient(`/api/v1/pacientes/${pacienteId}/consentimientos`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(pacienteId, id, data) {
    return apiClient(`/api/v1/pacientes/${pacienteId}/consentimientos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(pacienteId, id) {
    return apiClient(`/api/v1/pacientes/${pacienteId}/consentimientos/${id}`, {
      method: 'DELETE',
    });
  },
};

export const configService = {
  async getCountries() {
    return apiClient('/api/v1/config/paises');
  },
};
