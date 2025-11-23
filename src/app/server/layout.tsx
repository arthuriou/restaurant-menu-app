import ProtectedLayout from "@/components/auth/ProtectedLayout";
import { UserRole } from "@/stores/auth";
import { ServerSidebar } from "@/components/server/ServerSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu as MenuIcon } from "lucide-react";

const SERVER_ALLOWED_ROLES: UserRole[] = ['server', 'admin'];

export default function ServerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedLayout allowedRoles={SERVER_ALLOWED_ROLES}>
      <div className="h-full relative bg-zinc-50 dark:bg-black">
        {/* Desktop Sidebar */}
        <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80]">
          <ServerSidebar />
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
                <ServerSidebar />
              </SheetContent>
            </Sheet>
            <span className="font-bold ml-2">Espace Serveur</span>
          </div>
          <div className="p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </ProtectedLayout>
  );
}
