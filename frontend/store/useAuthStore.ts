// frontend/store/useAuthStore.ts
import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  role: string;
  email?: string;
  walletBalance?: number;
  diamonds?: number;   
  inrBalance?: number; 
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (token: string, userData: User) => void; 
  logout: () => void;
  loadFromStorage: () => void; // 🚀 FIXED: Added to satisfy TypeScript in Providers.tsx
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  
  login: (token, userData) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
    set({ user: userData, token });
  },
  
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    set({ user: null, token: null });
  },

  // 🚀 FIXED: Implemented the missing function to load the token on page refresh
  loadFromStorage: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        set({ token });
      }
    }
  }
}));