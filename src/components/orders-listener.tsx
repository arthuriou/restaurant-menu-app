"use client";

import { useEffect, useRef } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { playBeep } from "@/lib/sound";

export function OrdersListener() {
  const initialized = useRef(false);

  useEffect(() => {
    const q = query(collection(db, "orders"), where("status", "==", "pending"));
    const unsub = onSnapshot(q, (snap) => {
      if (!initialized.current) {
        initialized.current = true;
        return;
      }
      const hasNew = snap.docChanges().some((c) => c.type === "added");
      if (hasNew) {
        playBeep();
      }
    });
    return () => unsub();
  }, []);

  return null;
}
