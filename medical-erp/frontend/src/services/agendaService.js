import apiClient from './apiClient';

const agendaService = {
  async getCitasHoy() {
    return apiClient('/api/v1/citas/hoy');
  },

  async getCitasProximas() {
    return apiClient('/api/v1/citas/proximas');
  },

  async getCitasPorPaciente(pacienteId) {
    return apiClient(`/api/v1/citas/paciente/${pacienteId}`);
  },

  async getCitasPorFecha(fecha) {
    return apiClient(`/api/v1/citas?fecha=${fecha}`);
  },

  async getCitasPorSemana(inicio, fin) {
    const promises = [];
    const fecha = new Date(inicio);
    const fechaFin = new Date(fin);

    while (fecha <= fechaFin) {
      const fechaKey = fecha.toISOString().split('T')[0];
      promises.push(
        apiClient(`/api/v1/citas?fecha=${fechaKey}`).catch(() => ({
          success: false,
          data: [],
        }))
      );
      fecha.setDate(fecha.getDate() + 1);
    }

    const results = await Promise.all(promises);
    const allCitas = results
      .filter((r) => r.success)
      .flatMap((r) => r.data || []);

    return { success: true, data: allCitas };
  },

  async getSlots(usuarioId, fecha, duracion = 30) {
    return apiClient(
      `/api/v1/agenda/${usuarioId}/disponibilidad?fecha=${fecha}&duracion=${duracion}`
    );
  },

  async getDisponibilidad(fecha, doctoraId) {
    const params = new URLSearchParams({ fecha });
    if (doctoraId) params.append('doctoraId', doctoraId);
    return apiClient(`/api/v1/agenda/disponibilidad?${params}`);
  },

  // --- Agenda CRUD ---

  async getAgendaByUsuario(usuarioId) {
    return apiClient(`/api/v1/agenda/usuario/${usuarioId}`);
  },

  async crearAgenda(agendaData) {
    return apiClient('/api/v1/agenda', {
      method: 'POST',
      body: JSON.stringify(agendaData),
    });
  },

  async updateDisponibilidades(agendaId, disponibilidades) {
    return apiClient(`/api/v1/agenda/${agendaId}/disponibilidades`, {
      method: 'PUT',
      body: JSON.stringify(disponibilidades),
    });
  },

  // --- Bloqueos ---

  async getBloqueos(agendaId) {
    return apiClient(`/api/v1/agenda/${agendaId}/bloqueos`);
  },

  async crearBloqueo(agendaId, bloqueoData) {
    return apiClient(`/api/v1/agenda/${agendaId}/bloqueos`, {
      method: 'POST',
      body: JSON.stringify(bloqueoData),
    });
  },

  async eliminarBloqueo(bloqueoId) {
    return apiClient(`/api/v1/agenda/bloqueos/${bloqueoId}`, {
      method: 'DELETE',
    });
  },

  // --- Citas ---

  async crearCita(citaData) {
    return apiClient('/api/v1/citas', {
      method: 'POST',
      body: JSON.stringify(citaData),
    });
  },

  async confirmarCita(citaId) {
    return apiClient(`/api/v1/citas/${citaId}/confirmar`, {
      method: 'PUT',
    });
  },

  async cancelarCita(citaId, motivo) {
    return apiClient(`/api/v1/citas/${citaId}/cancelar`, {
      method: 'PUT',
      body: JSON.stringify({ motivo }),
    });
  },

  async reprogramarCita(citaId, nuevaFecha, nuevaHora) {
    return apiClient(`/api/v1/citas/${citaId}/reprogramar`, {
      method: 'PUT',
      body: JSON.stringify({ fecha: nuevaFecha, hora: nuevaHora }),
    });
  },

  async marcarLlegada(citaId) {
    return apiClient(`/api/v1/citas/${citaId}/llegada`, {
      method: 'PUT',
    });
  },

  async iniciarAtencion(citaId) {
    return apiClient(`/api/v1/citas/${citaId}/iniciar`, {
      method: 'PUT',
    });
  },

  async completarCita(citaId) {
    return apiClient(`/api/v1/citas/${citaId}/completar`, {
      method: 'PUT',
    });
  },

  // Disponibilidad semanal
  getDisponibilidadSemana: async (usuarioId, inicio, fin) => {
    try {
      const response = await apiClient(
        `/api/v1/agenda/${usuarioId}/disponibilidad-semana?inicio=${inicio}&fin=${fin}`
      );
      return response;
    } catch (error) {
      console.error('Error fetching disponibilidad semanal:', error);
      return { success: false, data: [] };
    }
  },

  // Reprogramar cita (actualizar fecha/hora)
  updateCita: async (citaId, data) => {
    try {
      const response = await apiClient(`/api/v1/citas/${citaId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      console.error('Error updating cita:', error);
      throw error;
    }
  },

  // Doctores
  getDoctores: async () => {
    try {
      const response = await apiClient('/api/v1/usuarios?rol=DOCTORA');
      return response;
    } catch (error) {
      console.error('Error fetching doctores:', error);
      return { success: false, data: [] };
    }
  },

  // Solicitar cita (doctora → enfermera flow)
  solicitarCita: async (citaData) => {
    try {
      const response = await apiClient('/api/v1/citas/solicitar', {
        method: 'POST',
        body: JSON.stringify(citaData),
      });
      return response;
    } catch (error) {
      console.error('Error solicitando cita:', error);
      throw error;
    }
  },

  // Get citas solicitadas pendientes (for nurse sidebar)
  getSolicitadasPendientes: async () => {
    try {
      const response = await apiClient('/api/v1/citas/solicitadas');
      return response;
    } catch (error) {
      console.error('Error fetching solicitadas:', error);
      return { success: false, data: [] };
    }
  },

  // Programar cita (nurse confirms a solicitud)
  programarCita: async (citaId) => {
    try {
      const response = await apiClient(`/api/v1/citas/${citaId}/programar`, {
        method: 'PATCH',
      });
      return response;
    } catch (error) {
      console.error('Error programando cita:', error);
      throw error;
    }
  },

  // Rechazar solicitud
  rechazarCita: async (citaId, motivo) => {
    try {
      const params = motivo ? `?motivo=${encodeURIComponent(motivo)}` : '';
      const response = await apiClient(`/api/v1/citas/${citaId}/rechazar${params}`, {
        method: 'PATCH',
      });
      return response;
    } catch (error) {
      console.error('Error rechazando cita:', error);
      throw error;
    }
  },

  // Verificar extensión de duración
  verificarExtension: async (citaId, nuevaDuracion) => {
    try {
      const response = await apiClient(`/api/v1/citas/${citaId}/verificar-extension?nuevaDuracion=${nuevaDuracion}`);
      return response;
    } catch (error) {
      console.error('Error verificando extension:', error);
      return { success: false, data: { conflicto: false } };
    }
  },

  // Get available slots for scheduling a solicitud (nurse uses this)
  getDisponibilidadSolicitud: async (usuarioId, fechaMinima, duracion = 30) => {
    try {
      const response = await apiClient(
        `/api/v1/citas/disponibilidad-solicitud?usuarioId=${usuarioId}&fechaMinima=${fechaMinima}&duracion=${duracion}`
      );
      return response;
    } catch (error) {
      console.error('Error fetching disponibilidad para solicitud:', error);
      return { success: false, data: [] };
    }
  },

  // Update solicitud with assigned time (nurse assigns slot)
  asignarHorarioCita: async (citaId, fecha, hora) => {
    try {
      const response = await apiClient(`/api/v1/citas/${citaId}`, {
        method: 'PUT',
        body: JSON.stringify({ fecha, hora }),
      });
      return response;
    } catch (error) {
      console.error('Error asignando horario:', error);
      throw error;
    }
  },
};

export default agendaService;
