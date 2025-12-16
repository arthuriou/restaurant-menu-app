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
import { cn } from "@/lib/utils";

export default function ServerInvoicesPage() {
  const { invoices, addInvoice } = useInvoiceStore();
  const { tables, closeTable } = useTableStore();
  const { orders } = useOrderStore();
  const { invoiceSettings } = useRestaurantStore();
  const { user } = useAuthStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Only show finalized invoices from the store
  const displayList = invoices.filter(inv => 
    inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.tableId && inv.tableId.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

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
        paymentMethod: 'cash',
        serverName: user?.name,
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        paidAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        restaurantInfo: getRestaurantInfo()
      };

      await addInvoice(newInvoice);
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
    <div className="h-[calc(100vh-2rem)] flex flex-col bg-zinc-50 dark:bg-black p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Factures</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestion des encaissements et historique</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher..." 
            className="pl-9 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-zinc-400" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1 -mx-4 px-4">
        <div className="space-y-2 pb-20 max-w-4xl mx-auto">
          {displayList.length === 0 ? (
            <div className="text-center py-20 opacity-40">
              <FileText className="w-12 h-12 mx-auto mb-3" />
              <p>Aucune facture</p>
            </div>
          ) : (
            displayList.map((invoice: any) => {
               const isProvisional = invoice.isProvisional;
               const isRequestingBill = invoice.isRequestingBill;
               
               return (
                <div 
                  key={invoice.id}
                  onClick={() => handleOpenInvoice(invoice)}
                  className={cn(
                    "group flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer",
                    "bg-white dark:bg-zinc-900",
                    isRequestingBill 
                      ? "border-red-200 bg-red-50/10 dark:border-red-900/30" 
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      isRequestingBill ? "bg-red-100 text-red-600 dark:bg-red-900/30" :
                      isProvisional ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20" :
                      "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                    )}>
                      {isRequestingBill ? <BellRing className="w-5 h-5" /> : 
                       isProvisional ? <Utensils className="w-5 h-5" /> : 
                       <FileText className="w-5 h-5" />}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase">
                          {isProvisional ? (isRequestingBill ? `Demande: ${invoice.number}` : invoice.number) : invoice.number}
                        </span>
                        {isRequestingBill && (
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                         <span>{new Date(invoice.createdAt.seconds * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                         <span>•</span>
                         <span>{invoice.items?.length || 0} articles</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                      {invoice.total.toLocaleString()} FCFA
                    </div>
                    <div className="text-xs font-medium mt-0.5">
                      {isProvisional ? (
                        <span className="text-blue-600 dark:text-blue-400">À encaisser</span>
                      ) : (
                        <span className="text-green-600 dark:text-green-500">Payé ({invoice.paymentMethod === 'card' ? 'CB' : 'Esp'})</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] p-0 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col h-full ring-0 shadow-2xl">
           <div className="p-4 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center">
             <SheetTitle className="text-lg font-bold">
               {(selectedInvoice as any)?.isProvisional ? "Encaissement" : "Détails"}
             </SheetTitle>
             <Button variant="ghost" size="icon" onClick={() => setIsSheetOpen(false)}>
               <X className="w-4 h-4" />
             </Button>
           </div>

           <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-black p-6">
             {selectedInvoice && (
               <OrderBill 
                 order={invoiceToOrder(selectedInvoice)} 
                 companyName={invoiceSettings.companyName || "RESTAURANT"}
                 showActions={false}
               />
             )}
           </div>

           <div className="p-4 border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 space-y-3">
             {(selectedInvoice as any)?.isProvisional ? (
                <Button 
                  onClick={() => handleProcessPayment(selectedInvoice)} 
                  disabled={isGenerating}
                  className="w-full h-12 rounded-lg text-base font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200" 
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Banknote className="mr-2 w-4 h-4" />} 
                  Encaisser {selectedInvoice?.total.toLocaleString()} FCFA
                </Button>
             ) : (
                <Button 
                  onClick={() => selectedInvoice && handlePrint(selectedInvoice.id)} 
                  variant="outline"
                  className="w-full h-12 rounded-lg text-base font-medium" 
                >
                  <Printer className="mr-2 w-4 h-4" /> Imprimer le ticket
                </Button>
             )}
           </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
