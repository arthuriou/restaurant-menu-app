"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth";
import { useOrderStore } from "@/stores/orders";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { 
  Clock, CheckCircle2, ChefHat, Utensils, LogOut, 
  ArrowRight, BellRing, AlertTriangle, ShoppingBag, UtensilsCrossed
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ModeToggle } from "@/components/mode-toggle";
import { UserAvatar } from "@/components/user-avatar";
import { Timestamp } from "firebase/firestore";

const columns = {
  pending: { title: "À Faire", icon: BellRing, color: "text-orange-600", bg: "bg-orange-50/50 dark:bg-orange-950/10", border: "border-orange-100 dark:border-orange-900/20" },
  preparing: { title: "En Préparation", icon: ChefHat, color: "text-blue-600", bg: "bg-blue-50/50 dark:bg-blue-950/10", border: "border-blue-100 dark:border-blue-900/20" },
  ready: { title: "Prêt à Servir", icon: Utensils, color: "text-green-600", bg: "bg-green-50/50 dark:bg-green-950/10", border: "border-green-100 dark:border-green-900/20" },
};

export default function KitchenPage() {
  const { user, logout } = useAuthStore();
  const { orders, updateOrderStatus } = useOrderStore();
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    // Update timer every 30 seconds
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => {
      cancelAnimationFrame(animation);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;
    const { source, destination } = result;

    if (source.droppableId !== destination.droppableId) {
      await updateOrderStatus(result.draggableId, destination.droppableId);
      toast.success(`Commande passée en ${columns[destination.droppableId as keyof typeof columns].title}`);
    }
  };

  const advanceOrder = async (orderId: string, currentStatus: string) => {
    let nextStatus = '';
    if (currentStatus === 'pending') nextStatus = 'preparing';
    else if (currentStatus === 'preparing') nextStatus = 'ready';

    if (nextStatus) {
      await updateOrderStatus(orderId, nextStatus as any);
      toast.success("Statut mis à jour");
    }
  };

  const getElapsedTime = (createdAt: Timestamp | any) => {
    if (!createdAt) return 0;
    // Handle both Firestore Timestamp and serialized object
    const millis = createdAt.seconds ? createdAt.seconds * 1000 : (createdAt._seconds ? createdAt._seconds * 1000 : Date.now());
    const diff = now - millis;
    return Math.floor(diff / 60000); // Minutes
  };

  const getTimerColor = (minutes: number) => {
    if (minutes < 5) return "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400";
    if (minutes < 15) return "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400";
    return "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 animate-pulse";
  };

  if (!enabled) return null;

  return (
    <div className="h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} size="md" />
          <div>
            <h1 className="font-bold text-lg leading-none">Cuisine</h1>
            <p className="text-xs text-muted-foreground mt-1">{user?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </header>

      <div className="flex-1 p-4 md:p-6 overflow-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {Object.entries(columns).map(([columnId, col]) => (
              <div 
                key={columnId} 
                className={`flex flex-col rounded-2xl border ${col.border} ${col.bg} h-full overflow-hidden shadow-sm`}
              >
                <div className="p-3 md:p-4 flex items-center justify-between bg-white/50 dark:bg-black/20 backdrop-blur-sm border-b border-zinc-200/50 dark:border-zinc-800/50 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl bg-white dark:bg-zinc-900 shadow-sm ${col.color}`}>
                      <col.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg text-zinc-700 dark:text-zinc-300">
                      {col.title}
                    </h3>
                  </div>
                  <Badge variant="secondary" className="bg-white dark:bg-zinc-900 font-mono font-bold shadow-sm text-base px-3 py-1">
                    {orders[columnId as keyof typeof orders]?.length || 0}
                  </Badge>
                </div>
                
                <Droppable droppableId={columnId}>
                  {(provided, snapshot) => (
                    <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide">
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`p-3 md:p-4 space-y-4 min-h-[200px] transition-colors duration-200 ${
                          snapshot.isDraggingOver ? "bg-black/5 dark:bg-white/5" : ""
                        }`}
                      >
                        {orders[columnId as keyof typeof orders]?.map((order, index) => {
                          const elapsed = getElapsedTime(order.createdAt);
                          const timerColor = getTimerColor(elapsed);

                          return (
                            <Draggable key={order.id} draggableId={order.id} index={index}>
                              {(provided, snapshot) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`
                                    group rounded-xl border-zinc-200 dark:border-zinc-800 
                                    shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-zinc-900
                                    ${snapshot.isDragging ? "shadow-2xl rotate-2 scale-105 z-50 ring-2 ring-primary/20" : ""}
                                  `}
                                >
                                    <CardContent className="p-0">
                                      <div className="flex justify-between items-center p-3 md:p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                                        <div className="flex flex-col gap-1">
                                          <div className="flex items-center gap-2">
                                            <Badge 
                                              variant="outline" 
                                              className={cn(
                                                "text-sm md:text-base font-black px-2.5 md:px-3 py-1 rounded-lg shadow-sm uppercase",
                                                (order.table === 'Emporter' || !order.table?.toLowerCase().startsWith('table')) ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-900" : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700"
                                              )}
                                            >
                                              {(order.table === 'Emporter' || !order.table?.toLowerCase().startsWith('table')) ? <ShoppingBag className="w-4 h-4 mr-2" /> : <UtensilsCrossed className="w-4 h-4 mr-2" />}
                                              {order.table}
                                            </Badge>
                                          </div>
                                          <span className="text-[10px] md:text-xs font-mono text-muted-foreground uppercase ml-1">#{order.id.slice(0, 4)}</span>
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg font-bold text-xs md:text-sm ${timerColor}`}>
                                          <Clock className="w-3 h-3 md:w-4 md:h-4" />
                                          <span>{elapsed} min</span>
                                        </div>
                                      </div>
                                      
                                      <div className="p-3 md:p-4 space-y-3 md:space-y-4">
                                        {order.items && order.items.map((item: any, idx: number) => (
                                          <div key={idx} className="flex gap-2 md:gap-4">
                                            {item.imageUrl && (
                                              <div className="shrink-0">
                                                <img 
                                                  src={item.imageUrl} 
                                                  alt={item.name} 
                                                  className="w-14 h-14 md:w-20 md:h-20 rounded-lg object-cover bg-zinc-100 dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-zinc-800" 
                                                />
                                              </div>
                                            )}
                                            
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                              <div className="flex items-start justify-between gap-2">
                                                <span className="font-bold text-base md:text-xl leading-tight text-zinc-900 dark:text-zinc-100">
                                                  {item.name}
                                                </span>
                                                <Badge className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs md:text-sm h-6 md:h-7 min-w-[1.75rem] md:min-w-[2rem] flex items-center justify-center shrink-0">
                                                  {item.qty}
                                                </Badge>
                                              </div>

                                              {item.options && Object.values(item.options).some(Boolean) && (
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                  {Object.entries(item.options).map(([key, value]) => {
                                                    if (key === 'note') return null;
                                                    if (!value) return null;
                                                    
                                                    return (
                                                      <span 
                                                        key={key} 
                                                        className="inline-flex items-center px-2 py-1 rounded-md text-xs md:text-sm font-semibold bg-primary/15 text-primary dark:bg-primary/25 border-2 border-primary/40"
                                                      >
                                                        {typeof value === 'boolean' ? key : String(value)}
                                                      </span>
                                                    );
                                                  })}
                                                </div>
                                              )}

                                              {item.note && (
                                                <div className="mt-2 flex items-start gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-medium leading-snug">
                                                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                                  <span>{item.note}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>

                                      <div className="p-3 md:p-4 pt-0">
                                        {columnId === 'ready' ? (
                                          <div className="w-full h-12 md:h-14 flex items-center justify-center gap-2 rounded-xl bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400 font-bold">
                                            <CheckCircle2 className="w-5 h-5" />
                                            En attente du serveur
                                          </div>
                                        ) : (
                                          <Button 
                                            className="w-full font-bold h-12 md:h-14 text-base md:text-lg shadow-sm rounded-xl" 
                                            size="lg"
                                            variant={columnId === 'pending' ? 'default' : 'secondary'}
                                            onClick={() => advanceOrder(order.id, columnId)}
                                          >
                                            {columnId === 'pending' && (
                                              <>
                                                Lancer la préparation
                                                <ArrowRight className="w-5 h-5 ml-2" />
                                              </>
                                            )}
                                            {columnId === 'preparing' && (
                                              <>
                                                <CheckCircle2 className="w-5 h-5 mr-2" />
                                                Marquer comme Prêt
                                              </>
                                            )}
                                          </Button>
                                        )}
                                      </div>
                                    </CardContent>
                                </Card>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
