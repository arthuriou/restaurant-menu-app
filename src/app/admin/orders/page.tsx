"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Clock, CheckCircle2, ChefHat, Utensils, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Mock Data
const initialOrders = {
  pending: [
    { id: "ord-1", table: "T-4", items: 3, total: 12500, time: "12:30", status: "pending", customer: "Client" },
    { id: "ord-2", table: "T-2", items: 1, total: 4500, time: "12:32", status: "pending", customer: "Client" },
  ],
  preparing: [
    { id: "ord-3", table: "T-8", items: 5, total: 28000, time: "12:15", status: "preparing", customer: "Client" },
  ],
  ready: [
    { id: "ord-4", table: "T-1", items: 2, total: 8900, time: "12:10", status: "ready", customer: "Client" },
  ],
  served: [
    { id: "ord-5", table: "T-5", items: 4, total: 15600, time: "11:45", status: "served", customer: "Client" },
  ]
};

const columns = {
  pending: { title: "En Attente", icon: Clock, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/20" },
  preparing: { title: "En Cuisine", icon: ChefHat, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20" },
  ready: { title: "Prêt à Servir", icon: Utensils, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/20" },
  served: { title: "Terminé", icon: CheckCircle2, color: "text-zinc-500", bg: "bg-zinc-50 dark:bg-zinc-900/20" }
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState(initialOrders);

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId !== destination.droppableId) {
      const sourceColumn = orders[source.droppableId as keyof typeof orders];
      const destColumn = orders[destination.droppableId as keyof typeof orders];
      const [removed] = sourceColumn.splice(source.index, 1);
      destColumn.splice(destination.index, 0, { ...removed, status: destination.droppableId });
      setOrders({
        ...orders,
        [source.droppableId]: sourceColumn,
        [destination.droppableId]: destColumn
      });
    } else {
      const column = orders[source.droppableId as keyof typeof orders];
      const [removed] = column.splice(source.index, 1);
      column.splice(destination.index, 0, removed);
      setOrders({
        ...orders,
        [source.droppableId]: column
      });
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Commandes en cours</h2>
        <p className="text-muted-foreground mt-1">Gérez le flux des commandes en temps réel.</p>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-0">
          {Object.entries(columns).map(([columnId, col]) => (
            <div key={columnId} className={`flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 ${col.bg} h-full`}>
              <div className="p-4 flex items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/50">
                <div className="flex items-center gap-2">
                  <col.icon className={`w-5 h-5 ${col.color}`} />
                  <h3 className="font-bold text-sm uppercase tracking-wider">{col.title}</h3>
                </div>
                <Badge variant="secondary" className="bg-white/50 dark:bg-black/20">
                  {orders[columnId as keyof typeof orders].length}
                </Badge>
              </div>
              
              <Droppable droppableId={columnId}>
                {(provided) => (
                  <ScrollArea className="flex-1">
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="p-3 space-y-3 min-h-[150px]"
                    >
                      {orders[columnId as keyof typeof orders].map((order, index) => (
                        <Draggable key={order.id} draggableId={order.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`rounded-xl border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all ${
                                snapshot.isDragging ? "shadow-xl rotate-2 scale-105 z-50" : ""
                              }`}
                            >
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                  <Badge variant="outline" className="font-bold border-primary/20 text-primary bg-primary/5">
                                    {order.table}
                                  </Badge>
                                  <span className="text-xs font-medium text-muted-foreground flex items-center">
                                    <Clock className="w-3 h-3 mr-1" /> {order.time}
                                  </span>
                                </div>
                                
                                <div className="space-y-2 mb-4">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{order.items} articles</span>
                                    <span className="font-bold">{order.total.toLocaleString()} FCFA</span>
                                  </div>
                                  <div className="text-xs text-zinc-500">
                                    {order.id} • {order.customer}
                                  </div>
                                </div>

                                <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-xl">
                                      <DropdownMenuItem>Voir détails</DropdownMenuItem>
                                      <DropdownMenuItem>Imprimer ticket</DropdownMenuItem>
                                      <DropdownMenuItem className="text-red-600">Annuler</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
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
  );
}
