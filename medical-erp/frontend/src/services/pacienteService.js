import apiClient from './apiClient';

function toBackend(data) {
  const out = { ...data };
  if (out.direccion !== undefined) {
    out.direccionLinea1 = out.direccion || null;
    delete out.direccion;
  }
  if (out.ciudadEstado !== undefined) {
    const parts = (out.ciudadEstado || '').split(',').map(s => s.trim());
    out.ciudad = parts[0] || null;
    out.estadoProvincia = parts[1] || out.estadoProvincia || null;
    delete out.ciudadEstado;
  }
  if (out.estatura === '' || out.estatura === undefined) out.estatura = null;
  if (out.peso === '' || out.peso === undefined) out.peso = null;
  if (out.fechaNacimiento === '' || out.fechaNacimiento === undefined) out.fechaNacimiento = null;
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

  async search(query) {
    const res = await apiClient(`/api/v1/pacientes/buscar?q=${encodeURIComponent(query)}`);
    return mapList(res);
  },

  async filterByEstado(estado) {
    const res = await apiClient(`/api/v1/pacientes/estado/${estado}`);
    return mapList(res);
  },
};
