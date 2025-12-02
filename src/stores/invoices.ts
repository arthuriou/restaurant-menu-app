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
  setDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Invoice } from '@/types';

interface InvoiceState {
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;
  
  subscribeToInvoices: () => () => void;
  addInvoice: (invoice: Invoice) => Promise<void>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoices: [],
  isLoading: false,
  error: null,

  subscribeToInvoices: () => {
    if (!db) return () => {};
    
    set({ isLoading: true });
    
    // Écouter la collection 'invoices' triée par date de création décroissante
    const q = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invoices: Invoice[] = [];
      snapshot.forEach((doc) => {
        invoices.push({ id: doc.id, ...doc.data() } as Invoice);
      });
      
      set({ invoices, isLoading: false });
    }, (error) => {
      console.error("Error fetching invoices:", error);
      set({ error: error.message, isLoading: false });
    });

    return unsubscribe;
  },

  addInvoice: async (invoice) => {
    try {
      // Utiliser setDoc avec l'ID généré si présent, sinon addDoc
      if (invoice.id) {
        await setDoc(doc(db, 'invoices', invoice.id), invoice);
      } else {
        await addDoc(collection(db, 'invoices'), invoice);
      }
    } catch (error) {
      console.error("Error adding invoice:", error);
      throw error;
    }
  },

  updateInvoice: async (id, updates) => {
    try {
      await updateDoc(doc(db, 'invoices', id), updates);
    } catch (error) {
      console.error("Error updating invoice:", error);
      throw error;
    }
  },

  deleteInvoice: async (id) => {
    try {
      await deleteDoc(doc(db, 'invoices', id));
    } catch (error) {
      console.error("Error deleting invoice:", error);
      throw error;
    }
  }
}));
