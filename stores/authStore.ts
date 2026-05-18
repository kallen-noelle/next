import { create } from "zustand";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  token: null,
  isLoggedIn: false,

  setAuth: (token, user) => {
    localStorage.setItem("token", token);
    set({ token, user, isLoggedIn: true });
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ token: null, user: null, isLoggedIn: false });
  },

  setUser: (user) => set({ user }),
}));

// Hydrate from localStorage on client side
if (typeof window !== "undefined") {
  const token = localStorage.getItem("token");
  if (token) {
    useAuthStore.setState({ token, isLoggedIn: true });
  }
}
