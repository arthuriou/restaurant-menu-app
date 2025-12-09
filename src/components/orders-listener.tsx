"use client";

import { useEffect, useRef } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { playBeep } from "@/lib/sound";
import { useOrderStore } from "@/stores/orders";
import { useTableStore } from "@/stores/tables";
import { useInvoiceStore } from "@/stores/invoices";

export function OrdersListener() {
  const initialized = useRef(false);
  const { subscribeToOrders } = useOrderStore();
  const { subscribeToTables } = useTableStore();
  const { subscribeToInvoices } = useInvoiceStore();

  useEffect(() => {
    if (!db || !db.app) return;

    // 1. Subscribe to Global Stores to keep data fresh across Server Pages
    // This ensures that when we navigate to 'Invoices' or 'Tables', the data is already there.
    const unsubOrders = subscribeToOrders();
    const unsubTables = subscribeToTables();
    const unsubInvoices = subscribeToInvoices();

    // 2. Specific Listener for Sound Notification (Pending Orders)
    const q = query(collection(db, "orders"), where("status", "==", "pending"));
    const unsubSound = onSnapshot(q, (snap) => {
      if (!initialized.current) {
        initialized.current = true;
        return;
      }
      const hasNew = snap.docChanges().some((c) => c.type === "added");
      if (hasNew) {
        playBeep();
      }
    });

    return () => {
      unsubOrders();
      unsubTables();
      unsubInvoices();
      unsubSound();
    };
  }, [subscribeToOrders, subscribeToTables, subscribeToInvoices]);

  return null;
}
