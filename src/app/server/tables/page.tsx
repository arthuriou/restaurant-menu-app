"use client";

import { useState } from "react";
import { useTableStore } from "@/stores/tables";
import { useOrderStore } from "@/stores/orders";
import { useInvoiceStore } from "@/stores/invoices";
import { useRestaurantStore } from "@/stores/restaurant";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Users, ChevronLeft, Receipt, Printer, CreditCard,
  Bell, Check, BanknoteIcon, Utensils, X, Armchair
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  generateInvoiceNumber, 
  calculateTax, 
  calculateTotal, 
  getRestaurantInfo 
} from "@/lib/invoice-utils";
import { Invoice, Order } from "@/types";
import { OrderBill } from "@/components/order/OrderBill";

export default function ServerTablesPage() {
  const { tables, resolveServiceRequest, closeTable } = useTableStore();
  const { orders } = useOrderStore();
  const { addInvoice } = useInvoiceStore();
  const { invoiceSettings } = useRestaurantStore();
  const { user } = useAuthStore();
  
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(null);
  const [activeSheet, setActiveSheet] = useState<boolean>(false);

  const handleTableClick = (tableId: string, status: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    if (status === 'needs_service') {
      resolveServiceRequest(tableId);
      toast.success(`Service rendu à la Table ${table.label}`);
    }
  };

  const handleOpenTableDetails = (tableId: string) => {
    setSelectedTableId(tableId);
    setActiveSheet(true);
    setGeneratedInvoice(null);
  };

  const handleGenerateInvoice = () => {
    const table = tables.find(t => t.id === selectedTableId);
    if (!table) return;

    // 1. Gather orders
    const tableOrders = Object.values(orders).flat().filter(
      o => o.table === `Table ${table.label}` && o.status !== 'cancelled'
    );

    if (tableOrders.length === 0) {
      toast.error("Aucune commande trouvée pour cette table");
      return;
    }

    // 2. Consolidate items
    const allItems: any[] = [];
    tableOrders.forEach(order => {
      order.items.forEach((item: any) => {
        allItems.push({
          menuId: item.id || 'unknown',
          name: item.name,
          price: item.price,
          qty: item.qty,
          imageUrl: item.image,
          options: item.options
        });
      });
    });

    // 3. Calculate totals
    const subtotal = tableOrders.reduce((acc, o) => acc + o.total, 0);
    const taxRate = invoiceSettings.taxRate;
    const tax = calculateTax(subtotal, taxRate);
    const total = calculateTotal(subtotal, taxRate);

    // 4. Create Invoice Object
    const newInvoice: Invoice = {
      id: `inv_${Date.now()}`,
      number: generateInvoiceNumber(),
      type: 'table',
      tableId: `Table ${table.label}`,
      items: allItems,
      subtotal,
      tax,
      taxRate,
      total,
      status: 'paid',
      paymentMethod: 'cash',
      serverName: user?.name,
      createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      paidAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      restaurantInfo: getRestaurantInfo()
    };

    // 5. Add to store
    addInvoice(newInvoice);

    // 6. Feedback & Update UI
    toast.success(`Facture ${newInvoice.number} générée !`);
    closeTable(selectedTableId!);
    setGeneratedInvoice(newInvoice);
  };

  const handlePrint = () => {
    if (generatedInvoice) {
      window.open(`/admin/invoices/${generatedInvoice.id}/print`, '_blank');
    }
  };

  const getTableOrders = (tableLabel: string): any[] => {
    return Object.values(orders).flat().filter(
      (o: any) => o.table === `Table ${tableLabel}` && o.status !== 'cancelled'
    );
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col bg-zinc-50/50 dark:bg-black p-2">
      <div className="flex flex-col gap-2 mb-6 px-2">
        <h1 className="text-3xl font-black tracking-tighter uppercase">Mes Tables</h1>
        <p className="text-muted-foreground">Vue d'ensemble et gestion des tables en temps réel.</p>
      </div>
      
      <ScrollArea className="flex-1 -mx-2 px-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-20">
          {tables.map((table) => {
            const isOccupied = table.status === 'occupied';
            const isService = table.status === 'needs_service';
            const isBill = table.status === 'requesting_bill';
            
            // Mock occupancy for demonstration if occupied
            const currentOccupancy = isOccupied ? Math.floor(Math.random() * table.seats) + 1 : 0;
            const isFull = currentOccupancy === table.seats;

            return (
              <Card 
                key={table.id}
                onClick={() => isService ? handleTableClick(table.id, table.status) : handleOpenTableDetails(table.id)}
                className={cn(
                  "group cursor-pointer relative overflow-hidden transition-all duration-300 rounded-[2rem] p-6 shadow-sm border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900",
                  (isService || isBill) && "ring-2 ring-offset-2",
                  isService ? "ring-amber-500" : isBill ? "ring-red-500" : "hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 hover:-translate-y-1"
                )}
              >
                <CardContent className="p-0 flex flex-col items-center justify-center aspect-square relative z-10">
                  {/* Table Number */}
                  <span className="text-5xl font-black tracking-tighter mb-4 text-zinc-900 dark:text-zinc-100">
                    {table.label}
                  </span>
                  
                  {/* Seats / Occupancy Visuals */}
                  <div className="flex flex-col items-center gap-2 w-full">
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                       <Users className={cn("w-4 h-4", isOccupied ? "text-zinc-900 dark:text-zinc-100" : "text-muted-foreground")} />
                       <span className={cn(
                         isOccupied ? "text-zinc-900 dark:text-zinc-100" : "text-muted-foreground"
                       )}>
                         {isOccupied ? `${currentOccupancy}/${table.seats}` : `${table.seats} places`}
                       </span>
                    </div>

                    {/* Progress Bar for Occupancy */}
                    {isOccupied && (
                      <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full transition-all duration-500", isFull ? "bg-red-500" : "bg-green-500")}
                          style={{ width: `${(currentOccupancy / table.seats) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Status Chips */}
                  <div className="mt-6">
                    {isService ? (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 animate-pulse px-3 py-1 text-xs">
                        <Bell className="w-3 h-3 mr-1" /> SERVICE
                      </Badge>
                    ) : isBill ? (
                      <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 animate-pulse border-red-200 px-3 py-1 text-xs">
                        <Receipt className="w-3 h-3 mr-1" /> ADDITION
                      </Badge>
                    ) : (
                      <Badge variant="outline" className={cn(
                        "border-0 px-3 py-1 text-xs font-bold",
                        isOccupied 
                          ? (isFull ? "bg-zinc-900 text-white dark:bg-white dark:text-black" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400")
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                      )}>
                        {isOccupied ? (isFull ? "COMPLET" : "OCCUPÉ") : "LIBRE"}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* Table Details Sheet (Invoice View) */}
      <Sheet open={activeSheet} onOpenChange={setActiveSheet}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0 border-l border-zinc-200 dark:border-zinc-800">
           {selectedTableId && (() => {
             const table = tables.find(t => t.id === selectedTableId);
             const tableOrders = getTableOrders(table?.label || "");
             // Fake an active order structure for the bill component using the aggregated items
             const aggregatedOrder: any = {
               id: 'preview',
               tableId: `Table ${table?.label}`,
               items: [],
               total: 0,
               status: 'pending',
               createdAt: { seconds: Date.now()/1000 }
             };

             if (tableOrders.length > 0) {
               aggregatedOrder.items = []; // Items will be handled via the order prop and otherOrders in OrderBill
             }

             const hasOrders = tableOrders.length > 0;

             return (
               <div className="h-full flex flex-col bg-zinc-50 dark:bg-black">
                 <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center">
                   <div>
                     <SheetTitle className="text-2xl font-black uppercase">Table {table?.label}</SheetTitle>
                     <p className="text-sm text-muted-foreground">
                        {hasOrders ? `${tableOrders.length} commandes en cours` : "Aucune commande"}
                     </p>
                   </div>
                   <Button variant="ghost" size="icon" onClick={() => setActiveSheet(false)}>
                     <X className="w-5 h-5" />
                   </Button>
                 </div>

                 <ScrollArea className="flex-1 p-6">
                    {hasOrders ? (
                      <OrderBill 
                        order={tableOrders[tableOrders.length - 1]} 
                        otherOrders={tableOrders.slice(0, -1)}
                        companyName={invoiceSettings.companyName}
                        showActions={false}
                      />
                    ) : (
                      <div className="text-center py-20 text-muted-foreground">
                        <Utensils className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Table libre ou sans commande.</p>
                        <Button 
                          className="mt-6 rounded-full"
                          onClick={() => {
                             window.location.href = `/?table=${table?.label}`;
                          }}
                        >
                          Prendre une commande
                        </Button>
                      </div>
                    )}
                 </ScrollArea>

                 {hasOrders && (
                   <div className="p-6 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                     {generatedInvoice ? (
                       <div className="space-y-3">
                         <div className="flex items-center gap-3 text-green-600 bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
                            <Check className="w-6 h-6" />
                            <div className="font-bold">Facture Payée & Générée</div>
                         </div>
                         <Button onClick={handlePrint} className="w-full h-12 rounded-xl text-lg font-bold" variant="outline">
                           <Printer className="mr-2 w-5 h-5" /> Imprimer le ticket
                         </Button>
                       </div>
                     ) : (
                       <div className="grid grid-cols-2 gap-3">
                         <Button 
                          variant="outline" 
                          className="h-14 rounded-xl font-bold"
                          onClick={() => {
                            window.location.href = `/?table=${table?.label}`;
                          }}
                         >
                           <Utensils className="mr-2 w-5 h-5" />
                           Ajouter
                         </Button>
                         <Button 
                          className="h-14 rounded-xl font-bold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black"
                          onClick={handleGenerateInvoice}
                         >
                           <BanknoteIcon className="mr-2 w-5 h-5" />
                           Encaisser
                         </Button>
                       </div>
                     )}
                   </div>
                 )}
               </div>
             );
           })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}
