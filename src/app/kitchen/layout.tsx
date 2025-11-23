"use client";

import ProtectedLayout from "@/components/auth/ProtectedLayout";

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedLayout allowedRoles={['kitchen', 'admin']}>
      {children}
    </ProtectedLayout>
  );
}
