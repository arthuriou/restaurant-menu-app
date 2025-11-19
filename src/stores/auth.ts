import { create } from "zustand";
// import type { User } from "firebase/auth";
// import { onAuthStateChanged, signInWithEmailAndPassword, signOut, getIdTokenResult } from "firebase/auth";
// import { doc, getDoc } from "firebase/firestore";
// import { auth, db } from "@/lib/firebase";
import type { Role } from "@/types";

type AuthState = {
  user: { email: string; [key: string]: unknown } | null;
  role: Role | null;
  loading: boolean;
  init: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  role: null,
  loading: false, // Désactivé en mode démo
  init: () => {
    // Désactivé en mode démo
    set({ loading: false });
  },
  login: async (email) => {
    // Simulation de connexion en mode démo
    console.log("Tentative de connexion avec:", email);
    return new Promise((resolve) => {
      setTimeout(() => {
        set({ user: { email }, role: "admin", loading: false });
        resolve();
      }, 500);
    });
  },
  logout: async () => {
    // Simulation de déconnexion en mode démo
    return new Promise((resolve) => {
      set({ user: null, role: null });
      resolve();
    });
  },
}));
