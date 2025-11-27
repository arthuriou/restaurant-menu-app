"use client";

import { useEffect, useState, useRef } from "react";
import { useOrderStore } from "@/stores/orders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  UtensilsCrossed, 
  BellRing,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ServerDashboard() {
  const { orders, updateOrderStatus } = useOrderStore();
  const [activeTab, setActiveTab] = useState("all");
  
  // Ref to track previous ready orders for notifications
  const prevReadyOrdersRef = useRef<Set<string>>(new Set());

  // Flatten all orders
  const allOrders = Object.values(orders).flat();

  // Filter active orders (not served)
  const activeOrders = allOrders.filter(o => o.status !== 'served');

  // Notification Logic
  useEffect(() => {
    const currentReadyOrders = new Set(
      allOrders
        .filter(o => o.status === 'ready')
        .map(o => o.id)
    );

    // Check for NEW ready orders
    currentReadyOrders.forEach(orderId => {
      if (!prevReadyOrdersRef.current.has(orderId)) {
        const order = allOrders.find(o => o.id === orderId);
        if (order) {
          // Play sound
          const audio = new Audio('/sounds/notification.mp3'); // Ensure this file exists or use a base64 string
          audio.play().catch(e => console.log("Audio play failed", e));

          // Show persistent toast
          toast.success(`COMMANDE PRÊTE ! - ${order.table}`, {
            description: `${order.items.length} articles à servir`,
            duration: 10000, // 10 seconds
            action: {
              label: "SERVIR",
              onClick: () => handleServeOrder(order.id)
            },
            icon: <BellRing className="w-6 h-6 text-green-600 animate-bounce" />
          });
        }
      }
    });

    prevReadyOrdersRef.current = currentReadyOrders;
  }, [allOrders]);

  const handleServeOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'served');
    toast.success("Commande marquée comme servie");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400";
      case 'preparing': return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400";
      case 'ready': return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 animate-pulse";
      default: return "bg-zinc-100 text-zinc-700 border-zinc-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return "En attente";
      case 'preparing': return "En cuisine";
      case 'ready': return "PRÊT À SERVIR";
      default: return status;
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-2rem)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <UtensilsCrossed className="w-8 h-8 text-primary" />
            Supervision Service
          </h1>
          <p className="text-muted-foreground">
            Suivez toutes les commandes en temps réel.
          </p>
        </div>
        <div className="flex gap-2">
           <Badge variant="outline" className="px-4 py-2 text-base bg-white dark:bg-zinc-900">
              {activeOrders.length} Commandes actives
           </Badge>
        </div>
      </div>

      <Tabs defaultValue="all" className="flex-1 flex flex-col" onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start h-12 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
          <TabsTrigger value="all" className="flex-1 rounded-lg text-base data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Tout voir
          </TabsTrigger>
          <TabsTrigger value="ready" className="flex-1 rounded-lg text-base data-[state=active]:bg-green-100 data-[state=active]:text-green-800">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Prêts à servir ({activeOrders.filter(o => o.status === 'ready').length})
          </TabsTrigger>
          <TabsTrigger value="kitchen" className="flex-1 rounded-lg text-base">
            <ChefHat className="w-4 h-4 mr-2" />
            En cuisine
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="flex-1 mt-4">
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
              {activeOrders.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-lg">Tout est calme. Aucune commande active.</p>
                </div>
              ) : (
                activeOrders.map((order) => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    onServe={() => handleServeOrder(order.id)}
                    statusColor={getStatusColor(order.status)}
                    statusLabel={getStatusLabel(order.status)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="ready" className="flex-1 mt-4">
           <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
              {activeOrders.filter(o => o.status === 'ready').map((order) => (
                 <OrderCard 
                    key={order.id} 
                    order={order} 
                    onServe={() => handleServeOrder(order.id)}
                    statusColor={getStatusColor(order.status)}
                    statusLabel={getStatusLabel(order.status)}
                    isPriority
                  />
              ))}
              {activeOrders.filter(o => o.status === 'ready').length === 0 && (
                 <div className="col-span-full flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <p>Aucun plat prêt à servir pour le moment.</p>
                </div>
              )}
            </div>
           </ScrollArea>
        </TabsContent>
        
        <TabsContent value="kitchen" className="flex-1 mt-4">
           <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
              {activeOrders.filter(o => ['pending', 'preparing'].includes(o.status)).map((order) => (
                 <OrderCard 
                    key={order.id} 
                    order={order} 
                    onServe={() => handleServeOrder(order.id)}
                    statusColor={getStatusColor(order.status)}
                    statusLabel={getStatusLabel(order.status)}
                  />
              ))}
            </div>
           </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OrderCard({ order, onServe, statusColor, statusLabel, isPriority = false }: any) {
  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 border-2",
      isPriority ? "border-green-500 shadow-lg scale-[1.02]" : "border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
    )}>
      <CardHeader className={cn(
        "px-4 py-3 flex flex-row items-center justify-between",
        order.status === 'ready' ? "bg-green-50 dark:bg-green-900/20" : "bg-zinc-50 dark:bg-zinc-900"
      )}>
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">{order.table}</span>
          <span className="text-xs text-muted-foreground px-2 py-0.5 bg-white dark:bg-black rounded-full border">
            #{order.id.split('-')[1]}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Clock className="w-3 h-3" />
          <span>{order.time}</span>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-4">
          <Badge variant="outline" className={cn("w-full justify-center py-1 text-sm font-bold uppercase tracking-wider", statusColor)}>
            {statusLabel}
          </Badge>
        </div>
        
        {/* Items with Images */}
        <div className="space-y-3 mb-6">
          {order.items.map((item: any, idx: number) => (
            <div key={idx} className="flex gap-3 items-center bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-2 border border-zinc-100 dark:border-zinc-800">
              {/* Image */}
              {item.image && (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-200 dark:bg-zinc-800">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              {/* Item Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-semibold text-sm truncate",
                      order.status === 'ready' && "text-green-700 dark:text-green-400"
                    )}>
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.price.toLocaleString()} FCFA
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-block px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                      x{item.qty}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <span className="text-sm font-medium text-muted-foreground">Total</span>
          <span className="text-xl font-bold">{order.total.toLocaleString()} FCFA</span>
        </div>

        {/* Action Button */}
        {order.status === 'ready' ? (
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 text-lg animate-pulse shadow-green-200 shadow-lg"
            onClick={onServe}
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            SERVIR MAINTENANT
          </Button>
        ) : (
          <div className="flex items-center justify-center text-muted-foreground text-sm gap-2 py-2 opacity-50">
            <ChefHat className="w-4 h-4" />
            <span>En préparation...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
