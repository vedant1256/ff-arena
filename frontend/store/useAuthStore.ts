// frontend/store/useAuthStore.ts
import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  role: string;
  email?: string; // Added to support our Bulletproof Admin check
  walletBalance?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  // FIX 1: Aligned argument order to (token, userData)
  login: (token: string, userData: User) => void; 
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  // FIX 2: Standardized local storage key to 'token'
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