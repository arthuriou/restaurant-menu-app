import { create } from "zustand";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type TableStatus =
  | "available"
  | "occupied"
  | "needs_service"
  | "requesting_bill";

export type ServiceRequest = {
  tableId: string;
  type: "assistance" | "bill";
  timestamp: number;
  resolved: boolean;
};

export type Table = {
  id: string;
  label: string;
  seats: number;
  status: TableStatus;
  scans: number;
  occupants?: number;
  activeOrderId?: string;
  lastScanTime?: number;
  sessionStartTime?: number;
};

interface TableState {
  tables: Table[];
  serviceRequests: ServiceRequest[]; // Derived from tables or separate collection? Keeping local for now or derived
  isLoading: boolean;
  error: string | null;

  subscribeToTables: () => () => void;
  addTable: (table: Omit<Table, "id" | "scans" | "status">) => Promise<void>;
  updateTable: (id: string, updates: Partial<Table>) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  incrementTableScans: (id: string) => Promise<{
    success: boolean;
    message: string;
    newSession?: boolean;
  } | void>;
  incrementTableOccupants: (id: string) => Promise<void>;
  setTableStatus: (
    id: string,
    status: TableStatus,
    occupants?: number,
  ) => Promise<void>;
  requestService: (
    tableId: string,
    type: "assistance" | "bill",
  ) => Promise<void>;
  resolveServiceRequest: (tableId: string) => Promise<void>;
  closeTable: (id: string) => Promise<void>;
}

