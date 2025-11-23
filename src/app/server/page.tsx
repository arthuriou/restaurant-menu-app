"use client";

import { useOrderStore } from "@/stores/orders";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Utensils } from "lucide-react";
import { toast } from "sonner";

export default function ServerDashboard() {
  const { orders, moveOrder } = useOrderStore();
  const readyOrders = orders.ready || [];

  const handleMarkAsServed = (orderId: string) => {
    // Find index in ready list
    const orderIndex = readyOrders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
      moveOrder(orderId, 'ready', 'served', 0, orderIndex);
      toast.success("Commande marquée comme servie !");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">À Servir</h1>
        <p className="text-muted-foreground">Commandes prêtes en cuisine à apporter aux tables.</p>
      </div>

      {readyOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Tout est servi !</h3>
          <p className="text-muted-foreground max-w-sm mt-2">
            Aucune commande en attente de service pour le moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {readyOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden border-green-200 dark:border-green-900 shadow-lg shadow-green-500/5">
              <div className="bg-green-50 dark:bg-green-950/30 p-4 border-b border-green-100 dark:border-green-900/50 flex justify-between items-center">
                <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 text-lg px-3 py-1">
                  {order.table}
                </Badge>
                <span className="flex items-center text-sm font-medium text-green-700 dark:text-green-400">
                  <Clock className="w-4 h-4 mr-1" />
                  {order.time}
                </span>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4 mb-6">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-700 dark:text-zinc-300 min-w-[28px] text-center">
                        {item.qty}x
                      </span>
                      <div className="flex-1">
                        <span className="font-medium text-lg leading-tight block">{item.name}</span>
                        {item.options && Object.values(item.options).some(Boolean) && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {Object.values(item.options).filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Button 
                  className="w-full h-12 text-lg font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20"
                  onClick={() => handleMarkAsServed(order.id)}
                >
                  <Utensils className="w-5 h-5 mr-2" />
                  Servir à table
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
