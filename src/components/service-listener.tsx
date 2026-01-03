"use client";

import { useEffect, useRef } from "react";
import { useTableStore } from "@/stores/tables";
import { toast } from "sonner";
import { BellRing } from "lucide-react";

export function ServiceListener() {
  const { serviceRequests, resolveServiceRequest, tables } = useTableStore();
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
        const table = tables.find(t => t.id === req.tableId);
        const tableName = table ? table.label : req.tableId.replace('t', '');

        toast(message, {
          description: `Table ${tableName}`,
          duration: Infinity,
          action: {
            label: "J'y vais",
            onClick: () => {
              // Only resolve immediately for assistance requests.
              // For bill requests, we want the status to remain "requesting_bill" 
              // so the "Encaisser" button remains visible on the dashboard.
              if (req.type !== 'bill') {
                resolveServiceRequest(req.tableId);
                toast.success("Demande prise en charge");
              } else {
                toast.dismiss();
              }
            }
          },
          icon: <BellRing className="w-5 h-5 text-amber-500 animate-bounce" />
        });
      }
    });

    prevRequestsRef.current = currentRequests;
  }, [serviceRequests, resolveServiceRequest, tables]);

  return null;
}
