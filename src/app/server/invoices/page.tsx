"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";

export default function ServerInvoicesPage() {
  const { invoices } = useInvoiceStore();
  const { invoiceSettings } = useRestaurantStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
  const [periodType, setPeriodType] = useState<"day" | "week" | "month">("day");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Combine and filter
  const displayList = invoices.filter(inv => {
    const matchesSearch = inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.tableId && inv.tableId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const invoiceDate = new Date(inv.createdAt.seconds * 1000);
    const filterDate = parseISO(dateFilter);
    
    let matchesDate = false;

    if (periodType === 'day') {
       matchesDate = invoiceDate.toISOString().split('T')[0] === dateFilter;
    } else if (periodType === 'week') {
       const start = startOfWeek(filterDate, { weekStartsOn: 1 });
       const end = endOfWeek(filterDate, { weekStartsOn: 1 });
       matchesDate = isWithinInterval(invoiceDate, { start, end });
    } else if (periodType === 'month') {
       const start = startOfMonth(filterDate);
       const end = endOfMonth(filterDate);
       matchesDate = isWithinInterval(invoiceDate, { start, end });
    }

    return matchesSearch && matchesDate;
  }).sort((a, b) => {
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
    <div className="h-[calc(100vh-2rem)] flex flex-col bg-background p-4 transition-colors duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground transition-colors duration-200">Factures</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestion des encaissements et historique</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
          <Tabs value={periodType} onValueChange={(v) => setPeriodType(v as any)} className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="day">Jour</TabsTrigger>
              <TabsTrigger value="week">Semaine</TabsTrigger>
              <TabsTrigger value="month">Mois</TabsTrigger>
            </TabsList>
          </Tabs>

          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full sm:w-40 bg-card border-border transition-colors duration-200"
          />
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher..." 
              className="pl-9 bg-card border-border focus-visible:ring-ring transition-colors duration-200" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
                    "bg-card border-border hover:border-primary/30 transition-colors duration-200"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      "bg-secondary text-muted-foreground transition-colors duration-200"
                    )}>
                       <FileText className="w-5 h-5" />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground uppercase transition-colors duration-200">
                          {invoice.number}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                         <span>
                           {new Date(invoice.createdAt.seconds * 1000).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                           {' '}
                           {new Date(invoice.createdAt.seconds * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                         </span>
                         <span>•</span>
                         <span>{invoice.items?.reduce((acc: number, item) => acc + (item.qty || 0), 0) || 0} articles</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-lg text-foreground transition-colors duration-200">
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
        <SheetContent className="w-[400px] sm:w-[540px] p-0 border-l border-border bg-card flex flex-col h-full ring-0 shadow-2xl transition-colors duration-200">
           <div className="p-4 border-b border-border flex justify-between items-center transition-colors duration-200">
             <SheetTitle className="text-lg font-bold">
               Détails
             </SheetTitle>
             <Button variant="ghost" size="icon" onClick={() => setIsSheetOpen(false)}>
               <X className="w-4 h-4" />
             </Button>
           </div>

           <div className="flex-1 overflow-y-auto bg-background p-6 transition-colors duration-200">
             {selectedInvoice && (
               <OrderBill 
                 order={invoiceToOrder(selectedInvoice)} 
                 companyName={invoiceSettings.companyName || "RESTAURANT"}
                 showActions={false}
               />
             )}
           </div>

           <div className="p-4 border-t border-border bg-card space-y-3 transition-colors duration-200">
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
