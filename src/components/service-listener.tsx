"use client";

import { useEffect } from "react";
import { useTableStore } from "@/stores/tables";
import { useAuthStore } from "@/stores/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Bell, CreditCard, User, CheckCircle2 } from "lucide-react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function ServiceListener() {
  const { user } = useAuthStore();
  const { acceptServiceRequest } = useTableStore(); // We use the hook to get actions

  useEffect(() => {
    // Only for server (not admin, not kitchen)
    if (!user || user.role !== 'server') return;
    if (!db) return;

    // Query active service requests
    const q = query(
      collection(db, "tables"), 
      where("status", "in", ["requesting_bill", "needs_service"])
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const table = change.doc.data();
        const tableId = change.doc.id;
        // Use label as name, fallback to ID if needed.
        const tableName = table.label || tableId;
        
        if (change.type === "added" || change.type === "modified") {
             // Case 1: New Request (No one accepted yet)
             if (!table.serviceAcceptedBy) {
                 const isBill = table.status === "requesting_bill";
                 const toastId = `req-${tableId}`;
                 
                 // Show persistent toast
                 toast.custom((t) => (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl w-full max-w-[320px] pointer-events-auto overflow-hidden">
                       <div className="p-4">
                          <div className="flex items-center justify-between mb-1">
                             <h4 className="font-black text-xl tracking-tight">Table {tableName}</h4>
                             {isBill ? <CreditCard className="w-5 h-5 text-green-600" /> : <Bell className="w-5 h-5 text-orange-600" />}
                          </div>
                          <p className="text-zinc-600 dark:text-zinc-400 font-medium text-sm mb-4">
                              {isBill ? "Souhaite régler l'addition" : "A besoin d'assistance"}
                          </p>
                          
                          <div className="flex gap-2">
                             <Button 
                               size="sm" 
                               className="flex-1 font-bold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                               onClick={() => {
                                  acceptServiceRequest(tableId, user.name || "Un serveur");
                                  toast.dismiss(toastId);
                               }}
                             >
                               J'y vais
                             </Button>
                             <Button 
                               size="sm" variant="ghost"
                               className="px-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                               onClick={() => toast.dismiss(toastId)}
                             >
                               Ignorer
                             </Button>
                          </div>
                       </div>
                    </div>
                 ), { duration: Infinity, id: toastId });
             }
             
             // Case 2: Someone accepted it
             else if (table.serviceAcceptedBy) {
                 // Dismiss the request toast if it exists
                 toast.dismiss(`req-${tableId}`);
                 
                 // Display confirmation to others
                 // If I accepted it, I already know (I clicked). 
                 // But maybe good to confirm "You have taken Table X".
                 const isMe = table.serviceAcceptedBy === user.name;
                 
                 // Use a separate ID for the "Taken" notification to avoid spamming on recurring updates
                 // Only show if we haven't shown it recently? 
                 // sonner dedupes by ID.
                 
                 if (!isMe) {
                     toast.success(
                        `${table.serviceAcceptedBy} s'occupe de la Table ${tableName}`, 
                        {
                            icon: <User className="w-4 h-4" />,
                            duration: 4000,
                            id: `taken-${tableId}-${table.serviceAcceptedBy}` 
                        }
                     );
                 } else {
                     // Confirmation for me
                     toast.success(
                        `Vous vous occupez de la Table ${tableName}`,
                        {
                            icon: <CheckCircle2 className="w-4 h-4" />,
                            duration: 2000,
                            id: `taken-me-${tableId}`
                        }
                     );
                 }
             }
        }
        
        if (change.type === "removed") {
             // Request resolved/cancelled
             toast.dismiss(`req-${tableId}`);
        }
      });
    });

    return () => unsubscribe();
  }, [user, acceptServiceRequest]);

  return null;
}
