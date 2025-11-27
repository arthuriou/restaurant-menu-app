"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, Users, CreditCard, Activity, TrendingUp, 
  Plus, UtensilsCrossed, QrCode, ArrowRight, Clock, ChefHat, ScanLine, BarChart3
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/stores/orders";

export default function AdminDashboardPage() {
  const router = useRouter();

  const { stats, topItems, salesByHour } = useOrderStore();

  // Real Data from Store
  const dashboardStats = [
    {
      title: "Chiffre d'affaires",
      value: `${stats.totalRevenue.toLocaleString()} FCFA`,
      trend: "+12%", // Mock trend
      trendUp: true,
      icon: DollarSign,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Commandes",
      value: stats.totalOrders.toString(),
      trend: "+5%",
      trendUp: true,
      icon: CreditCard,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Plats Servis",
      value: stats.totalDishesServed.toString(),
      trend: "+8%",
      trendUp: true,
      icon: UtensilsCrossed,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Scans QR Code",
      value: stats.scanCount.toString(),
      trend: "+24%",
      trendUp: true,
      icon: ScanLine,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];



  // Mock Rush Hours Data if empty
  const rushHoursData = Object.keys(salesByHour).length > 0 ? salesByHour : {
    11: 10, 12: 45, 13: 60, 14: 30, 18: 20, 19: 55, 20: 80, 21: 40, 22: 15
  };
  
  const maxRush = Math.max(...Object.values(rushHoursData));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Tableau de Bord
          </h2>
          <p className="text-muted-foreground mt-1">
            Bienvenue ! Voici les performances de votre restaurant aujourd'hui.
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

      <div className="grid gap-6 grid-cols-1">
        
        {/* Charts & Stats */}
        <div className="space-y-6">
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Rush Hours Chart */}
            <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Heures d'Affluence
                </CardTitle>
                <CardDescription>Répartition des commandes par heure (24h)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full flex items-end justify-between gap-2 pt-4">
                  {[11, 12, 13, 14, 18, 19, 20, 21, 22].map((hour) => {
                    const value = rushHoursData[hour as keyof typeof rushHoursData] || 0;
                    const height = maxRush > 0 ? (value / maxRush) * 100 : 0;
                    return (
                      <div key={hour} className="flex flex-col items-center gap-2 group w-full">
                        <div className="relative w-full bg-zinc-100 dark:bg-zinc-800 rounded-t-lg overflow-hidden h-[150px] flex items-end">
                           <div 
                             className="w-full bg-primary/80 group-hover:bg-primary transition-all duration-500 rounded-t-md"
                             style={{ height: `${height}%` }}
                           />
                           {/* Tooltip */}
                           <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                             {value} cmds
                           </div>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">{hour}h</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top Items */}
            <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-orange-500" />
                  Plats les plus populaires
                </CardTitle>
                <CardDescription>Top 5 des plats les plus commandés</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topItems.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 font-bold text-sm text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          {i + 1}
                        </div>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-orange-500 rounded-full" 
                            style={{ width: `${(item.count / (topItems[0]?.count || 1)) * 100}%` }} 
                          />
                        </div>
                        <span className="text-sm font-semibold w-12 text-right">{item.count}</span>
                      </div>
                    </div>
                  ))}
                  {topItems.length === 0 && (
                    <p className="text-muted-foreground text-sm">Aucune donnée disponible.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
