"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { 
  Clock, CheckCircle2, ChefHat, Utensils, MoreHorizontal, 
  Receipt, Plus, AlertCircle 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { generateInvoiceFromOrder, saveInvoice } from "@/lib/invoice-service";
import { getRestaurantInfo } from "@/lib/invoice-utils";
import { Order } from "@/types";
import { useOrderStore } from "@/stores/orders";

// Mock Data - Extended for better testing


const columns = {
  pending: { title: "En Attente", icon: Clock, color: "text-orange-600", bg: "bg-orange-50/50 dark:bg-orange-950/10", border: "border-orange-100 dark:border-orange-900/20" },
  preparing: { title: "En Cuisine", icon: ChefHat, color: "text-blue-600", bg: "bg-blue-50/50 dark:bg-blue-950/10", border: "border-blue-100 dark:border-blue-900/20" },
  ready: { title: "Prêt à Servir", icon: Utensils, color: "text-green-600", bg: "bg-green-50/50 dark:bg-green-950/10", border: "border-green-100 dark:border-green-900/20" },
  served: { title: "Terminé", icon: CheckCircle2, color: "text-zinc-600", bg: "bg-zinc-50/50 dark:bg-zinc-900/10", border: "border-zinc-100 dark:border-zinc-800" }
};

export default function AdminOrdersPage() {
  const { orders, moveOrder } = useOrderStore();
  const [enabled, setEnabled] = useState(false); // Strict Mode fix
  const router = useRouter();

  // Fix for React 18 Strict Mode DnD issues
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

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

      if (source.droppableId !== destination.droppableId) {
        toast.success(`Commande déplacée vers ${columns[destination.droppableId as keyof typeof columns].title}`);
      }
    }
  };

  const handleGenerateInvoice = async (order: any) => {
    try {
      toast.loading("Génération de la facture...");
      
      // Mock converting UI order to Order type
      const orderData: Order = {
        id: order.id,
        tableId: order.table,
        items: order.items || [], // Should be real items
        total: order.total,
        status: "served",
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
      };

      const invoice = generateInvoiceFromOrder(
        orderData,
        getRestaurantInfo(), // Should come from store
        undefined // Payment method not yet selected
      );

      await saveInvoice(invoice);
      
      toast.dismiss();
      toast.success("Facture générée !");
      
      // Redirect to invoice page
      router.push(`/admin/invoices/${invoice.id}`);
      
    } catch (error) {
      toast.dismiss();
      toast.error("Erreur lors de la génération de la facture");
      console.error(error);
    }
  };

  if (!enabled) {
    return null;
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Commandes</h2>
          <p className="text-muted-foreground mt-1">Flux des commandes en temps réel.</p>
        </div>
        <Button className="rounded-xl shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Commande
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-0 pb-2">
          {Object.entries(columns).map(([columnId, col]) => (
            <div 
              key={columnId} 
              className={`flex flex-col rounded-2xl border ${col.border} ${col.bg} h-full overflow-hidden transition-colors duration-300`}
            >
              {/* Column Header */}
              <div className="p-4 flex items-center justify-between bg-white/50 dark:bg-black/20 backdrop-blur-sm border-b border-zinc-200/50 dark:border-zinc-800/50">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl bg-white dark:bg-zinc-900 shadow-sm ${col.color}`}>
                    <col.icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    {col.title}
                  </h3>
                </div>
                <Badge variant="secondary" className="bg-white dark:bg-zinc-900 font-mono font-bold shadow-sm">
                  {orders[columnId].length}
                </Badge>
              </div>
              
              {/* Droppable Area */}
              <Droppable droppableId={columnId}>
                {(provided, snapshot) => (
                  <ScrollArea className="flex-1">
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`p-3 space-y-3 min-h-[150px] transition-colors duration-200 ${
                        snapshot.isDraggingOver ? "bg-black/5 dark:bg-white/5" : ""
                      }`}
                    >
                      {orders[columnId].map((order, index) => (
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
                              <CardContent className="p-4">
                                {/* Card Header */}
                                <div className="flex justify-between items-start mb-3">
                                  <Badge 
                                    variant="outline" 
                                    className="font-bold border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-2.5 py-1 rounded-lg"
                                  >
                                    {order.table}
                                  </Badge>
                                  <span className="text-xs font-medium text-muted-foreground flex items-center bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
                                    <Clock className="w-3 h-3 mr-1.5" /> {order.time}
                                  </span>
                                </div>
                                
                                {/* Card Body */}
                                <div className="space-y-3 mb-4">
                                  <div className="flex justify-between items-baseline">
                                    <span className="text-sm text-muted-foreground font-medium">
                                      {order.itemCount} articles
                                    </span>
                                    <span className="font-bold text-lg tracking-tight">
                                      {order.total.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">FCFA</span>
                                    </span>
                                  </div>
                                  
                                  {/* Progress Bar (Visual Indicator) */}
                                  <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${
                                        columnId === 'pending' ? 'bg-orange-500 w-1/4' :
                                        columnId === 'preparing' ? 'bg-blue-500 w-2/4' :
                                        columnId === 'ready' ? 'bg-green-500 w-3/4' :
                                        'bg-zinc-500 w-full'
                                      }`} 
                                    />
                                  </div>
                                </div>

                                {/* Card Footer / Actions */}
                                <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                  <div className="text-xs font-medium text-zinc-400 truncate max-w-[100px]">
                                    #{order.id.split('-')[1]}
                                  </div>
                                  
                                  <div className="flex items-center gap-1">
                                    {columnId === 'served' && (
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        className="h-8 px-2 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 rounded-lg"
                                        onClick={() => handleGenerateInvoice(order)}
                                      >
                                        <Receipt className="w-3.5 h-3.5 mr-1.5" />
                                        Facturer
                                      </Button>
                                    )}
                                    
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                          <MoreHorizontal className="h-4 w-4 text-zinc-500" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="rounded-xl">
                                        <DropdownMenuItem onClick={() => handleGenerateInvoice(order)}>
                                          <Receipt className="w-4 h-4 mr-2" />
                                          Générer facture
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                          <AlertCircle className="w-4 h-4 mr-2" />
                                          Voir détails
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20">
                                          Annuler commande
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
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
