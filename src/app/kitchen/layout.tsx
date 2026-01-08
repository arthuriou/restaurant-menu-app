"use client";

import ProtectedLayout from "@/components/auth/ProtectedLayout";
import { OrdersListener } from "@/components/orders-listener";

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedLayout allowedRoles={['kitchen', 'admin']}>
      {/* Cuisine toujours en thème sombre */}
      <div className="dark bg-background text-foreground min-h-screen">
        <OrdersListener />
        {children}
      </div>
    </ProtectedLayout>
  );
}
