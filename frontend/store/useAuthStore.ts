// frontend/store/useAuthStore.ts
import { create } from 'zustand';

export interface User {
  id: string;
  username: string;
  role: string;
  email?: string;
  walletBalance?: number;
  // 🚀 FIXED: Added these properties so TypeScript stops blocking the build!
  diamonds?: number;
  inrBalance?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (token: string, userData: User) => void; 
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  
  login: (token, userData) => {
    localStorage.setItem('token', token);
    set({ user: userData, token });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));