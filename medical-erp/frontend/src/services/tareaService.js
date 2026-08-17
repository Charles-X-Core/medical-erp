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

export const tareaService = {
  async getPendientes(rol) {
    const res = await request(`/api/v1/tareas/pendientes?rol=${rol}`);
    return extractList(res);
  },

  async countPendientes(rol) {
    const res = await request(`/api/v1/tareas/count?rol=${rol}`);
    return res?.data?.count ?? 0;
  },

  async create(data) {
    const res = await request('/api/v1/tareas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateEstado(id, estado) {
    const res = await request(`/api/v1/tareas/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    });
    return res.data;
  },
};
