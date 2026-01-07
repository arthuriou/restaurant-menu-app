import { create } from "zustand";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OrderStatus } from "@/types";

export type DashboardOrder = {
  id: string;
  table: string;
  items: any[];
  itemCount: number;
  total: number;
  time: string;
  status: OrderStatus;
  customer?: string;
  customerName?: string;
  createdAt?: any;
  tableId?: string;
  type?: string;
};

export interface OrderState {
  orders: Record<OrderStatus, DashboardOrder[]>;
  isLoading: boolean;
  error: string | null;

  // Actions
  subscribeToOrders: () => () => void;
  addOrder: (
    order: Omit<DashboardOrder, "id" | "time" | "status">,
  ) => Promise<void>;
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

// Helper to deep clone orders object
const cloneOrders = (
  orders: Record<OrderStatus, DashboardOrder[]>,
): Record<OrderStatus, DashboardOrder[]> => {
  return {
    "awaiting-payment": [...(orders["awaiting-payment"] || [])],
    pending: [...orders.pending],
    preparing: [...orders.preparing],
    ready: [...orders.ready],
    served: [...orders.served],
    paid: [...orders.paid],
    cancelled: [...orders.cancelled],
  };
};

// Track pending updates to prevent snapshot from overwriting optimistic updates
let pendingUpdates: Set<string> = new Set();
let updateTimestamps: Map<string, number> = new Map();
const UPDATE_LOCK_DURATION = 3000; // 3 seconds lock

const isUpdatePending = (orderId: string): boolean => {
  if (!pendingUpdates.has(orderId)) return false;

  const timestamp = updateTimestamps.get(orderId);
  if (timestamp && Date.now() - timestamp > UPDATE_LOCK_DURATION) {
    // Lock expired, remove it
    pendingUpdates.delete(orderId);
    updateTimestamps.delete(orderId);
    return false;
  }
  return true;
};

const lockOrder = (orderId: string) => {
  pendingUpdates.add(orderId);
  updateTimestamps.set(orderId, Date.now());
};

const unlockOrder = (orderId: string) => {
  pendingUpdates.delete(orderId);
  updateTimestamps.delete(orderId);
};

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: {
    "awaiting-payment": [],
    pending: [],
    preparing: [],
    ready: [],
    served: [],
    paid: [],
    cancelled: [],
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

    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const currentState = get();
        const orders: Record<OrderStatus, DashboardOrder[]> = {
          "awaiting-payment": [],
          pending: [],
          preparing: [],
          ready: [],
          served: [],
          paid: [],
          cancelled: [],
        };

        let totalRev = 0;
        let count = 0;
        let active = 0;
        let dishes = 0;
        const salesByHour: Record<number, number> = {};
        const itemCounts: Record<string, number> = {};

        snapshot.docs.forEach((doc) => {
          const data = doc.data() as any;

          // Check if this order has a pending optimistic update
          if (isUpdatePending(doc.id)) {
            // Use the local state for this order instead of Firebase data
            let foundInLocal = false;
            for (const [status, orderList] of Object.entries(
              currentState.orders,
            )) {
              const localOrder = orderList.find((o) => o.id === doc.id);
              if (localOrder) {
                if (orders[localOrder.status]) {
                  orders[localOrder.status].push(localOrder);
                }
                foundInLocal = true;

                // Still count stats from local order
                totalRev += localOrder.total || 0;
                count++;
                if (localOrder.status !== "served") active++;
                dishes += localOrder.itemCount || 0;
                break;
              }
            }
            if (foundInLocal) return; // Skip to next doc
          }

          const order: DashboardOrder = {
            id: doc.id,
            ...data,
            time: data.createdAt?.toDate
              ? data.createdAt.toDate().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Now",
          };

          if (orders[order.status]) {
            orders[order.status].push(order);
          } else {
            console.warn(
              `[OrderStore] Unknown status: ${order.status} for order ${doc.id}`,
            );
          }

          // Stats calculation
          totalRev += order.total || 0;
          count++;
          if (order.status !== "served") active++;
          dishes += order.itemCount || 0;

          // Sales by hour
          if (data.createdAt?.toDate) {
            const hour = data.createdAt.toDate().getHours();
            salesByHour[hour] = (salesByHour[hour] || 0) + 1;
          }

          // Top items
          order.items?.forEach((item: any) => {
            itemCounts[item.name] =
              (itemCounts[item.name] || 0) + (item.qty || 1);
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
            scanCount: get().stats.scanCount,
          },
          salesByHour,
          topItems,
        });
      },
      (error) => {
        console.error("Error fetching orders:", error);
        set({ error: error.message, isLoading: false });
      },
    );

