"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, TrendingUp, TrendingDown,
  UtensilsCrossed, ScanLine, BarChart3, Clock,
  Calendar, ShoppingCart, Banknote, Users
} from "lucide-react";
import { useOrderStore } from "@/stores/orders";
import { useTableStore } from "@/stores/tables";
import { useInvoiceStore } from "@/stores/invoices";
import { useScanStore } from "@/stores/scans";
import { format, isToday, startOfDay, endOfDay, subDays, subWeeks, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export default function AdminDashboardPage() {
  const { orders, subscribeToOrders } = useOrderStore();
  const { tables, subscribeToTables } = useTableStore();
  const { invoices, subscribeToInvoices } = useInvoiceStore();
  const { scans, subscribeToScans } = useScanStore();
  
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split("T")[0]);
  const [periodType, setPeriodType] = useState<"day" | "week" | "month">("day");

  // Subscribe to real-time data
  useEffect(() => {
    const unsubOrders = subscribeToOrders();
    const unsubTables = subscribeToTables();
    const unsubInvoices = subscribeToInvoices();
    const unsubScans = subscribeToScans();
    
    return () => {
      unsubOrders();
      unsubTables();
      unsubInvoices();
      unsubScans();
    };
  }, [subscribeToOrders, subscribeToTables, subscribeToInvoices, subscribeToScans]);

  // Helper to parse dates
  const parseDate = (dateValue: any): Date => {
    if (!dateValue) return new Date(0);
    if (typeof dateValue === 'object' && typeof dateValue.toDate === 'function') {
      return dateValue.toDate();
    }
    if (typeof dateValue === 'object' && 'seconds' in dateValue) {
      return new Date(dateValue.seconds * 1000);
    }
    if (dateValue instanceof Date) return dateValue;
    return new Date(dateValue);
  };

  // Get date range based on filter (same logic as accounting page)
  const getDateRange = (date: Date, period: "day" | "week" | "month") => {
    let start = startOfDay(date);
    let end = endOfDay(date);
    
    if (period === "week") {
      start = startOfWeek(date, { weekStartsOn: 1 }); // Lundi
      end = endOfWeek(date, { weekStartsOn: 1 });
    } else if (period === "month") {
      start = startOfMonth(date);
      end = endOfMonth(date);
    }
    
    return { start, end };
  };

  // Calculate stats from invoices (paid orders) for accuracy
  const stats = useMemo(() => {
    const selectedDate = parseISO(dateFilter);
    const { start: currentStart, end: currentEnd } = getDateRange(selectedDate, periodType);
    
    // Previous period calculation (same as accounting)
    let prevDate = subDays(selectedDate, 1);
    if (periodType === "week") {
      prevDate = subWeeks(selectedDate, 1);
    } else if (periodType === "month") {
      prevDate = subMonths(selectedDate, 1);
    }
    const { start: prevStart, end: prevEnd } = getDateRange(prevDate, periodType);

    // Filter invoices for current period
    const currentInvoices = invoices.filter(inv => {
      const date = parseDate(inv.createdAt);
      return isWithinInterval(date, { start: currentStart, end: currentEnd });
    });

    // Filter invoices for previous period (for comparison)
    const prevInvoices = invoices.filter(inv => {
      const date = parseDate(inv.createdAt);
      return isWithinInterval(date, { start: prevStart, end: prevEnd });
    });

    // Only count PAID invoices for revenue (same as accounting)
    const paidCurrentInvoices = currentInvoices.filter(inv => inv.status === 'paid');
    const paidPrevInvoices = prevInvoices.filter(inv => inv.status === 'paid');

    // Current period stats (from paid invoices only)
    const currentRevenue = paidCurrentInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const currentOrderCount = paidCurrentInvoices.length;
    const currentDishes = paidCurrentInvoices.reduce((sum, inv) => 
      sum + (inv.items?.reduce((s: number, item: any) => s + (item.qty || 1), 0) || 0), 0
    );

    // Previous period stats (from paid invoices only)
    const prevRevenue = paidPrevInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const prevOrderCount = paidPrevInvoices.length;

    // Calculate trends
    const revenueTrend = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue * 100).toFixed(0) : "0";
    const ordersTrend = prevOrderCount > 0 ? ((currentOrderCount - prevOrderCount) / prevOrderCount * 100).toFixed(0) : "0";

    // Top items from current period (paid invoices only)
    const itemCounts: Record<string, number> = {};
    paidCurrentInvoices.forEach(inv => {
      inv.items?.forEach((item: any) => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + (item.qty || 1);
      });
    });
    const topItems = Object.entries(itemCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Sales by hour for current period (paid invoices only)
    const salesByHour: Record<number, number> = {};
    paidCurrentInvoices.forEach(inv => {
      const date = parseDate(inv.createdAt);
      const hour = date.getHours();
      salesByHour[hour] = (salesByHour[hour] || 0) + 1;
    });

    // Scans filtered by current period (same as accounting)
    const currentScans = scans.filter(scan => {
      const date = parseDate(scan.timestamp);
      return isWithinInterval(date, { start: currentStart, end: currentEnd });
    });

    return {
      revenue: currentRevenue,
      orderCount: currentOrderCount,
      dishesServed: currentDishes,
      avgTicket: currentOrderCount > 0 ? Math.round(currentRevenue / currentOrderCount) : 0,
      revenueTrend: Number(revenueTrend),
      ordersTrend: Number(ordersTrend),
      topItems,
      salesByHour,
      totalScans: currentScans.length,
      currentStart,
      currentEnd
    };
  }, [invoices, scans, dateFilter, periodType]);

  // Active orders (not paid yet)
  const activeOrders = useMemo(() => {
    const allOrders = [
      ...orders.pending,
      ...orders.preparing,
      ...orders.ready,
      ...orders.served,
      ...orders["awaiting-payment"]
    ];
    return allOrders.filter(o => {
      const date = parseDate(o.createdAt);
      return isToday(date);
    });
  }, [orders]);

  const dashboardStats = [
    {
      title: "Chiffre d'affaires",
      value: `${stats.revenue.toLocaleString()} FCFA`,
      trend: stats.revenueTrend,
      icon: Banknote,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Commandes payées",
      value: stats.orderCount.toString(),
      trend: stats.ordersTrend,
      icon: ShoppingCart,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Plats servis",
      value: stats.dishesServed.toString(),
      trend: null,
      icon: UtensilsCrossed,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Ticket moyen",
      value: `${stats.avgTicket.toLocaleString()} FCFA`,
      trend: null,
      icon: DollarSign,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
    },
  ];

  const maxRush = Math.max(...Object.values(stats.salesByHour), 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10 min-h-0">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Tableau de Bord
          </h2>
          <p className="text-muted-foreground text-sm">
            Performances de votre restaurant
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Period Selector */}
          <div className="flex items-center bg-secondary p-1 rounded-xl">
            {(["day", "week", "month"] as const).map((period) => (
              <Button
                key={period}
                variant={periodType === period ? "default" : "ghost"}
                size="sm"
                onClick={() => setPeriodType(period)}
                className="rounded-lg text-xs px-3 h-8"
              >
                {period === "day" ? "Jour" : period === "week" ? "Semaine" : "Mois"}
              </Button>
            ))}
          </div>

          {/* Date Picker */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-9 rounded-xl w-[160px] text-sm h-10"
            />
          </div>
        </div>
      </div>

      {/* Date Range Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs font-medium">
          {format(stats.currentStart, "dd MMM", { locale: fr })} - {format(stats.currentEnd, "dd MMM yyyy", { locale: fr })}
        </Badge>
        {activeOrders.length > 0 && (
          <Badge variant="outline" className="text-xs font-medium text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            {activeOrders.length} commande{activeOrders.length > 1 ? "s" : ""} en cours
          </Badge>
        )}
      </div>
      
      {/* KPI Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat, index) => (
          <Card key={index} className="rounded-2xl border-border shadow-sm overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {stat.title}
                </span>
                <div className={`h-8 w-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <div className="text-xl font-bold tracking-tight text-foreground">{stat.value}</div>
              {stat.trend !== null && (
                <div className={`text-xs flex items-center mt-1 font-medium ${stat.trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {stat.trend >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {stat.trend >= 0 ? "+" : ""}{stat.trend}%
                  <span className="text-muted-foreground ml-1 font-normal">vs période préc.</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Rush Hours Chart */}
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Heures d'affluence
            </CardTitle>
            <CardDescription className="text-xs">Commandes par heure</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[180px] w-full flex items-end justify-between gap-1.5 pt-4">
              {[11, 12, 13, 14, 18, 19, 20, 21, 22].map((hour) => {
                const value = stats.salesByHour[hour] || 0;
                const height = maxRush > 0 ? (value / maxRush) * 100 : 0;
                return (
                  <div key={hour} className="flex flex-col items-center gap-1.5 group flex-1">
                    <div className="relative w-full bg-secondary rounded-t-md overflow-hidden h-[130px] flex items-end">
                      <div 
                        className="w-full bg-primary/80 group-hover:bg-primary rounded-t-sm"
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                      {value > 0 && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                          {value}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">{hour}h</span>
                  </div>
                );
              })}
            </div>
            {Object.keys(stats.salesByHour).length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">Aucune donnée pour cette période</p>
            )}
          </CardContent>
        </Card>

        {/* Top Items */}
        <Card className="rounded-2xl border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-orange-500" />
              Plats populaires
            </CardTitle>
            <CardDescription className="text-xs">Top 5 des ventes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary font-bold text-xs text-muted-foreground shrink-0">
                      {i + 1}
                    </div>
                    <span className="font-medium text-sm truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 rounded-full" 
                        style={{ width: `${(item.count / (stats.topItems[0]?.count || 1)) * 100}%` }} 
                      />
                    </div>
                    <span className="text-xs font-semibold w-8 text-right tabular-nums">{item.count}</span>
                  </div>
                </div>
              ))}
              {stats.topItems.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-8">Aucune donnée pour cette période</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <ScanLine className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Scans QR</p>
              <p className="text-lg font-bold">{stats.totalScans}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tables actives</p>
              <p className="text-lg font-bold">{tables.filter(t => t.status === 'occupied').length}/{tables.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">En cuisine</p>
              <p className="text-lg font-bold">{orders.preparing.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Prêts à servir</p>
              <p className="text-lg font-bold">{orders.ready.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
