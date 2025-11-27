"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth";
import { useOrderStore } from "@/stores/orders";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { 
  Clock, CheckCircle2, ChefHat, Utensils, LogOut, 
  ArrowRight, BellRing
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ModeToggle } from "@/components/mode-toggle";
import { UserAvatar } from "@/components/user-avatar";

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

  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => cancelAnimationFrame(animation);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };


  const onDragEnd = async (result: any) => {
    if (!result.destination) return;
    const { source, destination } = result;

    // Only update if status changed (moved to different column)
    if (source.droppableId !== destination.droppableId) {
      await updateOrderStatus(result.draggableId, destination.droppableId);
      toast.success(`Commande passée en ${columns[destination.droppableId as keyof typeof columns].title}`);
    }
  };

  const advanceOrder = async (orderId: string, currentStatus: string) => {
    let nextStatus = '';
    if (currentStatus === 'pending') nextStatus = 'preparing';
    else if (currentStatus === 'preparing') nextStatus = 'ready';
    else if (currentStatus === 'ready') nextStatus = 'served';

    if (nextStatus) {
      await updateOrderStatus(orderId, nextStatus as any);
      toast.success("Statut mis à jour");
    }
  };

  if (!enabled) return null;

  return (
    <div className="h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}

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

      {/* Kanban Board */}
      <div className="flex-1 p-6 overflow-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="h-full grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(columns).map(([columnId, col]) => (
              <div 
                key={columnId} 
                className={`flex flex-col rounded-2xl border ${col.border} ${col.bg} h-full overflow-hidden`}
              >
                {/* Column Header */}
                <div className="p-4 flex items-center justify-between bg-white/50 dark:bg-black/20 backdrop-blur-sm border-b border-zinc-200/50 dark:border-zinc-800/50">
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
                
                {/* Droppable Area */}
                <Droppable droppableId={columnId}>
                  {(provided, snapshot) => (
                    <div className="flex-1 overflow-y-auto min-h-0">
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`p-4 space-y-4 min-h-[200px] transition-colors duration-200 ${
                          snapshot.isDraggingOver ? "bg-black/5 dark:bg-white/5" : ""
                        }`}
                      >
                        {orders[columnId as keyof typeof orders]?.map((order, index) => (
                          <Draggable key={order.id} draggableId={order.id} index={index}>
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`
                                  group rounded-xl border-zinc-200 dark:border-zinc-800 
                                  shadow-sm hover:shadow-md transition-all duration-200
                                  ${snapshot.isDragging ? "shadow-2xl rotate-2 scale-105 z-50 ring-2 ring-primary/20" : ""}
                                `}
                              >
                                <CardContent className="p-3">
                                  {/* Card Header */}
                                  <div className="flex justify-between items-center mb-3">
                                    <Badge 
                                      variant="outline" 
                                      className="text-base font-bold border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-2 py-0.5 rounded-md"
                                    >
                                      {order.table}
                                    </Badge>
                                    <span className="text-xs font-medium text-muted-foreground flex items-center bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md">
                                      <Clock className="w-3 h-3 mr-1" /> {order.time}
                                    </span>
                                  </div>
                                  
                                  {/* Items List */}
                                  <div className="space-y-2 mb-3">
                                    {order.items && order.items.map((item: any, idx: number) => (
                                      <div key={idx} className="flex items-start gap-2 text-sm">
                                        {item.image && (
                                          <img 
                                            src={item.image} 
                                            alt={item.name} 
                                            className="w-8 h-8 rounded-md object-cover shrink-0 bg-zinc-100 dark:bg-zinc-800" 
                                          />
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-start justify-between gap-2">
                                            <span className="font-medium truncate text-sm">{item.name}</span>
                                            <span className="font-bold bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-700 dark:text-zinc-300 min-w-[24px] text-center shrink-0 text-xs">
                                              {item.qty}x
                                            </span>
                                          </div>
                                          {item.options && Object.values(item.options).some(Boolean) && (
                                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                              {Object.values(item.options).filter(Boolean).join(', ')}
                                            </p>
                                          )}
                                          {item.note && (
                                            <p className="text-[10px] text-orange-600 italic mt-0.5">
                                              Note: {item.note}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Action Button */}
                                  <Button 
                                    className="w-full font-bold h-8 text-xs" 
                                    size="sm"
                                    variant={columnId === 'pending' ? 'default' : columnId === 'preparing' ? 'secondary' : 'outline'}
                                    onClick={() => advanceOrder(order.id, columnId)}
                                  >
                                    {columnId === 'pending' && (
                                      <>
                                        Lancer
                                        <ArrowRight className="w-3 h-3 ml-1.5" />
                                      </>
                                    )}
                                    {columnId === 'preparing' && (
                                      <>
                                        <CheckCircle2 className="w-3 h-3 mr-1.5" />
                                        Prêt
                                      </>
                                    )}
                                    {columnId === 'ready' && (
                                      <>
                                        <Utensils className="w-3 h-3 mr-1.5" />
                                        Servi
                                      </>
                                    )}
                                  </Button>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ))}
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
