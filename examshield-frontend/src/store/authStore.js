import { create } from 'zustand';
import { authApi } from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isGuest: true,
  loading: false,
  error: null,

  // Initialize from localStorage
  init: () => {
    const token = localStorage.getItem('examshield_token');
    const userRaw = localStorage.getItem('examshield_user');
    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw);
        set({ token, user, isGuest: false });
      } catch (_) {
        localStorage.removeItem('examshield_token');
        localStorage.removeItem('examshield_user');
      }
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authApi.login(email, password);
      const { user, token } = data.data;
      localStorage.setItem('examshield_token', token);
      localStorage.setItem('examshield_user', JSON.stringify(user));
      set({ user, token, isGuest: false, loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      set({ error: msg, loading: false });
      return { success: false, message: msg };
    }
  },

  logout: async () => {
    try { await authApi.logout(); } catch (_) {}
    localStorage.removeItem('examshield_token');
    localStorage.removeItem('examshield_user');
    set({ user: null, token: null, isGuest: true, error: null });
  },

  setGuest: () => {
    set({ user: null, token: null, isGuest: true, error: null });
  },

  clearError: () => set({ error: null }),
}));
