"use client";

import { useEffect, useState, useMemo } from "react";
import {
  format,
  subDays,
  subWeeks,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  parseISO,
  endOfDay,
  startOfDay,
} from "date-fns";
import { fr } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";
import {
  Download,
  Calendar as CalendarIcon,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Banknote,
  ScanLine,
  XCircle,
  CheckCircle2,
  FileText,
  Printer,
  ShoppingBag,
  Utensils,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInvoiceStore } from "@/stores/invoices";
import { useScanStore } from "@/stores/scans";
import { useOrderStore, DashboardOrder } from "@/stores/orders";
import type { Invoice, OrderItem } from "@/types";
import type { ScanEvent } from "@/stores/scans";

// Helper to safely parse dates from various formats
const safeParseDate = (dateValue: any): Date => {
  if (!dateValue) return new Date();
  
  // Firestore Timestamp (object with toDate)
  if (typeof dateValue === 'object' && typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }
  
  // Firestore Timestamp-like object (from JSON)
  if (typeof dateValue === 'object' && 'seconds' in dateValue) {
    return new Date(dateValue.seconds * 1000);
  }
  
  // Date object
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  // String or Number
  if (typeof dateValue === 'string' || typeof dateValue === 'number') {
    return new Date(dateValue);
  }
  
  return new Date();
};

