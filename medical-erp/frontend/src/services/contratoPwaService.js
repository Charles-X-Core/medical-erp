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

  async getPreview(pacienteId, templateCode = 'CONTRATO_MEMBRESIA') {
    return apiClient(BASE + '/preview?pacienteId=' + pacienteId + '&templateCode=' + encodeURIComponent(templateCode));
  },

  async checkFirmado(pacienteId) {
    return apiClient(BASE + '/check?pacienteId=' + pacienteId);
  },

  async firmar(token, firmaImagen, htmlContent) {
    return apiClient(BASE + '/firmar', {
      method: 'POST',
      body: JSON.stringify({ token, firmaImagen, htmlContent }),
    });
  },

  async getStatus(token) {
    return apiClient(BASE + '/status?token=' + encodeURIComponent(token));
  },
};