export const useTableStore = create<TableState>((set, get) => ({
  tables: [],
  serviceRequests: [],
  isLoading: false,
  error: null,

  subscribeToTables: () => {
    if (!db) return () => {};

    set({ isLoading: true });

    const q = query(collection(db, "tables"), orderBy("label"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tables: Table[] = [];
        const serviceRequests: ServiceRequest[] = [];

        snapshot.docs.forEach((doc) => {
          const data = doc.data() as any;
          const table = { id: doc.id, ...data } as Table;
          tables.push(table);

          // Derive requests from status
          if (table.status === "needs_service") {
            serviceRequests.push({
              tableId: table.id,
              type: "assistance",
              timestamp: Date.now(),
              resolved: false,
            });
          } else if (table.status === "requesting_bill") {
            serviceRequests.push({
              tableId: table.id,
              type: "bill",
              timestamp: Date.now(),
              resolved: false,
            });
          }
        });

        set({ tables, serviceRequests, isLoading: false });
      },
      (error) => {
        console.error("Error fetching tables:", error);
        set({ error: error.message, isLoading: false });
      },
    );

    return unsubscribe;
  },

  addTable: async (tableData) => {
    try {
      await addDoc(collection(db, "tables"), {
        ...tableData,
        scans: 0,
        status: "available",
        sessionStartTime: Date.now(),
      });
    } catch (error) {
      console.error("Error adding table:", error);
      throw error;
    }
  },

  updateTable: async (id, updates) => {
    try {
      await updateDoc(doc(db, "tables", id), updates);
    } catch (error) {
      console.error("Error updating table:", error);
      throw error;
    }
  },

  deleteTable: async (id) => {
    try {
      // 1. Get the table first to know its label
      const tableRef = doc(db, "tables", id);
      const { getDoc } = await import("firebase/firestore");
      const tableSnap = await getDoc(tableRef);

      if (tableSnap.exists()) {
        const tableData = tableSnap.data() as Table;
        const tableLabel = tableData.label;

        console.log(
          `[TableStore] Deleting table ${tableLabel}, cleaning up orders...`,
        );

        // 2. Find and Cancel all active orders for this table
        const { collection, query, where, getDocs, writeBatch } =
          await import("firebase/firestore");
        const ordersRef = collection(db, "orders");
        // Find orders with this table label that are NOT paid/cancelled
        // Note: Firestore != query inequality is tricky, so we might need to fetch and filter or just cancel everything pending/preparing/ready/served
        const q = query(ordersRef, where("tableId", "in", [tableLabel, `Table ${tableLabel}`]));
        const snapshot = await getDocs(q);

        const batch = writeBatch(db);
        let updateCount = 0;

        snapshot.docs.forEach((doc) => {
          const order = doc.data();
          // Only cancel if it's an active status
          if (
            ["pending", "preparing", "ready", "served"].includes(order.status)
          ) {
            batch.update(doc.ref, { status: "cancelled" });
            updateCount++;
          }
        });

        // Cancel pending invoices
        const invoicesRef = collection(db, "invoices");
        const qInvoices = query(
          invoicesRef,
          where("tableId", "in", [tableLabel, `Table ${tableLabel}`]),
          where("status", "==", "pending")
        );
        const invoiceSnap = await getDocs(qInvoices);

        invoiceSnap.docs.forEach((doc) => {
          batch.update(doc.ref, { status: "cancelled" });
          updateCount++;
        });

        if (updateCount > 0) {
          await batch.commit();
          console.log(
            `[TableStore] Cancelled ${updateCount} active orders for ${tableLabel}`,
          );
        }
      }

      // 3. Delete the table
      await deleteDoc(tableRef);
    } catch (error) {
      console.error("Error deleting table:", error);
      throw error;
    }
  },

  incrementTableScans: async (label) => {
    try {
      console.log(`[TableStore] Incrementing scans for label: "${label}"`);
      const { query, where, getDocs, increment, serverTimestamp } =
        await import("firebase/firestore");

      // 1. Try exact match
      const q = query(collection(db, "tables"), where("label", "==", label));
      const snapshot = await getDocs(q);

      let tableDoc = snapshot.empty ? null : snapshot.docs[0];

      // 2. Try with "Table " prefix if not found
      if (!tableDoc) {
        console.log(
          `[TableStore] Exact match not found, trying "Table ${label}"`,
        );
        const q2 = query(
          collection(db, "tables"),
          where("label", "==", `Table ${label}`),
        );
        const snapshot2 = await getDocs(q2);
        if (!snapshot2.empty) tableDoc = snapshot2.docs[0];
      }

      if (tableDoc) {
        console.log(
          `[TableStore] Found table doc: ${tableDoc.id}, updating...`,
        );

        const data = tableDoc.data();
        const now = Date.now();
        const lastScanTime = data.lastScanTime || 0;
        const isStale = now - lastScanTime > 3 * 60 * 60 * 1000; // 3 hours timeout
        let newSession = false;

        const updates: any = {
          scans: increment(1),
          lastScanTime: now,
        };

        // Logic: If table was available OR is stale, this starts a NEW session.
        if (data.status === "available" || isStale) {
          console.log(`[TableStore] Starting NEW session (Stale: ${isStale})`);
          updates.status = "occupied";
          updates.occupants = 1;
          updates.scans = 1; // Reset scan count for new session
          updates.sessionStartTime = now; // Start new session
          newSession = true;
        } else {
          // Existing active session - Check capacity before joining
          const currentOccupants = data.occupants || 0;
          const seats = data.seats || 4; // Default to 4

          if (currentOccupants >= seats) {
            console.warn(
              `[TableStore] Table ${label} is full (${currentOccupants}/${seats})`,
            );
            return {
              success: false,
              message: "Table complète. Veuillez choisir une autre table.",
            };
          }

          updates.status = "occupied";
          // Increment occupants for every new person joining
          updates.occupants = increment(1);
        }

        await updateDoc(tableDoc.ref, updates);

        // --- NEW: Record Scan Event for Analytics ---
        try {
          await addDoc(collection(db, "scans"), {
            tableId: data.label, // Use the human-readable label (e.g. "5")
            timestamp: serverTimestamp(),
          });
        } catch (err) {
          console.error("[TableStore] Failed to record scan analytics:", err);
        }

        console.log(`[TableStore] Update successful`);
        return { success: true, message: "Scan enregistré", newSession };
      } else {
        console.warn(
          `[TableStore] Table with label "${label}" not found in DB`,
        );
        return { success: false, message: `Table "${label}" introuvable` };
      }
    } catch (error: any) {
      console.error("[TableStore] Error incrementing scans:", error);
      return { success: false, message: error.message || "Erreur scan" };
    }
  },

  incrementTableOccupants: async (label) => {
    try {
      console.log(`[TableStore] Incrementing occupants for label: "${label}"`);
      const { query, where, getDocs, increment } =
        await import("firebase/firestore");

      const q = query(collection(db, "tables"), where("label", "==", label));
      const snapshot = await getDocs(q);

      let tableDoc = snapshot.empty ? null : snapshot.docs[0];

      if (!tableDoc) {
        const q2 = query(
          collection(db, "tables"),
          where("label", "==", `Table ${label}`),
        );
        const snapshot2 = await getDocs(q2);
        if (!snapshot2.empty) tableDoc = snapshot2.docs[0];
      }

      if (tableDoc) {
        await updateDoc(tableDoc.ref, {
          occupants: increment(1),
          status: "occupied",
        });
      }
    } catch (error: any) {
      // Permission denied is expected for anonymous users on some protected collections
      // We swallow this error to prevent app crash. Occupancy tracking will be best-effort.
      if (error?.code === "permission-denied") {
        console.warn(
          "[TableStore] Permission denied for occupancy update (expected for Guest)",
        );
        return;
      }
      console.error("Error incrementing occupants:", error);
    }
  },

  setTableStatus: async (id, status, occupants) => {
    try {
      const updates: any = { status };
      if (occupants !== undefined) updates.occupants = occupants;
      await updateDoc(doc(db, "tables", id), updates);
    } catch (error) {
      console.error("Error setting status:", error);
      throw error;
    }
  },

  requestService: async (tableId, type) => {
    try {
      console.log(`[TableStore] Requesting service '${type}' for tableId: '${tableId}'`);
      const status = type === "bill" ? "requesting_bill" : "needs_service";
      
      // Handle temp IDs or label-based IDs
      let targetId = tableId;
      if (tableId.startsWith("temp_") || tableId.startsWith("Table ") || /^[tT]\d+$/.test(tableId)) {
        const label = tableId.replace("temp_", "").replace("Table ", "").replace(/^[tT]/, "");
        const { query, where, getDocs, collection } = await import("firebase/firestore");
        
        // Try to find real table by label
        const q = query(collection(db, "tables"), where("label", "==", label));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          targetId = snap.docs[0].id;
        } else {
           // Try with "Table " prefix
           const q2 = query(collection(db, "tables"), where("label", "==", `Table ${label}`));
           const snap2 = await getDocs(q2);
           if (!snap2.empty) targetId = snap2.docs[0].id;
        }
      }

      console.log(`[TableStore] Resolved targetId: '${targetId}' for update`);
      await updateDoc(doc(db, "tables", targetId), { status });
      console.log(`[TableStore] Status updated successfully to '${status}'`);
    } catch (error) {
      console.error("Error requesting service:", error);
      throw error;
    }
  },

  resolveServiceRequest: async (tableId) => {
    try {
      // Assuming resolving means setting back to occupied (or available if empty?)
      // Usually resolving a request keeps the table occupied.
      await updateDoc(doc(db, "tables", tableId), { status: "occupied" });
    } catch (error) {
      console.error("Error resolving request:", error);
      throw error;
    }
  },

  closeTable: async (id) => {
    try {
      // 1. Cancel active orders
      const tableRef = doc(db, "tables", id);
      const { getDoc, getDocs, writeBatch, where } =
        await import("firebase/firestore");

      const tableSnap = await getDoc(tableRef);
      if (tableSnap.exists()) {
        const tableData = tableSnap.data();
        const tableLabel = tableData.label;

        console.log(
          `[TableStore] Closing table ${tableLabel}, cancelling active orders...`,
        );

        const ordersRef = collection(db, "orders");
        // Fix: Check for both "5" and "Table 5" formats
        const q = query(ordersRef, where("tableId", "in", [tableLabel, `Table ${tableLabel}`]));
        const snapshot = await getDocs(q);

        const batch = writeBatch(db);
        let updateCount = 0;

        snapshot.docs.forEach((doc) => {
          const order = doc.data();
          if (
            ["pending", "preparing", "ready", "served"].includes(order.status)
          ) {
            batch.update(doc.ref, { status: "cancelled" });
            updateCount++;
          }
        });

        // Cancel pending invoices
        const invoicesRef = collection(db, "invoices");
        const qInvoices = query(
          invoicesRef,
          where("tableId", "in", [tableLabel, `Table ${tableLabel}`]),
          where("status", "==", "pending")
        );
        const invoiceSnap = await getDocs(qInvoices);

        invoiceSnap.docs.forEach((doc) => {
          batch.update(doc.ref, { status: "cancelled" });
          updateCount++;
        });

        if (updateCount > 0) {
          await batch.commit();
          console.log(
            `[TableStore] Cancelled ${updateCount} orders for table ${tableLabel}`,
          );
        }
      }

      await updateDoc(doc(db, "tables", id), {
        status: "available",
        occupants: 0,
        scans: 0,
        activeOrderId: null,
        sessionStartTime: Date.now(), // Reset session time to now (end of session)
      });
    } catch (error) {
      console.error("Error closing table:", error);
      throw error;
    }
  },
}));
