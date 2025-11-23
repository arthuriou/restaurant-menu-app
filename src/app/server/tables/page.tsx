"use client";

import { useState } from "react";
import { useTableStore } from "@/stores/tables";
import { useOrderStore } from "@/stores/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Users, ChevronLeft, Receipt, CheckCircle2, Printer, CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ServerTablesPage() {
  const { tables } = useTableStore();
  const { orders } = useOrderStore();
  
  // Views: 'tables' | 'invoice'
  const [view, setView] = useState<'tables' | 'invoice'>('tables');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const handleTableSelect = (tableId: string) => {
    setSelectedTable(tableId);
    // Check if table has active orders
    const tableLabel = tables.find(t => t.id === tableId)?.label;
    const hasActiveOrders = Object.values(orders).flat().some(o => o.table === `Table ${tableLabel}` && o.status !== 'paid');
    
    if (hasActiveOrders) {
      setView('invoice'); // Go to invoice view if occupied
    } else {
      toast.info("Cette table est libre. Aucune action requise.");
    }
  };

  const handlePrintInvoice = () => {
    toast.success("Facture imprimée !");
    // Logic to trigger print would go here
  };

  const handlePayment = () => {
    // Logic to process payment and close session
    toast.success("Paiement accepté. Table libérée.");
    setView('tables');
    // In a real app, this would update the order statuses to 'paid'
  };

  if (view === 'tables') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mes Tables</h1>
          <p className="text-muted-foreground">Vue d'ensemble des tables et gestion des additions.</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tables.map((table) => {
            // Calculate status based on active orders
            const hasActiveOrders = Object.values(orders).flat().some(o => o.table === `Table ${table.label}` && o.status !== 'paid');
            const status = hasActiveOrders ? 'occupied' : 'available'; 

            // Mock "Payment Requested" status for demo (randomly for occupied tables)
            const paymentRequested = status === 'occupied' && Math.random() > 0.7;

            return (
              <Card 
                key={table.id}
                className={cn(
                  "cursor-pointer transition-all hover:scale-105 active:scale-95 border-2 relative overflow-hidden",
                  paymentRequested ? "bg-orange-50 border-orange-500 animate-pulse" :
                  status === 'occupied' 
                    ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50" 
                    : "bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 hover:border-primary/50"
                )}
                onClick={() => handleTableSelect(table.id)}
              >
                {paymentRequested && (
                  <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                    ADDITION !
                  </div>
                )}
                <CardContent className="p-6 flex flex-col items-center justify-center aspect-square">
                  <span className={cn(
                    "text-3xl font-bold mb-2",
                    status === 'occupied' ? "text-blue-600" : "text-zinc-900 dark:text-zinc-100"
                  )}>
                    {table.label}
                  </span>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Users className="w-3 h-3" />
                    <span>{table.seats}</span>
                  </div>
                  <span className={cn(
                    "mt-3 text-xs font-medium px-2 py-1 rounded-full",
                    status === 'occupied' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" : 
                    "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                  )}>
                    {status === 'occupied' ? 'Occupée' : 'Libre'}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  if (view === 'invoice') {
    const table = tables.find(t => t.id === selectedTable);
    const tableOrders = Object.values(orders).flat().filter(o => o.table === `Table ${table?.label}`);
    const totalSession = tableOrders.reduce((acc, o) => acc + o.total, 0);

    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setView('tables')}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Table {table?.label}</h1>
            <p className="text-muted-foreground">Gestion de l'addition</p>
          </div>
        </div>
        
        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Left: Session Details */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <h2 className="text-xl font-bold">Détail de la consommation</h2>

            <ScrollArea className="flex-1">
              <div className="space-y-4 pb-20">
                {tableOrders.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">Aucune commande active</div>
                ) : (
                  tableOrders.map((order) => (
                    <Card key={order.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">#{order.id.split('-')[1]}</span>
                              <span className="text-xs text-muted-foreground">{order.time}</span>
                            </div>
                            <Badge variant="outline" className={cn(
                              "mt-1",
                              order.status === 'pending' ? "text-orange-600 border-orange-200 bg-orange-50" :
                              order.status === 'preparing' ? "text-blue-600 border-blue-200 bg-blue-50" :
                              order.status === 'ready' ? "text-green-600 border-green-200 bg-green-50" :
                              "text-zinc-600"
                            )}>
                              {order.status === 'pending' ? 'En attente' :
                               order.status === 'preparing' ? 'En préparation' :
                               order.status === 'ready' ? 'Prêt' : 'Servi'}
                            </Badge>
                          </div>
                          <span className="font-bold">{order.total.toLocaleString()} FCFA</span>
                        </div>
                        <div className="space-y-1">
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="text-sm flex justify-between">
                              <span>{item.qty}x {item.name}</span>
                              <span className="text-muted-foreground">{(item.price * item.qty).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right: Invoice Actions */}
          <div className="w-[400px] bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col shadow-xl">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Total à régler
              </h2>
            </div>
            
            <div className="flex-1 p-6 flex flex-col justify-center items-center text-center space-y-2">
               <span className="text-muted-foreground text-lg">Montant Total</span>
               <span className="font-bold text-5xl text-primary">{totalSession.toLocaleString()} <span className="text-2xl text-muted-foreground">FCFA</span></span>
            </div>

            <div className="p-6 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
              <Button 
                variant="outline" 
                className="w-full h-12 text-lg font-medium" 
                onClick={handlePrintInvoice}
                disabled={totalSession === 0}
              >
                <Printer className="w-5 h-5 mr-2" />
                Imprimer Note
              </Button>
              <Button 
                className="w-full h-14 text-xl font-bold bg-green-600 hover:bg-green-700" 
                onClick={handlePayment}
                disabled={totalSession === 0}
              >
                <CreditCard className="w-6 h-6 mr-2" />
                Encaisser (Cash/CB)
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
