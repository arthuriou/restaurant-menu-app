"use client";

import { useEffect, useState, useRef } from "react";
import { useOrderStore } from "@/stores/orders";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  ShoppingBag,
  BellRing
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ServerDashboard() {
  const { orders, updateOrderStatus } = useOrderStore();
  const [activeTab, setActiveTab] = useState("all");
  const prevReadyOrdersRef = useRef<Set<string>>(new Set());

  // Flatten and separate orders
  const allOrders = Object.values(orders).flat();
  const activeOrders = allOrders.filter(o => o.status !== 'served' && o.status !== 'paid');

  // Notification Logic (Kept from previous version)
  useEffect(() => {
    const currentReadyOrders = new Set(
      allOrders.filter(o => o.status === 'ready').map(o => o.id)
    );
    currentReadyOrders.forEach(orderId => {
      if (!prevReadyOrdersRef.current.has(orderId)) {
        const order = allOrders.find(o => o.id === orderId);
        if (order) {
          const audio = new Audio('/sounds/notification.mp3');
          audio.play().catch(e => {});
          toast.success(`COMMANDE PRÊTE ! - ${order.table}`, {
            duration: 8000,
            icon: <BellRing className="w-6 h-6 text-green-600 animate-bounce" />
          });
        }
      }
    });
    prevReadyOrdersRef.current = currentReadyOrders;
  }, [allOrders]);

  const handleServeOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'served');
    toast.success("Commande servie !");
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col bg-zinc-50/50 dark:bg-black p-2">
      <div className="flex items-center justify-between mb-8 px-2">
        <h1 className="text-2xl font-bold tracking-tight uppercase">COMMANDES EN COURS</h1>
        <div className="flex gap-2">
           <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
           <span className="text-xs font-medium text-muted-foreground">{activeOrders.length} actives</span>
        </div>
      </div>

      <Tabs defaultValue="all" className="flex-1 flex flex-col" onValueChange={setActiveTab}>
        {/* iOS Segmented Control Style Tabs */}
        <div className="px-1 mb-6">
          <TabsList className="bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-full h-12 w-full max-w-md mx-auto grid grid-cols-3">
            <TabsTrigger value="all" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">Tout</TabsTrigger>
            <TabsTrigger value="ready" className="rounded-full data-[state=active]:bg-green-500 data-[state=active]:text-white transition-all duration-300">Prêts</TabsTrigger>
            <TabsTrigger value="kitchen" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300">Cuisine</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="flex-1">
          <ScrollArea className="h-[calc(100vh-10rem)] pr-4">
             <div className="space-y-4 pb-20 max-w-2xl mx-auto">
              {activeOrders.length === 0 ? (
                <EmptyState />
              ) : (
                activeOrders.map((order) => (
                  <ObypayCard key={order.id} order={order} onServe={() => handleServeOrder(order.id)} />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="ready" className="flex-1">
           <ScrollArea className="h-[calc(100vh-10rem)] pr-4">
            <div className="space-y-4 pb-20 max-w-2xl mx-auto">
              {activeOrders.filter(o => o.status === 'ready').map((order) => (
                 <ObypayCard key={order.id} order={order} onServe={() => handleServeOrder(order.id)} />
              ))}
            </div>
           </ScrollArea>
        </TabsContent>

        <TabsContent value="kitchen" className="flex-1">
           <ScrollArea className="h-[calc(100vh-10rem)] pr-4">
            <div className="space-y-4 pb-20 max-w-2xl mx-auto">
              {activeOrders.filter(o => ['pending', 'preparing'].includes(o.status)).map((order) => (
                 <ObypayCard key={order.id} order={order} onServe={() => handleServeOrder(order.id)} />
              ))}
            </div>
           </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 opacity-50">
      <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-4">
        <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
      </div>
      <p>Aucune commande en cours</p>
    </div>
  );
}

function ObypayCard({ order, onServe }: { order: any, onServe: () => void }) {
  const isReady = order.status === 'ready';
  
  return (
    <div 
      onClick={isReady ? onServe : undefined}
      className={cn(
        "group relative bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-sm border border-zinc-100 dark:border-zinc-800 transition-all duration-300",
        isReady ? "cursor-pointer hover:shadow-md hover:border-green-200 dark:hover:border-green-900/50 ring-2 ring-transparent hover:ring-green-500/20" : "opacity-90"
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-black text-2xl tracking-tight">
          COMMANDE N°{order.id.split('-')[1]}
        </h3>
        
        <Badge className={cn(
          "px-4 py-1.5 rounded-full text-xs font-bold shadow-none",
          isReady 
            ? "bg-[#D4E8D4] text-[#4A7A4A] dark:bg-green-900/30 dark:text-green-300" // Pastel Green
            : "bg-[#FFE8CC] text-[#995500] dark:bg-orange-900/30 dark:text-orange-300" // Pastel Orange
        )}>
          <div className={cn(
            "w-2 h-2 rounded-full mr-2",
            isReady ? "bg-[#4A7A4A] dark:bg-green-400" : "bg-[#EA8A2F] dark:bg-orange-400"
          )}></div>
          {isReady ? "Prête" : "En cours"}
        </Badge>
      </div>

      <div className="space-y-2 text-muted-foreground mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4" />
          <span>Aujourd'hui à {order.time}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <ShoppingBag className="w-4 h-4" />
          <span>{order.items.length} items • {order.table}</span>
        </div>
      </div>
      
      {/* Items Preview (Optional - collapsed by default in reference but useful) */}
      <div className="pl-6 border-l-2 border-zinc-100 dark:border-zinc-800 mt-4 space-y-1">
        {order.items.map((item: any, idx: number) => (
           <p key={idx} className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1">
             {item.qty}x {item.name}
           </p>
        ))}
      </div>
    </div>
  );
}
