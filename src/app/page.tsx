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

// TODO: Données de démonstration - À remplacer par les données de Firestore
const mockCategories: Category[] = [
  { id: "cat_all", name: "Tout", order: 0 },
  { id: "cat_grill", name: "Grillades", order: 1 },
  { id: "cat_entrees", name: "Entrées", order: 2 },
  { id: "cat_boissons", name: "Boissons", order: 3 },
  { id: "cat_desserts", name: "Desserts", order: 4 },
];

const mockItems: (MenuItem & { available: boolean })[] = [
  {
    id: "chicken_01",
    categoryId: "cat_grill",
    name: "Poulet braisé",
    description: "Poulet mariné aux épices du chef, grillé lentement à la braise pour un goût fumé unique.",
    price: 4500,
    imageUrl: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=2070&auto=format&fit=crop",
    available: true,
  },
  {
    id: "steak_01",
    categoryId: "cat_grill",
    name: "Steak Frites",
    description: "Bœuf tendre de première qualité, servi avec nos frites maison croustillantes.",
    price: 6500,
    imageUrl: "https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=2070&auto=format&fit=crop",
    available: true,
  },
  {
    id: "burger_01",
    categoryId: "cat_grill",
    name: "Classic Burger",
    description: "Pain brioché, steak haché frais, cheddar fondant, salade, tomate, oignons rouges.",
    price: 3500,
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1899&auto=format&fit=crop",
    available: true,
  },
  {
    id: "salad_01",
    categoryId: "cat_entrees",
    name: "Salade César",
    description: "Laitue romaine, croûtons à l'ail, parmesan, sauce César onctueuse.",
    price: 2500,
    imageUrl: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?q=80&w=2070&auto=format&fit=crop",
    available: true,
  },
  {
    id: "soda_01",
    categoryId: "cat_boissons",
    name: "Coca Cola",
    description: "Bouteille en verre 33cl, servi bien frais avec une tranche de citron.",
    price: 1000,
    imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=2070&auto=format&fit=crop",
    available: true,
  },
  {
    id: "cocktail_01",
    categoryId: "cat_boissons",
    name: "Mojito Virgin",
    description: "Menthe fraîche, citron vert, eau gazeuse, glace pilée. Sans alcool.",
    price: 2000,
    imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=1887&auto=format&fit=crop",
    available: true,
  },
];

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
      setTableId(tableParam);
      setOrderType('dine-in');
      setTable({ id: "qr", label: tableParam }); 
      
      // Track scan in this session
      if (!scanProcessed.current) {
        incrementTableScans(tableParam);
        scanProcessed.current = true;
      }
    } else {
      setOrderType('takeaway');
      setTable({ id: "takeaway", label: "À emporter" });
    }
  }, [setTableId, setOrderType, setTable, incrementTableScans]);
  // State
  const [isTableSelectorOpen, setIsTableSelectorOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  
  const [detail, setDetail] = useState<DetailState>({ 
    open: false, 
    item: null, 
    qty: 1,
    options: {}
  });

  // Load Menu
  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  // Handle Errors
  useEffect(() => {
    if (error && !isLoading) toast.error(error);
  }, [error, isLoading]);

  // Data Resolution (Mock vs Real)
  const displayCategories = (categories && categories.length > 0) ? categories : mockCategories;
  const displayItems = (items && items.length > 0) ? items : mockItems;

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
    
    const toAdd: OrderItem = {
      menuId: detail.item.id,
      name: detail.item.name,
      price: detail.item.price,
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
    
    if (!table) {
      setIsTableSelectorOpen(true);
      toast.info("Veuillez indiquer votre numéro de table pour commander.");
      return;
    }

    try {
      const orderId = await placeOrder({
        tableId: table.label,
        items: cart,
        total: total,
      });
      
      toast.success("Commande envoyée en cuisine !");
      const { clearCart } = useMenuStore.getState();
      clearCart();
      setCartOpen(false);
      router.push(`/order/${orderId}`);
    } catch (error) {
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
        <div className="fixed bottom-32 right-4 z-40">
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
    </div>
  );
}
