import { create } from "zustand";
import { persist } from "zustand/middleware";
import { signInWithEmailAndPassword, signOut, signInWithCustomToken } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { loginWithPinAction } from "@/app/actions/auth";
import type { StaffMember } from "@/types";

export type UserRole = "admin" | "server" | "kitchen";

export interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  staff: StaffMember[];
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  loginWithPin: (pin: string) => Promise<void>;
  logout: () => Promise<void>;

  // Staff Management
  loadStaff: () => Promise<void>;
  addStaff: (member: Omit<StaffMember, "id" | "createdAt">) => Promise<void>;
  updateStaff: (id: string, updates: Partial<StaffMember>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      staff: [],
      isLoading: false,

      login: async (email, password) => {
        try {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password,
          );
          const firebaseUser = userCredential.user;

          // Récupérer le rôle depuis Firestore
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            set({
              user: {
                id: firebaseUser.uid,
                name:
                  userData.name ||
                  firebaseUser.email?.split("@")[0] ||
                  "Utilisateur",
                email: firebaseUser.email!,
                role: userData.role as UserRole,
                avatar: userData.avatar,
              },
              isAuthenticated: true,
            });
          } else {
            // Fallback si pas de doc utilisateur (ex: admin créé manuellement)
            // On déconnecte car on a besoin du rôle
            await signOut(auth);
            throw new Error(
              "Profil utilisateur non trouvé. Contactez le support.",
            );
          }
        } catch (error: any) {
          console.error("Login error:", error);
          if (error.code === "auth/invalid-credential") {
            throw new Error("Email ou mot de passe incorrect");
          }
          throw new Error("Erreur de connexion");
        }
      },

      loginWithPin: async (pin) => {
        if (!db) return;
        try {
          // 1. Call Server Action to verify PIN and get token
          const result = await loginWithPinAction(pin);

          if (!result.success || !result.token) {
            throw new Error(result.error || "Code PIN invalide");
          }

          // 2. Sign in with the custom token
          const userCredential = await signInWithCustomToken(auth, result.token);
          
          // 3. Fetch user profile from Firestore (now authenticated)
          const staffDocRef = doc(db, "staff", userCredential.user.uid);
          const staffDocSnap = await getDoc(staffDocRef);
          
          if (!staffDocSnap.exists()) {
             throw new Error("Profil introuvable");
          }

          const staffData = staffDocSnap.data() as StaffMember;

          if (!staffData.active) {
             await signOut(auth);
             throw new Error("Ce compte est désactivé");
          }

          set({
            user: {
              id: staffDocSnap.id,
              name: staffData.name,
              role: staffData.role as UserRole,
              email: userCredential.user.email || undefined,
              avatar: staffData.avatar,
            },
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          console.error("Login error:", error);
          throw new Error(error.message || "Erreur de connexion");
        }
      },

      logout: async () => {
        try {
          await signOut(auth);
          set({ user: null, isAuthenticated: false });
        } catch (error) {
          console.error("Logout error:", error);
        }
      },

      // Staff Management
      loadStaff: async () => {
        if (!db) return;
        set({ isLoading: true });
        try {
          const snapshot = await getDocs(collection(db, "staff"));
          const staff = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as StaffMember,
          );
          set({ staff, isLoading: false });
        } catch (error) {
          console.error("Error loading staff:", error);
          set({ isLoading: false });
        }
      },

      addStaff: async (member) => {
        try {
          await addDoc(collection(db, "staff"), {
            ...member,
            createdAt: Date.now(),
          });
          get().loadStaff();
        } catch (error) {
          console.error("Error adding staff:", error);
          throw error;
        }
      },

      updateStaff: async (id, updates) => {
        try {
          await updateDoc(doc(db, "staff", id), updates);
          get().loadStaff();
        } catch (error) {
          console.error("Error updating staff:", error);
          throw error;
        }
      },

      deleteStaff: async (id) => {
        try {
          await deleteDoc(doc(db, "staff", id));
          get().loadStaff();
        } catch (error) {
          console.error("Error deleting staff:", error);
          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
    },
  ),
);
