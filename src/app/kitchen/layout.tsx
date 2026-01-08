"use client";

import ProtectedLayout from "@/components/auth/ProtectedLayout";
import { ThemeProvider } from "@/components/theme-provider";
import { OrdersListener } from "@/components/orders-listener";

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedLayout allowedRoles={['kitchen', 'admin']}>
      <ThemeProvider storageKey="theme-kitchen" defaultTheme="dark">
        <OrdersListener />
        {children}
      </ThemeProvider>
    </ProtectedLayout>
  );
}
