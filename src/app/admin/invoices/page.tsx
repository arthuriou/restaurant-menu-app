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

import { useInvoiceStore } from "@/stores/invoices";

// Helper for payment icons
const getPaymentIcon = (method?: string) => {
  switch (method) {
    case 'cash':
      return <Banknote className="w-4 h-4" />;
    case 'card':
      return <CreditCard className="w-4 h-4" />;
    case 'mobile':
      return <Smartphone className="w-4 h-4" />;
    default:
      return null;
  }
};

export default function InvoicesPage() {
  const { invoices } = useInvoiceStore();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | InvoiceType>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | InvoiceStatus>("all");

  const [period, setPeriod] = useState<"day" | "week" | "month" | "all">("all");

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = 
      invoice.number.toLowerCase().includes(search.toLowerCase()) ||
      invoice.tableId?.toLowerCase().includes(search.toLowerCase()) ||
      invoice.customerName?.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = filterType === "all" || invoice.type === filterType;
    const matchesStatus = filterStatus === "all" || invoice.status === filterStatus;
    
    let matchesPeriod = true;
    if (period !== "all") {
      const date = new Date(invoice.createdAt.seconds * 1000);
      const now = new Date();
      if (period === "day") {
        matchesPeriod = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      } else if (period === "week") {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        matchesPeriod = date >= oneWeekAgo;
      } else if (period === "month") {
        matchesPeriod = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }
    }

    return matchesSearch && matchesType && matchesStatus && matchesPeriod;
  });

  // Stats
  const stats = {
    total: filteredInvoices.length,
    paid: filteredInvoices.filter(i => i.status === "paid").length,
    cancelled: filteredInvoices.filter(i => i.status === "cancelled").length,
    revenue: filteredInvoices
      .filter(i => i.status === "paid")
      .reduce((sum, i) => sum + i.total, 0)
  };

  const handleExportCSV = () => {
    const headers = ["Numéro", "Date", "Type", "Table/Client", "Total", "Statut", "Moyen de paiement"];
    const rows = filteredInvoices.map(inv => [
      inv.number,
      new Date(inv.createdAt.seconds * 1000).toLocaleDateString(),
      getInvoiceTypeLabel(inv.type), // Use label helper
      inv.type === 'table' ? inv.tableId : inv.customerName,
      inv.total,
      getInvoiceStatusConfig(inv.status).label, // Use label helper
      getPaymentMethodLabel(inv.paymentMethod) // Use label helper
    ]);

    const csvContent = "\uFEFF" // BOM for Excel UTF-8
      + headers.join(";") + "\n" 
      + rows.map(e => e.join(";")).join("\n");

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `factures_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export CSV téléchargé");
  };

  const handleViewInvoice = (id: string) => {
    toast.info("Ouverture de la facture...");
    // Navigate to invoice detail page
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    window.open(`/admin/invoices/${invoice.id}/print`, '_blank');
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    toast.info("Téléchargement de la facture...");
    // Download PDF logic
  };

  const handleShareInvoice = (invoice: Invoice) => {
    toast.info("Partage de la facture...");
    // Share invoice logic
  };

  // ... (keep other handlers)

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Comptabilité</h2>
          <p className="text-muted-foreground mt-1">Gérez vos finances et consultez vos rapports comptables.</p>
        </div>
        <Button 
          variant="outline" 
          className="rounded-xl"
          onClick={handleExportCSV}
        >
          <Download className="w-4 h-4 mr-2" /> Exporter CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Total factures</div>
                <div className="text-3xl font-bold mt-2">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">Période sélectionnée</p>
              </div>
              <Receipt className="w-10 h-10 text-zinc-200 dark:text-zinc-800" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 overflow-hidden bg-gradient-to-br from-green-50 to-transparent dark:from-green-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Payées</div>
                <div className="text-3xl font-bold mt-2 text-green-600 dark:text-green-400">{stats.paid}</div>
                <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">
                  {stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0}% du total
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 overflow-hidden bg-gradient-to-br from-red-50 to-transparent dark:from-red-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Annulées</div>
                <div className="text-3xl font-bold mt-2 text-red-600 dark:text-red-400">{stats.cancelled}</div>
                <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">
                  {stats.total > 0 ? Math.round((stats.cancelled / stats.total) * 100) : 0}% du total
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <span className="text-xl">⚠️</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 overflow-hidden bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Revenus totaux</div>
                <div className="text-2xl font-bold mt-2">{formatCurrency(stats.revenue)}</div>
                <p className="text-xs text-primary/70 mt-1">Transactions réussies</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Banknote className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Analytics */}
      <div className="grid gap-6">
        {/* Revenue Evolution Chart */}
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-lg">Évolution des Revenus (7 derniers jours)</h3>
                <p className="text-sm text-muted-foreground">Chiffre d'affaires quotidien</p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { day: 'Lun', revenue: 125000, color: 'bg-primary' },
                { day: 'Mar', revenue: 98000, color: 'bg-primary' },
                { day: 'Mer', revenue: 156000, color: 'bg-primary' },
                { day: 'Jeu', revenue: 142000, color: 'bg-primary' },
                { day: 'Ven', revenue: 198000, color: 'bg-green-500' },
                { day: 'Sam', revenue: 234000, color: 'bg-green-500' },
                { day: 'Dim', revenue: 187000, color: 'bg-green-500' },
              ].map((item, i) => {
                const maxRevenue = 250000;
                const percentage = (item.revenue / maxRevenue) * 100;
                return (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-sm font-medium w-12 text-muted-foreground">{item.day}</span>
                    <div className="flex-1 bg-zinc-100 dark:bg-zinc-900 rounded-full h-10 relative overflow-hidden">
                      <div 
                        className={`${item.color} h-full rounded-full transition-all duration-500 flex items-center justify-end pr-4`}
                        style={{ width: `${percentage}%` }}
                      >
                        <span className="text-sm font-bold text-white">{formatCurrency(item.revenue)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher..." 
            className="pl-9 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Period Filter */}
        <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
          <SelectTrigger className="w-[140px] rounded-xl">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Tout</SelectItem>
            <SelectItem value="day">Aujourd'hui</SelectItem>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
          <SelectTrigger className="w-[140px] rounded-xl">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Tous types</SelectItem>
            <SelectItem value="table">Tables</SelectItem>
            <SelectItem value="takeaway">Emporter</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
          <SelectTrigger className="w-[140px] rounded-xl">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Tous statuts</SelectItem>
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
          <Settings className="w-4 h-4 mr-2" /> Template
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
