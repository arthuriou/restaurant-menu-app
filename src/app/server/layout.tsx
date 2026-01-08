import ProtectedLayout from "@/components/auth/ProtectedLayout";
import { UserRole } from "@/stores/auth";
import { ServerSidebar } from "@/components/server/ServerSidebar";
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
      {/* Serveur toujours en thème sombre */}
      <div className="dark flex h-screen overflow-hidden bg-background text-foreground">
        <ServerSidebar />
        <main className="flex-1 overflow-auto relative">
          <OrdersListener />
          <ServiceListener />
          {children}
        </main>
      </div>
    </ProtectedLayout>
  );
}
