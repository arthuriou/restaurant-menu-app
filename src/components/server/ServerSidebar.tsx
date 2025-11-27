"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Grid3X3, 
  Receipt, 
  LogOut, 
  ChefHat,
  BellRing
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";
import { ModeToggle } from "@/components/mode-toggle";
import { UserAvatar } from "@/components/user-avatar";


export function ServerSidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuthStore();

  const routes = [
    {
      label: "À Servir",
      icon: BellRing,
      href: "/server",
      active: pathname === "/server"
    },
    {
      label: "Mes Tables",
      icon: Grid3X3,
      href: "/server/tables",
      active: pathname.startsWith("/server/tables")
    },
    {
      label: "Factures",
      icon: Receipt,
      href: "/server/invoices",
      active: pathname.startsWith("/server/invoices")
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800">
      <div className="px-6 py-8">
        <div className="flex items-center gap-3 mb-10">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <ChefHat className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Espace Serveur</h1>
        </div>
        <div className="space-y-1.5">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                route.active 
                  ? "bg-primary/10 text-primary shadow-sm" 
                  : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <route.icon className={`h-5 w-5 mr-3 transition-colors ${route.active ? "text-primary" : "text-zinc-400 group-hover:text-zinc-600"}`} />
              {route.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-auto p-6 border-t border-zinc-100 dark:border-zinc-900 space-y-4">
        <div className="flex items-center gap-3 px-2">
          <UserAvatar user={user} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Thème</span>
          <ModeToggle />
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/10" 
          onClick={() => logout()}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
}
