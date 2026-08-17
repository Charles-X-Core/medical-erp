const API_BASE = ''; // Vite proxy handles /api -> localhost:8080

async function post(endpoint, body, extraHeaders = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data?.message || data?.error?.message || `Error ${res.status}`);
    err.status = res.status;
    err.code = data?.error?.code || 'UNKNOWN';
    throw err;
  }
  return data;
}

export const authService = {
  async loginStep1(email, password) {
    return post('/api/v1/auth/login-step1', { email, password });
  },

  async loginStep2(email, codigo) {
    return post('/api/v1/auth/login-step2', { email, codigo });
  },

  async resendOtp(email) {
    return post('/api/v1/auth/resend-otp', { email });
  },

  async refreshToken(refreshToken) {
    return post('/api/v1/auth/refresh', null, { 'X-Refresh-Token': refreshToken });
  },

  async me(token) {
    const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    return res.json();
  },
};
