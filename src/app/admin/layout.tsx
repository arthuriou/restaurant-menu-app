"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UtensilsCrossed, ListOrdered, Settings, LogOut, Menu as MenuIcon, ChefHat, Users, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Don't show layout on login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const routes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin",
    },
    {
      label: "Menu & Plats",
      icon: UtensilsCrossed,
      href: "/admin/menu",
    },
    {
      label: "Tables & QR",
      icon: Grid3X3,
      href: "/admin/tables",
    },
    {
      label: "Commandes",
      icon: ListOrdered,
      href: "/admin/orders",
    },
    {
      label: "Équipe",
      icon: Users,
      href: "/admin/staff",
    },
    {
      label: "Paramètres",
      icon: Settings,
      href: "/admin/settings",
    },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800">
      <div className="px-6 py-8">
        <Link href="/admin" className="flex items-center gap-3 mb-10">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <ChefHat className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Admin Panel</h1>
        </Link>
        <div className="space-y-1.5">
          {routes.map((route) => {
            const isActive = pathname === route.href;
            return (
              <Link
                key={route.href}
                href={route.href}
                className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-primary/10 text-primary shadow-sm" 
                    : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <route.icon className={`h-5 w-5 mr-3 transition-colors ${isActive ? "text-primary" : "text-zinc-400 group-hover:text-zinc-600"}`} />
                {route.label}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="mt-auto p-6 border-t border-zinc-100 dark:border-zinc-900">
        <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/10" asChild>
          <Link href="/admin/login">
            <LogOut className="h-5 w-5 mr-3" />
            Déconnexion
          </Link>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-full relative bg-zinc-50 dark:bg-black">
      {/* Desktop Sidebar */}
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80]">
        <SidebarContent />
      </div>
      
      {/* Mobile Sidebar */}
      <main className="md:pl-72 min-h-screen">
        <div className="flex items-center p-4 md:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2">
                <MenuIcon className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <span className="font-bold ml-2">Administration</span>
        </div>
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
