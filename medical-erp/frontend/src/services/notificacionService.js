import apiClient from './apiClient';

const notificacionService = {
  getNoLeidas: async () => {
    try {
      const response = await apiClient('/api/v1/notificaciones/no-leidas');
      return response.success ? response : { success: true, data: response.data || [] };
    } catch (error) {
      console.error('Error fetching notificaciones:', error);
      return { success: false, data: [] };
    }
  },

  getConteo: async () => {
    try {
      const response = await apiClient('/api/v1/notificaciones/conteo');
      return response.success ? response : { success: true, data: { noLeidas: 0 } };
    } catch (error) {
      console.error('Error fetching conteo:', error);
      return { success: false, data: { noLeidas: 0 } };
    }
  },

  getAll: async () => {
    try {
      const response = await apiClient('/api/v1/notificaciones');
      return response.success ? response : { success: true, data: response.data || [] };
    } catch (error) {
      console.error('Error fetching all notificaciones:', error);
      return { success: false, data: [] };
    }
  },

  marcarLeida: async (id) => {
    try {
      const response = await apiClient(`/api/v1/notificaciones/${id}/leer`, { method: 'PATCH' });
      return response;
    } catch (error) {
      console.error('Error marking notificacion as read:', error);
      throw error;
    }
  },

  marcarTodasLeidas: async () => {
    try {
      const response = await apiClient('/api/v1/notificaciones/leer-todas', { method: 'PATCH' });
      return response;
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  },

  crear: async (data) => {
    try {
      const response = await apiClient('/api/v1/notificaciones', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      console.error('Error creating notificacion:', error);
      throw error;
    }
  },
};

export default notificacionService;
