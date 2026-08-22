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

  async getDisponibilidad(fecha, doctoraId, duracion = 30) {
    if (!doctoraId) return apiClient(`/api/v1/agenda/disponibilidad?fecha=${fecha}&duracion=${duracion}`);
    return apiClient(`/api/v1/agenda/${doctoraId}/disponibilidad?fecha=${fecha}&duracion=${duracion}`);
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

  async crearCita({ pacienteId, usuarioId, fecha, hora, duracionMinutos, tipoCitaId, motivo, notas, prioridad }) {
    const payload = {
      pacienteId,
      usuarioId,
      fecha,
      hora,
      duracionMinutos: duracionMinutos || 30,
      tipoCitaId: tipoCitaId || undefined,
      motivo: motivo || 'Consulta',
      notas: notas || undefined,
      prioridad: prioridad || 'NORMAL',
    };
    return apiClient('/api/v1/citas', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async confirmarCita(citaId) {
    return apiClient(`/api/v1/citas/${citaId}/confirmar`, {
      method: 'PATCH',
    });
  },

  async cancelarCita(citaId, motivo) {
    const params = motivo ? `?motivo=${encodeURIComponent(motivo)}` : '';
    return apiClient(`/api/v1/citas/${citaId}/cancelar${params}`, {
      method: 'PATCH',
    });
  },

  async reprogramarCita(citaId, nuevaFecha, nuevaHora) {
    return apiClient(`/api/v1/citas/${citaId}/reprogramar`, {
      method: 'PATCH',
      body: JSON.stringify({ fecha: nuevaFecha, hora: nuevaHora }),
    });
  },

  async marcarLlegada(citaId) {
    return apiClient(`/api/v1/citas/${citaId}/asistencia`, {
      method: 'PATCH',
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
  getDisponibilidadSemana: async (usuarioId, inicio, fin, duracion = 30) => {
    try {
      const response = await apiClient(
        `/api/v1/agenda/${usuarioId}/disponibilidad-semana?inicio=${inicio}&fin=${fin}&duracion=${duracion}`
      );
      return response;
    } catch (error) {
      console.error('Error fetching disponibilidad semanal:', error);
      return { success: false, data: [] };
    }
  },

  // Tipos de cita
  getTiposCita: async () => {
    try {
      const response = await apiClient('/api/v1/agenda/tipos');
      return response;
    } catch (error) {
      console.error('Error fetching tipos de cita:', error);
      return { success: false, data: [] };
    }
  },

  crearTipoCita: async (data) => {
    try {
      const response = await apiClient('/api/v1/agenda/tipos', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      console.error('Error creating tipo de cita:', error);
      return { success: false, message: error.message };
    }
  },

  eliminarTipoCita: async (id) => {
    try {
      const response = await apiClient(`/api/v1/agenda/tipos/${id}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error('Error deleting tipo de cita:', error);
      return { success: false, message: error.message };
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
      const response = await apiClient('/api/v1/agenda/doctoras');
      return response;
    } catch (error) {
      console.error('Error fetching doctores:', error);
      return { success: false, data: [] };
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

  // Rechazar solicitud (enfermera → cancelar + notificar doctora)
  rechazarCita: async (citaId, motivo) => {
    try {
      const response = await apiClient(`/api/v1/citas/${citaId}/rechazar`, {
        method: 'POST',
        body: JSON.stringify({ motivo: motivo || null }),
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

  // Extender sesión (doctor extends current session, notifies nurse)
  extenderSesion: async (citaId, minutosExtra = 0) => {
    try {
      const response = await apiClient(`/api/v1/citas/${citaId}/extender`, {
        method: 'PUT',
        body: JSON.stringify({ minutosExtra }),
      });
      return response;
    } catch (error) {
      console.error('Error extendiendo sesión:', error);
      throw error;
    }
  },

  // Mover cita (nurse moves citation to new time)
  moverCita: async (citaId, nuevaHora) => {
    try {
      const response = await apiClient(`/api/v1/citas/${citaId}/mover`, {
        method: 'PUT',
        body: JSON.stringify({ nuevaHora }),
      });
      return response;
    } catch (error) {
      console.error('Error moviendo cita:', error);
      throw error;
    }
  },

  // Marcar como no asistida
  marcarNoShow: async (citaId) => {
    try {
      const response = await apiClient(`/api/v1/citas/${citaId}/no-show`, {
        method: 'PUT',
      });
      return response;
    } catch (error) {
      console.error('Error marcando no show:', error);
      throw error;
    }
  },

  // Get solicitudes propias de la doctora
  getMisSolicitadas: async () => {
    try {
      const response = await apiClient('/api/v1/citas/solicitadas/mis');
      return response;
    } catch (error) {
      console.error('Error fetching mis solicitadas:', error);
      return { success: false, data: [] };
    }
  },
};

export default agendaService;
