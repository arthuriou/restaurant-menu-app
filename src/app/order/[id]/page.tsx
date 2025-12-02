"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CheckCircle2, Clock, ChefHat, UtensilsCrossed, XCircle, AlertCircle, Bell, Wallet } from "lucide-react";
import { toast } from "sonner";
import type { Order, OrderStatus as OrderStatusType } from "@/types";
import { useMenuStore } from "@/stores/menu";
import { useTableStore } from "@/stores/tables";

// Status configuration
const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    label: "En attente",
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950",
    description: "Votre commande a été enregistrée",
  },
  preparing: {
    icon: ChefHat,
    label: "En cuisine",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    description: "Nos chefs préparent votre commande",
  },
  ready: {
    icon: UtensilsCrossed,
    label: "Prête",
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950",
    description: "Votre commande est prête à être servie !",
  },
  served: {
    icon: CheckCircle2,
    label: "Servie",
    color: "text-zinc-600",
    bgColor: "bg-zinc-50 dark:bg-zinc-950",
    description: "Bon appétit !",
  }
};

export default function OrderPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const { setActiveOrderId, removeActiveOrderId } = useMenuStore();
  const { requestService } = useTableStore();

  // Track previous status for notifications
  const [prevStatus, setPrevStatus] = useState<OrderStatusType | null>(null);

  const [otherOrders, setOtherOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!params.id) return;

    const orderId = params.id as string;

    // Charger la commande depuis Firestore
    const loadOrder = async () => {
      try {
        const { doc, getDoc, onSnapshot, collection, query, where, limit, getDocs } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        
        if (!db) {
          toast.error("Firebase n'est pas configuré");
          setLoading(false);
          return;
        }

        const orderRef = doc(db, 'orders', orderId);
        
        // Subscribe to real-time updates for current order
        const unsubscribe = onSnapshot(orderRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const currentOrder = { id: docSnap.id, ...data } as Order;
            setOrder(currentOrder);

            // If table order, fetch other orders for this table
            if (currentOrder.tableId) {
              try {
                // Simple query for table orders
                // Removed orderBy to avoid needing a composite index
                const q = query(
                  collection(db, 'orders'), 
                  where('tableId', '==', currentOrder.tableId),
                  where('status', 'in', ['pending', 'preparing', 'ready', 'served']),
                  limit(20)
                );
                
                const querySnapshot = await getDocs(q);
                const others = querySnapshot.docs
                  .map(d => ({ id: d.id, ...d.data() } as Order))
                  .filter(o => o.id !== currentOrder.id) // Exclude current
                  .sort((a, b) => {
                    // Sort by createdAt desc (handling Firestore Timestamp)
                    const timeA = a.createdAt?.seconds || 0;
                    const timeB = b.createdAt?.seconds || 0;
                    return timeB - timeA;
                  });
                
                setOtherOrders(others);
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

        return unsubscribe;
      } catch (error) {
        console.error("Error setting up order listener:", error);
        setLoading(false);
      }
    };

    loadOrder();
  }, [params.id]);

  // Notifications when status changes
  useEffect(() => {
    if (!order || !prevStatus) {
      if (order) setPrevStatus(order.status);
      return;
    }

    if (order.status !== prevStatus) {
      const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
      
      if (order.status === "ready") {
        toast.success("🎉 Votre commande est prête !", {
          description: "Vous pouvez venir la récupérer",
          duration: 5000,
        });
      } else if (order.status === "preparing") {
        toast.info("👨‍🍳 Commande en préparation", {
          description: "Nos chefs s'occupent de votre commande",
        });
      } else if (order.status === "served") {
        toast.success("✅ Commande servie", {
          description: "Bon appétit !",
        });
      }
      
      setPrevStatus(order.status);
    }
  }, [order?.status, prevStatus]);

  const handleCallServer = (type: 'assistance' | 'bill') => {
    if (!order?.tableId) return;
    
    // Extract table number from "Table X" string if needed
    const tableNum = order.tableId.replace(/[^0-9]/g, '');
    const tableId = `t${tableNum}`;
    
    requestService(tableId, type);
    
    if (type === 'assistance') {
      toast.success("🔔 Serveur appelé ! Il arrive dans quelques instants.");
    } else {
      toast.success("💳 Demande d'addition envoyée !");
    }
  };

  const handleCancelOrder = async () => {
    if (!order || order.status !== "pending") return;
    
    setCancelling(true);
    
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      if (!db) throw new Error("No DB");

      // Update status to cancelled in Firebase
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'cancelled'
      });
      
      toast.success("Commande annulée", {
        description: "Votre commande a été annulée avec succès",
      });
      
      // Remove this order from active list in store
      removeActiveOrderId(order.id);

      // Smart Navigation
      if (otherOrders.length > 0) {
        // If there are other orders, switch to the most recent one
        const nextOrder = otherOrders[0];
        setActiveOrderId(nextOrder.id);
        // Navigate to the next order page immediately
        router.push(`/order/${nextOrder.id}`);
      } else {
        // No other orders, go back to menu
        setActiveOrderId(null);
        setTimeout(() => {
          router.push('/');
        }, 1000);
      }
      
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Erreur", {
        description: "Impossible d'annuler la commande",
      });
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-xl max-w-md w-full">
          <h1 className="text-2xl font-bold mb-2">Commande introuvable</h1>
          <p className="text-muted-foreground mb-6">Cette commande n'existe pas ou a été supprimée.</p>
          <Button onClick={() => router.push('/')} className="w-full rounded-full">Retour au menu</Button>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const canCancel = order.status === "pending";
  const isCompleted = order.status === "served";

  // Calculate session total (current + others)
  const sessionTotal = (order ? order.total : 0) + otherOrders.reduce((acc, o) => acc + o.total, 0);

  return (
    <div className="min-h-dvh bg-gradient-to-br from-primary/5 via-background to-primary/10 flex flex-col overflow-x-hidden">
      {/* Header with Deep Bowl Effect */}
      <div className="relative h-[25vh] w-full mb-4 md:mb-8 shrink-0">
        {/* Background Curve */}
        <div className="absolute inset-0 bg-primary rounded-b-[80%] md:rounded-b-[100%] scale-x-[1.3] md:scale-x-[1.5] origin-top overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-b from-primary to-primary/90" />
        </div>

        {/* Back Button */}
        <div className="relative z-10 p-3 md:p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/')}
            className="rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        {/* Status Icon */}
        <div className="absolute inset-x-0 -bottom-12 md:-bottom-16 z-10 flex justify-center">
          <div className={`relative w-24 h-24 md:w-32 md:h-32 rounded-full ${statusConfig.bgColor} shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] flex items-center justify-center animate-in zoom-in-50 duration-500`}>
            <StatusIcon className={`w-12 h-12 md:w-16 md:h-16 ${statusConfig.color}`} />
            <div className="absolute inset-0 rounded-full border-4 border-white dark:border-zinc-900" />
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="w-full max-w-md mx-auto px-3 md:px-4 space-y-4 md:space-y-6 pt-8 md:pt-12 pb-4 flex-1 flex flex-col justify-center">
        {/* Status Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-2">
            <p className="text-xs md:text-sm text-muted-foreground">Commande #{order.id.slice(0, 8)}</p>
            <h1 className="text-2xl md:text-3xl font-bold">{order.tableId.replace('Table ', 'Table ')}</h1>
            <div className={`inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full ${statusConfig.bgColor} ${statusConfig.color} font-bold text-xs md:text-sm`}>
              <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
              {statusConfig.label}
            </div>
            <p className="text-sm text-muted-foreground pt-2">{statusConfig.description}</p>
          </div>
        </div>

        {/* Order Items Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-lg animate-in fade-in slide-in-from-bottom-6 duration-500 mb-8">
          <h2 className="font-bold text-base md:text-lg mb-3 md:mb-4">Récapitulatif</h2>
          <div className="space-y-3 md:space-y-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm mr-2">
                      {item.qty}
                    </span>
                    {item.name}
                  </p>
                  {item.options && Object.keys(item.options).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1 ml-8">
                      {Object.entries(item.options)
                        .map(([key, value]) => {
                          // Skip 'note' key
                          if (key === 'note') return null;
                          // If it's a boolean true, show the key (option name)
                          if (value === true) {
                            return (
                              <span 
                                key={key}
                                className="inline-flex items-center text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary dark:bg-primary/20 font-medium border border-primary/30"
                              >
                                {key}
                              </span>
                            );
                          }
                          // If it's a string (like a note), show the value
                          if (typeof value === 'string' && value) {
                            return (
                              <span 
                                key={key}
                                className="text-xs px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium border border-zinc-200 dark:border-zinc-700"
                              >
                                {value}
                              </span>
                            );
                          }
                          return null;
                        })
                        .filter(Boolean)}
                    </div>
                  )}
                </div>
                <p className="font-bold text-primary whitespace-nowrap ml-4">
                  {(item.price * item.qty).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">FCFA</span>
                </p>
              </div>
            ))}
            <div className="border-t pt-4 flex justify-between items-center">
              <span className="font-bold text-lg">Total</span>
              <span className="font-bold text-2xl text-primary">
                {order.total.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">FCFA</span>
              </span>
            </div>
          </div>
        </div>

        {/* Other Orders Section */}
        {otherOrders.length > 0 && (
          <div className="space-y-3 mb-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <h3 className="font-bold text-lg px-1 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Historique de la session
            </h3>
            {otherOrders.map((other) => {
              const otherStatus = STATUS_CONFIG[other.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
              const OtherIcon = otherStatus.icon;
              
              return (
                <div 
                  key={other.id}
                  onClick={() => router.push(`/order/${other.id}`)}
                  className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800 flex justify-between items-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm">Commande #{other.id.slice(0, 4)}</span>
                      <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${otherStatus.bgColor} ${otherStatus.color}`}>
                        {otherStatus.label}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {other.items.length} articles • {other.total.toLocaleString()} FCFA
                    </p>
                  </div>
                  <ArrowLeft className="w-4 h-4 rotate-180 text-muted-foreground" />
                </div>
              );
            })}
          </div>
        )}

        {/* Session Total Card */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-full">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total à payer</p>
                <p className="text-xs text-muted-foreground">(Session complète)</p>
              </div>
            </div>
            <span className="font-bold text-2xl text-primary">
              {sessionTotal.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">FCFA</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          {/* Call Server Button */}
          {!isCompleted && (
             <Button 
               onClick={() => handleCallServer('assistance')}
               variant="outline"
               className="w-full rounded-full h-12 md:h-14 text-base md:text-lg font-bold shadow-sm border-primary/20 text-primary hover:bg-primary/5"
             >
               <Bell className="mr-2 h-5 w-5" />
               Appeler le serveur
             </Button>
          )}

          {/* Cancel Button - Only show if order is pending */}
          {canCancel && (
            <Button 
              onClick={handleCancelOrder}
              disabled={cancelling}
              variant="destructive"
              className="w-full rounded-full h-12 md:h-14 text-base md:text-lg font-bold shadow-lg animate-in fade-in slide-in-from-bottom-8 duration-500"
            >
              {cancelling ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Annulation...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-5 w-5" />
                  Annuler la commande
                </>
              )}
            </Button>
          )}

          {/* Warning for non-cancellable orders */}
          {!canCancel && !isCompleted && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>La commande est en cours de préparation et ne peut plus être annulée</p>
            </div>
          )}

          {/* Back to Menu Button */}
          <Button 
            onClick={() => router.push('/')} 
            variant={canCancel ? "outline" : "default"}
            className="w-full rounded-full h-12 md:h-14 text-base md:text-lg font-bold shadow-lg animate-in fade-in slide-in-from-bottom-10 duration-500"
          >
            Retour au menu
          </Button>
        </div>
      </main>
    </div>
  );
}
