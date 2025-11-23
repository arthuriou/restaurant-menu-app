"use client";

import { useState } from "react";
import { useStaffStore } from "@/stores/staff";
import { useTableStore } from "@/stores/tables";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Delete, LogOut, Users, ChefHat, ArrowLeft, Minus, Plus, Trash2, ShoppingBag, ChevronLeft, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useMenuStore } from "@/stores/menu";
import { useOrderStore } from "@/stores/orders";
import { CategoryNav } from "@/components/menu/CategoryNav";
import { MenuItemCard } from "@/components/menu/MenuItem";
import type { MenuItem } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ItemDetail } from "@/components/menu/ItemDetail";

export default function POSPage() {
  const router = useRouter();
  const { verifyPin } = useStaffStore();
  const { tables } = useTableStore();
  
  const { 
    categories, 
    items, 
    selectedCategory, 
    setSelectedCategory, 
    cart, 
    addToCart, 
    removeFromCart, 
    updateQty,
    clearCart
  } = useMenuStore();
  
  const { addOrder } = useOrderStore();

  // State
  interface DetailState {
    open: boolean;
    item: (MenuItem & { available: boolean }) | null;
    qty: number;
    options: Record<string, any>;
  }

  const [view, setView] = useState<'login' | 'tables' | 'order'>('login');
  const [pin, setPin] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailState>({ open: false, item: null, qty: 1, options: {} });

  // PIN Pad Logic
  const handlePinPress = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      
      // Auto-verify when 4 digits reached
      if (newPin.length === 4) {
        const user = verifyPin(newPin);
        if (user) {
          setCurrentUser(user);
          setView('tables');
          setPin("");
          toast.success(`Bonjour ${user.name}`);
        } else {
          toast.error("Code PIN incorrect");
          setTimeout(() => setPin(""), 500);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('login');
    setPin("");
  };

  const handleTableSelect = (tableId: string) => {
    setSelectedTable(tableId);
    setView('order');
  };

  const handleAddToCart = () => {
    if (!detail.item) return;
    
    addToCart({
      menuId: detail.item.id,
      name: detail.item.name,
      price: detail.item.price,
      qty: detail.qty,
      note: detail.options.note?.trim(),
      options: detail.options,
      imageUrl: detail.item.imageUrl,
    });
    
    setDetail({ open: false, item: null, qty: 1, options: {} });
    toast.success("Ajouté");
  };

  const handleSendOrder = () => {
    if (cart.length === 0 || !selectedTable) return;

    const tableLabel = tables.find(t => t.id === selectedTable)?.label || "??";
    const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

    addOrder({
      id: `ord-${Date.now()}`,
      table: `Table ${tableLabel}`,
      items: cart,
      itemCount: cart.reduce((acc, item) => acc + item.qty, 0),
      total: total,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'pending',
      customer: "Client"
    });

    clearCart();
    toast.success("Commande envoyée en cuisine !");
    setView('tables');
    setSelectedTable(null);
  };

  // --- VIEWS ---

  if (view === 'order') {
    const filteredItems = selectedCategory === 'cat_all' 
      ? items 
      : items.filter(i => i.categoryId === selectedCategory);

    const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

    return (
      <div className="h-screen flex bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
        {/* Left: Menu */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setView('tables')}>
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <div>
                <h2 className="font-bold text-lg leading-none">Table {tables.find(t => t.id === selectedTable)?.label}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Nouvelle commande</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <div className="text-right mr-2">
                <p className="text-xs text-muted-foreground">Serveur</p>
                <p className="font-bold text-sm">{currentUser?.name}</p>
               </div>
            </div>
          </header>

          {/* Categories */}
          <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
             <CategoryNav 
              categories={categories || []} 
              selectedCategory={selectedCategory} 
              onSelect={setSelectedCategory} 
            />
          </div>

          {/* Items Grid */}
          <ScrollArea className="flex-1 p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
              {filteredItems?.map((item) => (
                <MenuItemCard 
                  key={item.id} 
                  item={item} 
                  onAdd={() => setDetail({ open: true, item, qty: 1, options: {} })} 
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right: Cart Sidebar */}
        <div className="w-[350px] bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 flex flex-col shrink-0 shadow-xl z-20">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <h3 className="font-bold flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Panier en cours
            </h3>
          </div>

          <ScrollArea className="flex-1 px-4">
            <div className="py-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Panier vide
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="flex gap-2 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-sm truncate">{item.name}</span>
                        <span className="text-sm font-bold ml-2">{(item.price * item.qty).toLocaleString()}</span>
                      </div>
                      {item.options && Object.values(item.options).some(Boolean) && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                          {Object.values(item.options).filter(Boolean).join(', ')}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Button 
                          variant="outline" size="icon" className="h-6 w-6 rounded-full"
                          onClick={() => updateQty(idx, -1)} disabled={item.qty <= 1}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                        <Button 
                          variant="outline" size="icon" className="h-6 w-6 rounded-full"
                          onClick={() => updateQty(idx, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <div className="flex-1" />
                        <Button 
                          variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => removeFromCart(idx)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total</span>
              <span className="text-xl font-bold text-primary">{cartTotal.toLocaleString()} FCFA</span>
            </div>
            <Button 
              className="w-full h-12 text-lg font-bold rounded-xl shadow-lg shadow-primary/20"
              onClick={handleSendOrder}
              disabled={cart.length === 0}
            >
              <Send className="w-4 h-4 mr-2" />
              Envoyer en Cuisine
            </Button>
          </div>
        </div>

        {/* Item Detail Modal */}
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
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 text-primary mb-4">
              <ChefHat className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-white">Connexion Serveur</h1>
            <p className="text-zinc-400">Entrez votre code PIN personnel</p>
          </div>

          <div className="flex justify-center gap-4 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={cn(
                  "w-4 h-4 rounded-full transition-all duration-300",
                  i < pin.length ? "bg-primary scale-110" : "bg-zinc-800"
                )} 
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <Button
                key={digit}
                variant="outline"
                className="h-20 text-3xl font-bold rounded-2xl border-zinc-800 bg-zinc-900/50 text-white hover:bg-zinc-800 hover:text-white hover:border-zinc-700 transition-all active:scale-95"
                onClick={() => handlePinPress(digit.toString())}
              >
                {digit}
              </Button>
            ))}
            <div />
            <Button
              variant="outline"
              className="h-20 text-3xl font-bold rounded-2xl border-zinc-800 bg-zinc-900/50 text-white hover:bg-zinc-800 hover:text-white hover:border-zinc-700 transition-all active:scale-95"
              onClick={() => handlePinPress("0")}
            >
              0
            </Button>
            <Button
              variant="ghost"
              className="h-20 rounded-2xl text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-all active:scale-95"
              onClick={handleBackspace}
            >
              <Delete className="w-8 h-8" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'tables') {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {currentUser?.avatar || currentUser?.name[0]}
            </div>
            <div>
              <h2 className="font-bold text-lg leading-none">{currentUser?.name}</h2>
              <p className="text-xs text-muted-foreground mt-1">Serveur</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </header>

        {/* Tables Grid */}
        <main className="flex-1 p-6 overflow-auto">
          <h1 className="text-2xl font-bold mb-6">Sélectionnez une table</h1>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {tables.map((table) => (
              <Card 
                key={table.id}
                className={cn(
                  "cursor-pointer transition-all hover:scale-105 active:scale-95 border-2",
                  table.status === 'occupied' 
                    ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50" 
                    : table.status === 'reserved'
                    ? "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900/50"
                    : "bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 hover:border-primary/50"
                )}
                onClick={() => handleTableSelect(table.id)}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center aspect-square">
                  <span className={cn(
                    "text-3xl font-bold mb-2",
                    table.status === 'occupied' ? "text-red-600" : 
                    table.status === 'reserved' ? "text-orange-600" : "text-zinc-900 dark:text-zinc-100"
                  )}>
                    {table.label}
                  </span>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Users className="w-3 h-3" />
                    <span>{table.seats}</span>
                  </div>
                  <span className={cn(
                    "mt-3 text-xs font-medium px-2 py-1 rounded-full",
                    table.status === 'occupied' ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" : 
                    table.status === 'reserved' ? "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300" : 
                    "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                  )}>
                    {table.status === 'occupied' ? 'Occupée' : 
                     table.status === 'reserved' ? 'Réservée' : 'Libre'}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return null;
}
