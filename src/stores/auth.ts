import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'admin' | 'server' | 'kitchen';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Mock users for development
const MOCK_USERS: Record<string, User & { password: string }> = {
  'admin@restaurant.com': {
    id: 'u1',
    name: 'Administrateur',
    email: 'admin@restaurant.com',
    role: 'admin',
    password: 'admin',
    avatar: 'A'
  },
  'server@restaurant.com': {
    id: 'u2',
    name: 'Thomas Serveur',
    email: 'server@restaurant.com',
    role: 'server',
    password: 'server',
    avatar: 'T'
  },
  'kitchen@restaurant.com': {
    id: 'u3',
    name: 'Chef Philippe',
    email: 'kitchen@restaurant.com',
    role: 'kitchen',
    password: 'kitchen',
    avatar: 'P'
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email, password) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        const user = MOCK_USERS[email];
        if (user && user.password === password) {
          const { password: _, ...userWithoutPassword } = user;
          set({ user: userWithoutPassword, isAuthenticated: true });
        } else {
          throw new Error('Identifiants incorrects');
        }
      },
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
