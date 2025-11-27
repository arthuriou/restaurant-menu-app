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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Users, ChevronLeft, Receipt, Printer, CreditCard,
  Bell, Check, BanknoteIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  generateInvoiceNumber, 
  calculateTax, 
  calculateTotal, 
  getRestaurantInfo 
} from "@/lib/invoice-utils";
import { Invoice } from "@/types";

export default function ServerTablesPage() {
  const { tables, resolveServiceRequest, closeTable } = useTableStore();
  const { orders } = useOrderStore();
  const { addInvoice } = useInvoiceStore();
  const { invoiceSettings } = useRestaurantStore();
  const { user } = useAuthStore();
  
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(null);

  const getTableStatusConfig = (status: string) => {
    switch (status) {
      case 'available':
        return { 
          label: 'Libre', 
          bgColor: 'bg-green-50 dark:bg-green-950/20', 
          borderColor: 'border-green-200 dark:border-green-900/50',
          textColor: 'text-green-700 dark:text-green-300',
          badgeBg: 'bg-green-100 dark:bg-green-900/50'
        };
      case 'occupied':
        return { 
          label: 'Occupée', 
          bgColor: 'bg-blue-50 dark:bg-blue-950/20', 
          borderColor: 'border-blue-200 dark:border-blue-900/50',
          textColor: 'text-blue-700 dark:text-blue-300',
          badgeBg: 'bg-blue-100 dark:bg-blue-900/50'
        };
      case 'needs_service':
        return { 
          label: 'Service', 
          bgColor: 'bg-amber-50 dark:bg-amber-950/20', 
          borderColor: 'border-amber-400 dark:border-amber-600',
          textColor: 'text-amber-700 dark:text-amber-300',
          badgeBg: 'bg-amber-100 dark:bg-amber-900/50',
          pulse: true
        };
      case 'requesting_bill':
        return { 
          label: 'Addition', 
          bgColor: 'bg-red-50 dark:bg-red-950/20', 
          borderColor: 'border-red-400 dark:border-red-600',
          textColor: 'text-red-700 dark:text-red-300',
          badgeBg: 'bg-red-100 dark:bg-red-900/50',
          pulse: true
        };
      default:
        return { 
          label: 'Inconnue', 
          bgColor: 'bg-gray-50', 
          borderColor: 'border-gray-200',
          textColor: 'text-gray-700',
          badgeBg: 'bg-gray-100'
        };
    }
  };

  const handleTableClick = (tableId: string, status: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    if (status === 'available') {
      toast.info("Cette table est libre.");
      return;
    }

    if (status === 'needs_service') {
      resolveServiceRequest(tableId);
      toast.success(`Service rendu à la Table ${table.label}`);
      return;
    }

    if (status === 'requesting_bill') {
      setSelectedTable(tableId);
      setGeneratedInvoice(null); // Reset previous invoice
      setShowInvoiceDialog(true);
      return;
    }

    // For occupied tables, just show info
    if (status === 'occupied') {
      toast.info(`Table ${table.label} occupée par ${table.occupants} personne(s)`);
    }
  };

  const handleGenerateInvoice = () => {
    const table = tables.find(t => t.id === selectedTable);
    if (!table) return;

    // 1. Gather orders
    const tableOrders = Object.values(orders).flat().filter(
      o => o.table === `Table ${table.label}`
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
          imageUrl: item.image
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
      serverName: user?.name, // Add server name
      createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      paidAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      restaurantInfo: getRestaurantInfo()
    };

    // 5. Add to store
    addInvoice(newInvoice);

    // 6. Feedback & Update UI
    toast.success(`Facture ${newInvoice.number} générée !`);
    closeTable(selectedTable!);
    setGeneratedInvoice(newInvoice);
    // Do not close dialog, let user print
  };

  const handlePrint = () => {
    if (generatedInvoice) {
      window.open(`/admin/invoices/${generatedInvoice.id}/print`, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mes Tables</h1>
        <p className="text-muted-foreground">Vue d'ensemble et gestion des demandes clients.</p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tables.map((table) => {
          const statusConfig = getTableStatusConfig(table.status);

          return (
            <Card 
              key={table.id}
              className={cn(
                "cursor-pointer transition-all hover:scale-105 active:scale-95 border-2 relative overflow-hidden",
                statusConfig.bgColor,
                statusConfig.borderColor,
                statusConfig.pulse && "animate-pulse"
              )}
              onClick={() => handleTableClick(table.id, table.status)}
            >
              {/* Alert Badge for urgent statuses */}
              {(table.status === 'needs_service' || table.status === 'requesting_bill') && (
                <div className={cn(
                  "absolute top-0 right-0 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1",
                  table.status === 'needs_service' ? 'bg-amber-500' : 'bg-red-500'
                )}>
                  {table.status === 'needs_service' ? (
                    <><Bell className="w-3 h-3" /> SERVICE</>
                  ) : (
                    <><Receipt className="w-3 h-3" /> ADDITION</>
                  )}
                </div>
              )}

              <CardContent className="p-6 flex flex-col items-center justify-center aspect-square">
                <span className={cn("text-3xl font-bold mb-2", statusConfig.textColor)}>
                  {table.label}
                </span>
                
                <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
                  <Users className="w-3 h-3" />
                  <span>{table.seats}</span>
                </div>

                {table.occupants && (
                  <div className="text-xs text-muted-foreground mb-2">
                    {table.occupants} personne{table.occupants > 1 ? 's' : ''}
                  </div>
                )}

                <span className={cn(
                  "mt-2 text-xs font-medium px-2 py-1 rounded-full",
                  statusConfig.badgeBg,
                  statusConfig.textColor
                )}>
                  {statusConfig.label}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Invoice Generation Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {generatedInvoice ? 'Facture Générée' : 'Générer l\'Addition'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6">
            {generatedInvoice ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8" />
                </div>
                <p className="text-lg font-medium">Paiement enregistré avec succès !</p>
                <p className="text-muted-foreground">
                  Facture #{generatedInvoice.number}
                </p>
              </div>
            ) : (
              selectedTable && (() => {
                const table = tables.find(t => t.id === selectedTable);
                const tableOrders = Object.values(orders).flat().filter(
                  o => o.table === `Table ${table?.label}`
                );
                const total = tableOrders.reduce((acc, o) => acc + o.total, 0);

                return (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-muted-foreground mb-2">Table {table?.label}</p>
                      <p className="text-4xl font-bold text-primary">
                        {total.toLocaleString()} <span className="text-xl text-muted-foreground">FCFA</span>
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {tableOrders.length} commande(s) • {table?.occupants} personne(s)
                      </p>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 space-y-2">
                      <h4 className="font-semibold text-sm">Détail des commandes :</h4>
                      {tableOrders.map((order) => (
                        <div key={order.id} className="text-sm flex justify-between">
                          <span>#{order.id.split('-')[1]}</span>
                          <span className="font-medium">{order.total.toLocaleString()} FCFA</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()
            )}
          </div>

          <DialogFooter className="gap-2 sm:justify-center">
            {generatedInvoice ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setShowInvoiceDialog(false)}
                  className="rounded-xl"
                >
                  Fermer
                </Button>
                <Button 
                  onClick={handlePrint}
                  className="rounded-xl"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimer
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setShowInvoiceDialog(false)}
                  className="rounded-xl"
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleGenerateInvoice}
                  className="rounded-xl bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Générer & Encaisser
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
