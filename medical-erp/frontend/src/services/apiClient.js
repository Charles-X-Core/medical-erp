const API_BASE = ''; // Vite proxy handles /api -> localhost:8080

let isRefreshing = false;
let refreshSubscribers = [];
let onLogoutCallback = null;

export function setLogoutCallback(cb) {
  onLogoutCallback = cb;
}

function getToken() {
  return localStorage.getItem('token');
}

function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}

function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb);
}

async function doRefresh() {
  const rt = getRefreshToken();
  if (!rt) throw new Error('No refresh token');

  const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'X-Refresh-Token': rt },
  });

  if (!res.ok) throw new Error('Refresh failed');

  const json = await res.json();
  if (!json.success) throw new Error(json.message);

  const { token, refreshToken, user, expiresIn } = json.data;
  localStorage.setItem('token', token);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('user', JSON.stringify(user));
  if (expiresIn) {
    localStorage.setItem('tokenExpiresAt', String(Date.now() + expiresIn * 1000));
  }

  return token;
}

async function apiClient(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const token = getToken();

  const isFormData = options.isFormData;

  const headers = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    'Accept': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = { ...options, headers };
  delete config.isFormData;

  let response = await fetch(url, config);

  // If 401, try to refresh token
  if (response.status === 401 && token) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const newToken = await doRefresh();
        isRefreshing = false;
        onTokenRefreshed(newToken);
      } catch {
        isRefreshing = false;
        refreshSubscribers = [];
        if (onLogoutCallback) onLogoutCallback();
        throw new Error('Sesión expirada');
      }
    }

    // Wait for refresh and retry
    const newToken = await new Promise((resolve) => {
      addRefreshSubscriber(resolve);
    });

    const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
    response = await fetch(url, { ...config, headers: retryHeaders });
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || `Error ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export default apiClient;
