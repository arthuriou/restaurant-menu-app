"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, UtensilsCrossed, Settings, LogOut, Menu as MenuIcon, Users, Grid3X3, Receipt, Star, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ProtectedLayout from "@/components/auth/ProtectedLayout";
import { useAuthStore } from "@/stores/auth";
import { UserAvatar } from "@/components/user-avatar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Don't show layout on login page
  if (pathname === "/login") {
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
      label: "Comptabilité",
      icon: Receipt,
      href: "/admin/invoices",
    },
    {
      label: "Template Facture",
      icon: Receipt,
      href: "/admin/invoices/template",
    },
    {
      label: "Avis Clients",
      icon: Star,
      href: "/admin/reviews",
    },
    {
      label: "Équipe",
      icon: Users,
      href: "/admin/staff",
    },
    {
      label: "Médiathèque",
      icon: ImageIcon,
      href: "/admin/gallery",
    },
    {
      label: "Paramètres",
      icon: Settings,
      href: "/admin/settings",
    },
  ];

  const SidebarContent = () => {
    const { user } = useAuthStore();
    
    return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="px-6 py-8">
        <Link href="/admin" className="flex items-center gap-3 mb-10">
          <UserAvatar user={user} size="md" className="h-10 w-10 border-2 border-primary" />
          <div>
            <h1 className="text-base font-bold tracking-tight text-foreground">{user?.name || "Admin"}</h1>
            <span className="text-xs text-muted-foreground">Administrateur</span>
          </div>
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
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <route.icon className={`h-5 w-5 mr-3 transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                {route.label}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="mt-auto p-6 border-t border-border">
        <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/10" asChild>
          <Link href="/login">
            <LogOut className="h-5 w-5 mr-3" />
            Déconnexion
          </Link>
        </Button>
      </div>
    </div>
  );
  };

  return (
    <ProtectedLayout allowedRoles={['admin']}>
      <div className="h-full relative bg-background text-foreground">
        {/* Desktop Sidebar */}
        <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80]">
          <SidebarContent />
        </div>
        
        {/* Mobile Sidebar */}
        <main className="md:pl-72 min-h-screen">
          <div className="flex items-center p-4 md:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
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
    </ProtectedLayout>
  );
}
