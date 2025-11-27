import { create } from 'zustand';

export type StaffRole = 'admin' | 'server' | 'cook';

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  pin: string;
  active: boolean;
  avatar?: string;
  email?: string;
}

interface StaffState {
  staff: StaffMember[];
  addStaff: (member: Omit<StaffMember, 'id'>) => void;
  updateStaff: (id: string, updates: Partial<StaffMember>) => void;
  deleteStaff: (id: string) => void;
  verifyPin: (pin: string) => StaffMember | undefined;
}

// Mock Data
const initialStaff: StaffMember[] = [
  { id: '1', name: "Jean Dupont", role: "admin", pin: "1234", active: true, email: "jean@restaurant.com", avatar: "JD" },
  { id: '2', name: "Marie Koné", role: "server", pin: "0000", active: true, email: "marie@restaurant.com", avatar: "MK" },
  { id: '3', name: "Paul Kouassi", role: "server", pin: "1111", active: false, email: "paul@restaurant.com", avatar: "PK" },
  { id: '4', name: "Chef Moussa", role: "cook", pin: "2222", active: true, email: "moussa@restaurant.com", avatar: "CM" },
];

export const useStaffStore = create<StaffState>((set, get) => ({
  staff: initialStaff,

  addStaff: (member) => set((state) => ({
    staff: [...state.staff, { ...member, id: `staff_${Date.now()}` }]
  })),

  updateStaff: (id, updates) => set((state) => ({
    staff: state.staff.map((s) => s.id === id ? { ...s, ...updates } : s)
  })),

  deleteStaff: (id) => set((state) => ({
    staff: state.staff.filter((s) => s.id !== id)
  })),

  verifyPin: (pin) => {
    return get().staff.find(s => s.pin === pin && s.active);
  }
}));
