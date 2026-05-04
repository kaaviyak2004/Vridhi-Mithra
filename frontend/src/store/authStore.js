import { create } from 'zustand';
import api from '../utils/api';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('vridhi_user') || 'null'),
  token: localStorage.getItem('vridhi_token') || null,
  loading: false,
  error: null,

  setUser: (user) => {
    localStorage.setItem('vridhi_user', JSON.stringify(user));
    set({ user });
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('vridhi_token', data.token);
      localStorage.setItem('vridhi_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      set({ loading: false, error: msg });
      throw new Error(msg);
    }
  },

  register: async (userData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', userData);
      set({ loading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
      set({ loading: false, error: msg });
      throw new Error(msg);
    }
  },

  verifyOTP: async (email, otp) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      localStorage.setItem('vridhi_token', data.token);
      localStorage.setItem('vridhi_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Verification failed';
      set({ loading: false, error: msg });
      throw new Error(msg);
    }
  },

  logout: () => {
    localStorage.removeItem('vridhi_token');
    localStorage.removeItem('vridhi_user');
    set({ user: null, token: null });
  },

  isAuthenticated: () => !!get().token && !!get().user,
}));

export default useAuthStore;
