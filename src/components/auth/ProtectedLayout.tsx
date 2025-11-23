"use client";

import { useEffect, useState } from "react";
import { useAuthStore, UserRole } from "@/stores/auth";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface ProtectedLayoutProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export default function ProtectedLayout({ children, allowedRoles }: ProtectedLayoutProps) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setIsChecking(false);
    });

    if (useAuthStore.persist.hasHydrated()) {
      setIsChecking(false);
    }

    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    if (isChecking) return;

    // console.log("ProtectedLayout Check:", { isAuthenticated, userRole: user?.role, allowedRoles, pathname: window.location.pathname });

    if (!isAuthenticated) {
      // console.log("Redirecting to login");
      router.push("/login");
    } else if (user && !allowedRoles.includes(user.role)) {
      // console.log("Redirecting based on role", user.role);
      // Redirect to appropriate dashboard based on role
      switch (user.role) {
        case 'admin':
          router.push('/admin');
          break;
        case 'server':
          router.push('/server');
          break;
        case 'kitchen':
          router.push('/kitchen');
          break;
        default:
          router.push('/');
      }
    }
  }, [isChecking, isAuthenticated, user, router, allowedRoles]);

  if (isChecking) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
