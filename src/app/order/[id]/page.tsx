"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CheckCircle2, Clock, ChefHat, UtensilsCrossed, XCircle, Wallet, ShoppingBag, Star } from "lucide-react";
import { toast } from "sonner";
import type { Order, OrderStatus as OrderStatusType } from "@/types";
import { useMenuStore } from "@/stores/menu";
import { useTableStore } from "@/stores/tables";
import { useRestaurantStore } from "@/stores/restaurant";
import { ReviewDialog } from "@/components/reviews/ReviewDialog";
import { useReviewStore } from "@/stores/reviews";
import { OrderBill } from "@/components/order/OrderBill";

// Status configuration
const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    label: "En attente",
    description: "Commande enregistrée",
  },
  preparing: {
    icon: ChefHat,
    label: "En cuisine",
    description: "Préparation en cours",
  },
  ready: {
    icon: UtensilsCrossed,
    label: "Prête",
    description: "Prête à servir",
  },
  served: {
    icon: CheckCircle2,
    label: "Servie",
    description: "Bon appétit !",
  },
  cancelled: {
    icon: XCircle,
    label: "Annulée",
    description: "Commande annulée",
  }
};

export default function OrderPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const { items: allMenuItems, removeActiveOrderId } = useMenuStore();
  const {  requestService } = useTableStore();
  const { invoiceSettings } = useRestaurantStore();
  const { hasReviewedOrder } = useReviewStore();

  const [prevStatus, setPrevStatus] = useState<OrderStatusType | null>(null);
  const [otherOrders, setOtherOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!params.id) return;

    const orderId = params.id as string;

    const loadOrder = async () => {
      try {
        const { doc, onSnapshot, collection, query, where, limit } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        
        if (!db) {
          toast.error("Firebase n'est pas configuré");
          setLoading(false);
          return;
        }

        const orderRef = doc(db, 'orders', orderId);
        
        // Store unsubscribe for other orders
        let unsubscribeOthers: (() => void) | null = null;
        
        const unsubscribe = onSnapshot(orderRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const currentOrder = { id: docSnap.id, ...data } as Order;
            
            // Auto-cleanup: If order is cancelled, remove from store
            if (currentOrder.status === 'cancelled') {
              removeActiveOrderId(currentOrder.id);
            }
            
            setOrder(currentOrder);

            if (currentOrder.tableId) {
              try {
                const q = query(
                  collection(db, 'orders'), 
                  where('tableId', '==', currentOrder.tableId),
                  where('status', 'in', ['pending', 'preparing', 'ready', 'served']),
                  limit(50)
                );
                
                // Clean up previous subscription if exists
                if (unsubscribeOthers) {
                  unsubscribeOthers();
                }
                
                // Use onSnapshot instead of getDocs for real-time updates
                unsubscribeOthers = onSnapshot(q, (querySnapshot) => {
                  const now = Date.now();
                  const twelveHours = 12 * 60 * 60 * 1000;

                  const others = querySnapshot.docs
                    .map(d => ({ id: d.id, ...d.data() } as Order))
                    .filter(o => o.id !== currentOrder.id)
                    // Filter out orders older than 12h or with invalid dates
                    .filter(o => {
                      if (!o.createdAt?.seconds) return false;
                      const orderTime = o.createdAt.seconds * 1000;
                      return (now - orderTime) < twelveHours;
                    })
                    .sort((a, b) => {
                      const timeA = a.createdAt?.seconds || 0;
                      const timeB = b.createdAt?.seconds || 0;
                      return timeA - timeB;
                    });
                  
                  setOtherOrders(others);
                });
              } catch (err) {
                console.error("Error loading other orders:", err);
              }
            }

          } else {
            setOrder(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error loading order:", error);
          toast.error("Erreur de chargement de la commande");
          setLoading(false);
        });

        return () => {
          unsubscribe();
          if (unsubscribeOthers) {
            unsubscribeOthers();
          }
        };
      } catch (error) {
        console.error("Error setting up order listener:", error);
        setLoading(false);
      }
    };

    loadOrder();
  }, [params.id, removeActiveOrderId]);

  // Check if order has been reviewed
  useEffect(() => {
    if (!params.id) return;
    
    const checkReview = async () => {
      const reviewed = await hasReviewedOrder(params.id as string);
      setHasReviewed(reviewed);
    };
    
    checkReview();
  }, [params.id, hasReviewedOrder]);

  useEffect(() => {
    if (!order || !prevStatus) {
      if (order) setPrevStatus(order.status);
      return;
    }

    if (order.status !== prevStatus) {
      if (order.status === "ready") {
        toast.success("🎉 Votre commande est prête !");
      } else if (order.status === "served") {
        toast.success("✅ Commande servie");
      }
      setPrevStatus(order.status);
    }
  }, [order?.status, prevStatus]);

  const handleCallServer = (type: 'assistance' | 'bill') => {
    if (!order?.tableId) return;
    const tableNum = order.tableId.replace(/[^0-9]/g, '');
    const tableId = `t${tableNum}`;
    requestService(tableId, type);
    if (type === 'assistance') {
      toast.success("🔔 Serveur appelé !");
    } else {
      toast.success("💳 Demande d'addition envoyée !");
    }
  };

  const handleCancelOrder = async (targetOrderId: string) => {
    setCancellingId(targetOrderId);
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      if (!db) throw new Error("No DB");

      await updateDoc(doc(db, 'orders', targetOrderId), { status: 'cancelled' });
      
      // IMMEDIATELY remove from active orders
      removeActiveOrderId(targetOrderId);
      
      toast.success("Commande annulée");
      
      // Navigate away if we cancelled the current order
      if (targetOrderId === order?.id) {
        const remainingOrders = otherOrders.filter(o => o.id !== targetOrderId);
        if (remainingOrders.length > 0) {
          router.push(`/order/${remainingOrders[remainingOrders.length - 1].id}`);
        } else {
          router.push('/');
        }
      }
    } catch (error: any) {
      console.error("Error cancelling:", error);
      
      console.error("Error cancelling:", error);
      toast.error("Impossible d'annuler cette commande. Réessayez ou appelez le serveur.");
    } finally {
      setCancellingId(null);
    }
  };

  const getOptionDetails = (orderItem: any, optionName: string) => {
    const menuItem = allMenuItems.find(m => m.id === orderItem.menuId);
    return menuItem?.options?.find(opt => opt.name === optionName);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-zinc-100 dark:bg-zinc-950"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!order) return null;

  const allSessionOrders = [...otherOrders, order].sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
  const sessionTotal = allSessionOrders.reduce((acc, o) => acc + o.total, 0);
  
  // Calculate global status based on ALL orders
  const allServed = allSessionOrders.every(o => o.status === 'served');
  const anyPreparing = allSessionOrders.some(o => o.status === 'preparing');
  const anyReady = allSessionOrders.some(o => o.status === 'ready');
  
  let globalStatus: OrderStatusType;
  if (allServed) {
    globalStatus = 'served';
  } else if (anyReady) {
    globalStatus = 'ready';
  } else if (anyPreparing) {
    globalStatus = 'preparing';
  } else {
    globalStatus = 'pending';
  }
  
  const statusConfig = STATUS_CONFIG[globalStatus as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const isCompleted = allServed;
  
  // Aggregate all items from all session orders for review
  const combinedItems = allSessionOrders.flatMap(o => o.items || []);

  return (
    <div className="min-h-dvh bg-zinc-100 dark:bg-zinc-950 flex flex-col pb-8">
      <div className="sticky top-0 z-50 bg-zinc-100/90 dark:bg-zinc-950/90 backdrop-blur-sm p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-bold text-lg">Votre Note</h1>
        <div className="w-10" />
      </div>

      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-2">
        <OrderBill 
          order={order}
          otherOrders={otherOrders}
          companyName={invoiceSettings.companyName}
          showActions={true}
          onCancelOrder={handleCancelOrder}
          cancellingId={cancellingId}
        />

        <div className="mt-8 space-y-3 pb-8">
          <Button 
            onClick={() => handleCallServer('bill')}
            className="w-full h-14 rounded-full text-lg font-bold shadow-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-transform active:scale-[0.98]"
          >
            <Wallet className="mr-2 h-5 w-5" />
            Régler l'addition
          </Button>

          {/* Review Button (only if all orders served and not reviewed) */}
          {allServed && !hasReviewed && (
            <Button
              onClick={() => setReviewDialogOpen(true)}
              variant="outline"
              className="w-full h-14 rounded-full text-lg font-bold shadow-xl border-2 border-yellow-400 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950 transition-transform active:scale-[0.98]"
            >
              <Star className="mr-2 h-5 w-5 fill-yellow-400" />
              Laisser un avis
            </Button>
          )}
        </div>
      </main>

      {/* Review Dialog */}
      {order && combinedItems.length > 0 && (
        <ReviewDialog
          open={reviewDialogOpen}
          onOpenChange={(open) => {
            setReviewDialogOpen(open);
            if (!open) setHasReviewed(true);
          }}
          orderId={params.id as string}
          tableId={order.tableId || ""}
          items={combinedItems}
        />
      )}
    </div>
  );
}
