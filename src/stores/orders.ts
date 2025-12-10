import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { OrderStatus } from '@/types';

export type DashboardOrder = {
  id: string;
  table: string;
  items: any[];
  itemCount: number;
  total: number;
  time: string;
  status: OrderStatus;
  customer?: string;
  createdAt?: any;
};

export interface OrderState {
  orders: Record<OrderStatus, DashboardOrder[]>;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  subscribeToOrders: () => () => void;
  addOrder: (order: Omit<DashboardOrder, 'id' | 'time' | 'status'>) => Promise<void>;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  
  // Stats
  stats: {
    totalRevenue: number;
    totalOrders: number;
    averageTicket: number;
    activeOrders: number;
    totalDishesServed: number;
    scanCount: number;
  };
  
  topItems: { name: string; count: number }[];
  salesByHour: Record<number, number>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: {
    pending: [],
    preparing: [],
    ready: [],
    served: [],
    paid: [],
    cancelled: []
  },
  isLoading: false,
  error: null,
  
  stats: {
    totalRevenue: 0,
    totalOrders: 0,
    averageTicket: 0,
    activeOrders: 0,
    totalDishesServed: 0,
    scanCount: 0,
  },
  topItems: [],
  salesByHour: {},

  subscribeToOrders: () => {
    if (!db) return () => {};
    
    set({ isLoading: true });
    
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders: Record<OrderStatus, DashboardOrder[]> = {
        pending: [],
        preparing: [],
        ready: [],
        served: [],
        paid: [],
        cancelled: []
      };
      
      let totalRev = 0;
      let count = 0;
      let active = 0;
      let dishes = 0;
      const salesByHour: Record<number, number> = {};
      const itemCounts: Record<string, number> = {};

      snapshot.docs.forEach((doc) => {
        const data = doc.data() as any;
        const order: DashboardOrder = {
          id: doc.id,
          ...data,
          time: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Now'
        };
        
        if (orders[order.status]) {
          orders[order.status].push(order);
        }

        // Stats calculation
        totalRev += order.total || 0;
        count++;
        if (order.status !== 'served') active++;
        dishes += order.itemCount || 0;

        // Sales by hour
        if (data.createdAt?.toDate) {
          const hour = data.createdAt.toDate().getHours();
          salesByHour[hour] = (salesByHour[hour] || 0) + 1;
        }

        // Top items
        order.items?.forEach((item: any) => {
          itemCounts[item.name] = (itemCounts[item.name] || 0) + (item.qty || 1);
        });
      });

      // Process Top Items
      const topItems = Object.entries(itemCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      set({
        orders,
        isLoading: false,
        stats: {
          totalRevenue: totalRev,
          totalOrders: count,
          averageTicket: count > 0 ? Math.round(totalRev / count) : 0,
          activeOrders: active,
          totalDishesServed: dishes,
          scanCount: get().stats.scanCount // Keep local for now or fetch from elsewhere
        },
        salesByHour,
        topItems
      });
    }, (error) => {
      console.error("Error fetching orders:", error);
      set({ error: error.message, isLoading: false });
    });

    return unsubscribe;
  },

  addOrder: async (orderData) => {
    try {
      await addDoc(collection(db, 'orders'), {
        ...orderData,
        status: 'pending',
        createdAt: serverTimestamp(),
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      });
    } catch (error) {
      console.error("Error adding order:", error);
      throw error;
    }
  },

  updateOrderStatus: async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      // Si la commande est servie, générer une facture automatiquement
      if (newStatus === 'served') {
        const { useInvoiceStore } = await import('@/stores/invoices');
        const { generateInvoiceFromOrder } = await import('@/lib/invoice-service');
        
        // Récupérer la commande complète depuis le state local
        const state = get();
        let order = null;
        
        // Chercher dans toutes les listes
        Object.values(state.orders).forEach(list => {
          const found = list.find(o => o.id === orderId);
          if (found) order = found;
        });

        if (order) {
          // Info restaurant par défaut (à configurer plus tard)
          const restaurantInfo = {
            name: "Mon Restaurant",
            address: "Abidjan, Côte d'Ivoire",
            phone: "+225 07 00 00 00 00"
          };

          // Convertir DashboardOrder en Order (types compatibles)
          const invoice = generateInvoiceFromOrder(order as any, restaurantInfo);
          
          // Sauvegarder la facture via le store
          await useInvoiceStore.getState().addInvoice(invoice);
          console.log("Facture générée automatiquement pour la commande", orderId);
        }
      }
    } catch (error) {
      console.error("Error updating order:", error);
      throw error;
    }
  }
}));
