import { create } from 'zustand';

export type Table = {
  id: string;
  label: string;
  seats: number;
  status?: 'available' | 'occupied' | 'reserved';
};

interface TableState {
  tables: Table[];
  addTable: (table: Omit<Table, 'id'>) => void;
  updateTable: (id: string, updates: Partial<Table>) => void;
  deleteTable: (id: string) => void;
}

// Mock Data
const initialTables: Table[] = [
  { id: "t1", label: "1", seats: 2, status: 'available' },
  { id: "t2", label: "2", seats: 4, status: 'occupied' },
  { id: "t3", label: "3", seats: 4, status: 'available' },
  { id: "t4", label: "4", seats: 6, status: 'reserved' },
  { id: "t5", label: "5", seats: 2, status: 'available' },
  { id: "t6", label: "6", seats: 8, status: 'available' },
];

export const useTableStore = create<TableState>((set) => ({
  tables: initialTables,

  addTable: (table) => set((state) => ({
    tables: [...state.tables, { ...table, id: `t${Date.now()}` }]
  })),

  updateTable: (id, updates) => set((state) => ({
    tables: state.tables.map((t) => t.id === id ? { ...t, ...updates } : t)
  })),

  deleteTable: (id) => set((state) => ({
    tables: state.tables.filter((t) => t.id !== id)
  }))
}));
