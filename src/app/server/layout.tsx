import ProtectedLayout from "@/components/auth/ProtectedLayout";
import { UserRole } from "@/stores/auth";
import { ServerSidebar } from "@/components/server/ServerSidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { OrdersListener } from "@/components/orders-listener";
import { ServiceListener } from "@/components/service-listener";

const SERVER_ALLOWED_ROLES: UserRole[] = ['server', 'admin'];

export default function ServerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedLayout allowedRoles={SERVER_ALLOWED_ROLES}>
      <ThemeProvider storageKey="theme-server">
        <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
          <ServerSidebar />
          <main className="flex-1 overflow-auto relative">
            <OrdersListener />
            <ServiceListener />
            {children}
          </main>
        </div>
      </ThemeProvider>
    </ProtectedLayout>
  );
}
