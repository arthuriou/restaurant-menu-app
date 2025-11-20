"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CheckCircle2, Clock, ChefHat, UtensilsCrossed, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { Order, OrderStatus as OrderStatusType } from "@/types";
import { useMenuStore } from "@/stores/menu";

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
  const { setActiveOrderId } = useMenuStore();

  // Track previous status for notifications
  const [prevStatus, setPrevStatus] = useState<OrderStatusType | null>(null);

  useEffect(() => {
    if (!params.id) return;

    const orderId = params.id as string;

    // Mode Démo : Si l'ID commence par "demo-order-", on affiche une fausse commande
    if (orderId.startsWith("demo-order-")) {
      const demoOrder: Order = {
        id: orderId,
        tableId: "Table 12",
        items: [
          { menuId: "chicken_01", name: "Poulet braisé", price: 4500, qty: 2, options: { cuisson: "Bien cuit" } },
          { menuId: "soda_01", name: "Coca Cola", price: 1000, qty: 2 }
        ],
        total: 11000,
        status: "pending",
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
      };
      setOrder(demoOrder);
      setLoading(false);
      
      // Simulation de changement de statut pour démo (optionnel)
      let currentStatus: OrderStatusType = "pending";
      const statuses: OrderStatusType[] = ["pending", "preparing", "ready", "served"];
      let statusIndex = 0;
      
      const interval = setInterval(() => {
        statusIndex++;
        if (statusIndex < statuses.length) {
          currentStatus = statuses[statusIndex];
          setOrder(prev => prev ? { ...prev, status: currentStatus } : null);
        } else {
          clearInterval(interval);
        }
      }, 10000); // Change status every 10 seconds for demo
      
      return () => clearInterval(interval);
    }

    // En l'absence de Firebase configuré, on affiche une commande de démo
    setOrder({
      id: orderId,
      tableId: "Table 12",
      items: [
        { menuId: "chicken_01", name: "Poulet braisé", price: 4500, qty: 2 },
        { menuId: "soda_01", name: "Coca Cola", price: 1000, qty: 2 }
      ],
      total: 11000,
      status: "pending",
      createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
    });
    setLoading(false);
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

  const handleCancelOrder = async () => {
    if (!order || order.status !== "pending") return;
    
    setCancelling(true);
    
    try {
      // Simulation d'annulation (remplacer par appel Firebase)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Commande annulée", {
        description: "Votre commande a été annulée avec succès",
      });
      
      // Clear active order from store
      setActiveOrderId(null);
      
      // Redirect to menu after 1 second
      setTimeout(() => {
        router.push('/');
      }, 1000);
      
    } catch (error) {
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
        <div className="bg-white dark:bg-zinc-900 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-lg animate-in fade-in slide-in-from-bottom-6 duration-500">
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
                  {item.options && Object.values(item.options).filter(Boolean).length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1 ml-8">
                      {Object.values(item.options).filter(Boolean).join(', ')}
                    </p>
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

        {/* Action Buttons */}
        <div className="space-y-3">
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
