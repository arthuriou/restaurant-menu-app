import { create } from 'zustand';
// import { collection, getDocs, addDoc, query, orderBy, where } from 'firebase/firestore';
// import { db } from '@/lib/firebase';
import type { Category, MenuItem, Order, OrderStatus, OrderItem } from '@/types';

// Données de démonstration
const DEMO_CATEGORIES: Category[] = [
  { id: 'cat_grill', name: 'Grillades', order: 1 },
  { id: 'cat_entrees', name: 'Entrées', order: 2 },
  { id: 'cat_boissons', name: 'Boissons', order: 3 },
  { id: 'cat_desserts', name: 'Desserts', order: 4 },
];

const DEMO_ITEMS: MenuItem[] = [
  {
    id: "chicken_01",
    categoryId: "cat_grill",
    name: "Poulet braisé",
    description: "Poulet mariné aux épices du chef, grillé lentement à la braise pour un goût fumé unique.",
    price: 4500,
    imageUrl: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=2070&auto=format&fit=crop",
    available: true,
  },
  {
    id: "steak_01",
    categoryId: "cat_grill",
    name: "Steak Frites",
    description: "Bœuf tendre de première qualité, servi avec nos frites maison croustillantes.",
    price: 6500,
    imageUrl: "https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=2070&auto=format&fit=crop",
    available: true,
  },
  {
    id: "burger_01",
    categoryId: "cat_grill",
    name: "Classic Burger",
    description: "Pain brioché, steak haché frais, cheddar fondant, salade, tomate, oignons rouges.",
    price: 3500,
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1899&auto=format&fit=crop",
    available: true,
  },
  {
    id: "salad_01",
    categoryId: "cat_entrees",
    name: "Salade César",
    description: "Laitue romaine, croûtons à l'ail, parmesan, sauce César onctueuse.",
    price: 2500,
    imageUrl: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?q=80&w=2070&auto=format&fit=crop",
    available: true,
  },
  {
    id: "soda_01",
    categoryId: "cat_boissons",
    name: "Coca Cola",
    description: "Bouteille en verre 33cl, servi bien frais avec une tranche de citron.",
    price: 1000,
    imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=2070&auto=format&fit=crop",
    available: true,
  },
  {
    id: "cocktail_01",
    categoryId: "cat_boissons",
    name: "Mojito Virgin",
    description: "Menthe fraîche, citron vert, eau gazeuse, glace pilée. Sans alcool.",
    price: 2000,
    imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=1887&auto=format&fit=crop",
    available: true,
  },
];

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
  
  cart: OrderItem[];
  addToCart: (item: OrderItem) => void;
  removeFromCart: (index: number) => void;
  updateQty: (index: number, delta: number) => void;
  clearCart: () => void;
  
  loadMenu: () => Promise<void>;
  placeOrder: (order: Omit<Order, 'id' | 'status' | 'createdAt'>) => Promise<string>;
  getItemsByCategory: (categoryId: string) => MenuItem[];
  getItemById: (id: string) => MenuItem | undefined;
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
    set({ isLoading: true, error: null });
    try {
      // Simulation d'appel réseau
      await new Promise(resolve => setTimeout(resolve, 800));
      
      set({ 
        categories: DEMO_CATEGORIES, 
        items: DEMO_ITEMS, 
        isLoading: false 
      });
    } catch (error) {
      console.error('Erreur de chargement du menu:', error);
      set({ 
        error: 'Impossible de charger le menu.', 
        isLoading: false 
      });
    }
  },
  
  placeOrder: async (order: Omit<Order, 'id' | 'status' | 'createdAt'>) => {
    // Simulation d'envoi de commande
    return new Promise((resolve) => {
      console.log('Commande passée (MOCK):', order);
      setTimeout(() => resolve(`demo-order-${Date.now()}`), 1000);
    });
  },
  
  getItemsByCategory: (categoryId: string) => {
    return get().items.filter((item: MenuItem) => item.categoryId === categoryId);
  },
  
  getItemById: (id: string) => {
    return get().items.find((item: MenuItem) => item.id === id);
  }
}));
