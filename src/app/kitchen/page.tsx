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
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

const columns = {
  pending: { title: "À Faire", icon: BellRing, color: "text-orange-600", bg: "bg-orange-50/50 dark:bg-orange-950/10", border: "border-orange-100 dark:border-orange-900/20" },
  preparing: { title: "En Préparation", icon: ChefHat, color: "text-blue-600", bg: "bg-blue-50/50 dark:bg-blue-950/10", border: "border-blue-100 dark:border-blue-900/20" },
  ready: { title: "Prêt à Servir", icon: Utensils, color: "text-green-600", bg: "bg-green-50/50 dark:bg-green-950/10", border: "border-green-100 dark:border-green-900/20" },
};

export default function KitchenPage() {
  const { user, logout } = useAuthStore();
  const { orders, moveOrder, updateOrderStatus } = useOrderStore();
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

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const { source, destination } = result;

    if (source.droppableId !== destination.droppableId || source.index !== destination.index) {
      moveOrder(
        result.draggableId,
        source.droppableId,
        destination.droppableId,
        destination.index,
        source.index
      );
      
      // Notify if status changed
      if (source.droppableId !== destination.droppableId) {
        toast.success(`Commande passée en ${columns[destination.droppableId as keyof typeof columns].title}`);
      }
    }
  };

  const advanceOrder = (orderId: string, currentStatus: string) => {
    let nextStatus = '';
    if (currentStatus === 'pending') nextStatus = 'preparing';
    else if (currentStatus === 'preparing') nextStatus = 'ready';
    else if (currentStatus === 'ready') nextStatus = 'served';

    if (nextStatus) {
      // Find the order index
      const currentList = orders[currentStatus as keyof typeof orders];
      const orderIndex = currentList.findIndex(o => o.id === orderId);
      
      if (orderIndex !== -1) {
        moveOrder(orderId, currentStatus as any, nextStatus as any, 0, orderIndex);
        toast.success("Statut mis à jour");
      }
    }
  };

  if (!enabled) return null;

  return (
    <div className="h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {user?.avatar || "C"}
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">Cuisine</h1>
            <p className="text-xs text-muted-foreground mt-1">{user?.name}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
          <LogOut className="w-4 h-4 mr-2" />
          Déconnexion
        </Button>
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
                    <ScrollArea className="flex-1">
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
                                <CardContent className="p-5">
                                  {/* Card Header */}
                                  <div className="flex justify-between items-start mb-4">
                                    <Badge 
                                      variant="outline" 
                                      className="text-lg font-bold border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-1 rounded-lg"
                                    >
                                      {order.table}
                                    </Badge>
                                    <span className="text-sm font-medium text-muted-foreground flex items-center bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
                                      <Clock className="w-4 h-4 mr-1.5" /> {order.time}
                                    </span>
                                  </div>
                                  
                                  {/* Items List */}
                                  <div className="space-y-2 mb-5">
                                    {order.items && order.items.map((item: any, idx: number) => (
                                      <div key={idx} className="flex items-start gap-2 text-sm">
                                        <span className="font-bold bg-zinc-100 dark:bg-zinc-800 px-1.5 rounded text-zinc-700 dark:text-zinc-300 min-w-[24px] text-center">
                                          {item.qty}x
                                        </span>
                                        <div className="flex-1">
                                          <span className="font-medium">{item.name}</span>
                                          {item.options && Object.values(item.options).some(Boolean) && (
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                              {Object.values(item.options).filter(Boolean).join(', ')}
                                            </p>
                                          )}
                                          {item.note && (
                                            <p className="text-xs text-orange-600 italic mt-0.5">
                                              Note: {item.note}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Action Button */}
                                  <Button 
                                    className="w-full font-bold" 
                                    size="lg"
                                    variant={columnId === 'pending' ? 'default' : columnId === 'preparing' ? 'secondary' : 'outline'}
                                    onClick={() => advanceOrder(order.id, columnId)}
                                  >
                                    {columnId === 'pending' && (
                                      <>
                                        Lancer la préparation
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                      </>
                                    )}
                                    {columnId === 'preparing' && (
                                      <>
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Prêt à servir
                                      </>
                                    )}
                                    {columnId === 'ready' && (
                                      <>
                                        <Utensils className="w-4 h-4 mr-2" />
                                        Marquer comme servi
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
                    </ScrollArea>
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
