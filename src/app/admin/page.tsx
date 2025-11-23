"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, Users, CreditCard, Activity, TrendingUp, 
  Plus, UtensilsCrossed, QrCode, ArrowRight, Clock, ChefHat
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/stores/orders";
import { useEffect } from "react";

export default function AdminDashboardPage() {
  const router = useRouter();

  const { stats, calculateStats, orders } = useOrderStore();

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  // Real Data from Store
  const dashboardStats = [
    {
      title: "Chiffre d'affaires",
      value: `${stats.totalRevenue.toLocaleString()} FCFA`,
      trend: "+0%", // To be implemented with history
      trendUp: true,
      icon: DollarSign,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Commandes",
      value: stats.totalOrders.toString(),
      trend: "+0%",
      trendUp: true,
      icon: CreditCard,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Ticket Moyen",
      value: `${stats.averageTicket.toLocaleString()} FCFA`,
      trend: "+0%",
      trendUp: true,
      icon: Activity,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Commandes Actives",
      value: stats.activeOrders.toString(),
      trend: "En cours",
      trendUp: true,
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  const quickActions = [
    {
      label: "Nouvelle Commande",
      icon: Plus,
      onClick: () => router.push("/admin/orders"),
      color: "bg-primary text-primary-foreground hover:bg-primary/90",
    },
    {
      label: "Ajouter un Plat",
      icon: UtensilsCrossed,
      onClick: () => router.push("/admin/menu"),
      color: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
    },
    {
      label: "Gérer les Tables",
      icon: QrCode,
      onClick: () => router.push("/admin/tables"),
      color: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
    },
  ];

  const recentOrders = [
    { id: "CMD-001", table: "Table 4", items: "2x Burger, 1x Coca", status: "preparing", time: "Il y a 5 min" },
    { id: "CMD-002", table: "Table 2", items: "1x Poulet Braisé", status: "ready", time: "Il y a 12 min" },
    { id: "CMD-003", table: "Emporter", items: "3x Shawarma", status: "pending", time: "Il y a 2 min" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Tableau de Bord
          </h2>
          <p className="text-muted-foreground mt-1">
            Bienvenue ! Voici ce qui se passe dans votre restaurant aujourd'hui.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm font-medium text-green-600 dark:text-green-400">Service en cours</span>
        </div>
      </div>
      
      {/* KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat, index) => (
          <Card key={index} className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative group">
            <div className={`absolute right-0 top-0 w-24 h-24 rounded-bl-full opacity-10 transition-transform group-hover:scale-110 ${stat.color.replace('text-', 'bg-')}`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`h-10 w-10 rounded-xl ${stat.bgColor} flex items-center justify-center transition-colors group-hover:bg-opacity-80`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
              <p className={`text-xs flex items-center mt-1 font-medium ${stat.trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600'}`}>
                {stat.trendUp ? <TrendingUp className="w-3 h-3 mr-1" /> : null} 
                {stat.trend} <span className="text-muted-foreground ml-1 font-normal">vs hier</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Main Chart Section (Placeholder for now) */}
        <Card className="col-span-4 rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle>Aperçu des Ventes</CardTitle>
            <CardDescription>Évolution du chiffre d'affaires sur la semaine.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-muted-foreground gap-4 group cursor-pointer hover:border-primary/50 transition-colors">
              <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:scale-110 transition-transform duration-500">
                <Activity className="w-8 h-8 text-zinc-400" />
              </div>
              <p className="text-sm font-medium">Le graphique des ventes sera disponible bientôt</p>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Quick Actions & Live Feed */}
        <div className="col-span-3 space-y-6">
          
          {/* Quick Actions */}
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {quickActions.map((action, idx) => (
                <Button 
                  key={idx}
                  variant="ghost"
                  className={`w-full justify-start h-14 rounded-xl px-4 text-base font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${action.color}`}
                  onClick={action.onClick}
                >
                  <div className="p-2 rounded-lg bg-white/20 mr-3">
                    <action.icon className="w-5 h-5" />
                  </div>
                  {action.label}
                  <ArrowRight className="w-4 h-4 ml-auto opacity-50" />
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Recent Orders Preview */}
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">En Cuisine</CardTitle>
              <Link href="/admin/orders" className="text-xs font-medium text-primary hover:underline">
                Voir tout
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...orders.pending, ...orders.preparing, ...orders.ready].slice(0, 3).map((order, i) => (
                  <div key={i} className="flex items-start gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0 last:pb-0">
                    <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      order.status === 'ready' ? 'bg-green-100 text-green-600' : 
                      order.status === 'preparing' ? 'bg-orange-100 text-orange-600' : 
                      'bg-zinc-100 text-zinc-600'
                    }`}>
                      <ChefHat className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold truncate">{order.table}</p>
                        <span className="text-[10px] text-muted-foreground flex items-center bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3 mr-1" /> {order.time}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{order.itemCount} articles</p>
                    </div>
                  </div>
                ))}
                {([...orders.pending, ...orders.preparing, ...orders.ready].length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucune commande en cours</p>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
