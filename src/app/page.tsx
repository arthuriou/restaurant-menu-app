"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Bell, HelpCircle, Receipt as ReceiptIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useMenuStore } from "@/stores/menu";
import { useTableStore } from "@/stores/tables";
import { useOrderStore } from "@/stores/orders";
import { useRestaurantStore } from "@/stores/restaurant";
import { useScanStore } from "@/stores/scans";
import type { Category, MenuItem, OrderItem } from "@/types";

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

export default function Home() {
  const router = useRouter();
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
  } = useMenuStore();

  // Data Resolution
  const displayCategories = categories || [];
  const displayItems = items || [];
  
  const { incrementTableScans, requestService } = useTableStore();
  const scanProcessed = useRef(false);

  // Call Server State
  const [callServerOpen, setCallServerOpen] = useState(false);

  const handleCallServer = (type: 'assistance' | 'bill') => {
    if (!table) {
      toast.error("Veuillez scanner le QR code de votre table");
      return;
    }

    // Find table ID from label
    const tableId = `t${table.label}`;
    requestService(tableId, type);
    
    setCallServerOpen(false);
    
    if (type === 'assistance') {
      toast.success("🔔 Serveur appelé ! Il arrive dans quelques instants.", {
        duration: 4000,
      });
    } else {
      toast.success("💳 Demande d'addition envoyée ! Le serveur prépare votre note.", {
        duration: 4000,
      });
    }
  };

  // Handle URL params for QR codes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table');
    
    if (tableParam) {
      const cleanTableId = tableParam.replace('Table ', '');
      setTableId(cleanTableId);
      setOrderType('dine-in');
      setTable({ id: "qr", label: cleanTableId }); // Just the number
      
      // Track scan in this session
      if (!scanProcessed.current) {
        // Ensure auth before scanning
        import('firebase/auth').then(({ signInAnonymously }) => {
          import('@/lib/firebase').then(({ auth }) => {
            addLog("Starting auth...");
            signInAnonymously(auth).then(async () => {
              addLog("Auth success. Incrementing scans...");
              const result = await incrementTableScans(cleanTableId);
              if (result && !result.success) {
                addLog("Scan failed: " + result.message);
                toast.error("Erreur Scan: " + result.message);
              } else {
                addLog("Scan success. Adding to history...");
                // Only add to history if table update worked (or ignore)
                useScanStore.getState().addScan(cleanTableId).then(() => {
                  addLog("History added.");
                  toast.success("Bienvenue ! Table " + cleanTableId + " détectée.");
                });
              }
              scanProcessed.current = true;
            }).catch(err => {
              addLog("Auth error: " + err.message);
              console.error("Auth error:", err);
              toast.error("Erreur Auth: " + err.message);
            });
          });
        });
      }
    } else {
      // Only reset if no table is already set (persistence check)
      const currentTable = useMenuStore.getState().table;
      if (!currentTable) {
        setOrderType('takeaway');
        setTable({ id: "takeaway", label: "À emporter" });
      } else if (currentTable.label.startsWith('Table ')) {
        // Migration: Fix old "Table X" labels to just "X"
        const cleanLabel = currentTable.label.replace('Table ', '');
        setTable({ ...currentTable, label: cleanLabel });
      }
    }
  }, [setTableId, setOrderType, setTable, incrementTableScans]);

  // Initial Loading State
  const [mounted, setMounted] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    console.log(msg);
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
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
    options: {}
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
  }, [displayCategories, selectedCategory]);

  // Filtering
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'cat_all') return displayItems;
    return displayItems.filter(item => item.categoryId === selectedCategory);
  }, [selectedCategory, displayItems]);

  // Cart Totals
  const total = useMemo(() => 
    cart.reduce((acc, item) => acc + (item.price * (item.qty || 1)), 0),
    [cart]
  );
  
  const itemCount = useMemo(() => 
    cart.reduce((acc, item) => acc + (item.qty || 1), 0),
    [cart]
  );

  // Handlers
  const openDetail = (item: MenuItem & { available: boolean }) => {
    setDetail({ 
      open: true, 
      item, 
      qty: 1, 
      options: {} 
    });
  };

  const handleAddToCart = () => {
    if (!detail.item) return;
    
    // Calculate price with options
    // Si une variante est sélectionnée, utilprix absolu de la variante
    // Sinon, prix de base + suppléments
    const selectedOptions = detail.options as Record<string, any>;
    const selectedVariant = detail.item.options?.find(opt => opt.type === 'variant' && selectedOptions[opt.name]);
    const basePrice = selectedVariant ? selectedVariant.price : detail.item.price;
    const addonsTotal = detail.item.options?.filter(opt => (opt.type === 'addon' || !opt.type) && selectedOptions[opt.name])
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
    if (orderType === 'dine-in' && !table) {
      setIsTableSelectorOpen(true);
      toast.info("Veuillez scanner le QR code de votre table pour commander sur place.");
      return;
    }

    try {
      // Vérifier la disponibilité de chaque plat avant de créer la commande
      const unavailableItems: string[] = [];
      
      for (const cartItem of cart) {
        const menuItem = items.find(item => item.id === cartItem.menuId);
        if (!menuItem || !menuItem.available) {
          unavailableItems.push(cartItem.name);
        }
      }

      if (unavailableItems.length > 0) {
        toast.error(`Certains articles ne sont plus disponibles : ${unavailableItems.join(', ')}`, {
          description: "Veuillez les retirer de votre panier",
          duration: 6000,
        });
        return;
      }

      const orderId = await placeOrder({
        tableId: table ? table.label : 'À emporter',
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
  if (isLoading && (!categories || categories.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-background z-[100] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium animate-pulse">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Header 
        table={table} 
        orderType={orderType}
        onTableClick={() => setIsTableSelectorOpen(true)} 
      />
      
      <main className="max-w-5xl mx-auto w-full flex-1 pb-24">
        <Hero />
        
        <FeaturedItems items={displayItems} onAdd={openDetail} />

        <CategoryNav 
          categories={displayCategories} 
          selectedCategory={selectedCategory} 
          onSelect={setSelectedCategory} 
        />
        
        <div className="px-4 py-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-xl">
              {displayCategories.find(c => c.id === selectedCategory)?.name || 'Menu'}
            </h2>
            <span className="text-sm text-muted-foreground">{filteredItems.length} plats</span>
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
      {activeOrderId && (
        <div className="fixed bottom-40 right-4 z-40">
          <Button 
            onClick={() => router.push(`/order/${activeOrderId}`)}
            className="rounded-full shadow-lg bg-green-600 hover:bg-green-700 text-white px-4 py-3 h-auto flex items-center gap-2 animate-in slide-in-from-bottom-10"
          >
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="font-bold">Suivi Commande</span>
          </Button>
        </div>
      )}

      {/* Call Server Button */}
      {table && (
        <div className="fixed bottom-20 right-4 z-40">
          <Button 
            onClick={() => setCallServerOpen(true)}
            className="rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-white w-14 h-14 flex items-center justify-center animate-in slide-in-from-bottom-10 hover:scale-110 transition-transform"
            title="Appeler le serveur"
          >
            <Bell className="w-6 h-6 animate-pulse" />
          </Button>
        </div>
      )}
      
      <Footer />

      {/* Call Server Dialog */}
      <Dialog open={callServerOpen} onOpenChange={setCallServerOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Bell className="w-6 h-6 text-primary" />
              Appeler le Serveur
            </DialogTitle>
            <DialogDescription>
              Comment pouvons-nous vous aider ?
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <Button
              onClick={() => handleCallServer('assistance')}
              className="h-24 text-lg font-semibold rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg flex flex-col items-center justify-center gap-2"
            >
              <HelpCircle className="w-8 h-8" />
              <span>J'ai besoin d'aide</span>
              <span className="text-xs font-normal opacity-90">Question ou demande spéciale</span>
            </Button>

            <Button
              onClick={() => handleCallServer('bill')}
              className="h-24 text-lg font-semibold rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg flex flex-col items-center justify-center gap-2"
            >
              <ReceiptIcon className="w-8 h-8" />
              <span>Demander l'addition</span>
              <span className="text-xs font-normal opacity-90">Prêt à régler</span>
            </Button>
          </div>
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
        onOpenChange={(open) => setDetail(prev => ({ ...prev, open }))}
        item={detail.item}
        qty={detail.qty}
        setQty={(qty) => setDetail(prev => ({ ...prev, qty }))}
        options={detail.options}
        setOptions={(options) => setDetail(prev => ({ ...prev, options }))}
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
