"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Bell, ChefHat } from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { auth, db } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useMenuStore } from "@/stores/menu";
import { useTableStore } from "@/stores/tables";
import { useRestaurantStore } from "@/stores/restaurant";
import { useScanStore } from "@/stores/scans";
import type { MenuItem, OrderItem } from "@/types";

import { Header } from "@/components/menu/Header";
import { Hero } from "@/components/menu/Hero";
import { FeaturedItems } from "@/components/menu/FeaturedItems";
import { CategoryNav } from "@/components/menu/CategoryNav";
import { MenuItemCard } from "@/components/menu/MenuItem";
import { CartBar } from "@/components/menu/CartBar";
import { ItemDetail } from "@/components/menu/ItemDetail";
import { TableSelector } from "@/components/menu/TableSelector";
import { CartDrawer } from "@/components/menu/CartDrawer";
import { Footer } from "@/components/menu/Footer";

type DetailState = {
  open: boolean;
  item: (MenuItem & { available: boolean }) | null;
  qty: number;
  options: {
    cuisson?: string;
    sauce?: string;
    note?: string;
  };
};

function MenuContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableParam = searchParams.get("table");

  const { loadSettings } = useRestaurantStore();
  const {
    categories,
    items,
    isLoading,
    error,
    loadMenu,
    placeOrder,
    selectedCategory,
    setSelectedCategory,
    cart,
    addToCart,
    removeFromCart,
    updateQty,
    table,
    setTable,
    setOrderType,
    setTableId,
    orderType,
    activeOrderId,
    clearTableSession,
  } = useMenuStore();

  // Data Resolution
  const displayCategories = useMemo(() => categories || [], [categories]);
  const displayItems = useMemo(() => items || [], [items]);

  const { incrementTableScans, requestService } = useTableStore();
  const scanProcessed = useRef(false);
  const [accessDenied, setAccessDenied] = useState(false);
  // Block rendering if we have a table param to verify
  const [isVerifyingTable, setIsVerifyingTable] = useState(!!tableParam);

  // Call Server State
  const [callServerOpen, setCallServerOpen] = useState(false);
  const [activeOrderStatus, setActiveOrderStatus] = useState<string | null>(
    null,
  );

  const handleCallServer = async (type: "assistance" | "bill") => {
    if (!table || !table.id) {
      toast.error("Veuillez scanner le QR code de votre table");
      return;
    }

    try {
      // Use the real table ID from the store
      await requestService(table.id, type);

      setCallServerOpen(false);

      if (type === "assistance") {
        toast.success("🔔 Serveur appelé ! Il arrive dans quelques instants.", {
          duration: 4000,
        });
      } else {
        toast.success(
          "💳 Demande d'addition envoyée ! Le serveur prépare votre note.",
          {
            duration: 4000,
          },
        );
      }
    } catch (error) {
      console.error("Failed to call server:", error);
      toast.error("Impossible de contacter le serveur. Veuillez réessayer.");
    }
  };

  // Monitor active order status for dynamic button text
  useEffect(() => {
    if (!activeOrderId) {
      setActiveOrderStatus(null);
      return;
    }

    const loadOrderStatus = async () => {
      try {
        if (!db) return;

        const orderRef = doc(db, "orders", activeOrderId);
        const unsubscribe = onSnapshot(orderRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setActiveOrderStatus(data.status || null);
          } else {
            setActiveOrderStatus(null);
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error("Error loading order status:", error);
      }
    };

    loadOrderStatus();
  }, [activeOrderId]);

  // Listen for Table Status Changes (Session Termination)
  useEffect(() => {
    if (!table?.id || table.id.startsWith("temp_") || table.id === "takeaway") return;

    let unsubscribe: () => void;

    const setupListener = async () => {
      try {
        const { doc, onSnapshot } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        if (!db) return;

        unsubscribe = onSnapshot(doc(db, "tables", table.id), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Check if session is still valid
            const storedSessionKey = `session_${table.id}`;
            const storedSessionTime = window.sessionStorage.getItem(storedSessionKey);
            
            // If table is available (reset) or session time mismatch
            // If the server's sessionStartTime is NEWER than what we have stored, it means the table was reset
            if (data.sessionStartTime && storedSessionTime && Number(data.sessionStartTime) > Number(storedSessionTime)) {
               console.log("Session expired: Server session time > Local session time");
               toast.info("Votre session a expiré. La table a été libérée.");
               
               // Clear local state - this now also sets to takeaway mode
               clearTableSession();
               
               // Clear URL param using router to trigger re-render and update hooks
               // This prevents the app from restoring the table from the URL
               router.replace("/");
               
               // Clear sessionStorage for this table
               window.sessionStorage.removeItem(storedSessionKey);
            }
          }
        });
      } catch (err) {
        console.error("Error setting up table listener:", err);
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [table?.id]);

  // Handle URL params for QR codes
  useEffect(() => {
    // Use the param from hook instead of window.location
    if (tableParam) {
      const cleanTableId = tableParam.replace("Table ", "");

      // ✅ Session & Ghost Order Fix
      // Only clear if we are on a DIFFERENT table and NOT already in takeaway mode
      if (
        table?.label && 
        table.label !== cleanTableId && 
        table.id !== "takeaway"
      ) {
        console.log(
          `Switching from table ${table.label} to ${cleanTableId} - clearing session`,
        );
        clearTableSession();
        scanProcessed.current = false;
      }

      // Resolve Real Table ID & Log Scan
      const initializeTable = async () => {
        try {
          // 0. AUTHENTICATE FIRST (Critical for Rules)
          if (!auth.currentUser) {
            try {
              console.log("Authenticating anonymously...");
              await signInAnonymously(auth);
            } catch (authErr) {
              console.warn("Anon Auth failed:", authErr);
            }
          }

          // 1. Resolve Real DB ID for Table
          let realTableId = `temp_${cleanTableId}`;

          // Optimization: Skip fetch if state is already correct and has a real ID
          if (
            table?.label === cleanTableId &&
            table?.id &&
            !table.id.startsWith("temp_") &&
            !table.id.startsWith("qr") &&
            table.id !== "takeaway"
          ) {
            realTableId = table.id;
          } else {
            const q = query(
              collection(db, "tables"),
              where("label", "==", cleanTableId),
            );
            const snap = await getDocs(q);

            if (!snap.empty) {
              realTableId = snap.docs[0].id;
            } else {
              const q2 = query(
                collection(db, "tables"),
                where("label", "==", `Table ${cleanTableId}`),
              );
              const snap2 = await getDocs(q2);
              if (!snap2.empty) realTableId = snap2.docs[0].id;
            }
          }

          // Update State with VALID ID
          // CRITICAL: Only update if different to prevent loop
          if (table?.id !== realTableId || table?.label !== cleanTableId) {
            setTableId(cleanTableId);
            setOrderType("dine-in");
            setTable({ id: realTableId, label: cleanTableId });
          }

          // 3. Scan Logging - IMPROVED: Use combination key
          const scanKey = `scan_${cleanTableId}_${realTableId}`;
          if (scanProcessed.current || window.sessionStorage.getItem(scanKey)) {
            console.log(`[Scan] Already processed this exact scan: ${scanKey}`);
            scanProcessed.current = true;
            setIsVerifyingTable(false); // Done verifying

            // Setup listener for existing session
            // (Moved to global useEffect)

            return; // Already processed this exact scan
          }

          // Anti-Spam - check time-based cooldown
          const lastScanKey = `lastScan_${cleanTableId}`;
          const lastScanTime = window.sessionStorage.getItem(lastScanKey);
          const now = Date.now();

          if (!lastScanTime || now - parseInt(lastScanTime) > 2 * 60 * 1000) {
            // IMMEDIATE LOCK: Set cooldown key before any async work to prevent race conditions
            window.sessionStorage.setItem(lastScanKey, now.toString());

            try {
              // Single source of truth for scan logging
              await useScanStore.getState().addScan(cleanTableId);

              // Update Legacy Stats & Occupancy
              const { incrementTableScans } = useTableStore.getState();            
              const result = await incrementTableScans(cleanTableId);

              if (result && !result.success) {
                // toast.error(result.message, { duration: 5000 });

                // CRITICAL: Revert State & Block Access
                setTable(null);
                setTableId("");
                setAccessDenied(true);
                setIsVerifyingTable(false); // Done verifying (denied)

                // Clear session and stop processing
                window.sessionStorage.removeItem(scanKey);
                window.sessionStorage.removeItem(lastScanKey);
                return;
              }

              // NEW: Check for new session to clear cache
              if (result && result.newSession) {
                console.log(
                  "New session detected - clearing previous cart/orders",
                );
                clearTableSession();
                
                // Store the new session time immediately
                const storedSessionKey = `session_${realTableId}`;
                window.sessionStorage.setItem(storedSessionKey, Date.now().toString());
              }

              console.log(`[Scan] Logged for table ${cleanTableId}`);
              toast.success(`📍 Table ${cleanTableId} détectée`);
            } catch (e) {
              console.error("Scan logging failed:", e);
            }
          } else {
            console.log(`[Scan] Cooldown active for table ${cleanTableId}`);
          }

          // Always mark as processed for this session
          window.sessionStorage.setItem(scanKey, "true");
          scanProcessed.current = true;
          setIsVerifyingTable(false); // Done verifying (success)

          // 4. Listen for Table Status Changes (Session Termination)
          // (Moved to global useEffect)
        } catch (err: unknown) {
          console.error("Table Init Error:", err);
          // Fallback: Force set table from URL even if DB lookup fails
          if (table?.label !== cleanTableId) {
            setTableId(cleanTableId);
            setOrderType("dine-in");
            setTable({ id: `temp_${cleanTableId}`, label: cleanTableId });
            const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
            toast.error(
              `Mode hors ligne : ${errorMessage}`,
            );
          }
          setIsVerifyingTable(false); // Done verifying (error fallback)
        }
      };

      initializeTable();
    } else {
      // No table param, so no verification needed
      setIsVerifyingTable(false);

      // Logic for Takeaway / No Table
      const currentTable = useMenuStore.getState().table;

      // STRICT MODE: If no table param, FORCE Takeaway.
      // This satisfies: "s'il veux commander à table obliger il rescan"
      if (currentTable && currentTable.id !== "takeaway") {
        console.log("No table param - forcing Takeaway mode");
        clearTableSession();
      }

      // Initialize Takeaway if needed (e.g. first load without table)
      if (!currentTable) {
        setOrderType("takeaway");
        setTable({ id: "takeaway", label: "À emporter" });
      }

      // Log Takeaway Scan (if not already logged)
      if (!window.sessionStorage.getItem("takeaway_scan")) {
        import("@/lib/firebase").then(async ({ db }) => {
          if (!db) return;
          const { collection, addDoc, serverTimestamp } =
            await import("firebase/firestore");
          addDoc(collection(db, "scans"), {
            type: "TAKEAWAY",
            tableId: null,
            scannedAt: serverTimestamp(),
          }).catch((e) => console.error(e));
          window.sessionStorage.setItem("takeaway_scan", "true");
        });
      }
    }
  }, [
    setTableId,
    setOrderType,
    setTable,
    incrementTableScans,
    clearTableSession,
    table,
    tableParam,
  ]);

  // Initial Loading State
  const [mounted, setMounted] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const addLog = (msg: string) => {
    console.log(msg);
    setDebugLog((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${msg}`,
    ]);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // State
  const [isTableSelectorOpen, setIsTableSelectorOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const [detail, setDetail] = useState<DetailState>({
    open: false,
    item: null,
    qty: 1,
    options: {},
  });

  // Load Menu & Settings
  useEffect(() => {
    loadMenu();
    loadSettings();
  }, [loadMenu, loadSettings]);

  // Handle Errors
  useEffect(() => {
    if (error && !isLoading) toast.error(error);
  }, [error, isLoading]);

  // Default Category Selection
  useEffect(() => {
    if (displayCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(displayCategories[0].id);
    }
  }, [displayCategories, selectedCategory, setSelectedCategory]);

  // Filtering
  const filteredItems = useMemo(() => {
    if (selectedCategory === "cat_all") return displayItems;
    return displayItems.filter((item) => item.categoryId === selectedCategory);
  }, [selectedCategory, displayItems]);

  // Cart Totals
  const total = useMemo(
    () => cart.reduce((acc, item) => acc + item.price * (item.qty || 1), 0),
    [cart],
  );

  const itemCount = useMemo(
    () => cart.reduce((acc, item) => acc + (item.qty || 1), 0),
    [cart],
  );

  // Handlers
  const openDetail = (item: MenuItem & { available: boolean }) => {
    setDetail({
      open: true,
      item,
      qty: 1,
      options: {},
    });
  };

  const handleAddToCart = () => {
    if (!detail.item) return;

    // Calculate price with options
    // Si une variante est sélectionnée, utilprix absolu de la variante
    // Sinon, prix de base (ou promo) + suppléments
    const selectedOptions = detail.options as Record<string, string | number | boolean>;
    const selectedVariant = detail.item.options?.find(
      (opt) => opt.type === "variant" && selectedOptions[opt.name],
    );

    // Use promo price if active
    const effectiveBasePrice =
      detail.item.promotion &&
      Date.now() >= detail.item.promotion.startDate &&
      Date.now() <= detail.item.promotion.endDate
        ? detail.item.promotion.price
        : detail.item.price;

    const basePrice = selectedVariant
      ? selectedVariant.price
      : effectiveBasePrice;
    const addonsTotal =
      detail.item.options
        ?.filter(
          (opt) =>
            (opt.type === "addon" || !opt.type) && selectedOptions[opt.name],
        )
        .reduce((sum, opt) => sum + opt.price, 0) || 0;
    const totalPrice = basePrice + addonsTotal;

    const toAdd: OrderItem = {
      menuId: detail.item.id,
      name: detail.item.name,
      price: totalPrice, // Use calculated price with options
      qty: detail.qty,
      note: detail.options.note?.trim(),
      options: detail.options,
      imageUrl: detail.item.imageUrl,
    };

    addToCart(toAdd);
    setDetail({ open: false, item: null, qty: 1, options: {} });
    toast.success("Ajouté au panier");
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    // Only require table for dine-in orders
    if (orderType === "dine-in" && !table) {
      setIsTableSelectorOpen(true);
      toast.info(
        "Veuillez scanner le QR code de votre table pour commander sur place.",
      );
      return;
    }

    try {
      // Vérifier la disponibilité de chaque plat avant de créer la commande
      const unavailableItems: string[] = [];

      for (const cartItem of cart) {
        const menuItem = items.find((item) => item.id === cartItem.menuId);
        if (!menuItem || !menuItem.available) {
          unavailableItems.push(cartItem.name);
        }
      }

      if (unavailableItems.length > 0) {
        toast.error(
          `Certains articles ne sont plus disponibles : ${unavailableItems.join(", ")}`,
          {
            description: "Veuillez les retirer de votre panier",
            duration: 6000,
          },
        );
        return;
      }

      // Fallback: If table is null but we have a tableParam, use it
      let finalTableId = table ? table.label : "À emporter";
      let finalTableDocId = table?.id;

      if (!table && tableParam) {
        const cleanParam = tableParam.replace("Table ", "");
        finalTableId = cleanParam;
        finalTableDocId = `temp_${cleanParam}`;
        console.warn("Using fallback table param for order:", finalTableId);
      }

      const orderId = await placeOrder({
        tableId: finalTableId,
        tableDocId: finalTableDocId,
        items: cart,
        total: total,
      });

      toast.success("Commande envoyée en cuisine !");
      const { clearCart } = useMenuStore.getState();
      clearCart();
      setCartOpen(false);
      router.push(`/order/${orderId}`);
    } catch (error) {
      console.error("Order error:", error);
      toast.error("Erreur lors de la commande");
    }
  };

  // Loading State
  // CRITICAL: Block rendering if we have a table param that hasn't been processed yet
  // This prevents the "Flash" of the menu before the access check completes
  const shouldShowLoader =
    (isLoading && (!categories || categories.length === 0)) ||
    isVerifyingTable ||
    (!!tableParam && !scanProcessed.current && !accessDenied);

  if (shouldShowLoader) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-background z-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium animate-pulse">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="fixed inset-0 bg-background z-[9999] flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="max-w-md w-full bg-card border rounded-3xl shadow-2xl p-8 text-center space-y-6">
          <div className="mx-auto w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-2">
            <Bell className="w-12 h-12 text-red-600 dark:text-red-500" />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              Table Complète
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Cette table a atteint sa capacité maximale.
              <br />
              <span className="text-sm">
                Veuillez scanner une autre table pour commander.
              </span>
            </p>
          </div>

          <div className="pt-4">
            <p className="text-sm text-muted-foreground font-medium animate-pulse">
              Veuillez scanner un autre code QR pour continuer.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Header
        table={table}
        orderType={orderType}
        onCallServer={() => setCallServerOpen(true)}
      />

      <main className="max-w-5xl mx-auto w-full flex-1 pb-8">
        <Hero />

        <FeaturedItems items={displayItems} onAdd={openDetail} />

        <CategoryNav
          categories={displayCategories}
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
        />

        <div className="px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-xl">
              {displayCategories.find((c) => c.id === selectedCategory)?.name ||
                "Menu"}
            </h2>
            <span className="text-sm text-muted-foreground">
              {filteredItems.length} plats
            </span>
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Aucun plat disponible dans cette catégorie.
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onAdd={() => openDetail(item)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none z-50">
        <div className="w-full max-w-5xl pointer-events-auto">
          <CartBar
            itemCount={itemCount}
            total={total}
            onViewCart={() => setCartOpen(true)}
          />
        </div>
      </div>

      {/* Active Order Floating Button */}
      {activeOrderId && itemCount === 0 && (
        <div className="fixed bottom-6 right-4 z-40">
          <Button
            onClick={() => router.push(`/order/${activeOrderId}`)}
            className="rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-white px-5 py-3 h-auto flex items-center gap-3 animate-in slide-in-from-bottom-10 border-2 border-white/20"
          >
            <div className="relative flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full animate-ping absolute" />
              <div className="w-2 h-2 bg-white rounded-full relative" />
            </div>
            <span className="font-bold text-sm">
              {activeOrderStatus === "served"
                ? "Voir ma facture"
                : "Ma Commande"}
            </span>
          </Button>
        </div>
      )}

      <Footer />

      {/* Call Server Dialog */}
      <Dialog open={callServerOpen} onOpenChange={setCallServerOpen}>
        <DialogContent className="sm:max-w-xs rounded-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-center text-xl font-bold">
              Appeler un serveur ?
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6">
            {/* Server Animation */}
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping" />
              <div className="relative w-full h-full bg-white dark:bg-zinc-900 border-2 border-primary rounded-full flex items-center justify-center overflow-hidden">
                <div className="animate-[slide-in_1.5s_ease-in-out_infinite]">
                  <ChefHat className="w-10 h-10 text-primary" />
                </div>
              </div>
            </div>

            <Button
              onClick={() => handleCallServer("assistance")}
              className="w-full h-12 text-base font-bold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md transition-all active:scale-95"
            >
              Oui, appeler maintenant
            </Button>
          </div>

          <style jsx global>{`
            @keyframes slide-in {
              0% {
                transform: translateX(-150%);
                opacity: 0;
              }
              50% {
                transform: translateX(0);
                opacity: 1;
              }
              100% {
                transform: translateX(150%);
                opacity: 0;
              }
            }
          `}</style>
        </DialogContent>
      </Dialog>

      <TableSelector
        open={isTableSelectorOpen}
        onOpenChange={setIsTableSelectorOpen}
        currentTable={table}
        onSelectTable={setTable}
        forceSelection={false}
      />

      <ItemDetail
        open={detail.open}
        onOpenChange={(open) => setDetail((prev) => ({ ...prev, open }))}
        item={detail.item}
        qty={detail.qty}
        setQty={(qty) => setDetail((prev) => ({ ...prev, qty }))}
        options={detail.options}
        setOptions={(options) => setDetail((prev) => ({ ...prev, options }))}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        cart={cart}
        onUpdateQty={updateQty}
        onRemove={removeFromCart}
        onCheckout={handlePlaceOrder}
        total={total}
      />

      {/* Debug Log - Temporary */}
      {debugLog.length > 0 && (
        <div className="fixed top-0 left-0 bg-black/80 text-white text-xs p-2 z-[200] max-w-[300px] max-h-[200px] overflow-auto pointer-events-none">
          {debugLog.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <MenuContent />
    </Suspense>
  );
}
