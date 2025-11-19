"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Star, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMenuStore } from "@/stores/menu";
import { ItemDetail } from "@/components/menu/ItemDetail";
import { CartBar } from "@/components/menu/CartBar";
import { CartDrawer } from "@/components/menu/CartDrawer";
import Image from "next/image";
import type { MenuItem, OrderItem } from "@/types";
import { toast } from "sonner";

// Reuse mock data if store is empty (for demo)
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

export default function SpecialsPage() {
  const router = useRouter();
  const { items, loadMenu, placeOrder } = useMenuStore();
  
  const [detail, setDetail] = useState<DetailState>({ 
    open: false, 
    item: null, 
    qty: 1,
    options: {}
  });
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const displayItems = (items && items.length > 0) ? items : mockItems;

  // Cart Totals
  const total = cart.reduce((acc, item) => acc + (item.price * (item.qty || 1)), 0);
  const itemCount = cart.reduce((acc, item) => acc + (item.qty || 1), 0);

  // Handlers
  const openDetail = (item: MenuItem & { available: boolean }) => {
    setDetail({ open: true, item, qty: 1, options: {} });
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
    setCart((prev) => [...prev, toAdd]);
    setDetail({ open: false, item: null, qty: 1, options: {} });
    toast.success("Ajouté au panier");
  };

  const handleUpdateQty = (idx: number, delta: number) => {
    setCart((prev) => prev.map((item, i) => {
      if (i === idx) {
        const newQty = Math.max(1, (item.qty || 1) + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (idx: number) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePlaceOrder = async () => {
    // Reuse logic or redirect to main page to finish? 
    // For now, simple mock order
    toast.success("Commande envoyée !");
    setCart([]);
    setCartOpen(false);
    router.push('/');
  };

  return (
    <div className="min-h-dvh bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full -ml-2" onClick={() => router.back()}>
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-lg font-bold">Spécial du Chef</h1>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {displayItems.map((item) => (
          <div key={item.id} className="group relative rounded-xl overflow-hidden shadow-lg bg-card border border-white/10">
            <div className="relative h-56 w-full">
              {item.imageUrl ? (
                <Image 
                  src={item.imageUrl} 
                  alt={item.name} 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-muted-foreground">No Image</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-black text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                4.9
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
              <h3 className="font-bold text-xl leading-tight mb-2">{item.name}</h3>
              <p className="text-white/80 text-sm line-clamp-2 mb-4">{item.description}</p>
              
              <div className="flex items-center justify-between">
                <span className="font-bold text-2xl">{item.price.toLocaleString()} <span className="text-sm font-normal opacity-80">FCFA</span></span>
                <Button 
                  className="rounded-full bg-white text-black hover:bg-white/90 font-bold shadow-lg active:scale-95 transition-all px-6"
                  onClick={() => openDetail(item)}
                >
                  Ajouter <Plus className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Bar & Drawer (Reused) */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none z-20">
        <div className="w-full max-w-5xl pointer-events-auto">
          <CartBar 
            itemCount={itemCount} 
            total={total} 
            onViewCart={() => setCartOpen(true)} 
          />
        </div>
      </div>

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
        onUpdateQty={handleUpdateQty}
        onRemove={removeFromCart}
        onCheckout={handlePlaceOrder}
        total={total}
      />
    </div>
  );
}
