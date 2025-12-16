"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useOrderStore } from "@/stores/orders";
import { useMenuStore } from "@/stores/menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { OrderBill } from "@/components/order/OrderBill";
import { 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  ShoppingBag,
  BellRing,
  UtensilsCrossed,
  AlertCircle,
  Receipt
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ServerDashboard() {
  const { orders, updateOrderStatus } = useOrderStore();
  const { items: menuItems, loadMenu } = useMenuStore();
  const [viewingOrder, setViewingOrder] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    if (menuItems.length === 0) {
      loadMenu();
    }
  }, [menuItems.length, loadMenu]);

  // Update current time every minute for elapsed time display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const [activeTab, setActiveTab] = useState("all");
  const prevReadyOrdersRef = useRef<Set<string>>(new Set());

  // Create a stable key that changes when any order status changes
  const ordersKey = useMemo(() => {
    return Object.entries(orders)
      .map(([status, list]) => `${status}:${list.length}`)
      .join('|');
  }, [orders]);

  // Flatten and separate orders - using ordersKey to ensure recalculation
  const allOrders = useMemo(() => {
    const flattened = Object.values(orders).flat();
    console.log('[ServerDashboard] All orders:', flattened.length, 'orders');
    console.log('[ServerDashboard] Orders by status:', orders);
    console.log('[ServerDashboard] ordersKey:', ordersKey);
    return flattened;
  }, [orders, ordersKey]);

  const activeOrders = useMemo(
    () => allOrders.filter(o => o.status !== 'served' && o.status !== 'paid'),
    [allOrders]
  );

  // Notification Logic
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

  // Helper function to calculate elapsed time display
  const getElapsedTimeText = (createdAt: any) => {
    if (!createdAt) return 'Maintenant';
    
    const orderTime = createdAt.toDate ? createdAt.toDate().getTime() : 
                      (createdAt.seconds ? createdAt.seconds * 1000 : 
                      (createdAt._seconds ? createdAt._seconds * 1000 : Date.now()));
    
    const diff = currentTime - orderTime;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    return 'À l\'instant';
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
              {allOrders.length === 0 ? (
                <EmptyState />
              ) : (
                allOrders.map((order) => {
                  try {
                    return (
                      <ObypayCard 
                        key={order.id} 
                        order={order} 
                        onServe={() => handleServeOrder(order.id)} 
                        onViewBill={() => setViewingOrder(order)}
                        getElapsedTimeText={getElapsedTimeText}
                      />
                    );
                  } catch (error) {
                    console.error('[ObypayCard] Error rendering order:', order.id, error);
                    return (
                      <div key={order.id} className="p-4 bg-red-100 border border-red-500 rounded">
                        Error rendering order {order.id}: {String(error)}
                      </div>
                    );
                  }
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="ready" className="flex-1">
           <ScrollArea className="h-[calc(100vh-10rem)] pr-4">
            <div className="space-y-4 pb-20 max-w-2xl mx-auto">
              {activeOrders.filter(o => o.status === 'ready').map((order) => (
                 <ObypayCard 
                   key={order.id} 
                   order={order} 
                   onServe={() => handleServeOrder(order.id)} 
                   onViewBill={() => setViewingOrder(order)}
                   getElapsedTimeText={getElapsedTimeText}
                 />
              ))}
            </div>
           </ScrollArea>
        </TabsContent>

        <TabsContent value="kitchen" className="flex-1">
           <ScrollArea className="h-[calc(100vh-10rem)] pr-4">
            <div className="space-y-4 pb-20 max-w-2xl mx-auto">
              {activeOrders.filter(o => ['pending', 'preparing'].includes(o.status)).map((order) => (
                 <ObypayCard 
                   key={order.id} 
                   order={order} 
                   onServe={() => handleServeOrder(order.id)} 
                   onViewBill={() => setViewingOrder(order)}
                   getElapsedTimeText={getElapsedTimeText}
                 />
              ))}
            </div>
           </ScrollArea>
        </TabsContent>
      </Tabs>
      
      {/* Bill View Modal */}
      <Dialog open={!!viewingOrder} onOpenChange={(open) => !open && setViewingOrder(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none sm:rounded-[2rem]">
          {viewingOrder && (
            <div className="relative">
              <OrderBill order={viewingOrder} showActions={false} />
              
              {/* Print Button Overlay */}
              <div className="absolute top-4 right-4 z-50 print:hidden">
                <button 
                  onClick={() => window.print()}
                  className="bg-zinc-900 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
                >
                  <Receipt className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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

function ObypayCard({ 
  order, 
  onServe, 
  onViewBill,
  getElapsedTimeText
}: { 
  order: any;
  onServe: () => void;
  onViewBill: () => void;
  getElapsedTimeText: (createdAt: any) => string;
}) {
  // Resolve table name robustly (support order.tableId and order.table)
  const orderTable = order.tableId || order.table || "";
  
  // Determine if it's takeaway
  // Only detect as takeaway if explicitly labeled 'Emporter' (case insensitive) or type is takeaway
  const isTakeaway = orderTable.toLowerCase().includes('emporter') || order.type === 'takeaway';
  const isReady = order.status === 'ready';
  const { items: allMenuItems } = useMenuStore();

  const getOptionDetails = (orderItem: any, optionName: string) => {
    const menuItem = allMenuItems.find(m => m.id === orderItem.menuId);
    return menuItem?.options?.find(opt => opt.name === optionName);
  };

  // Get status display info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'En attente',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
          textColor: 'text-yellow-700 dark:text-yellow-300',
          dotColor: 'bg-yellow-500'
        };
      case 'preparing':
        return {
          label: 'En préparation',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          textColor: 'text-blue-700 dark:text-blue-300',
          dotColor: 'bg-blue-500'
        };
      case 'ready':
        return {
          label: 'Prête (Servir)',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          textColor: 'text-green-700 dark:text-green-300',
          dotColor: 'bg-green-500'
        };
      case 'served':
        return {
          label: 'Servie',
          bgColor: 'bg-gray-100 dark:bg-gray-900/30',
          textColor: 'text-gray-700 dark:text-gray-300',
          dotColor: 'bg-gray-500'
        };
      case 'paid':
        return {
          label: 'Payée',
          bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
          textColor: 'text-emerald-700 dark:text-emerald-300',
          dotColor: 'bg-emerald-500'
        };
      case 'cancelled':
        return {
          label: 'Annulée',
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          textColor: 'text-red-700 dark:text-red-300',
          dotColor: 'bg-red-500'
        };
      default:
        return {
          label: status,
          bgColor: 'bg-zinc-100 dark:bg-zinc-900/30',
          textColor: 'text-zinc-700 dark:text-zinc-300',
          dotColor: 'bg-zinc-500'
        };
    }
  };

  const statusInfo = getStatusInfo(order.status);

  return (
    <div 
      className={cn(
        "group relative bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-sm border border-zinc-100 dark:border-zinc-800 transition-all duration-300",
        isReady ? "border-green-200 dark:border-green-900/50 ring-2 ring-transparent ring-green-500/20" : "opacity-90"
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
           <div className="flex items-center gap-3 mb-2">
             {/* Main Table Badge - Much Larger */}
             <Badge 
               className={cn(
                 "text-sm md:text-base font-black px-3 py-1.5 rounded-xl shadow-sm uppercase tracking-wide",
                 isTakeaway 
                   ? "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-900" 
                   : "bg-zinc-900 text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200"
               )}
             >
               {isTakeaway ? <ShoppingBag className="w-4 h-4 mr-2" /> : <UtensilsCrossed className="w-4 h-4 mr-2" />}
               {orderTable || "Sans Table"}
             </Badge>
             
             {/* Order ID Tag */}
             <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
               #{order.id.slice(0, 4)}
             </span>
          </div>
           <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 pl-1">
            <Clock className="w-3.5 h-3.5" />
            {getElapsedTimeText(order.createdAt)}
           </p>
        </div>
        
        <div className="flex items-center gap-2">
            {/* User requested to remove bill/details options */}
            {/* <button 
              onClick={(e) => {
                e.stopPropagation();
                onViewBill();
              }}
              className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              title="Voir la note"
            >
              <Receipt className="w-4 h-4" />
            </button> */}
            
            <Badge 
              onClick={isReady ? onServe : undefined}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold shadow-none transition-transform",
                statusInfo.bgColor,
                statusInfo.textColor,
                isReady ? "cursor-pointer active:scale-95 hover:brightness-95" : "cursor-default"
              )}
            >
              <div className={cn("w-2 h-2 rounded-full mr-2", statusInfo.dotColor)}></div>
              {statusInfo.label}
            </Badge>
        </div>
      </div>

      <div className="space-y-4 mb-4">
        {order.items.map((item: any, idx: number) => (
           <div key={idx} className="flex items-start gap-3">
             {/* Image Thumbnail */}
             <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0 border border-zinc-200 dark:border-zinc-700">
               {item.imageUrl ? (
                 <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-zinc-400">
                   <UtensilsCrossed className="w-5 h-5" />
                 </div>
               )}
             </div>
             
             <div className="flex-1 min-w-0">
               <div className="flex justify-between items-start">
                 <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                   <span className="text-primary mr-1">{item.qty}x</span> {item.name}
                 </p>
               </div>
               
               {/* Options & Notes */}
               {(item.note || (item.options && Object.keys(item.options).length > 0)) && (
                 <div className="mt-2 space-y-2 pl-1">
                   {item.options && Object.entries(item.options)
                     .filter(([key]) => key !== 'note') 
                     .map(([key, value]) => {
                       const optionDetails = getOptionDetails(item, key);
                       
                       return (
                         <div key={key} className="flex items-start gap-3 text-xs text-muted-foreground bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-lg border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800/50 transition-colors">
                           {/* Option Image if available */}
                           {optionDetails?.imageUrl && (
                              <div className="w-10 h-10 rounded overflow-hidden bg-white dark:bg-zinc-900 flex-shrink-0 border border-zinc-200 dark:border-zinc-800">
                                <img src={optionDetails.imageUrl} alt={key} className="w-full h-full object-cover" />
                              </div>
                           )}
                           <div className="flex-1 min-w-0 pt-0.5">
                             <div className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                               {value === true || value === 'true' ? key : <>{key}: <span className="font-normal text-muted-foreground">{String(value)}</span></>}
                             </div>
                             {optionDetails?.description && (
                                <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{optionDetails.description}</p>
                             )}
                           </div>
                         </div>
                       );
                   })}
                   
                   {/* Dedicated Note Alert */}
                   {item.note && (
                     <div className="flex items-start gap-1 text-orange-600 dark:text-orange-400 font-medium bg-orange-50 dark:bg-orange-900/20 px-2 py-1.5 rounded-md text-xs mt-1.5 border border-orange-100 dark:border-orange-900/30">
                       <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                       <span className="italic leading-tight">"{item.note}"</span>
                     </div>
                   )}
                 </div>
               )}
             </div>
           </div>
        ))}
      </div>
      
      <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        {/* User requested to remove Details button */}
        {/* <Button 
          variant="outline" 
          className="flex-1 rounded-xl h-10 text-xs font-bold"
          onClick={onViewBill}
        >
          <Receipt className="w-3.5 h-3.5 mr-2" />
          Détails
        </Button> */}
        {isReady && (
          <Button 
            className="flex-1 rounded-xl h-10 text-xs font-bold bg-green-500 hover:bg-green-600 text-white"
            onClick={onServe}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
            Servir
          </Button>
        )}
      </div>
    </div>
  );
}
