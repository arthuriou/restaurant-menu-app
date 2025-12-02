import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type TableStatus = 'available' | 'occupied' | 'needs_service' | 'requesting_bill';

export type ServiceRequest = {
  tableId: string;
  type: 'assistance' | 'bill';
  timestamp: number;
  resolved: boolean;
};

export type Table = {
  id: string;
  label: string;
  seats: number;
  status: TableStatus;
  scans: number;
  occupants?: number;
  activeOrderId?: string;
};

interface TableState {
  tables: Table[];
  serviceRequests: ServiceRequest[]; // Derived from tables or separate collection? Keeping local for now or derived
  isLoading: boolean;
  error: string | null;

  subscribeToTables: () => () => void;
  addTable: (table: Omit<Table, 'id' | 'scans' | 'status'>) => Promise<void>;
  updateTable: (id: string, updates: Partial<Table>) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  incrementTableScans: (id: string) => Promise<{ success: boolean; message: string } | void>;
  setTableStatus: (id: string, status: TableStatus, occupants?: number) => Promise<void>;
  requestService: (tableId: string, type: 'assistance' | 'bill') => Promise<void>;
  resolveServiceRequest: (tableId: string) => Promise<void>;
  closeTable: (id: string) => Promise<void>;
}

export const useTableStore = create<TableState>((set, get) => ({
  tables: [],
  serviceRequests: [],
  isLoading: false,
  error: null,

  subscribeToTables: () => {
    if (!db) return () => {};
    
    set({ isLoading: true });
    
    const q = query(collection(db, 'tables'), orderBy('label'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tables: Table[] = [];
      const serviceRequests: ServiceRequest[] = [];

      snapshot.docs.forEach((doc) => {
        const data = doc.data() as any;
        const table = { id: doc.id, ...data } as Table;
        tables.push(table);

        // Derive requests from status
        if (table.status === 'needs_service') {
          serviceRequests.push({ tableId: table.id, type: 'assistance', timestamp: Date.now(), resolved: false });
        } else if (table.status === 'requesting_bill') {
          serviceRequests.push({ tableId: table.id, type: 'bill', timestamp: Date.now(), resolved: false });
        }
      });

      set({ tables, serviceRequests, isLoading: false });
    }, (error) => {
      console.error("Error fetching tables:", error);
      set({ error: error.message, isLoading: false });
    });

    return unsubscribe;
  },

  addTable: async (tableData) => {
    try {
      await addDoc(collection(db, 'tables'), {
        ...tableData,
        scans: 0,
        status: 'available'
      });
    } catch (error) {
      console.error("Error adding table:", error);
      throw error;
    }
  },

  updateTable: async (id, updates) => {
    try {
      await updateDoc(doc(db, 'tables', id), updates);
    } catch (error) {
      console.error("Error updating table:", error);
      throw error;
    }
  },

  deleteTable: async (id) => {
    try {
      await deleteDoc(doc(db, 'tables', id));
    } catch (error) {
      console.error("Error deleting table:", error);
      throw error;
    }
  },

  incrementTableScans: async (label) => {
    try {
      console.log(`[TableStore] Incrementing scans for label: "${label}"`);
      const { query, where, getDocs, increment } = await import('firebase/firestore');
      
      // 1. Try exact match
      const q = query(collection(db, 'tables'), where('label', '==', label));
      const snapshot = await getDocs(q);

      let tableDoc = snapshot.empty ? null : snapshot.docs[0];

      // 2. Try with "Table " prefix if not found
      if (!tableDoc) {
        console.log(`[TableStore] Exact match not found, trying "Table ${label}"`);
        const q2 = query(collection(db, 'tables'), where('label', '==', `Table ${label}`));
        const snapshot2 = await getDocs(q2);
        if (!snapshot2.empty) tableDoc = snapshot2.docs[0];
      }

      if (tableDoc) {
        console.log(`[TableStore] Found table doc: ${tableDoc.id}, updating...`);
        await updateDoc(tableDoc.ref, {
          scans: increment(1),
          occupants: increment(1),
          status: 'occupied'
        });
        console.log(`[TableStore] Update successful`);
        return { success: true, message: "Scan enregistré" };
      } else {
         console.warn(`[TableStore] Table with label "${label}" not found in DB`);
         return { success: false, message: `Table "${label}" introuvable` };
      }
    } catch (error: any) {
      console.error("[TableStore] Error incrementing scans:", error);
      return { success: false, message: error.message || "Erreur scan" };
    }
  },

  setTableStatus: async (id, status, occupants) => {
    try {
      const updates: any = { status };
      if (occupants !== undefined) updates.occupants = occupants;
      await updateDoc(doc(db, 'tables', id), updates);
    } catch (error) {
      console.error("Error setting status:", error);
      throw error;
    }
  },

  requestService: async (tableId, type) => {
    try {
      const status = type === 'bill' ? 'requesting_bill' : 'needs_service';
      await updateDoc(doc(db, 'tables', tableId), { status });
    } catch (error) {
      console.error("Error requesting service:", error);
      throw error;
    }
  },

  resolveServiceRequest: async (tableId) => {
    try {
      // Assuming resolving means setting back to occupied (or available if empty?)
      // Usually resolving a request keeps the table occupied.
      await updateDoc(doc(db, 'tables', tableId), { status: 'occupied' });
    } catch (error) {
      console.error("Error resolving request:", error);
      throw error;
    }
  },

  closeTable: async (id) => {
    try {
      await updateDoc(doc(db, 'tables', id), {
        status: 'available',
        occupants: null, // Firestore allows null or deleteField()
        activeOrderId: null
      });
    } catch (error) {
      console.error("Error closing table:", error);
      throw error;
    }
  }
}));
