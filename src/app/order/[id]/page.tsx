"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ChefHat,
  UtensilsCrossed,
  XCircle,
  Wallet,
  ShoppingBag,
  Star,
} from "lucide-react";
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
  "awaiting-payment": {
    icon: Wallet,
    label: "Paiement requis",
    description: "Veuillez régler à la caisse",
  },
  pending: {
    icon: Clock,
    label: "En attente",
    description: "Commande validée",
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
  },
  paid: {
    icon: CheckCircle2,
    label: "Payée",
    description: "Merci de votre visite !",
  },
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
  const { requestService } = useTableStore();
  const { invoiceSettings } = useRestaurantStore();
  const { hasReviewedOrder } = useReviewStore();

  const [otherOrders, setOtherOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!params.id) return;

    const orderId = params.id as string;

    const loadOrder = async () => {
      try {
        const { doc, onSnapshot, collection, query, where, limit } =
          await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");

        if (!db) {
          toast.error("Firebase n'est pas configuré");
          setLoading(false);
          return;
        }

        const orderRef = doc(db, "orders", orderId);

        // Store unsubscribe for other orders
        let unsubscribeOthers: (() => void) | null = null;

        const unsubscribe = onSnapshot(
          orderRef,
          async (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              const currentOrder = { id: docSnap.id, ...data } as Order;

              // Auto-cleanup: If order is cancelled or paid, remove from store
              if (
                currentOrder.status === "cancelled" ||
                currentOrder.status === "paid"
              ) {
                removeActiveOrderId(currentOrder.id);
              }

              setOrder(currentOrder);

              // Only fetch other orders if it's a real table, not takeaway
              // Takeaway orders are individual and shouldn't be grouped
              const isTakeaway =
                currentOrder.tableId === "À emporter" ||
                currentOrder.tableId === "takeaway";

              if (currentOrder.tableId && !isTakeaway) {
                try {
                  let q;

                  if (currentOrder.tableDocId) {
                    // New logic: Query by unique table document ID to avoid mixing sessions
                    q = query(
                      collection(db, "orders"),
                      where("tableDocId", "==", currentOrder.tableDocId),
                      where("status", "in", [
                        "awaiting-payment",
                        "pending",
                        "preparing",
                        "ready",
                        "served",
                        "paid",
                      ]),
                      limit(50)
                    );
                  } else {
                    // Fallback logic: Query by label (legacy)
                    q = query(
                      collection(db, "orders"),
                      where("tableId", "==", currentOrder.tableId),
                      where("status", "in", [
                        "awaiting-payment",
                        "pending",
                        "preparing",
                        "ready",
                        "served",
                        "paid",
                      ]),
                      limit(50)
                    );
                  }

                  // Clean up previous subscription if exists
                  if (unsubscribeOthers) {
                    unsubscribeOthers();
                  }

                  // Use onSnapshot instead of getDocs for real-time updates
                  unsubscribeOthers = onSnapshot(q, async (querySnapshot) => {
                    const now = Date.now();
                    const twelveHours = 12 * 60 * 60 * 1000;

                    // Fetch table session start time if possible
                    let sessionStart = 0;
                    if (currentOrder.tableDocId) {
                      try {
                        const { doc, getDoc } = await import(
                          "firebase/firestore"
                        );
                        const tableSnap = await getDoc(
                          doc(db, "tables", currentOrder.tableDocId)
                        );
                        if (tableSnap.exists()) {
                          sessionStart = tableSnap.data().sessionStartTime || 0;
                        }
                      } catch (e) {
                        console.warn("Failed to fetch table session time", e);
                      }
                    }

                    const others = querySnapshot.docs
                      .map((d) => ({ id: d.id, ...d.data() } as Order))
                      .filter((o) => o.id !== currentOrder.id)
                      // Filter out orders older than 12h or with invalid dates
                      .filter((o) => {
                        if (!o.createdAt?.seconds) return false;
                        const orderTime = o.createdAt.seconds * 1000;
                        // Filter by session time if available
                        if (sessionStart > 0 && orderTime < sessionStart)
                          return false;
                        return now - orderTime < twelveHours;
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
          },
          (error) => {
            console.error("Error loading order:", error);
            toast.error("Erreur de chargement de la commande");
            setLoading(false);
          }
        );

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

  const isTakeaway =
    order?.tableId === "À emporter" || order?.tableId === "takeaway";

  const handleCallServer = async (type: "assistance" | "bill") => {
    try {
      if (order?.tableDocId) {
        await requestService(order.tableDocId, type);
      } else if (order?.tableId) {
        // Fallback for legacy orders
        const tableNum = order.tableId.replace(/[^0-9]/g, "");
        // Try to use a format that the store can resolve (e.g. "Table 1")
        await requestService(`Table ${tableNum}`, type);
      }

      if (type === "assistance") {
        toast.success("🔔 Serveur appelé !");
      } else {
        toast.success("💳 Demande d'addition envoyée !");
      }
    } catch (error) {
      console.error("Failed to call server:", error);
      toast.error("Erreur lors de l'appel serveur. Veuillez réessayer.");
    }
  };

  const handleCancelOrder = async (targetOrderId: string) => {
    setCancellingId(targetOrderId);
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      if (!db) throw new Error("No DB");

      await updateDoc(doc(db, "orders", targetOrderId), {
        status: "cancelled",
      });

      // IMMEDIATELY remove from active orders
      removeActiveOrderId(targetOrderId);

      toast.success("Commande annulée");

      // Navigate away if we cancelled the current order
      if (targetOrderId === order?.id) {
        const remainingOrders = otherOrders.filter(
          (o) => o.id !== targetOrderId
        );
        if (remainingOrders.length > 0) {
          router.push(
            `/order/${remainingOrders[remainingOrders.length - 1].id}`
          );
        } else {
          router.push("/");
        }
      }
    } catch (error: any) {
      console.error("Error cancelling:", error);
      toast.error(
        "Impossible d'annuler cette commande. Réessayez ou appelez le serveur."
      );
    } finally {
      setCancellingId(null);
    }
  };

  const getOptionDetails = (orderItem: any, optionName: string) => {
    const menuItem = allMenuItems.find((m) => m.id === orderItem.menuId);
    return menuItem?.options?.find((opt) => opt.name === optionName);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-100 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  if (!order) return null;

  const allSessionOrders = [...otherOrders, order].sort(
    (a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
  );
  const sessionTotal = allSessionOrders.reduce((acc, o) => acc + o.total, 0);

  // Calculate global status based on ALL orders
  const allServed = allSessionOrders.every((o) => o.status === "served");
  const anyPreparing = allSessionOrders.some((o) => o.status === "preparing");
  const anyReady = allSessionOrders.some((o) => o.status === "ready");

  let globalStatus: OrderStatusType;
  if (allServed) {
    globalStatus = "served";
  } else if (anyReady) {
    globalStatus = "ready";
  } else if (anyPreparing) {
    globalStatus = "preparing";
  } else {
    globalStatus = "pending";
  }

  const statusConfig =
    STATUS_CONFIG[globalStatus as keyof typeof STATUS_CONFIG] ||
    STATUS_CONFIG.pending;
  const isCompleted = allServed;

  // Aggregate all items from all session orders for review
  const combinedItems = allSessionOrders.flatMap((o) => o.items || []);

  return (
    <div className="min-h-dvh bg-zinc-100 dark:bg-zinc-950 flex flex-col pb-8">
      <div className="sticky top-0 z-50 bg-zinc-100/90 dark:bg-zinc-950/90 backdrop-blur-sm p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (order?.tableId) {
              const label = order.tableId.replace(/Table\s+/i, "");
              router.push(`/?table=${label}`);
            } else {
              router.push("/");
            }
          }}
          className="rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800"
        >
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
          {order?.status === "paid" ? (
            <div className="w-full p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-green-800 dark:text-green-300">
                Addition réglée
              </h3>
              <p className="text-sm text-green-700 dark:text-green-400">
                Merci de votre visite ! À bientôt.
              </p>
            </div>
          ) : isTakeaway && order.status === "awaiting-payment" ? (
            <div className="w-full p-6 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center mb-2">
                <Wallet className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-bold text-orange-800 dark:text-orange-300">
                Paiement requis
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-400">
                Veuillez vous diriger vers la caisse pour régler et valider
                votre commande.
              </p>
            </div>
          ) : isTakeaway && order.status !== "awaiting-payment" ? (
            <div className="w-full p-6 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mb-2 shadow-sm">
                <ChefHat className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-300">
                {order.status === "served"
                  ? "Commande servie"
                  : order.status === "ready"
                  ? "Commande prête"
                  : "Commande validée"}
              </h3>
              {order.status === "ready" && (
                <p className="text-sm text-muted-foreground">
                  Votre commande est prête à être récupérée !
                </p>
              )}
              {order.status === "preparing" && (
                <p className="text-sm text-muted-foreground">
                  Préparation en cours...
                </p>
              )}
            </div>
          ) : (
            <Button
              onClick={() => handleCallServer("bill")}
              className="w-full h-14 rounded-full text-lg font-bold shadow-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-transform active:scale-[0.98]"
            >
              <Wallet className="mr-2 h-5 w-5" />
              Régler l'addition
            </Button>
          )}

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
