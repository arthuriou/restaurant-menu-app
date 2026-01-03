"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, Printer, FileText, 
  X
} from "lucide-react";
import { useState } from "react";
import { useInvoiceStore } from "@/stores/invoices";
import { useRestaurantStore } from "@/stores/restaurant";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { OrderBill } from "@/components/order/OrderBill";
import { Invoice } from "@/types";
import { cn } from "@/lib/utils";

export default function ServerInvoicesPage() {
  const { invoices } = useInvoiceStore();
  const { invoiceSettings } = useRestaurantStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Combine and filter
  const displayList = invoices.filter(inv => 
    inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.tableId && inv.tableId.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => {
    return b.createdAt.seconds - a.createdAt.seconds;
  });

  const handleOpenInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsSheetOpen(true);
  };

  const handlePrint = (invoiceId: string) => {
    window.open(`/print/invoice/${invoiceId}`, '_blank');
  };

  const invoiceToOrder = (inv: Invoice | unknown): any => {
    const invoice = inv as Invoice;
    return {
      id: invoice.id,
      tableId: invoice.tableId,
      status: invoice.status === 'pending' ? 'pending' : 'paid',
      items: invoice.items.map((item) => ({
        ...item,
        imageUrl: item.imageUrl, 
        qty: item.qty
      })),
      total: invoice.total,
      createdAt: invoice.createdAt,
      table: invoice.tableId 
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
            displayList.map((invoice) => {
               return (
                <div 
                  key={invoice.id}
                  onClick={() => handleOpenInvoice(invoice)}
                  className={cn(
                    "group flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer",
                    "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                    )}>
                       <FileText className="w-5 h-5" />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase">
                          {invoice.number}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                         <span>{new Date(invoice.createdAt.seconds * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                         <span>•</span>
                         <span>{invoice.items?.reduce((acc: number, item) => acc + (item.qty || 0), 0) || 0} articles</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                      {invoice.total.toLocaleString()} FCFA
                    </div>
                    <div className="text-xs font-medium mt-0.5">
                        <span className="text-green-600 dark:text-green-500">Payé ({invoice.paymentMethod === 'card' ? 'CB' : 'Esp'})</span>
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
               Détails
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
                <Button 
                  onClick={() => selectedInvoice && handlePrint(selectedInvoice.id)} 
                  variant="outline"
                  className="w-full h-12 rounded-lg text-base font-medium" 
                >
                  <Printer className="mr-2 w-4 h-4" /> Imprimer le ticket
                </Button>
           </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
