"use client";

import { useEffect, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { UserCheck } from "lucide-react";

interface ClientOrderListenerProps {
  tableId: string | null;
}

export function ClientOrderListener({ tableId }: ClientOrderListenerProps) {
  const lastClaimRef = useRef<string | null>(null);

  useEffect(() => {
    if (!tableId || !db || tableId === "takeaway" || tableId.startsWith("temp_")) return;

    // Listen only for the specific "claimedBy" field changes
    const unsubscribe = onSnapshot(doc(db, "tables", tableId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const claimedBy = data.claimedBy;

        // If newly claimed and different from last seen claim
        if (claimedBy && claimedBy !== lastClaimRef.current) {
          lastClaimRef.current = claimedBy;
          
          // Play a small sound for the client
          const audio = new Audio('/sounds/notification.mp3');
          audio.volume = 0.5;
          audio.play().catch(() => {});

          toast.success(`${claimedBy} a pris en charge votre demande !`, {
            description: "Le serveur arrive à votre table.",
            duration: 8000,
            icon: <UserCheck className="w-5 h-5 text-green-500" />,
            position: "top-center", // Make it very visible
            style: {
                backgroundColor: "#ecfdf5", // green-50
                border: "2px solid #10b981", // green-500
                color: "#1f2937"
            }
          });
        }
        
        // Reset if claim is cleared (request resolved)
        if (!claimedBy) {
            lastClaimRef.current = null;
        }
      }
    });

    return () => unsubscribe();
  }, [tableId]);

  return null;
}
