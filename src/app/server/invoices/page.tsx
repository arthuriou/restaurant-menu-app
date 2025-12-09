"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, Printer, FileText, Calendar, Wallet, 
  CreditCard, Banknote, Sparkles, X, Eye, 
  BellRing, Loader2, Receipt, Utensils
} from "lucide-react";
import { useState, useMemo } from "react";
import { useInvoiceStore } from "@/stores/invoices";
import { useTableStore } from "@/stores/tables"; 
import { useOrderStore } from "@/stores/orders"; 
import { useRestaurantStore } from "@/stores/restaurant";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { OrderBill } from "@/components/order/OrderBill";
import { Invoice } from "@/types";
import { calculateTotal, calculateTax, generateInvoiceNumber, getRestaurantInfo } from "@/lib/invoice-utils";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth";

export default function ServerInvoicesPage() {
  const { invoices, addInvoice } = useInvoiceStore();
  const { tables, closeTable, resolveServiceRequest } = useTableStore();
  const { orders } = useOrderStore();
  const { invoiceSettings } = useRestaurantStore();
  const { user } = useAuthStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // 1. Compute Active Bills (All occupied tables with orders)
  const pendingBills = useMemo(() => {
    return tables
      .filter(t => t.status !== 'available') // Get ALL active tables
      .map(table => {
        // Gather orders for this table
        const tableOrders = Object.values(orders).flat().filter(
          o => o.table === `Table ${table.label}` && o.status !== 'cancelled' && o.status !== 'paid'
        );

        if (tableOrders.length === 0) return null;

        const subtotal = tableOrders.reduce((acc, o) => acc + o.total, 0);
        const taxRate = invoiceSettings.taxRate;
        const tax = calculateTax(subtotal, taxRate);
        const total = calculateTotal(subtotal, taxRate);

        const isRequestingBill = table.status === 'requesting_bill';

        // Create a provisional invoice object
        return {
          id: `provisional_${table.id}`,
          number: isRequestingBill ? `DEMANDE-${table.label}` : `TABLE-${table.label}`,
          type: 'table',
          tableId: `Table ${table.label}`,
          items: tableOrders.flatMap(o => o.items), // Flatten items
          subtotal,
          tax,
          taxRate,
          total,
          status: 'pending', 
          paymentMethod: 'pending',
          createdAt: { seconds: Date.now() / 1000 },
          isProvisional: true, 
          isRequestingBill, // Flag for UI styling
          realTableId: table.id
        } as unknown as Invoice & { isProvisional: boolean, isRequestingBill: boolean, realTableId: string };
      })
      .filter(Boolean) as (Invoice & { isProvisional: boolean, isRequestingBill: boolean, realTableId: string })[];
  }, [tables, orders, invoiceSettings]);

  const filteredInvoices = invoices.filter(inv => 
    inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.tableId && inv.tableId.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

  // Merge lists for display, putting pending first
  const displayList = [...pendingBills, ...filteredInvoices];

  const handleOpenInvoice = (invoice: Invoice | any) => {
    setSelectedInvoice(invoice);
    setIsSheetOpen(true);
  };

  const handlePrint = (invoiceId: string) => {
    if (invoiceId.startsWith('provisional_')) {
      toast.error("Veuillez d'abord encaisser pour imprimer une facture officielle");
      return;
    }
    window.open(`/admin/invoices/${invoiceId}/print`, '_blank');
  };

  const handleProcessPayment = async (provisionalInv: any) => {
    setIsGenerating(true);
    try {
      // Create real invoice
      const newInvoice: Invoice = {
        id: `inv_${Date.now()}`,
        number: generateInvoiceNumber(),
        type: provisionalInv.type,
        tableId: provisionalInv.tableId,
        items: provisionalInv.items,
        subtotal: provisionalInv.subtotal,
        tax: provisionalInv.tax,
        taxRate: provisionalInv.taxRate,
        total: provisionalInv.total,
        status: 'paid',
        paymentMethod: 'cash', // Default to cash for now, could add selector
        serverName: user?.name,
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        paidAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        restaurantInfo: getRestaurantInfo()
      };

      await addInvoice(newInvoice);
      
      // Close table / Resolve request
      await closeTable(provisionalInv.realTableId);
      
      toast.success(`Facture ${newInvoice.number} générée et table libérée !`);
      setIsSheetOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de l'encaissement");
    } finally {
      setIsGenerating(false);
    }
  };

  // Convert Invoice to Order structure for OrderBill component
  const invoiceToOrder = (inv: Invoice | any): any => {
    return {
      id: inv.id,
      tableId: inv.tableId,
      status: inv.status === 'pending' ? 'pending' : 'paid',
      items: inv.items.map((item: any) => ({
        ...item,
        imageUrl: item.imageUrl || item.image, 
        qty: item.qty || item.quantity
      })),
      total: inv.total,
      createdAt: inv.createdAt,
      table: inv.tableId 
    };
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col bg-zinc-50/50 dark:bg-black p-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 px-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tighter uppercase">Factures</h1>
          <p className="text-muted-foreground flex items-center gap-2">
             <Sparkles className="w-4 h-4 text-amber-500" />
             Historique & Demandes
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher (N°, Table)..." 
            className="pl-10 h-10 rounded-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1 -mx-2 px-2">
        <div className="space-y-3 pb-20 max-w-3xl mx-auto">
          {displayList.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <FileText className="w-16 h-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
              <p className="text-lg font-medium">Aucune facture trouvée</p>
            </div>
          ) : (
            displayList.map((invoice: any) => {
               const isProvisional = invoice.isProvisional;
               const isRequestingBill = invoice.isRequestingBill;
               
               let cardClasses = "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700";
               let iconBg = "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black";
               let amountColor = "";

               if (isRequestingBill) {
                 cardClasses = "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/50 hover:border-red-300 ring-1 ring-red-500/20";
                 iconBg = "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse";
                 amountColor = "text-red-600 dark:text-red-400";
               } else if (isProvisional) {
                 cardClasses = "bg-blue-50/50 dark:bg-blue-900/5 border-blue-200 dark:border-blue-900/30 hover:border-blue-300";
                 iconBg = "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
                 amountColor = "text-blue-600 dark:text-blue-400";
               }

               return (
                <div 
                  key={invoice.id}
                  onClick={() => handleOpenInvoice(invoice)}
                  className={`group cursor-pointer rounded-[2rem] p-5 shadow-sm border flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300 hover:scale-[1.01] hover:shadow-md ${cardClasses}`}
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${iconBg}`}>
                      {isRequestingBill ? <BellRing className="w-6 h-6" /> : (isProvisional ? <Utensils className="w-6 h-6" /> : <FileText className="w-6 h-6" />)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg tracking-tight flex items-center gap-2">
                        {isProvisional ? (isRequestingBill ? "Demande d'addition" : "Table en cours") : invoice.number}
                        {isProvisional ? (
                          isRequestingBill ? (
                            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Action Requise</span>
                          ) : (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">En cours</span>
                          )
                        ) : (
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Payée</span>
                        )}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{invoice.tableId || 'Emporter'}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-300" />
                        <div className="flex items-center gap-1">
                           <Calendar className="w-3 h-3" />
                           <span>{new Date(invoice.createdAt.seconds * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <div className={`font-black text-xl ${amountColor}`}>{invoice.total.toLocaleString()} FCFA</div>
                      <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                        {isProvisional ? (
                          <span className="italic">Non encaissée</span>
                        ) : (
                          <>
                            {invoice.paymentMethod === 'card' ? <CreditCard className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                            <span className="capitalize">{invoice.paymentMethod === 'card' ? 'Carte' : 'Espèces'}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <Button 
                      variant="ghost"
                      size="icon"
                      className="rounded-full h-12 w-12 shrink-0 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"
                    >
                      <Eye className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] p-0 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black flex flex-col h-full">
           <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center flex-shrink-0">
             <div>
               <SheetTitle className="text-xl font-black uppercase tracking-tight">
                 {(selectedInvoice as any)?.isProvisional ? "Aperçu Addition" : "Détail Facture"}
               </SheetTitle>
               <p className="text-sm text-muted-foreground">Vue client exacte</p>
             </div>
             <Button variant="ghost" size="icon" onClick={() => setIsSheetOpen(false)} className="rounded-full">
               <X className="w-5 h-5" />
             </Button>
           </div>

           <div className="flex-1 overflow-y-auto p-6">
             {selectedInvoice && (
               <OrderBill 
                 order={invoiceToOrder(selectedInvoice)} 
                 companyName={invoiceSettings.companyName || "RESTAURANT"}
                 showActions={false}
               />
             )}
           </div>

           <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-shrink-0 space-y-3">
             {(selectedInvoice as any)?.isProvisional ? (
                <Button 
                  onClick={() => handleProcessPayment(selectedInvoice)} 
                  disabled={isGenerating}
                  className="w-full h-12 rounded-xl text-lg font-bold shadow-lg bg-green-600 hover:bg-green-700 text-white" 
                  size="lg"
                >
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Banknote className="mr-2 w-5 h-5" />} 
                  Encaisser & Clôturer
                </Button>
             ) : (
                <Button 
                  onClick={() => selectedInvoice && handlePrint(selectedInvoice.id)} 
                  className="w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-zinc-200 dark:shadow-zinc-900" 
                  size="lg"
                >
                  <Printer className="mr-2 w-5 h-5" /> Imprimer le ticket
                </Button>
             )}
           </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
