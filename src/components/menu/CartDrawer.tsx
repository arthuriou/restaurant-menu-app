"use client";

import { Minus, Plus, Trash2, ShoppingBag, ChevronDown } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { OrderItem, MenuItem } from "@/types";
import { useMenuStore } from "@/stores/menu";
import { useMemo } from "react";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: OrderItem[];
  onUpdateQty: (index: number, delta: number) => void;
  onRemove: (index: number) => void;
  onCheckout: () => void;
  total: number;
}

export function CartDrawer({ 
  open, 
  onOpenChange, 
  cart, 
  onUpdateQty, 
  onRemove, 
  onCheckout,
  total 
}: CartDrawerProps) {
  const totalQuantity = cart.reduce((acc, item) => acc + (item.qty || 1), 0);
  const { items: allMenuItems, addToCart } = useMenuStore();

  // Récupérer les recommandations basées sur le panier
  const recommendations = useMemo(() => {
    if (cart.length === 0) return [];

    const recIds = new Set<string>();
    const inCartIds = new Set(cart.map(item => item.menuId));

    cart.forEach(cartItem => {
      const menuItem = allMenuItems.find(m => m.id === cartItem.menuId);
      if (menuItem?.recommendations) {
        menuItem.recommendations.forEach(recId => {
          if (!inCartIds.has(recId)) {
            recIds.add(recId);
          }
        });
      }
    });

    const recommendedItems = Array.from(recIds)
      .map(id => allMenuItems.find(item => item.id === id))
      .filter((item): item is MenuItem & { available: boolean } => 
        item !== undefined && item.available
      )
      .slice(0, 4);

    return recommendedItems;
  }, [cart, allMenuItems]);

  const handleAddRecommendation = (item: MenuItem & { available: boolean }) => {
    addToCart({
      menuId: item.id,
      name: item.name,
      price: item.price,
      qty: 1,
      imageUrl: item.imageUrl,
    });
  };

  // Fonction pour récupérer les détails d'une option depuis le MenuItem original
  const getOptionDetails = (cartItem: OrderItem, optionName: string) => {
    const menuItem = allMenuItems.find(m => m.id === cartItem.menuId);
    return menuItem?.options?.find(opt => opt.name === optionName);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent hideDefaultClose className="w-full sm:max-w-md flex flex-col h-full p-0 bg-white dark:bg-zinc-950 border-l border-border/20">
        <SheetHeader className="px-4 py-4 border-b border-border/20 sticky top-0 z-10 space-y-0 bg-white dark:bg-zinc-950">
          <div className="w-full flex justify-center pb-3">
            <div className="w-12 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <SheetTitle className="text-lg font-bold">Mon Panier</SheetTitle>
              {cart.length > 0 && (
                <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {totalQuantity}
                </span>
              )}
            </div>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <ChevronDown className="w-5 h-5" />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>
        
        <div className="flex-1 min-h-0 overflow-hidden">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
              <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-zinc-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground mb-1">Votre panier est vide</p>
                <p className="text-sm text-muted-foreground">Découvrez nos délicieux plats !</p>
              </div>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full px-6">
                Retour au menu
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="px-4 py-4 space-y-4">
                {/* Liste des items */}
                {cart.map((item, idx) => (
                  <div key={idx} className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-3 border border-border/30">
                    {/* Header: Image plat + Nom + Prix + Actions */}
                    <div className="flex gap-3 mb-3">
                      <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-zinc-100">
                        {item.imageUrl ? (
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-zinc-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h4 className="font-bold text-sm text-foreground">{item.name}</h4>
                          <span className="font-bold text-sm text-primary whitespace-nowrap">
                            {(item.price * (item.qty || 1)).toLocaleString()} FCFA
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 rounded-lg p-0.5 border border-border/30">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 rounded-md"
                              onClick={() => onUpdateQty(idx, -1)}
                              disabled={item.qty <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-xs font-bold w-6 text-center">{item.qty}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 rounded-md"
                              onClick={() => onUpdateQty(idx, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-full"
                            onClick={() => onRemove(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Options sélectionnées avec images */}
                    {item.options && Object.keys(item.options).length > 0 && (
                      <div className="pt-2 border-t border-border/20 space-y-1.5">
                        {Object.entries(item.options).map(([optionName, optionValue]) => {
                          if (optionName === 'note') {
                            // Afficher la note différemment
                            return (
                              <div key={optionName} className="text-xs text-muted-foreground italic bg-zinc-100 dark:bg-zinc-800 p-2 rounded">
                                📝 {optionValue as string}
                              </div>
                            );
                          }
                          
                          if (optionValue === true || typeof optionValue === 'string') {
                            const optionDetails = getOptionDetails(item, optionName);
                            
                            return (
                              <div key={optionName} className="flex items-center gap-2 text-xs">
                                {optionDetails?.imageUrl && (
                                  <div className="relative h-8 w-8 shrink-0 rounded overflow-hidden bg-zinc-100">
                                    <Image 
                                      src={optionDetails.imageUrl} 
                                      alt={optionName} 
                                      fill 
                                      className="object-cover" 
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium text-foreground">{optionName}</span>
                                  {optionDetails?.description && (
                                    <p className="text-[10px] text-muted-foreground line-clamp-1">
                                      {optionDetails.description}
                                    </p>
                                  )}
                                </div>
                                {optionDetails && optionDetails.price > 0 && (
                                  <span className="text-xs font-semibold text-primary whitespace-nowrap">
                                    +{optionDetails.price.toLocaleString()} FCFA
                                  </span>
                                )}
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {/* Section "Et avec ça ?" */}
                {recommendations.length > 0 && (
                  <div className="pt-2 pb-2">
                    <h3 className="text-sm font-bold text-foreground mb-3 px-1">Et avec ça ? ✨</h3>
                    <div className="space-y-2">
                      {recommendations.map((rec) => (
                        <button
                          key={rec.id}
                          onClick={() => handleAddRecommendation(rec)}
                          className="w-full bg-white dark:bg-zinc-900 rounded-lg p-2.5 flex items-center gap-3 border border-border/30 hover:border-primary/50 hover:bg-primary/5 transition-all active:scale-[0.98]"
                        >
                          <div className="relative h-12 w-12 shrink-0 rounded-md overflow-hidden bg-zinc-100">
                            {rec.imageUrl ? (
                              <Image src={rec.imageUrl} alt={rec.name} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingBag className="w-5 h-5 text-zinc-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <div className="font-semibold text-sm text-foreground line-clamp-1">{rec.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">{rec.description}</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-bold text-primary">{rec.price.toLocaleString()} FCFA</span>
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                              <Plus className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-4 bg-white dark:bg-zinc-950 border-t border-border/20 z-20">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sous-total</span>
                <span className="font-semibold">{total.toLocaleString()} FCFA</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-xl text-primary">
                  {total.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">FCFA</span>
                </span>
              </div>
            </div>
            <Button 
              className="w-full h-12 text-base font-bold rounded-lg bg-primary hover:bg-primary/90 shadow-md" 
              onClick={onCheckout}
            >
              Commander ({totalQuantity})
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
