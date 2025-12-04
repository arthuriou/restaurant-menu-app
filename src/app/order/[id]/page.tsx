"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CheckCircle2, Clock, ChefHat, UtensilsCrossed, XCircle, Wallet, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import type { Order, OrderStatus as OrderStatusType } from "@/types";
import { useMenuStore } from "@/stores/menu";
import { useTableStore } from "@/stores/tables";
import { useRestaurantStore } from "@/stores/restaurant";

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
  const { items: allMenuItems, removeActiveOrderId } = useMenuStore();
  const { requestService } = useTableStore();
  const { invoiceSettings } = useRestaurantStore();

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
                  const others = querySnapshot.docs
                    .map(d => ({ id: d.id, ...d.data() } as Order))
                    .filter(o => o.id !== currentOrder.id)
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
    } catch (error) {
      console.error("Error cancelling:", error);
      toast.error("Impossible d'annuler");
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
        <div className="relative filter drop-shadow-xl">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-t-xl relative z-10">
            
            <div className="text-center space-y-2 mb-6 border-b-2 border-dashed border-zinc-200 dark:border-zinc-800 pb-6">
              <h2 className="font-black text-2xl uppercase tracking-widest text-zinc-900 dark:text-white">
                {invoiceSettings.companyName || "RESTAURANT"}
              </h2>
              <div className="flex flex-col text-xs text-muted-foreground uppercase tracking-wide font-medium">
                <span>{order.tableId}</span>
                <span>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                <span>{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              
              <div className="pt-2">
                {globalStatus === 'served' && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 bg-zinc-50 text-zinc-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Servie</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {allSessionOrders.map((ord) => {
                const orderStatusConfig = STATUS_CONFIG[ord.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                
                return (
                  <div key={ord.id} className="space-y-4">
                    <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span>Commande {ord.id.slice(0, 4)}</span>
                        
                        {/* Individual order status badge */}
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] ${
                          ord.status === 'served' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                            : ord.status === 'ready'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                            : ord.status === 'preparing'
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400'
                            : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}>
                          <orderStatusConfig.icon className="w-2.5 h-2.5" />
                          <span className="font-bold">{orderStatusConfig.label}</span>
                        </div>
                      </div>
                      
                      {ord.status === 'pending' && (
                        <button 
                          onClick={() => handleCancelOrder(ord.id)}
                          disabled={cancellingId === ord.id}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 px-2 py-0.5 rounded transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          {cancellingId === ord.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          <span>Annuler</span>
                        </button>
                      )}
                    </div>

                  {ord.items.map((item, idx) => (
                    <div key={`${ord.id}-${idx}`} className="flex gap-3">
                      <div className="relative h-12 w-12 shrink-0 rounded overflow-hidden bg-zinc-100 dark:bg-zinc-800 mt-1">
                        {item.imageUrl ? (
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-zinc-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200 leading-tight">
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs mr-1.5">
                                {item.qty}
                              </span>
                              {item.name}
                            </p>
                          </div>
                          <p className="font-bold text-sm text-zinc-900 dark:text-white whitespace-nowrap">
                            {(item.price * item.qty).toLocaleString()}
                          </p>
                        </div>

                        {item.options && Object.keys(item.options).length > 0 && (
                          <div className="mt-2 space-y-1.5 pl-1">
                            {Object.entries(item.options).map(([optName, optVal]) => {
                              if (optName === 'note') {
                                return (
                                  <div key={optName} className="text-[10px] text-muted-foreground italic bg-zinc-50 dark:bg-zinc-900/50 p-1.5 rounded border border-zinc-100 dark:border-zinc-800">
                                    Note: {optVal as string}
                                  </div>
                                );
                              }
                              if (optVal === true || typeof optVal === 'string') {
                                const details = getOptionDetails(item, optName);
                                return (
                                  <div key={optName} className="flex items-center gap-2 text-xs text-muted-foreground">
                                    {details?.imageUrl && (
                                      <div className="relative h-6 w-6 shrink-0 rounded overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                        <Image src={details.imageUrl} alt={optName} fill className="object-cover" />
                                      </div>
                                    )}
                                    <div className="flex-1 flex justify-between items-center border-b border-dashed border-zinc-100 dark:border-zinc-800 pb-0.5">
                                      <span>{optName}</span>
                                      {details && details.price > 0 && (
                                        <span className="font-medium">+{details.price.toLocaleString()}</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
              })}
            </div>

            <div className="mt-8 pt-6 border-t-2 border-dashed border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Sous-total</span>
                <span>{sessionTotal.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-black text-xl uppercase text-zinc-900 dark:text-white">Total à payer</span>
                <span className="font-black text-2xl text-primary">{sessionTotal.toLocaleString()} <span className="text-sm font-medium text-muted-foreground">FCFA</span></span>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="font-handwriting text-lg text-zinc-400 rotate-[-2deg]">Merci de votre visite !</p>
            </div>

          </div>

          <div 
            className="h-4 w-full bg-white dark:bg-zinc-900 relative z-10"
            style={{
              maskImage: 'linear-gradient(45deg, transparent 50%, black 50%), linear-gradient(-45deg, transparent 50%, black 50%)',
              maskSize: '20px 20px',
              maskRepeat: 'repeat-x',
              maskPosition: 'bottom',
              WebkitMaskImage: 'linear-gradient(45deg, transparent 50%, black 50%), linear-gradient(-45deg, transparent 50%, black 50%)',
              WebkitMaskSize: '20px 20px',
              WebkitMaskRepeat: 'repeat-x',
              WebkitMaskPosition: 'bottom',
            }}
          />
          <div className="h-6 w-full bg-transparent -mt-4 relative z-0 overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-zinc-100 dark:bg-zinc-950" />
          </div>

        </div>

        <div className="mt-8 space-y-3 pb-8">
          <Button 
            onClick={() => handleCallServer('bill')}
            className="w-full h-14 rounded-full text-lg font-bold shadow-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-transform active:scale-[0.98]"
          >
            <Wallet className="mr-2 h-5 w-5" />
            Régler l'addition
          </Button>
        </div>

      </main>
    </div>
  );
}
