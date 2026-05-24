import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: string;
  readinessScore: number;
  streakDays: number;
  diagnosticDone: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('psy_user') || 'null')
    : null,
  token: typeof window !== 'undefined'
    ? localStorage.getItem('psy_token')
    : null,
  setAuth: (user, token) => {
    localStorage.setItem('psy_token', token);
    localStorage.setItem('psy_user', JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('psy_token');
    localStorage.removeItem('psy_user');
    set({ user: null, token: null });
  },
  isAuthenticated: () => !!get().token,
}));
