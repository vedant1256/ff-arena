// frontend/store/useAuthStore.ts
import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  role: string;
  email?: string;
  walletBalance?: number;
  diamonds?: number;   // 🚀 FIXED: Added to satisfy TypeScript in Navbar.tsx
  inrBalance?: number; // 🚀 FIXED: Added to satisfy TypeScript in Navbar.tsx
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