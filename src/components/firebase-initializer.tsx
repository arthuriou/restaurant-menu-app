"use client";

import { useEffect } from "react";
import { useOrderStore } from "@/stores/orders";
import { useTableStore } from "@/stores/tables";
import { useMenuStore } from "@/stores/menu";
import { useRestaurantStore } from "@/stores/restaurant";

export function FirebaseInitializer() {
  const { subscribeToOrders } = useOrderStore();
  const { subscribeToTables } = useTableStore();
  const { loadMenu } = useMenuStore();
  const { loadSettings } = useRestaurantStore();

  useEffect(() => {
    // Subscribe to data streams
    const unsubOrders = subscribeToOrders();
    const unsubTables = subscribeToTables();

    // Load static data
    loadMenu();
    loadSettings();

    return () => {
      if (unsubOrders) unsubOrders();
      if (unsubTables) unsubTables();
    };
  }, []);

  return null;
}
