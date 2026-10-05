import apiClient from './apiClient';

function toBackend(data) {
  const out = { ...data };
  // Compatibilidad: si llega el campo legacy 'direccion', mapearlo a direccionLinea1.
  if (out.direccion !== undefined && out.direccionLinea1 === undefined) {
    out.direccionLinea1 = out.direccion || null;
    delete out.direccion;
  }
  // Compatibilidad: si llega el campo legacy 'ciudadEstado' ("Ciudad, Estado"), descomponer.
  if (out.ciudadEstado !== undefined && (out.ciudad === undefined || out.ciudad === '')) {
    const parts = (out.ciudadEstado || '').split(',').map(s => s.trim());
    out.ciudad = out.ciudad || parts[0] || null;
    out.estadoProvincia = out.estadoProvincia || parts[1] || null;
    delete out.ciudadEstado;
  }
  if (out.estatura === '' || out.estatura === undefined) out.estatura = null;
  if (out.peso === '' || out.peso === undefined) out.peso = null;
  if (out.fechaNacimiento === '' || out.fechaNacimiento === undefined) out.fechaNacimiento = null;
  if (out.codigoPostal === '' || out.codigoPostal === undefined) out.codigoPostal = null;
  // Convertir strings vacíos a null para campos opcionales con @Email/@Size
  const optionalFields = ['email', 'telefono', 'estadoCivil', 'sexo', 'lugarNacimiento', 'lugarProcedencia', 'gradoInstruccion', 'ocupacion', 'nombreAcompanante', 'contactoEmergencia', 'telefonoEmergencia', 'parentescoEmergencia', 'ciudad', 'estadoProvincia', 'direccionPais'];
  for (const field of optionalFields) {
    if (out[field] === '') out[field] = null;
  }
  // País por defecto USA si no llega.
  if (!out.pais) out.pais = 'US';
  return out;
}

function fromBackend(data) {
  if (!data) return data;
  return {
    ...data,
    direccion: data.direccionLinea1 || '',
    ciudadEstado: [data.ciudad, data.estadoProvincia].filter(Boolean).join(', '),
  };
}

function mapList(res) {
  if (res?.data?.content) {
    res.data.content = res.data.content.map(fromBackend);
  }
  return res;
}

export const pacienteService = {
  async list(params = {}) {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.set('page', params.page);
    if (params.size !== undefined) query.set('size', params.size);
    if (params.sort) query.set('sort', params.sort);

    const q = query.toString();
    const res = await apiClient(`/api/v1/pacientes${q ? '?' + q : ''}`);
    return mapList(res);
  },

  async getById(id) {
    const res = await apiClient(`/api/v1/pacientes/${id}`);
    if (res?.data) res.data = fromBackend(res.data);
    return res;
  },

  async create(data) {
    const res = await apiClient('/api/v1/pacientes', {
      method: 'POST',
      body: JSON.stringify(toBackend(data)),
    });
    if (res?.data) res.data = fromBackend(res.data);
    return res;
  },

  async createSimple(data) {
    return this.create(data);
  },

  async update(id, data) {
    const res = await apiClient(`/api/v1/pacientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toBackend(data)),
    });
    if (res?.data) res.data = fromBackend(res.data);
    return res;
  },

  async updateSimple(id, data) {
    return this.update(id, data);
  },

  async delete(id) {
    return apiClient(`/api/v1/pacientes/${id}`, {
      method: 'DELETE',
    });
  },

  async activate(id) {
    return apiClient(`/api/v1/pacientes/${id}/activate`, {
      method: 'PATCH',
    });
  },

  async search(query) {
    const res = await apiClient(`/api/v1/pacientes/buscar?q=${encodeURIComponent(query)}`);
    return mapList(res);
  },

  async filterByEstado(estado) {
    const res = await apiClient(`/api/v1/pacientes/estado/${estado}`);
    return mapList(res);
  },

  async importCsv(file) {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient('/api/v1/pacientes/import/csv', {
      method: 'POST',
      body: formData,
      isFormData: true,
    });
  },

  async importExcel(file) {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient('/api/v1/pacientes/import/excel', {
      method: 'POST',
      body: formData,
      isFormData: true,
    });
  },

  async getUltimosSignosVitales(pacienteId) {
    const res = await apiClient(`/api/v1/pacientes/${pacienteId}/ultimos-signos-vitales`);
    return res;
  },

  // Actualiza solo peso/estatura (ficha del paciente) sin tocar el resto de campos.
  async updateSignosVitales(pacienteId, { peso, estatura }) {
    return apiClient(`/api/v1/pacientes/${pacienteId}/signos-vitales`, {
      method: 'PATCH',
      body: JSON.stringify({
        peso: peso === '' || peso === undefined ? null : parseFloat(peso),
        estatura: estatura === '' || estatura === undefined ? null : parseFloat(estatura),
      }),
    });
  },
};
