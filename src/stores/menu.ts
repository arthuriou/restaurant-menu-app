import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  getDocs,
  query, 
  orderBy,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Category, MenuItem, Order, OrderItem } from '@/types';

type MenuStore = {
  categories: Category[];
  items: MenuItem[];
  isLoading: boolean;
  error: string | null;
  selectedCategory: string | null;
  setSelectedCategory: (id: string) => void;

  orderType: 'dine-in' | 'takeaway' | 'delivery';
  setOrderType: (type: 'dine-in' | 'takeaway' | 'delivery') => void;
  
  table: { id: string; label: string } | null;
  setTable: (table: { id: string; label: string } | null) => void;
  setTableId: (id: string) => void;

  activeOrderId: string | null;
  setActiveOrderId: (id: string | null) => void;
  
  cart: OrderItem[];
  addToCart: (item: OrderItem) => void;
  removeFromCart: (index: number) => void;
  updateQty: (index: number, delta: number) => void;
  clearCart: () => void;
  
  loadMenu: () => Promise<void>;
  placeOrder: (order: Omit<Order, 'id' | 'status' | 'createdAt'>) => Promise<string>;
  getItemsByCategory: (categoryId: string) => MenuItem[];
  getItemById: (id: string) => MenuItem | undefined;
  
  // Categories CRUD
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (categories: Category[]) => Promise<void>;

  // Items CRUD
  addItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<MenuItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
};

export const useMenuStore = create<MenuStore>((set, get) => ({
  categories: [],
  items: [],
  isLoading: false,
  error: null,
  
  selectedCategory: null,
  setSelectedCategory: (id) => set({ selectedCategory: id }),

  orderType: 'dine-in',
  setOrderType: (type) => set({ orderType: type }),
  
  table: null,
  setTable: (table) => set({ table }),
  setTableId: (id) => set({ table: { id, label: `Table ${id}` } }),

  activeOrderId: null,
  setActiveOrderId: (id) => set({ activeOrderId: id }),
  
  cart: [],
  addToCart: (item) => set((state) => ({ cart: [...state.cart, item] })),
  removeFromCart: (index) => set((state) => ({ cart: state.cart.filter((_, i) => i !== index) })),
  updateQty: (index, delta) => set((state) => ({
    cart: state.cart.map((item, i) => {
      if (i === index) {
        const newQty = Math.max(1, (item.qty || 1) + delta);
        return { ...item, qty: newQty };
      }
      return item;
    })
  })),
  clearCart: () => set({ cart: [] }),
  
  loadMenu: async () => {
    if (!db) return;
    set({ isLoading: true, error: null });
    try {
      // Load Categories
      const catQuery = query(collection(db, 'categories'), orderBy('order'));
      const catSnap = await getDocs(catQuery);
      const categories = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));

      // Load Items
      const itemQuery = query(collection(db, 'products'), where('available', '==', true));
      const itemSnap = await getDocs(itemQuery);
      const items = itemSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));

      set({ categories, items, isLoading: false });
    } catch (error: any) {
      console.error('Erreur de chargement du menu:', error);
      set({ 
        error: 'Impossible de charger le menu.', 
        isLoading: false 
      });
    }
  },
  
  placeOrder: async (orderData) => {
    // This calls useOrderStore logic implicitly via UI or we can call Firestore directly here.
    // Usually, placeOrder creates the order in Firestore.
    // Let's implement it to write to 'orders' collection.
    try {
      const { addDoc, serverTimestamp } = await import('firebase/firestore');
      const docRef = await addDoc(collection(db, 'orders'), {
        ...orderData,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      set({ activeOrderId: docRef.id, cart: [] });
      return docRef.id;
    } catch (error) {
      console.error("Error placing order:", error);
      throw error;
    }
  },
  
  getItemsByCategory: (categoryId: string) => {
    return get().items.filter((item: MenuItem) => item.categoryId === categoryId);
  },
  
  getItemById: (id: string) => {
    return get().items.find((item: MenuItem) => item.id === id);
  },

  // Categories Actions
  addCategory: async (category) => {
    try {
      await addDoc(collection(db, 'categories'), category);
      get().loadMenu(); // Reload to refresh
    } catch (error) {
      console.error("Error adding category:", error);
    }
  },

  updateCategory: async (id, updates) => {
    try {
      await updateDoc(doc(db, 'categories', id), updates);
      get().loadMenu();
    } catch (error) {
      console.error("Error updating category:", error);
    }
  },

  deleteCategory: async (id) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
      get().loadMenu();
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  },

  reorderCategories: async (categories) => {
    // Optimistic update
    set({ categories });
    // Batch update order in Firestore
    // For simplicity, we just update one by one or use batch if needed.
    // Leaving as TODO or simple loop
    try {
      const { writeBatch } = await import('firebase/firestore');
      const batch = writeBatch(db);
      categories.forEach((cat, index) => {
        const ref = doc(db, 'categories', cat.id);
        batch.update(ref, { order: index + 1 });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error reordering categories:", error);
    }
  },

  // Items Actions
  addItem: async (item) => {
    try {
      await addDoc(collection(db, 'products'), item);
      get().loadMenu();
    } catch (error) {
      console.error("Error adding item:", error);
    }
  },

  updateItem: async (id, updates) => {
    try {
      await updateDoc(doc(db, 'products', id), updates);
      get().loadMenu();
    } catch (error) {
      console.error("Error updating item:", error);
    }
  },

  deleteItem: async (id) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      get().loadMenu();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  }
}));
