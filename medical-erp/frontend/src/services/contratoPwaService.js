import apiClient from './apiClient';

const BASE = '/api/v1/contrato-pwa';

export const contratoPwaService = {
  async enviar(pacienteId, templateCode = 'CONTRATO_MEMBRESIA') {
    return apiClient(BASE + '/enviar', {
      method: 'POST',
      body: JSON.stringify({ pacienteId, templateCode }),
    });
  },

  async getSiguiente() {
    return apiClient(BASE + '/siguiente');
  },

  async render(token) {
    return apiClient(BASE + '/render?token=' + encodeURIComponent(token));
  },

  async firmar(token, firmaImagen) {
    return apiClient(BASE + '/firmar', {
      method: 'POST',
      body: JSON.stringify({ token, firmaImagen }),
    });
  },

  async getStatus(token) {
    return apiClient(BASE + '/status?token=' + encodeURIComponent(token));
  },
};
