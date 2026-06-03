// frontend/store/useAuthStore.ts
import { create } from 'zustand';

// 🚀 FIXED: Added diamonds and inrBalance to the User type so TypeScript stops complaining
interface User {
  id: string;
  username: string;
  role: string;
  email?: string;
  walletBalance?: number;
  diamonds?: number;   // Added this!
  inrBalance?: number; // Added this!
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