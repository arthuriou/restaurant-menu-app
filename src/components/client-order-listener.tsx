"use client";

import { useEffect, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useMenuStore } from "@/stores/menu";
import { toast } from "sonner";
import { playBeep } from "@/lib/sound";

export function ClientOrderListener() {
  const { activeOrderId } = useMenuStore();
  const previousStatus = useRef<string | null>(null);

  useEffect(() => {
    // Demander la permission pour les notifications au chargement
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!db || !activeOrderId) return;

    const unsub = onSnapshot(doc(db, "orders", activeOrderId), (doc) => {
      if (!doc.exists()) return;
      
      const data = doc.data();
      const newStatus = data.status;

      // Si le statut a changé
      if (previousStatus.current && previousStatus.current !== newStatus) {
        
        // Notification pour "ready" (Prêt)
        if (newStatus === "ready") {
          playBeep(); // Son
          
          // Notification Toast (In-App)
          toast.success("Votre commande est prête !", {
            description: "Un serveur va vous l'apporter à table.",
            duration: 10000,
            action: {
              label: "D'accord!",
              onClick: () => console.log("Client notifié"),
            },
          });

          // Notification Système (Navigateur)
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("🍽️ Commande Prête !", {
              body: "Votre commande est prête, elle vous sera servie d'ici peu!",
              icon: "/icons/icon-192x192.png", // Assure-toi d'avoir une icône
              // vibrate: [200, 100, 200], // Removed to fix TS error
            });
          }
        }
      }

      previousStatus.current = newStatus;
    });

    return () => unsub();
  }, [activeOrderId]);

  return null;
}
