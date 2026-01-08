"use client";

import { useEffect, useRef } from "react";
import { useTableStore } from "@/stores/tables";
import { useAuthStore } from "@/stores/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Bell, CreditCard, User, CheckCircle2 } from "lucide-react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function ServiceListener() {
  const { user } = useAuthStore();
  const { acceptServiceRequest } = useTableStore();
  const shownToastsRef = useRef<Set<string>>(new Set());
  const acceptedByRef = useRef<Map<string, string>>(new Map());
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    // Only for server (not admin, not kitchen)
    if (!user || user.role !== 'server') return;
    if (!db) return;

    // Reset initial load flag when effect re-runs
    isInitialLoadRef.current = true;

    // Query active service requests
    const q = query(
      collection(db, "tables"), 
      where("status", "in", ["requesting_bill", "needs_service"])
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Skip showing toasts for initial snapshot load (existing data)
      // Only show toasts for real-time changes after initial load
      const isInitial = isInitialLoadRef.current;
      isInitialLoadRef.current = false;

      snapshot.docChanges().forEach((change) => {
        const table = change.doc.data();
        const tableId = change.doc.id;
        const tableName = table.label || tableId;
        const toastId = `req-${tableId}`;
        
        if (change.type === "added") {
          // Skip toasts during initial load - these are existing requests, not new ones
          if (isInitial) {
            // Just track them so we don't show duplicates later
            if (!table.serviceAcceptedBy) {
              shownToastsRef.current.add(toastId);
            }
            return;
          }
          
          // Only show toast for NEW requests that no one has accepted
          if (!table.serviceAcceptedBy && !shownToastsRef.current.has(toastId)) {
            shownToastsRef.current.add(toastId);
            const isBill = table.status === "requesting_bill";
            
            toast.custom(() => (
              <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-[320px] pointer-events-auto overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-black text-lg tracking-tight text-foreground">Table {tableName}</h4>
                    {isBill ? <CreditCard className="w-5 h-5 text-green-600" /> : <Bell className="w-5 h-5 text-orange-500" />}
                  </div>
                  <p className="text-muted-foreground font-medium text-sm mb-4">
                    {isBill ? "Souhaite régler l&apos;addition" : "A besoin d&apos;assistance"}
                  </p>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1 font-bold"
                      onClick={() => {
                        acceptServiceRequest(tableId, user.name || "Un serveur");
                        toast.dismiss(toastId);
                        shownToastsRef.current.delete(toastId);
                      }}
                    >
                      J&apos;y vais
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        toast.dismiss(toastId);
                        shownToastsRef.current.delete(toastId);
                      }}
                    >
                      Ignorer
                    </Button>
                  </div>
                </div>
              </div>
            ), { duration: Infinity, id: toastId });
          }
        }
        
        if (change.type === "modified") {
          // Someone accepted the request
          if (table.serviceAcceptedBy) {
            // Dismiss the request toast
            toast.dismiss(toastId);
            shownToastsRef.current.delete(toastId);
            
            // Only show "taken" notification once per acceptedBy
            const prevAcceptedBy = acceptedByRef.current.get(tableId);
            if (prevAcceptedBy !== table.serviceAcceptedBy) {
              acceptedByRef.current.set(tableId, table.serviceAcceptedBy);
              
              const isMe = table.serviceAcceptedBy === user.name;
              if (!isMe) {
                toast.info(`${table.serviceAcceptedBy} s'occupe de la Table ${tableName}`, {
                  icon: <User className="w-4 h-4" />,
                  duration: 3000,
                });
              } else {
                toast.success(`Vous vous occupez de la Table ${tableName}`, {
                  icon: <CheckCircle2 className="w-4 h-4" />,
                  duration: 2000,
                });
              }
            }
          }
        }
        
        if (change.type === "removed") {
          toast.dismiss(toastId);
          shownToastsRef.current.delete(toastId);
          acceptedByRef.current.delete(tableId);
        }
      });
    });

    return () => {
      unsubscribe();
      // Capture refs for cleanup - copy values before cleanup runs
      const currentShownToasts = shownToastsRef.current;
      const currentAcceptedBy = acceptedByRef.current;
      // Dismiss all toasts on unmount
      currentShownToasts.forEach(id => toast.dismiss(id));
      currentShownToasts.clear();
      currentAcceptedBy.clear();
    };
  }, [user, acceptServiceRequest]);

  return null;
}
