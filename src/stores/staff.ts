import { create } from 'zustand';

export type StaffRole = 'manager' | 'server' | 'kitchen';

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  pin: string;
  active: boolean;
  avatar?: string;
  email?: string; // Optional now
  phone?: string; // Optional now
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
  { id: '1', name: "Jean Dupont", role: "manager", pin: "1234", active: true, email: "jean@restaurant.com", phone: "+225 07 07 07 07", avatar: "JD" },
  { id: '2', name: "Marie Koné", role: "server", pin: "0000", active: true, email: "marie@restaurant.com", phone: "+225 05 05 05 05", avatar: "MK" },
  { id: '3', name: "Paul Kouassi", role: "server", pin: "1111", active: false, email: "paul@restaurant.com", phone: "+225 01 01 01 01", avatar: "PK" },
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
