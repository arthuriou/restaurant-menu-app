"use client";

import { useEffect, useState, useMemo } from "react";
import { format, isSameDay, subDays, subWeeks, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO, endOfDay, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Search, Download, Calendar as CalendarIcon, ArrowUpRight, ArrowDownRight,
  CreditCard, Banknote, Filter, History, ScanLine, XCircle, CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrderStore, DashboardOrder } from "@/stores/orders";
import { useScanStore, ScanEvent } from "@/stores/scans";

export default function AccountingPage() {
  const { orders, subscribeToOrders } = useOrderStore();
  const { scans, subscribeToScans } = useScanStore();
  
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [periodType, setPeriodType] = useState<'day' | 'week' | 'month'>('day');
  const [activeTab, setActiveTab] = useState("sales");

  // Subscribe to data
  useEffect(() => {
    const unsubOrders = subscribeToOrders();
    const unsubScans = subscribeToScans();
    return () => {
      unsubOrders();
      unsubScans();
    };
  }, [subscribeToOrders, subscribeToScans]);

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
  const allOrders = useMemo(() => Object.values(orders).flat() as DashboardOrder[], [orders]);
  
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

  const currentOrders = useMemo(() => filterDataByRange(allOrders, 'createdAt', currentStart, currentEnd), [allOrders, currentStart, currentEnd]);
  const prevOrders = useMemo(() => filterDataByRange(allOrders, 'createdAt', prevStart, prevEnd), [allOrders, prevStart, prevEnd]);

  const currentScans = useMemo(() => {
    console.log("All Scans:", scans);
    const filtered = filterDataByRange(scans, 'timestamp', currentStart, currentEnd);
    console.log("Filtered Scans (Current):", filtered, "Start:", currentStart, "End:", currentEnd);
    return filtered;
  }, [scans, currentStart, currentEnd]);
  const prevScans = useMemo(() => filterDataByRange(scans, 'timestamp', prevStart, prevEnd), [scans, prevStart, prevEnd]);

  // --- Stats Calculation ---
  const calculateStats = (orderList: DashboardOrder[]) => {
    const served = orderList.filter(o => o.status === 'served');
    const cancelled = orderList.filter(o => o.status === 'cancelled');
    const revenue = served.reduce((acc, o) => acc + (o.total || 0), 0);
    return {
      revenue,
      totalOrders: orderList.length,
      servedCount: served.length,
      cancelledCount: cancelled.length,
      avgBasket: served.length ? revenue / served.length : 0
    };
  };

  const currentStats = calculateStats(currentOrders);
  const prevStats = calculateStats(prevOrders);

  const calculateGrowth = (current: number, prev: number) => {
    if (prev === 0) return current > 0 ? 100 : 0;
    return ((current - prev) / prev) * 100;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount).replace('XOF', 'FCFA');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Comptabilité & Analytics
          </h2>
          <p className="text-muted-foreground mt-1">
            Suivi détaillé des ventes et de l'activité.
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
          <TabsTrigger value="sales" className="rounded-lg">Ventes</TabsTrigger>
          <TabsTrigger value="scans" className="rounded-lg">Scans QR</TabsTrigger>
        </TabsList>

        {/* --- SALES TAB --- */}
        <TabsContent value="sales" className="space-y-6">
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
              title="Commandes Servies" 
              value={currentStats.servedCount.toString()} 
              icon={CheckCircle2} 
              trend={calculateGrowth(currentStats.servedCount, prevStats.servedCount)}
              subtext={`${currentStats.totalOrders} total`}
            />
            <KPICard 
              title="Panier Moyen" 
              value={formatCurrency(currentStats.avgBasket)} 
              icon={CreditCard} 
              trend={calculateGrowth(currentStats.avgBasket, prevStats.avgBasket)}
              subtext="par commande"
            />
            <KPICard 
              title="Annulations" 
              value={currentStats.cancelledCount.toString()} 
              icon={XCircle} 
              trend={calculateGrowth(currentStats.cancelledCount, prevStats.cancelledCount)}
              inverseTrend // Red if up
              subtext="commandes annulées"
            />
          </div>

          {/* Orders List */}
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Détail des Commandes</CardTitle>
              <CardDescription>
                {currentOrders.length} commandes sur la période sélectionnée
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentOrders.length === 0 ? (
                  <div className="text-center py-12 opacity-50">Aucune commande trouvée</div>
                ) : (
                  currentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          order.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-zinc-200 dark:bg-zinc-800'
                        }`}>
                          {order.table?.replace('Table ', '') || '?'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">#{order.id.slice(-4)}</span>
                            <Badge variant={order.status === 'served' ? 'default' : order.status === 'cancelled' ? 'destructive' : 'secondary'}>
                              {order.status === 'served' ? 'Servi' : order.status === 'cancelled' ? 'Annulé' : order.status}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">{order.time} • {order.itemCount} articles</span>
                        </div>
                      </div>
                      <div className="font-bold">
                        {formatCurrency(order.total)}
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
