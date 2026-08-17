import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { setLogoutCallback } from '../services/apiClient';

const AuthContext = createContext(null);

const API_BASE = ''; // Vite proxy handles /api -> localhost:8080

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken'));
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(() => sessionStorage.getItem('pendingEmail'));

  const storeAuth = useCallback((data) => {
    const { token, refreshToken, user, expiresIn } = data;
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    if (expiresIn) {
      const exp = Date.now() + expiresIn * 1000;
      localStorage.setItem('tokenExpiresAt', exp.toString());
    }
    setToken(token);
    setRefreshToken(refreshToken);
    setUser(user);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiresAt');
    sessionStorage.removeItem('pendingEmail');
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    setPendingEmail(null);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    window.location.href = '/login';
  }, [clearAuth]);

  // Register logout callback with apiClient
  useEffect(() => {
    setLogoutCallback(logout);
  }, [logout]);

  const refreshAccessToken = useCallback(async () => {
    const rt = localStorage.getItem('refreshToken');
    if (!rt) throw new Error('No refresh token');

    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'X-Refresh-Token': rt },
    });

    if (!res.ok) throw new Error('Refresh failed');

    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    storeAuth(json.data);
    return json.data.token;
  }, [storeAuth]);

  // Auto-refresh when token is about to expire
  useEffect(() => {
    if (!token) return;

    const expStr = localStorage.getItem('tokenExpiresAt');
    if (!expStr) return;

    const exp = parseInt(expStr, 10);
    const now = Date.now();
    const timeUntilRefresh = Math.max(exp - now - 60000, 0); // refresh 1 min before

    if (timeUntilRefresh <= 0) {
      refreshAccessToken().catch(() => logout());
      return;
    }

    const timer = setTimeout(() => {
      refreshAccessToken().catch(() => logout());
    }, timeUntilRefresh);

    return () => clearTimeout(timer);
  }, [token, refreshAccessToken, logout]);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        isAuthenticated,
        loading,
        setLoading,
        pendingEmail,
        setPendingEmail,
        storeAuth,
        clearAuth,
        logout,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
