"use client";

import { useEffect, useState, useMemo } from "react";
import { format, isSameDay, subDays, subWeeks, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO, endOfDay, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Search, Download, Calendar as CalendarIcon, ArrowUpRight, ArrowDownRight,
  CreditCard, Banknote, Filter, History, ScanLine, XCircle, CheckCircle2, FileText, Printer
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInvoiceStore } from "@/stores/invoices"; // Changed from Orders
import { useScanStore } from "@/stores/scans";
import { Invoice } from "@/types";

export default function AccountingPage() {
  const { invoices, subscribeToInvoices } = useInvoiceStore();
  const { scans, subscribeToScans } = useScanStore();
  
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [periodType, setPeriodType] = useState<'day' | 'week' | 'month'>('day');
  const [activeTab, setActiveTab] = useState("invoices");

  // Subscribe to data
  useEffect(() => {
    const unsubInvoices = subscribeToInvoices();
    const unsubScans = subscribeToScans();
    return () => {
      unsubInvoices();
      unsubScans();
    };
  }, [subscribeToInvoices, subscribeToScans]);

  // --- Date Logic ---
  const selectedDate = useMemo(() => parseISO(dateFilter), [dateFilter]);

  const getDateRange = (date: Date, type: 'day' | 'week' | 'month') => {
    let start = startOfDay(date);
    let end = endOfDay(date);

    if (type === 'week') {
      start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
      end = endOfWeek(date, { weekStartsOn: 1 });
    } else if (type === 'month') {
      start = startOfMonth(date);
      end = endOfMonth(date);
    }
    return { start, end };
  };

  const { start: currentStart, end: currentEnd } = getDateRange(selectedDate, periodType);

  // Previous period for comparison
  const getPreviousPeriod = () => {
    let prevDate = subDays(selectedDate, 1);
    
    if (periodType === 'week') {
      prevDate = subWeeks(selectedDate, 1);
    } else if (periodType === 'month') {
      prevDate = subMonths(selectedDate, 1);
    }
    
    return getDateRange(prevDate, periodType);
  };

  const { start: prevStart, end: prevEnd } = getPreviousPeriod();

  // --- Filtering ---
  
  const filterDataByRange = (data: any[], dateField: string, start: Date, end: Date) => {
    return data.filter(item => {
      if (!item[dateField]) return false;
      // Handle Firestore Timestamp or Date object or String
      let itemDate = new Date();
      if (item[dateField]?.seconds) {
        itemDate = new Date(item[dateField].seconds * 1000);
      } else if (item[dateField] instanceof Date) {
        itemDate = item[dateField];
      } else {
        return false; // Invalid date
      }
      return isWithinInterval(itemDate, { start, end });
    });
  };

  const currentInvoices = useMemo(() => filterDataByRange(invoices, 'createdAt', currentStart, currentEnd), [invoices, currentStart, currentEnd]);
  const prevInvoices = useMemo(() => filterDataByRange(invoices, 'createdAt', prevStart, prevEnd), [invoices, prevStart, prevEnd]);

  const currentScans = useMemo(() => filterDataByRange(scans, 'timestamp', currentStart, currentEnd), [scans, currentStart, currentEnd]);
  const prevScans = useMemo(() => filterDataByRange(scans, 'timestamp', prevStart, prevEnd), [scans, prevStart, prevEnd]);

  // --- Stats Calculation ---
  const calculateStats = (invoiceList: Invoice[]) => {
    const paid = invoiceList.filter(i => i.status === 'paid');
    const cancelled = invoiceList.filter(i => i.status === 'cancelled');
    const revenue = paid.reduce((acc, i) => acc + (i.total || 0), 0);
    return {
      revenue,
      totalInvoices: invoiceList.length,
      paidCount: paid.length,
      cancelledCount: cancelled.length,
      avgTicket: paid.length ? revenue / paid.length : 0
    };
  };

  const currentStats = calculateStats(currentInvoices);
  const prevStats = calculateStats(prevInvoices);

  const calculateGrowth = (current: number, prev: number) => {
    if (prev === 0) return current > 0 ? 100 : 0;
    return ((current - prev) / prev) * 100;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount).replace('XOF', 'FCFA');
  };

  const handlePrintInvoice = (invoiceId: string) => {
    window.open(`/admin/invoices/${invoiceId}/print`, '_blank');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Comptabilité & Factures
          </h2>
          <p className="text-muted-foreground mt-1">
            Suivi des factures générées et des encaissements.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
          <Button 
            variant={periodType === 'day' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setPeriodType('day')}
            className="rounded-lg"
          >
            Jour
          </Button>
          <Button 
            variant={periodType === 'week' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setPeriodType('week')}
            className="rounded-lg"
          >
            Semaine
          </Button>
          <Button 
            variant={periodType === 'month' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setPeriodType('month')}
            className="rounded-lg"
          >
            Mois
          </Button>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="date" 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-9 rounded-xl w-[160px]"
              />
            </div>
            <Button variant="outline" className="rounded-xl">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
          <div className="text-xs text-muted-foreground font-medium bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
            {format(currentStart, 'dd MMM', { locale: fr })} - {format(currentEnd, 'dd MMM yyyy', { locale: fr })}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] rounded-xl">
          <TabsTrigger value="invoices" className="rounded-lg">Factures</TabsTrigger>
          <TabsTrigger value="scans" className="rounded-lg">Scans QR</TabsTrigger>
        </TabsList>

        {/* --- INVOICES TAB --- */}
        <TabsContent value="invoices" className="space-y-6">
          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-4">
            <KPICard 
              title="Chiffre d'Affaires" 
              value={formatCurrency(currentStats.revenue)} 
              icon={Banknote} 
              trend={calculateGrowth(currentStats.revenue, prevStats.revenue)}
              subtext="vs période préc."
            />
            <KPICard 
              title="Factures Payées" 
              value={currentStats.paidCount.toString()} 
              icon={CheckCircle2} 
              trend={calculateGrowth(currentStats.paidCount, prevStats.paidCount)}
              subtext={`${currentStats.totalInvoices} emises`}
            />
            <KPICard 
              title="Ticket Moyen" 
              value={formatCurrency(currentStats.avgTicket)} 
              icon={CreditCard} 
              trend={calculateGrowth(currentStats.avgTicket, prevStats.avgTicket)}
              subtext="par facture"
            />
            <KPICard 
              title="Annulations" 
              value={currentStats.cancelledCount.toString()} 
              icon={XCircle} 
              trend={calculateGrowth(currentStats.cancelledCount, prevStats.cancelledCount)}
              inverseTrend // Red if up
              subtext="factures annulées"
            />
          </div>

          {/* Invoices List */}
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Liste des Factures</CardTitle>
              <CardDescription>
                {currentInvoices.length} factures sur la période sélectionnée
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentInvoices.length === 0 ? (
                  <div className="text-center py-12 opacity-50">Aucune facture trouvée</div>
                ) : (
                  currentInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          invoice.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm tracking-wide">{invoice.number}</span>
                            <Badge variant={invoice.status === 'paid' ? 'default' : invoice.status === 'cancelled' ? 'destructive' : 'secondary'}>
                              {invoice.status === 'paid' ? 'Payée' : invoice.status === 'cancelled' ? 'Annulée' : invoice.status}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                             {format(invoice.createdAt.seconds * 1000, 'HH:mm')} • {invoice.tableId} • {invoice.items.reduce((acc, i: ) => acc + i.qty, 0)} articles
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="font-bold text-right">
                           {formatCurrency(invoice.total)}
                           <p className="text-[10px] text-muted-foreground font-normal">{invoice.paymentMethod}</p>
                         </div>
                         <Button variant="ghost" size="icon" onClick={() => handlePrintInvoice(invoice.id)}>
                           <Printer className="w-4 h-4" />
                         </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- SCANS TAB --- */}
        <TabsContent value="scans" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
             <KPICard 
              title="Total Scans" 
              value={currentScans.length.toString()} 
              icon={ScanLine} 
              trend={calculateGrowth(currentScans.length, prevScans.length)}
              subtext="sur la période"
            />
          </div>

          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Historique des Scans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                 {currentScans.length === 0 ? (
                  <div className="text-center py-12 opacity-50">Aucun scan enregistré</div>
                ) : (
                  currentScans.map((scan) => (
                    <div key={scan.id} className="flex items-center justify-between p-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                      <div className="flex items-center gap-3">
                        <ScanLine className="w-4 h-4 text-muted-foreground" />
                        <span>Table {scan.tableId}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {format(scan.timestamp, 'HH:mm:ss')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper Component for KPIs
function KPICard({ title, value, icon: Icon, trend, subtext, inverseTrend }: any) {
  const isPositive = trend >= 0;
  const isGood = inverseTrend ? !isPositive : isPositive;
  
  return (
    <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Icon className="w-4 h-4 opacity-70" />
          </div>
        </div>
        <div className="flex items-end justify-between">
          <h3 className="text-2xl font-bold">{value}</h3>
          <div className={`flex items-center text-xs font-medium ${isGood ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {Math.abs(trend).toFixed(0)}%
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
      </CardContent>
    </Card>
  );
}
