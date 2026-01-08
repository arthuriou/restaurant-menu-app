"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useOrderStore } from "@/stores/orders";
import { useMenuStore } from "@/stores/menu";
import { useRestaurantStore } from "@/stores/restaurant";
import { generateInvoiceFromOrder } from "@/lib/invoice-service";
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
  const { invoiceSettings } = useRestaurantStore();
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
    () => allOrders.filter(o => o.status !== 'paid'),
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
          // Use tableId or table (fallback)
          const tableName = order.tableId || order.table || "Client";
          toast.success(`COMMANDE PRÊTE ! - ${tableName}`, {
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

  const handlePayOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'paid');
    toast.success("Commande encaissée !");
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
    <div className="h-[calc(100vh-2rem)] flex flex-col bg-background p-2 transition-colors duration-200">
      <div className="flex items-center justify-between mb-8 px-2">
        <h1 className="text-2xl font-bold tracking-tight uppercase text-foreground">COMMANDES EN COURS</h1>
        <div className="flex gap-2">
           <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
           <span className="text-xs font-medium text-muted-foreground">{activeOrders.length} actives</span>
        </div>
      </div>

      <Tabs defaultValue="all" className="flex-1 flex flex-col" onValueChange={setActiveTab}>
        {/* iOS Segmented Control Style Tabs */}
        <div className="px-1 mb-6">
          <TabsList className="bg-secondary p-1 rounded-full h-12 w-full max-w-xl mx-auto grid grid-cols-4 transition-colors duration-200">
            <TabsTrigger value="all" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">Tout</TabsTrigger>
            <TabsTrigger value="validate" className="rounded-full data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all duration-200">À Valider</TabsTrigger>
            <TabsTrigger value="ready" className="rounded-full data-[state=active]:bg-green-500 data-[state=active]:text-white transition-all duration-200">Prêts</TabsTrigger>
            <TabsTrigger value="kitchen" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200">Cuisine</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="validate" className="flex-1">
          <ScrollArea className="h-[calc(100vh-10rem)] pr-4">
             <div className="space-y-4 pb-20 max-w-2xl mx-auto">
              {allOrders.filter(o => o.status === 'awaiting-payment').length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                  <CheckCircle2 className="w-12 h-12 mb-4" />
                  <p>Aucune commande à valider</p>
                </div>
              ) : (
                allOrders.filter(o => o.status === 'awaiting-payment').map((order) => (
                   <ObypayCard 
                     key={order.id} 
                     order={order} 
                     onServe={() => handleServeOrder(order.id)}
                     onPay={() => handlePayOrder(order.id)}
                     onViewBill={() => setViewingOrder(order)}
                     getElapsedTimeText={getElapsedTimeText}
                     onValidate={async () => {
                        try {
                          // 1. Create Invoice
                          const restaurantInfo = {
                              name: invoiceSettings.companyName,
                              address: invoiceSettings.companyAddress,
                              phone: invoiceSettings.companyPhone,
                              email: invoiceSettings.companyEmail,
                              taxId: invoiceSettings.taxId,
                              footerMessage: invoiceSettings.footerMessage
                          };

                          const invoice = generateInvoiceFromOrder(
                              { ...order, tableId: order.tableId || "Unknown" } as any, 
                              restaurantInfo, 
                              'cash', 
                              invoiceSettings.taxRate
                          );
                          
                          // 2. Save Invoice
                          const { doc, setDoc } = await import("firebase/firestore");
                          const { db } = await import("@/lib/firebase");
                          if (db) {
                            await setDoc(doc(db, "invoices", invoice.id), invoice);
                          }
                          
                          // 3. Update Order Status
                          await updateOrderStatus(order.id, 'pending'); 
                          
                          // 4. Print using the INVOICE ID
                          window.open(`/print/invoice/${invoice.id}`, '_blank');
                          
                          toast.success("Commande validée et facturée !");
                        } catch (e) {
                          console.error("Error validating:", e);
                          toast.error("Erreur lors de la validation");
                        }
                     }}
                   />
                ))
              )}
             </div>
          </ScrollArea>
        </TabsContent>

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
                   onPay={() => handlePayOrder(order.id)}
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
                   onPay={() => handlePayOrder(order.id)}
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
                   onPay={() => handlePayOrder(order.id)}
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
                  className="bg-foreground text-background p-3 rounded-full shadow-lg hover:opacity-80 transition-opacity"
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
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4 transition-colors duration-200">
        <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-foreground">Aucune commande en cours</p>
    </div>
  );
}

