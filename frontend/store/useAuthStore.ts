// frontend/store/useAuthStore.ts
import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  role: string;
  email?: string; 
  walletBalance?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  loadFromStorage: () => void; // 🚀 ADDED: The missing property causing the build failure
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null, // Start as null so Next.js server doesn't crash during build
  
  // 🚀 ADDED: Safely extracts token on the client side when Providers.tsx calls it
  loadFromStorage: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        set({ token });
      }
    }
  },

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
}));