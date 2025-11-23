"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Plus, Search, Filter, Eye, Download, Printer, Share2,
  Receipt, CreditCard, Banknote, Smartphone, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Invoice, InvoiceType, InvoiceStatus } from "@/types";
import {
  formatCurrency,
  formatInvoiceNumber,
  getInvoiceTypeLabel,
  getInvoiceStatusConfig,
  getPaymentMethodLabel
} from "@/lib/invoice-utils";
import { toast } from "sonner";

// Mock data - Will be replaced with Firebase
const mockInvoices: Invoice[] = [
  {
    id: "inv_1",
    number: "INV-2024-00001",
    type: "table",
    tableId: "Table 5",
    items: [
      { menuId: "1", name: "Poulet Braisé", price: 4500, qty: 2 },
      { menuId: "2", name: "Coca Cola", price: 1000, qty: 2 }
    ],
    subtotal: 11000,
    tax: 2200,
    taxRate: 20,
    total: 13200,
    status: "paid",
    paymentMethod: "card",
    createdAt: { seconds: Date.now() / 1000 - 3600, nanoseconds: 0 } as any,
    paidAt: { seconds: Date.now() / 1000 - 3500, nanoseconds: 0 } as any,
    restaurantInfo: {
      name: "Restaurant Le Gourmet",
      address: "123 Avenue des Saveurs",
      phone: "+225 27 XX XX XX XX"
    }
  },
  {
    id: "inv_2",
    number: "INV-2024-00002",
    type: "takeaway",
    customerName: "Jean Dupont",
    items: [
      { menuId: "3", name: "Burger Classic", price: 3500, qty: 3 }
    ],
    subtotal: 10500,
    tax: 2100,
    taxRate: 20,
    total: 12600,
    status: "paid",
    paymentMethod: "cash",
    createdAt: { seconds: Date.now() / 1000 - 1800, nanoseconds: 0 } as any,
    paidAt: { seconds: Date.now() / 1000 - 1700, nanoseconds: 0 } as any,
    restaurantInfo: {
      name: "Restaurant Le Gourmet",
      address: "123 Avenue des Saveurs",
      phone: "+225 27 XX XX XX XX"
    }
  }
];

export default function InvoicesPage() {
  const [invoices] = useState<Invoice[]>(mockInvoices);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | InvoiceType>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | InvoiceStatus>("all");

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = 
      invoice.number.toLowerCase().includes(search.toLowerCase()) ||
      invoice.tableId?.toLowerCase().includes(search.toLowerCase()) ||
      invoice.customerName?.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = filterType === "all" || invoice.type === filterType;
    const matchesStatus = filterStatus === "all" || invoice.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Stats
  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === "paid").length,
    pending: invoices.filter(i => i.status === "pending").length,
    revenue: invoices
      .filter(i => i.status === "paid")
      .reduce((sum, i) => sum + i.total, 0)
  };

  const handleViewInvoice = (invoiceId: string) => {
    // Will navigate to /admin/invoices/[id]
    toast.info("Ouverture de la facture...");
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    toast.info(`Impression de ${invoice.number}...`);
    // Will trigger print
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    toast.info(`Téléchargement de ${invoice.number}...`);
    // Will generate PDF
  };

  const handleShareInvoice = (invoice: Invoice) => {
    const url = `${window.location.origin}/invoice/${invoice.id}`;
    if (navigator.share) {
      navigator.share({
        title: `Facture ${invoice.number}`,
        text: `Facture - ${invoice.restaurantInfo.name}`,
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Lien copié !");
    }
  };

  const getPaymentIcon = (method?: string) => {
    switch (method) {
      case "cash": return <Banknote className="w-4 h-4" />;
      case "card": return <CreditCard className="w-4 h-4" />;
      case "mobile": return <Smartphone className="w-4 h-4" />;
      default: return <Receipt className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Factures</h2>
        <p className="text-muted-foreground mt-1">Gérez toutes les factures de votre restaurant.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Total factures</div>
            <div className="text-3xl font-bold mt-2">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Payées</div>
            <div className="text-3xl font-bold mt-2 text-green-600 dark:text-green-400">{stats.paid}</div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">En attente</div>
            <div className="text-3xl font-bold mt-2 text-amber-600 dark:text-amber-400">{stats.pending}</div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Revenus</div>
            <div className="text-2xl font-bold mt-2">{formatCurrency(stats.revenue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher une facture..." 
            className="pl-9 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Type Filter */}
        <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
          <SelectTrigger className="w-full sm:w-[180px] rounded-xl">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="table">Tables</SelectItem>
            <SelectItem value="takeaway">À emporter</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
          <SelectTrigger className="w-full sm:w-[180px] rounded-xl">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="paid">Payée</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="cancelled">Annulée</SelectItem>
          </SelectContent>
        </Select>

        {/* Template Editor Button */}
        <Button 
          variant="outline"
          className="rounded-xl"
          onClick={() => window.location.href = '/admin/invoices/template'}
        >
          <Settings className="w-4 h-4 mr-2" /> Configurer Template
        </Button>

        {/* New Invoice Button */}
        <Button 
          className="rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          onClick={() => toast.info("Création de facture à venir...")}
        >
          <Plus className="w-4 h-4 mr-2" /> Nouvelle facture
        </Button>
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        {filteredInvoices.length === 0 ? (
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-12 text-center">
              <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune facture trouvée</p>
            </CardContent>
          </Card>
        ) : (
          filteredInvoices.map((invoice) => {
            const statusConfig = getInvoiceStatusConfig(invoice.status);
            
            return (
              <Card 
                key={invoice.id}
                className="group rounded-2xl border-zinc-200 dark:border-zinc-800 hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Invoice Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg">
                            {formatInvoiceNumber(invoice.number)}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(invoice.createdAt.seconds * 1000), 'PPp', { locale: fr })}
                          </p>
                        </div>
                        <Badge variant="secondary" className={`${statusConfig.color} font-semibold`}>
                          {statusConfig.label}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="rounded-lg">
                            {getInvoiceTypeLabel(invoice.type)}
                          </Badge>
                          <span className="font-medium">
                            {invoice.type === 'table' ? invoice.tableId : invoice.customerName}
                          </span>
                        </div>
                        
                        {invoice.paymentMethod && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            {getPaymentIcon(invoice.paymentMethod)}
                            <span>{getPaymentMethodLabel(invoice.paymentMethod)}</span>
                          </div>
                        )}
                        
                        <div className="font-bold text-lg">
                          {formatCurrency(invoice.total)}
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {invoice.items.length} article{invoice.items.length > 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full"
                        onClick={() => handleViewInvoice(invoice.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full"
                        onClick={() => handlePrintInvoice(invoice)}
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full"
                        onClick={() => handleDownloadInvoice(invoice)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full"
                        onClick={() => handleShareInvoice(invoice)}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
