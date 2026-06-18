import { create } from 'zustand';
import { api, getToken, setToken, type User } from '../api/client';

interface AuthState {
  user: User | null;
  loading: boolean;
  init: () => Promise<void>;
  login: (username: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  init: async () => {
    if (!getToken()) return set({ loading: false });
    try {
      set({ user: await api.me(), loading: false });
    } catch {
      setToken(null);
      set({ user: null, loading: false });
    }
  },
  login: async (username) => {
    const { token, user } = await api.devLogin(username);
    setToken(token);
    set({ user });
  },
  logout: () => {
    setToken(null);
    set({ user: null });
  },
}));