export default function AccountingPage() {
  const { invoices, subscribeToInvoices } = useInvoiceStore();
  const { scans, subscribeToScans } = useScanStore();
  const { orders, subscribeToOrders } = useOrderStore();

  const [dateFilter, setDateFilter] = useState<string>(
    new Date().toISOString().split("T")[0],
  ); // YYYY-MM-DD
  const [periodType, setPeriodType] = useState<"day" | "week" | "month">("day");
  const [activeTab, setActiveTab] = useState("invoices");

  // Subscribe to data
  useEffect(() => {
    const unsubInvoices = subscribeToInvoices();
    const unsubScans = subscribeToScans();
    const unsubOrders = subscribeToOrders();
    return () => {
      unsubInvoices();
      unsubScans();
      unsubOrders();
    };
  }, [subscribeToInvoices, subscribeToScans, subscribeToOrders]);

  // --- Date Logic ---
  const selectedDate = useMemo(() => parseISO(dateFilter), [dateFilter]);

  const getDateRange = (date: Date, type: "day" | "week" | "month") => {
    let start = startOfDay(date);
    let end = endOfDay(date);

    if (type === "week") {
      start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
      end = endOfWeek(date, { weekStartsOn: 1 });
    } else if (type === "month") {
      start = startOfMonth(date);
      end = endOfMonth(date);
    }
    return { start, end };
  };

  const { start: currentStart, end: currentEnd } = getDateRange(
    selectedDate,
    periodType,
  );

  // Previous period for comparison
  const getPreviousPeriod = () => {
    let prevDate = subDays(selectedDate, 1);

    if (periodType === "week") {
      prevDate = subWeeks(selectedDate, 1);
    } else if (periodType === "month") {
      prevDate = subMonths(selectedDate, 1);
    }

    return getDateRange(prevDate, periodType);
  };

  const { start: prevStart, end: prevEnd } = getPreviousPeriod();

  // --- Filtering ---

  const filterInvoicesByRange = (
    data: Invoice[],
    start: Date,
    end: Date,
  ): Invoice[] => {
    return data.filter((invoice) => {
      const invoiceDate = safeParseDate(invoice.createdAt);
      return isWithinInterval(invoiceDate, { start, end });
    });
  };

  const filterScansByRange = (
    data: ScanEvent[],
    start: Date,
    end: Date,
  ): ScanEvent[] => {
    return data.filter((scan) => {
      const scanDate = safeParseDate(scan.timestamp);
      return isWithinInterval(scanDate, { start, end });
    });
  };

  // Flatten orders from all statuses
  const allOrders = useMemo(() => {
    return Object.values(orders).flat();
  }, [orders]);

  const filterOrdersByRange = (
    data: DashboardOrder[],
    start: Date,
    end: Date,
  ): DashboardOrder[] => {
    return data.filter((order) => {
      const orderDate = safeParseDate(order.createdAt);
      return isWithinInterval(orderDate, { start, end });
    });
  };

  const currentInvoices = useMemo(
    () => filterInvoicesByRange(invoices, currentStart, currentEnd),
    [invoices, currentStart, currentEnd],
  );
  const prevInvoices = useMemo(
    () => filterInvoicesByRange(invoices, prevStart, prevEnd),
    [invoices, prevStart, prevEnd],
  );

  const currentScans = useMemo(
    () => filterScansByRange(scans, currentStart, currentEnd),
    [scans, currentStart, currentEnd],
  );
  const prevScans = useMemo(
    () => filterScansByRange(scans, prevStart, prevEnd),
    [scans, prevStart, prevEnd],
  );

  const currentOrders = useMemo(
    () => filterOrdersByRange(allOrders, currentStart, currentEnd),
    [allOrders, currentStart, currentEnd]
  );

  // --- Stats Calculation ---
  const calculateStats = (
    invoiceList: Invoice[],
    orderList: DashboardOrder[]
  ): {
    revenue: number;
    totalInvoices: number;
    paidCount: number;
    cancelledCount: number;
    avgTicket: number;
    totalOrders: number;
    potentialRevenue: number;
  } => {
    const paid = invoiceList.filter((i) => i.status === "paid");
    const cancelled = invoiceList.filter((i) => i.status === "cancelled");
    const revenue = paid.reduce(
      (acc: number, i: Invoice) => acc + (i.total || 0),
      0,
    );
    
    // Calculate potential revenue from orders (excluding cancelled)
    const activeOrders = orderList.filter(o => o.status !== 'cancelled');
    const potentialRevenue = activeOrders.reduce((acc, o) => acc + (o.total || 0), 0);

    return {
      revenue,
      totalInvoices: invoiceList.length,
      paidCount: paid.length,
      cancelledCount: cancelled.length,
      avgTicket: paid.length ? revenue / paid.length : 0,
      totalOrders: orderList.length,
      potentialRevenue
    };
  };

  const currentStats = calculateStats(currentInvoices, currentOrders);
  const prevStats = calculateStats(prevInvoices, []); // We don't have prev orders easily accessible in this store structure without filtering all again, simplifying for now

  const calculateGrowth = (current: number, prev: number): number => {
    if (prev === 0) return current > 0 ? 100 : 0;
    return ((current - prev) / prev) * 100;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
    })
      .format(amount)
      .replace("XOF", "FCFA");
  };

  const handlePrintInvoice = (invoiceId: string): void => {
    window.open(`/admin/invoices/${invoiceId}/print`, "_blank");
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Header & Controls */}
      <div className="flex-none flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            variant={periodType === "day" ? "default" : "ghost"}
            size="sm"
            onClick={() => setPeriodType("day")}
            className="rounded-lg"
          >
            Jour
          </Button>
          <Button
            variant={periodType === "week" ? "default" : "ghost"}
            size="sm"
            onClick={() => setPeriodType("week")}
            className="rounded-lg"
          >
            Semaine
          </Button>
          <Button
            variant={periodType === "month" ? "default" : "ghost"}
            size="sm"
            onClick={() => setPeriodType("month")}
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
                className="pl-9 rounded-xl w-40"
              />
            </div>
            <Button variant="outline" className="rounded-xl">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
          <div className="text-xs text-muted-foreground font-medium bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
            {format(currentStart, "dd MMM", { locale: fr })} -{" "}
            {format(currentEnd, "dd MMM yyyy", { locale: fr })}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          <div className="flex-none pb-6">
            <TabsList className="grid w-full grid-cols-3 max-w-[600px] rounded-xl">
              <TabsTrigger value="invoices" className="rounded-lg">
                Factures
              </TabsTrigger>
              <TabsTrigger value="orders" className="rounded-lg">
                Commandes
              </TabsTrigger>
              <TabsTrigger value="scans" className="rounded-lg">
                Scans QR
              </TabsTrigger>
            </TabsList>
          </div>

          {/* --- INVOICES TAB --- */}
          <TabsContent value="invoices" className="flex-1 flex flex-col min-h-0 mt-0 space-y-6">
            {/* KPIs */}
            <div className="flex-none grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                  trend={calculateGrowth(
                    currentStats.paidCount,
                    prevStats.paidCount,
                  )}
                  subtext={`${currentStats.totalInvoices} emises`}
                />
                <KPICard
                  title="Commandes Totales"
                  value={currentStats.totalOrders.toString()}
                  icon={ShoppingBag}
                  trend={0}
                  subtext="sur la période"
                />
                <KPICard
                  title="Revenu Potentiel"
                  value={formatCurrency(currentStats.potentialRevenue)}
                  icon={TrendingUp}
                  trend={0}
                  subtext="toutes commandes"
                />
            </div>

            {/* Invoices List */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-2">
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
                  <div className="text-center py-12 opacity-50">
                    Aucune facture trouvée
                  </div>
                ) : (
                  currentInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            invoice.status === "cancelled"
                              ? "bg-red-100 text-red-600"
                              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          }`}
                        >
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm tracking-wide">
                              {invoice.number}
                            </span>
                            <Badge
                              variant={
                                invoice.status === "paid"
                                  ? "default"
                                  : invoice.status === "cancelled"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {invoice.status === "paid"
                                ? "Payée"
                                : invoice.status === "cancelled"
                                  ? "Annulée"
                                  : invoice.status}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            {format(
                              safeParseDate(invoice.createdAt),
                              "HH:mm",
                            )}{" "}
                            • {invoice.tableId} •{" "}
                            {invoice.items.reduce(
                              (acc: number, i: OrderItem) => acc + i.qty,
                              0,
                            )}{" "}
                            articles
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="font-bold text-right">
                          {formatCurrency(invoice.total)}
                          <p className="text-[10px] text-muted-foreground font-normal">
                            {invoice.paymentMethod}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePrintInvoice(invoice.id)}
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* --- ORDERS TAB --- */}
          <TabsContent value="orders" className="flex-1 flex flex-col min-h-0 mt-0 space-y-6">
            <div className="flex-none grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                 <KPICard
                  title="Total Commandes"
                  value={currentStats.totalOrders.toString()}
                  icon={ShoppingBag}
                  trend={0}
                  subtext="sur la période"
                />
                 <KPICard
                  title="Revenu Potentiel"
                  value={formatCurrency(currentStats.potentialRevenue)}
                  icon={TrendingUp}
                  trend={0}
                  subtext="toutes commandes"
                />
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-2">
                <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <CardTitle>Liste des Commandes</CardTitle>
                  <CardDescription>
                    {currentOrders.length} commandes sur la période sélectionnée
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {currentOrders.length === 0 ? (
                      <div className="text-center py-12 opacity-50">
                        Aucune commande trouvée
                      </div>
                    ) : (
                      currentOrders.map((order) => {
                        const statusColors: Record<string, string> = {
                          pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                          preparing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                          ready: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
                          served: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                          paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                          cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                        };
                        
                        const statusLabels: Record<string, string> = {
                          pending: "En attente",
                          preparing: "En cuisine",
                          ready: "Prête",
                          served: "Servie",
                          paid: "Payée",
                          cancelled: "Annulée",
                        };

                        const statusStyle = statusColors[order.status] || "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400";
                        const statusLabel = statusLabels[order.status] || order.status;

                        return (
                        <div
                          key={order.id}
                          className="group flex items-center justify-between p-4 bg-white dark:bg-zinc-900/40 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all hover:shadow-sm"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-colors ${
                              order.status === 'cancelled' 
                                ? 'bg-red-50 text-red-500 dark:bg-red-900/10' 
                                : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 group-hover:bg-primary/10 group-hover:text-primary'
                            }`}>
                              <ShoppingBag className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-base">
                                  Table {order.tableId}
                                </span>
                                <Badge variant="outline" className={`border-0 font-medium ${statusStyle}`}>
                                  {statusLabel}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="font-medium text-foreground/80">
                                  {format(safeParseDate(order.createdAt), "HH:mm")}
                                </span>
                                <span>•</span>
                                <span>{order.items?.length || 0} articles</span>
                                {order.items && order.items.length > 0 && (
                                  <>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="max-w-[200px] truncate hidden sm:inline">
                                      {order.items.map(i => i.name).join(", ")}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg tracking-tight">
                              {formatCurrency(order.total || 0)}
                            </div>
                            <div className="text-xs text-muted-foreground font-medium">
                              {order.type === 'takeaway' ? 'À emporter' : 'Sur place'}
                            </div>
                          </div>
                        </div>
                      );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* --- SCANS TAB --- */}
          <TabsContent value="scans" className="flex-1 flex flex-col min-h-0 mt-0 space-y-6">
            <div className="flex-none grid gap-4 md:grid-cols-3">
                <KPICard
                  title="Total Scans"
                  value={currentScans.length.toString()}
                  icon={ScanLine}
                  trend={calculateGrowth(currentScans.length, prevScans.length)}
                  subtext="sur la période"
                />
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-2">
              <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                  <CardTitle>Historique des Scans</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {currentScans.length === 0 ? (
                      <div className="text-center py-12 opacity-50">
                        Aucun scan enregistré
                      </div>
                    ) : (
                      currentScans.map((scan) => (
                        <div
                          key={scan.id}
                          className="flex items-center justify-between p-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <ScanLine className="w-4 h-4 text-muted-foreground" />
                            <span>Table {scan.tableId}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {format(safeParseDate(scan.timestamp), "HH:mm:ss")}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Helper Component for KPIs
interface KPICardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trend: number;
  subtext: string;
  inverseTrend?: boolean;
}

function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  subtext,
  inverseTrend,
}: KPICardProps): React.ReactElement {
  const isPositive: boolean = trend >= 0;
  const isGood: boolean = inverseTrend ? !isPositive : isPositive;

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
          <div
            className={`flex items-center text-xs font-medium ${isGood ? "text-green-600" : "text-red-600"}`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3 h-3 mr-1" />
            ) : (
              <ArrowDownRight className="w-3 h-3 mr-1" />
            )}
            {Math.abs(trend).toFixed(0)}%
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
      </CardContent>
    </Card>
  );
}
