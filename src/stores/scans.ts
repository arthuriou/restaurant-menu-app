import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type ScanEvent = {
  id: string;
  tableId: string;
  timestamp: Date;
};

interface ScanState {
  scans: ScanEvent[];
  isLoading: boolean;
  error: string | null;

  addScan: (tableId: string) => Promise<void>;
  subscribeToScans: (startDate?: Date, endDate?: Date) => () => void;
}

export const useScanStore = create<ScanState>((set) => ({
  scans: [],
  isLoading: false,
  error: null,

  addScan: async (tableId: string) => {
    try {
      const { serverTimestamp } = await import('firebase/firestore');
      await addDoc(collection(db, 'scans'), {
        tableId,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error recording scan:", error);
      throw error;
    }
  },

  subscribeToScans: (startDate, endDate) => {
    if (!db) return () => {};
    
    set({ isLoading: true });

    let q = query(collection(db, 'scans'), orderBy('timestamp', 'desc'));

    // Note: Firestore requires composite indexes for range filters on different fields than orderBy
    // For simplicity in this version, we'll fetch recent scans and filter in memory if needed, 
    // or rely on the UI to filter the subscribed list.
    // If volume becomes high, we should add 'where' clauses here.

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const scans: ScanEvent[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Safety check for timestamp
        const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date();
        
        scans.push({
          id: doc.id,
          tableId: data.tableId,
          timestamp
        });
      });
      
      set({ scans, isLoading: false });
    }, (error) => {
      console.error("Error fetching scans:", error);
      set({ error: error.message, isLoading: false });
    });

    return unsubscribe;
  }
}));
