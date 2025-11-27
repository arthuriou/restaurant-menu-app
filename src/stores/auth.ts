import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { StaffMember } from '@/types';

export type UserRole = 'admin' | 'server' | 'kitchen';

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
  addStaff: (member: Omit<StaffMember, 'id' | 'createdAt'>) => Promise<void>;
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
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;

          // Récupérer le rôle depuis Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            set({
              user: {
                id: firebaseUser.uid,
                name: userData.name || firebaseUser.email?.split('@')[0] || 'Utilisateur',
                email: firebaseUser.email!,
                role: userData.role as UserRole,
                avatar: userData.avatar
              },
              isAuthenticated: true
            });
          } else {
            // Fallback si pas de doc utilisateur (ex: admin créé manuellement)
            // On déconnecte car on a besoin du rôle
            await signOut(auth);
            throw new Error('Profil utilisateur non trouvé. Contactez le support.');
          }
        } catch (error: any) {
          console.error('Login error:', error);
          if (error.code === 'auth/invalid-credential') {
            throw new Error('Email ou mot de passe incorrect');
          }
          throw new Error('Erreur de connexion');
        }
      },

      loginWithPin: async (pin) => {
        if (!db) return;
        try {
          // Query 'staff' collection for the PIN
          const q = query(collection(db, 'staff'), where('pin', '==', pin));
          const snapshot = await getDocs(q);

          if (snapshot.empty) {
            throw new Error('Code PIN invalide');
          }

          const staffDoc = snapshot.docs[0];
          const staffData = staffDoc.data() as StaffMember;

          if (!staffData.active) {
            throw new Error('Ce compte est désactivé');
          }

          set({
            user: {
              id: staffDoc.id,
              name: staffData.name,
              role: staffData.role,
              email: 'staff@local', // Placeholder
            },
            isAuthenticated: true
          });
        } catch (error: any) {
          console.error('PIN Login error:', error);
          throw error;
        }
      },

      logout: async () => {
        try {
          await signOut(auth);
          set({ user: null, isAuthenticated: false });
        } catch (error) {
          console.error('Logout error:', error);
        }
      },

      // Staff Management
      loadStaff: async () => {
        if (!db) return;
        set({ isLoading: true });
        try {
          const snapshot = await getDocs(collection(db, 'staff'));
          const staff = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StaffMember));
          set({ staff, isLoading: false });
        } catch (error) {
          console.error("Error loading staff:", error);
          set({ isLoading: false });
        }
      },

      addStaff: async (member) => {
        try {
          await addDoc(collection(db, 'staff'), {
            ...member,
            createdAt: Date.now()
          });
          get().loadStaff();
        } catch (error) {
          console.error("Error adding staff:", error);
          throw error;
        }
      },

      updateStaff: async (id, updates) => {
        try {
          await updateDoc(doc(db, 'staff', id), updates);
          get().loadStaff();
        } catch (error) {
          console.error("Error updating staff:", error);
          throw error;
        }
      },

      deleteStaff: async (id) => {
        try {
          await deleteDoc(doc(db, 'staff', id));
          get().loadStaff();
        } catch (error) {
          console.error("Error deleting staff:", error);
          throw error;
        }
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);
