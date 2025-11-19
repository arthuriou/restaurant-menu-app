"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/stores/auth";
import { OrdersListener } from "@/components/orders-listener";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, init } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== "/admin/login") {
        router.replace("/admin/login");
      }
    }
  }, [user, loading, router, pathname]);

  return (
    <div className="min-h-dvh">
      {/* Listener des nouvelles commandes */}
      <OrdersListener />
      {children}
    </div>
  );
}
