const API_BASE = '';

async function request(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data?.message || data?.error?.message || `Error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

function extractList(res) {
  if (res && res.data) {
    if (Array.isArray(res.data)) return res.data;
    if (res.data.content) return res.data.content;
  }
  if (Array.isArray(res)) return res;
  return [];
}

export const membresiaService = {
  async getByPaciente(pacienteId) {
    const res = await request(`/api/v1/membresias/paciente/${pacienteId}`);
    return extractList(res);
  },

  async create(data) {
    const res = await request('/api/v1/membresias', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async update(id, data) {
    const res = await request(`/api/v1/membresias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async remove(id) {
    await request(`/api/v1/membresias/${id}`, { method: 'DELETE' });
  },
};