    return unsubscribe;
  },

  addOrder: async (orderData) => {
    try {
      await addDoc(collection(db, "orders"), {
        ...orderData,
        status: "pending",
        createdAt: serverTimestamp(),
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    } catch (error) {
      console.error("Error adding order:", error);
      throw error;
    }
  },

  updateOrderStatus: async (orderId, newStatus) => {
    console.log(
      `[OrderStore] updateOrderStatus called: ${orderId} -> ${newStatus}`,
    );

    const state = get();
    let orderToMove: DashboardOrder | null = null;
    let oldStatus: OrderStatus | null = null;

    // Find the order and its current status
    for (const [status, orderList] of Object.entries(state.orders)) {
      const found = orderList.find((o) => o.id === orderId);
      if (found) {
        orderToMove = { ...found }; // Clone the order
        oldStatus = status as OrderStatus;
        console.log(
          `[OrderStore] Found order in ${status}, moving to ${newStatus}`,
        );
        break;
      }
    }

    if (!orderToMove || !oldStatus) {
      console.error(`[OrderStore] Order ${orderId} not found in any status!`);
      return;
    }

    if (oldStatus === newStatus) {
      console.log(`[OrderStore] Order already in ${newStatus}, skipping`);
      return;
    }

    // Lock this order to prevent snapshot from overwriting
    lockOrder(orderId);

    // Optimistic update: immediately move order in local state
    const newOrders = cloneOrders(state.orders);

    // Remove from old status
    newOrders[oldStatus] = newOrders[oldStatus].filter((o) => o.id !== orderId);

    // Add to new status with updated status field
    const updatedOrder: DashboardOrder = { ...orderToMove, status: newStatus };
    newOrders[newStatus] = [updatedOrder, ...newOrders[newStatus]];

    // Update state immediately
    console.log(
      `[OrderStore] Optimistic update: ${oldStatus}(${newOrders[oldStatus].length}) -> ${newStatus}(${newOrders[newStatus].length})`,
    );
    set({ orders: newOrders });

    try {
      console.log(`[OrderStore] Sending to Firebase...`);
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      console.log(`[OrderStore] Firebase update successful`);

      // Unlock after successful update - Firebase will sync the correct state
      unlockOrder(orderId);

      // Si la commande est servie, générer une facture automatiquement
      if (newStatus === "served" && orderToMove) {
        try {
          const { useInvoiceStore } = await import("@/stores/invoices");
          const { generateInvoiceFromOrder } =
            await import("@/lib/invoice-service");

          // Info restaurant par défaut (à configurer plus tard)
          const restaurantInfo = {
            name: "Mon Restaurant",
            address: "Abidjan, Côte d'Ivoire",
            phone: "+225 07 00 00 00 00",
          };

          // Convertir DashboardOrder en Order (types compatibles)
          const invoice = generateInvoiceFromOrder(
            orderToMove as any,
            restaurantInfo,
          );

          // Sauvegarder la facture via le store
          await useInvoiceStore.getState().addInvoice(invoice);
          console.log(
            "[OrderStore] Facture générée automatiquement pour la commande",
            orderId,
          );
        } catch (invoiceError) {
          console.error("[OrderStore] Error generating invoice:", invoiceError);
          // Don't throw - invoice generation failure shouldn't affect order status
        }
      }
    } catch (error) {
      console.error("[OrderStore] Error updating order in Firebase:", error);

      // Unlock on error
      unlockOrder(orderId);

      // Rollback: restore original state on error
      const currentState = get();
      const rollbackOrders = cloneOrders(currentState.orders);

      // Remove from new status
      rollbackOrders[newStatus] = rollbackOrders[newStatus].filter(
        (o) => o.id !== orderId,
      );

      // Add back to old status
      const restoredOrder: DashboardOrder = {
        ...orderToMove,
        status: oldStatus,
      };
      rollbackOrders[oldStatus] = [restoredOrder, ...rollbackOrders[oldStatus]];

      console.log(`[OrderStore] Rollback: ${newStatus} -> ${oldStatus}`);
      set({ orders: rollbackOrders });

      throw error;
    }
  },
}));
