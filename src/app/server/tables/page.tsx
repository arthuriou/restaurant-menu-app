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

  const handleGenerateInvoice = async () => {
    const table = tables.find(t => t.id === selectedTableId);
    if (!table) return;

    // 1. Gather orders
    const normalizedLabel = table.label.toLowerCase().replace('table ', '').trim();
    const tableOrders = Object.values(orders).flat().filter(
      (o: any) => {
        const orderTableVal = o.tableId || o.table;
        if (!orderTableVal || o.status === 'cancelled') return false;
        
        const orderTable = orderTableVal.toLowerCase().trim();
        return (
          orderTable === normalizedLabel || 
          orderTable === `table ${normalizedLabel}` ||
          orderTable.replace('table ', '').trim() === normalizedLabel
        );
      }
    );

    if (tableOrders.length === 0) {
      toast.error("Aucune commande trouvée pour cette table");
      return;
    }

    // 2. Consolidate items
    const allItems: any[] = [];
    tableOrders.forEach(order => {
      order.items.forEach((item: any) => {
        // Try to find existing identical item to merge
        const existingItemIndex = allItems.findIndex(existing => 
          existing.name === item.name && 
          existing.price === item.price && 
          JSON.stringify(existing.options || {}) === JSON.stringify(item.options || {})
        );

        if (existingItemIndex >= 0) {
          allItems[existingItemIndex].qty += item.qty;
        } else {
          allItems.push({
            menuId: item.id || 'unknown',
            name: item.name,
            price: item.price,
            qty: item.qty,
            imageUrl: item.image,
            options: item.options
          });
        }
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
    await addInvoice(newInvoice);

    // 5b. Mark all orders as PAID
    const { updateOrderStatus } = useOrderStore.getState();
    tableOrders.forEach(o => {
      updateOrderStatus(o.id, 'paid');
    });

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
    if (!tableLabel) return [];
    const normalizedLabel = tableLabel.toLowerCase().replace('table ', '').trim();
    
    return Object.values(orders).flat().filter(
      (o: any) => {
        // Fix: DB uses 'tableId' but code was checking 'table'. Support both for safely.
        const orderTableVal = o.tableId || o.table;
        if (!orderTableVal) return false;
        
        const orderTable = orderTableVal.toLowerCase().trim();
        // Check for "5", "Table 5", "table 5", "Table  5"
        const isMatch = (
          orderTable === normalizedLabel || 
          orderTable === `table ${normalizedLabel}` ||
          orderTable.replace('table ', '').trim() === normalizedLabel
        );
        if (isMatch && o.status !== 'cancelled') console.log(`[TableDebug] Found match for ${tableLabel}:`, o.id);
        return isMatch && o.status !== 'cancelled';
      }
    );
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col bg-zinc-50 dark:bg-black p-4">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Mes Tables</h1>
        <p className="text-sm text-muted-foreground">Vue d'ensemble et gestion temps réel</p>
      </div>
      
      <ScrollArea className="flex-1 -mx-4 px-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-20">
          {tables.map((table) => {
            const isOccupied = table.status === 'occupied';
            const isService = table.status === 'needs_service';
            const isBill = table.status === 'requesting_bill';
            
            // Use real occupancy data
            const currentOccupancy = table.occupants || 0;

            let borderColor = "border-zinc-200 dark:border-zinc-800";
            let statusIndicator = <div className="w-2 h-2 rounded-full bg-green-500" />;
            let statusText = "Libre";

            if (isService) {
              borderColor = "border-amber-400";
              statusIndicator = <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />;
              statusText = "Service";
            } else if (isBill) {
              borderColor = "border-red-400";
              statusIndicator = <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />;
              statusText = "Addition";
            } else if (isOccupied) {
              borderColor = "border-zinc-300 dark:border-zinc-700";
              statusIndicator = <div className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-zinc-100" />;
              statusText = "Occupée";
            }

            return (
              <Card 
                key={table.id}
                onClick={() => isService ? handleTableClick(table.id, table.status) : handleOpenTableDetails(table.id)}
                className={cn(
                  "group cursor-pointer rounded-xl border bg-white dark:bg-zinc-900 transition-all hover:border-zinc-400 dark:hover:border-zinc-600",
                  borderColor
                )}
              >
                <CardContent className="p-4 flex flex-col items-center justify-center min-h-[140px] relative">
                   {/* Header Status */}
                   <div className="absolute top-3 right-3 flex items-center gap-1.5">
                     <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{statusText}</span>
                     {statusIndicator}
                   </div>

                   {/* Main Number */}
                   <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
                     {table.label}
                   </div>

                   {/* Footer Info */}
                   <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{isOccupied ? `${currentOccupancy}` : table.seats}</span>
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
             const hasOrders = tableOrders.length > 0;

             return (
               <div className="h-full flex flex-col bg-zinc-50 dark:bg-black">
                 <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center">
                   <div>
                     <SheetTitle className="text-xl font-bold">Table {table?.label}</SheetTitle>
                     <p className="text-sm text-muted-foreground">
                        {hasOrders ? `${tableOrders.length} commandes` : "Table libre"}
                     </p>
                   </div>
                 </div>

                   <ScrollArea className="flex-1 p-6 h-[calc(100vh-200px)]">
                     {hasOrders ? (
                       (() => {
                         // Sort orders to ensure correct order in the bill view
                         const sortedOrders = [...tableOrders].sort((a, b) => {
                           const timeA = a.createdAt?.seconds || 0;
                           const timeB = b.createdAt?.seconds || 0;
                           return timeA - timeB;
                         });
                         
                         // We pass the last order as the "main" one, and the rest as "otherOrders"
                         // The OrderBill component will display them all sequentially
                         const lastOrder = sortedOrders[sortedOrders.length - 1];
                         const previousOrders = sortedOrders.slice(0, sortedOrders.length - 1);

                         return (
                           <OrderBill 
                             order={lastOrder}
                             otherOrders={previousOrders}
                             companyName={invoiceSettings.companyName}
                             showActions={false}
                           />
                         );
                       })()
                     ) : (
                       <div className="text-center py-20 text-muted-foreground">
                        <Utensils className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Aucune commande</p>
                        {table?.status === 'occupied' && (
                          <div className="mt-6">
                            <Button 
                              variant="outline" 
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => {
                                if(confirm("Forcer la libération de la table ?")) {
                                  closeTable(table.id);
                                  toast.success("Table libérée");
                                  setActiveSheet(false);
                                }
                              }}
                            >
                              Forcer "Libérer"
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                 </ScrollArea>

                 {hasOrders && (
                   <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                     {generatedInvoice ? (
                       <div className="space-y-3">
                         <div className="flex items-center gap-3 text-green-600 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-900/50">
                            <Check className="w-5 h-5" />
                            <div className="font-bold text-sm">Facture Payée & Générée</div>
                         </div>
                         <Button onClick={handlePrint} className="w-full h-12 rounded-lg text-base font-bold bg-white border border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm">
                           <Printer className="mr-2 w-4 h-4" /> Imprimer le ticket
                         </Button>
                       </div>
                     ) : (
                       <div className="flex flex-col gap-3">
                         <Button 
                          className="h-12 rounded-lg font-bold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black shadow-sm"
                          onClick={handleGenerateInvoice}
                         >
                           <BanknoteIcon className="mr-2 w-4 h-4" />
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
