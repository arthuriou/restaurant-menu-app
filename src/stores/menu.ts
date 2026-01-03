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
  where,
  serverTimestamp
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
  activeOrderIds: string[];
  setActiveOrderId: (id: string | null) => void;
  removeActiveOrderId: (id: string) => void;
  
  cart: OrderItem[];
  addToCart: (item: OrderItem) => void;
  removeFromCart: (index: number) => void;
  updateQty: (index: number, delta: number) => void;
  clearCart: () => void;
  clearTableSession: () => void;
  
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

import { persist, createJSONStorage } from 'zustand/middleware';

export const useMenuStore = create<MenuStore>()(
  persist(
    (set, get) => ({
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
      setTableId: (id) => set({ table: { id, label: id } }), // Removed "Table " prefix

      activeOrderId: null,
      activeOrderIds: [],
      setActiveOrderId: (id) => set({ activeOrderId: id }),
      removeActiveOrderId: (id) => set((state) => {
        const newIds = state.activeOrderIds.filter(oid => oid !== id);
        const newActiveId = state.activeOrderId === id 
          ? (newIds.length > 0 ? newIds[newIds.length - 1] : null) 
          : state.activeOrderId;
          
        return {
          activeOrderIds: newIds,
          activeOrderId: newActiveId
        };
      }),
      
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
      clearTableSession: () => set({ 
        cart: [], 
        activeOrderId: null, 
        activeOrderIds: [],
        table: { id: 'takeaway', label: 'À emporter' },
        orderType: 'takeaway'
      }),
      
      loadMenu: async () => {
        if (!db) return;
        set({ isLoading: true, error: null });
        try {
          const catQuery = query(collection(db, 'categories'), orderBy('order'));
          const catSnap = await getDocs(catQuery);
          const categories = catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));

          const itemQuery = query(collection(db, 'products'));
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
        const sanitizedItems = orderData.items.map(item => {
          const sanitized: Record<string, any> = {
            menuId: item.menuId,
            name: item.name,
            price: item.price,
            qty: item.qty || 1,
          };
          
          if (item.imageUrl) sanitized.imageUrl = item.imageUrl;
          if (item.note) sanitized.note = item.note;
          
          if (item.options && typeof item.options === 'object') {
            const cleanOptions: Record<string, any> = {};
            Object.entries(item.options).forEach(([key, value]) => {
              if (value !== undefined && value !== null && value !== '') {
                cleanOptions[key] = value;
              }
            });
            if (Object.keys(cleanOptions).length > 0) {
              sanitized.options = cleanOptions;
            }
          }
          
          return sanitized;
        });

        try {
          const { getAuth } = await import('firebase/auth');
          const auth = getAuth();
          const userId = auth.currentUser?.uid || 'anonymous';

          const docRef = await addDoc(collection(db, 'orders'), {
            ...orderData,
            items: sanitizedItems,
            status: 'pending',
            userId, // Attach ownership
            createdAt: serverTimestamp()
          });
          set((state) => ({ 
            activeOrderId: docRef.id, 
            activeOrderIds: [...state.activeOrderIds, docRef.id],
            cart: [] 
          }));

          // Mettre à jour le statut de la table à "occupied"
          // CRITICAL: We do NOT sync activeOrderId to the table anymore.
          // This ensures that other devices scanning the table do NOT see this order.
          // The order is only tracked locally in this device's session.
          const currentTable = get().table;
          if (currentTable?.id) {
             try {
                // Ensure table is marked occupied, but don't link the order ID
                await updateDoc(doc(db, 'tables', currentTable.id), { status: 'occupied' });
             } catch (e) {
                 console.warn("Table status update ignored (permissions):", e);
             }
          }

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

      addCategory: async (category) => {
        try {
          await addDoc(collection(db, 'categories'), category);
          get().loadMenu();
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
        set({ categories });
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

      addItem: async (item) => {
        try {
          const sanitizedItem = JSON.parse(JSON.stringify(item));
          await addDoc(collection(db, 'products'), sanitizedItem);
          get().loadMenu();
        } catch (error) {
          console.error("Error adding item:", error);
          throw error;
        }
      },

      updateItem: async (id, updates) => {
        try {
          const sanitizedUpdates = JSON.parse(JSON.stringify(updates));
          await updateDoc(doc(db, 'products', id), sanitizedUpdates);
          get().loadMenu();
        } catch (error) {
          console.error("Error updating item:", error);
          throw error;
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
    }),
    {
      name: 'restaurant-menu-storage',
      version: 3, // Bump version
      storage: createJSONStorage(() => sessionStorage), // Use Session Storage (clears on tab close)
      partialize: (state) => ({ 
        // Persist session-critical data
        orderType: state.orderType,
        table: state.table, // Restore table persistence (safe with sessionStorage)
        activeOrderId: state.activeOrderId,
        activeOrderIds: state.activeOrderIds,
        cart: state.cart, // Persist cart
      }),
    }
  )
);