function ObypayCard({ 
  order, 
  onServe, 
  onPay,
  onViewBill,
  getElapsedTimeText,
  onValidate
}: { 
  order: any;
  onServe: () => void;
  onPay?: () => void;
  onViewBill: () => void;
  getElapsedTimeText: (createdAt: any) => string;
  onValidate?: () => void;
}) {
  // Resolve table name robustly (support order.tableId and order.table)
  const orderTable = order.tableId || order.table || "";
  
  // Determine if it's takeaway
  // Only detect as takeaway if explicitly labeled 'Emporter' (case insensitive) or type is takeaway
  const isTakeaway = orderTable.toLowerCase().includes('emporter') || order.type === 'takeaway';
  const isReady = order.status === 'ready';
  const isServed = order.status === 'served';
  const isAwaitingPayment = order.status === 'awaiting-payment';
  const { items: allMenuItems } = useMenuStore();

  const getOptionDetails = (orderItem: any, optionName: string) => {
    const menuItem = allMenuItems.find(m => m.id === orderItem.menuId);
    return menuItem?.options?.find(opt => opt.name === optionName);
  };

  // Get status display info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'awaiting-payment':
        return {
          label: 'À Valider',
          bgColor: 'bg-orange-100 dark:bg-orange-900/30',
          textColor: 'text-orange-700 dark:text-orange-300',
          dotColor: 'bg-orange-500'
        };
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
          bgColor: 'bg-secondary',
          textColor: 'text-muted-foreground',
          dotColor: 'bg-muted-foreground'
        };
    }
  };

  const statusInfo = getStatusInfo(order.status);

  return (
    <div 
      className={cn(
        "group relative bg-card rounded-[2rem] p-6 shadow-sm border border-border transition-colors duration-200",
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
                   : "bg-foreground text-background hover:bg-foreground/90 transition-colors duration-200"
               )}
             >
               {isTakeaway ? <ShoppingBag className="w-4 h-4 mr-2" /> : <UtensilsCrossed className="w-4 h-4 mr-2" />}
               {orderTable || "Sans Table"}
               {order.customerName && <span className="ml-2 opacity-80 font-normal">- {order.customerName}</span>}
             </Badge>
             
             {/* Order ID Tag */}
             <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider bg-secondary px-2 py-1 rounded-md transition-colors duration-200">
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

      {/* Validation Button for Awaiting Payment */}
      {isAwaitingPayment && onValidate && (
        <div className="mb-4">
          <Button 
            onClick={onValidate}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-6 rounded-xl shadow-lg shadow-orange-500/20"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Valider & Encaisser ({order.total?.toLocaleString()} FCFA)
          </Button>
        </div>
      )}

      <div className="space-y-4 mb-4">
        {order.items.map((item: any, idx: number) => (
           <div key={idx} className="flex items-start gap-3">
             {/* Image Thumbnail */}
             <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden flex-shrink-0 border border-border transition-colors duration-200">
               {item.imageUrl ? (
                 <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                   <UtensilsCrossed className="w-5 h-5" />
                 </div>
               )}
             </div>
             
             <div className="flex-1 min-w-0">
               <div className="flex justify-between items-start">
                 <p className="text-sm font-bold text-foreground truncate transition-colors duration-200">
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
                         <div key={key} className="flex items-start gap-3 text-xs text-muted-foreground bg-secondary/50 p-2 rounded-lg border border-transparent hover:border-border transition-colors duration-200">
                           {/* Option Image if available */}
                           {optionDetails?.imageUrl && (
                              <div className="w-10 h-10 rounded overflow-hidden bg-card flex-shrink-0 border border-border transition-colors duration-200">
                                <img src={optionDetails.imageUrl} alt={key} className="w-full h-full object-cover" />
                              </div>
                           )}
                           <div className="flex-1 min-w-0 pt-0.5">
                             <div className="text-xs font-medium text-foreground transition-colors duration-200">
                               {value === true || value === 'true' ? key : <>{key}: <span className="font-normal text-muted-foreground">{String(value)}</span></>}
                             </div>
                             {optionDetails?.description && (
                                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{optionDetails.description}</p>
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
      
      <div className="flex gap-2 mt-4 pt-4 border-t border-border transition-colors duration-200">
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
        {isServed && onPay && (
          <Button 
            className="flex-1 rounded-xl h-10 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={onPay}
          >
            <Receipt className="w-3.5 h-3.5 mr-2" />
            Encaisser
          </Button>
        )}
      </div>
    </div>
  );
}
