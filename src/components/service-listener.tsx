"use client";

import { useEffect, useRef } from "react";
import { useTableStore } from "@/stores/tables";
import { toast } from "sonner";
import { BellRing } from "lucide-react";

export function ServiceListener() {
  const { serviceRequests, resolveServiceRequest } = useTableStore();
  const prevRequestsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentRequests = new Set(
      serviceRequests.filter(r => !r.resolved).map(r => `${r.tableId}-${r.type}`)
    );

    serviceRequests.forEach(req => {
      const key = `${req.tableId}-${req.type}`;
      if (!req.resolved && !prevRequestsRef.current.has(key)) {
        // New request found
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(e => console.log("Audio play failed", e));
        
        const message = req.type === 'bill' ? "Demande d'addition" : "Demande d'assistance";
        
        toast(message, {
          description: `Table ${req.tableId.replace('t', '')}`, // Assuming tableId is like 't5'
          duration: Infinity,
          action: {
            label: "J'y vais",
            onClick: () => {
              resolveServiceRequest(req.tableId);
              toast.success("Demande prise en charge");
            }
          },
          icon: <BellRing className="w-5 h-5 text-amber-500 animate-bounce" />
        });
      }
    });

    prevRequestsRef.current = currentRequests;
  }, [serviceRequests, resolveServiceRequest]);

  return null;
}
