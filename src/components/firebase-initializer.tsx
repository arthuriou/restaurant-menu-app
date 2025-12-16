"use client";

import { useEffect } from "react";
import { useOrderStore } from "@/stores/orders";
import { useTableStore } from "@/stores/tables";
import { useMenuStore } from "@/stores/menu";
import { useRestaurantStore } from "@/stores/restaurant";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useAuthStore } from "@/stores/auth";

export function FirebaseInitializer() {
  const { subscribeToOrders } = useOrderStore();
  const { subscribeToTables } = useTableStore();
  const { loadMenu } = useMenuStore();
  const { loadSettings } = useRestaurantStore();
  const { login, logout } = useAuthStore();

  useEffect(() => {
    // Subscribe to data streams
    const unsubOrders = subscribeToOrders();
    const unsubTables = subscribeToTables();
    
    // Load static data
    loadMenu();
    loadSettings();

    // Auth listener
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Auto sign-in anonymously for guests/takeaway
        try {
           const { signInAnonymously } = await import('firebase/auth');
           await signInAnonymously(auth);
        } catch (e) {
           console.error("Auto-auth failed:", e);
        }
      }
    });

    return () => {
      if (unsubOrders) unsubOrders();
      if (unsubTables) unsubTables();
      unsubAuth();
    };
  }, []);

  return null;
}
