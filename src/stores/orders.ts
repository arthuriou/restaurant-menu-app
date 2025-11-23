import { create } from 'zustand';
import { Order } from '@/types';

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served';

export interface OrderState {
  orders: Record<OrderStatus, any[]>;
  addOrder: (order: any) => void;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, oldStatus: OrderStatus) => void;
  moveOrder: (orderId: string, sourceStatus: OrderStatus, destStatus: OrderStatus, newIndex: number, oldIndex: number) => void;
  stats: {
    totalRevenue: number;
    totalOrders: number;
    averageTicket: number;
    activeOrders: number;
  };
  calculateStats: () => void;
}

// Initial mock data moved from page.tsx
const initialOrders: Record<OrderStatus, any[]> = {
  pending: [
    { id: "ord-1", table: "T-4", items: [{}], itemCount: 3, total: 12500, time: "12:30", status: "pending", customer: "Client" },
    { id: "ord-2", table: "T-2", items: [{}], itemCount: 1, total: 4500, time: "12:32", status: "pending", customer: "Client" },
  ],
  preparing: [
    { id: "ord-3", table: "T-8", items: [{}], itemCount: 5, total: 28000, time: "12:15", status: "preparing", customer: "Client" },
  ],
  ready: [
    { id: "ord-4", table: "T-1", items: [{}], itemCount: 2, total: 8900, time: "12:10", status: "ready", customer: "Client" },
  ],
  served: [
    { id: "ord-5", table: "T-5", items: [{}], itemCount: 4, total: 15600, time: "11:45", status: "served", customer: "Client" },
  ]
};

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: initialOrders,

  stats: {
    totalRevenue: 0,
    totalOrders: 0,
    averageTicket: 0,
    activeOrders: 0,
  },

  addOrder: (order) => set((state) => {
    const newOrders = { ...state.orders, pending: [order, ...state.orders.pending] };
    get().calculateStats();
    return { orders: newOrders };
  }),

  updateOrderStatus: (orderId, newStatus, oldStatus) => set((state) => {
    // Implementation for simple status update if needed
    return state;
  }),

  moveOrder: (orderId, sourceStatus, destStatus, newIndex, oldIndex) => set((state) => {
    const sourceColumn = [...state.orders[sourceStatus]];
    const destColumn = sourceStatus === destStatus ? sourceColumn : [...state.orders[destStatus]];
    
    // Remove from source
    const [movedOrder] = sourceColumn.splice(oldIndex, 1);
    const updatedOrder = { ...movedOrder, status: destStatus };

    // Add to dest
    if (sourceStatus === destStatus) {
      sourceColumn.splice(newIndex, 0, updatedOrder);
      return { 
        orders: { ...state.orders, [sourceStatus]: sourceColumn } 
      };
    } else {
      destColumn.splice(newIndex, 0, updatedOrder);
      const newState = {
        orders: { 
          ...state.orders, 
          [sourceStatus]: sourceColumn,
          [destStatus]: destColumn
        }
      };
      // Recalculate stats might be needed if we track "served" vs "pending" revenue differently
      // For now, revenue is based on all orders
      return newState;
    }
  }),

  calculateStats: () => {
    const state = get();
    let totalRev = 0;
    let count = 0;
    let active = 0;

    Object.values(state.orders).forEach(list => {
      list.forEach(order => {
        totalRev += order.total;
        count++;
        if (order.status !== 'served') active++;
      });
    });

    set({
      stats: {
        totalRevenue: totalRev,
        totalOrders: count,
        averageTicket: count > 0 ? Math.round(totalRev / count) : 0,
        activeOrders: active
      }
    });
  }
}));
