"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Grid3X3, 
  Receipt, 
  LogOut, 
  BellRing,
  Settings
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
      label: "Commandes",
      icon: BellRing,
      href: "/server",
      active: pathname === "/server"
    },
    {
      label: "Tables",
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
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-black border-r border-zinc-200 dark:border-zinc-800">
      {/* HEADER: USER INFO */}
      <div className="px-6 py-8">
        <div className="flex flex-col items-center justify-center text-center gap-4 mb-8">
           <div className="relative">
             <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary to-orange-500 opacity-70 blur-sm"></div>
             <UserAvatar user={user} size="lg" className="h-20 w-20 border-4 border-white dark:border-black relative" />
           </div>
           <div>
             <h2 className="text-lg font-bold tracking-tight">{user?.name || "Serveur"}</h2>
             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
               {user?.role === 'server' ? 'Service' : user?.role || 'Staff'}
             </span>
           </div>
        </div>

        {/* NAVIGATION */}
        <div className="space-y-2">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={`group flex items-center px-4 py-3.5 text-sm font-medium rounded-2xl transition-all duration-200 ${
                route.active 
                  ? "bg-white dark:bg-zinc-900 text-primary shadow-sm border border-zinc-100 dark:border-zinc-800" 
                  : "text-zinc-500 hover:bg-white/50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <div className={`mr-3 p-2 rounded-xl transition-colors ${
                 route.active ? "bg-primary/10 text-primary" : "bg-zinc-100 dark:bg-zinc-800/50 text-zinc-400 group-hover:text-zinc-600"
              }`}>
                <route.icon className="h-5 w-5" />
              </div>
              {route.label}
            </Link>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-auto p-6 space-y-4">
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Mode Sombre</span>
          <ModeToggle />
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-center rounded-2xl py-6 border-red-100 dark:border-red-950/30 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/10" 
          onClick={() => logout()}
        >
          <LogOut className="h-5 w-5 mr-2" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
}
