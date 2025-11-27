"use client";

import { useState, useEffect } from "react";
import { 
  Clock, CheckCircle2, ChefHat, Utensils
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOrderStore } from "@/stores/orders";

// Mock Data - Extended for better testing




export default function AdminOrdersPage() {
  const { orders } = useOrderStore();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(true);
  }, []);

  if (!enabled) return null;

  // Flatten orders for list view
  const allOrders = [
    ...orders.pending.map(o => ({ ...o, statusLabel: 'En Attente', color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/20' })),
    ...orders.preparing.map(o => ({ ...o, statusLabel: 'En Cuisine', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20' })),
    ...orders.ready.map(o => ({ ...o, statusLabel: 'Prêt', color: 'text-green-600 bg-green-50 dark:bg-green-950/20' })),
    ...orders.served.map(o => ({ ...o, statusLabel: 'Servi', color: 'text-zinc-600 bg-zinc-50 dark:bg-zinc-900/20' }))
  ].sort((a, b) => new Date(b.createdAt?.seconds || 0).getTime() - new Date(a.createdAt?.seconds || 0).getTime());

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Suivi des Commandes</h2>
        <p className="text-muted-foreground mt-1">Vue d'ensemble de l'activité en cuisine.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">En Attente</p>
              <p className="text-3xl font-bold text-orange-600">{orders.pending.length}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-100" />
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">En Cuisine</p>
              <p className="text-3xl font-bold text-blue-600">{orders.preparing.length}</p>
            </div>
            <ChefHat className="w-8 h-8 text-blue-100" />
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Prêts</p>
              <p className="text-3xl font-bold text-green-600">{orders.ready.length}</p>
            </div>
            <Utensils className="w-8 h-8 text-green-100" />
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Servis (Auj.)</p>
              <p className="text-3xl font-bold text-zinc-600">{orders.served.length}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-zinc-100" />
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {allOrders.map((order) => (
                <div key={order.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${order.color}`}>
                      {order.table}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">Commande #{order.id.split('-')[1] || order.id}</span>
                        <Badge variant="secondary" className="text-xs font-normal">
                          {order.time}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {order.items?.length || 0} articles • {order.total?.toLocaleString()} FCFA
                      </p>
                    </div>
                  </div>
                  <Badge className={`${order.color} border-0`}>
                    {order.statusLabel}
                  </Badge>
                </div>
              ))}
              {allOrders.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  Aucune commande pour le moment.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
