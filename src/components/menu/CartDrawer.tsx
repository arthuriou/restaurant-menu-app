"use client";

import { Minus, Plus, Trash2, ShoppingBag, ChevronDown } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { OrderItem } from "@/types";

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
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent hideDefaultClose className="w-full sm:max-w-md flex flex-col h-full p-0 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-2xl border-l border-white/20">
        <SheetHeader className="px-6 py-5 border-b border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2.5 rounded-full">
                <ShoppingBag className="w-5 h-5 text-primary" />
              </div>
              <SheetTitle className="text-xl font-bold tracking-tight">Mon Panier</SheetTitle>
            </div>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-black/5">
                <ChevronDown className="w-6 h-6 text-muted-foreground" />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-6 p-8 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-2 shadow-inner">
                <ShoppingBag className="w-10 h-10 opacity-20" />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-bold text-foreground">Votre panier est vide</p>
                <p className="text-sm max-w-xs mx-auto leading-relaxed">Découvrez nos délicieux plats et commencez votre commande !</p>
              </div>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="mt-4 rounded-full px-8 border-primary/20 text-primary hover:bg-primary/5">
                Retour au menu
              </Button>
            </div>
          ) : (
            <ScrollArea className="flex-1 px-4">
              <div className="py-6 space-y-4">
                {cart.map((item, idx) => (
                  <div key={idx} className="group bg-white dark:bg-zinc-900/80 rounded-xl p-3 shadow-sm border border-zinc-100 dark:border-zinc-800/50 flex gap-3 transition-all hover:shadow-md">
                    {/* Item Image */}
                    <div className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden bg-zinc-100">
                      {item.imageUrl ? (
                        <Image 
                          src={item.imageUrl} 
                          alt={item.name} 
                          fill 
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400">
                          <ShoppingBag className="w-6 h-6 opacity-20" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-sm truncate pr-2 text-foreground/90">{item.name}</h4>
                          <span className="font-bold text-sm text-primary whitespace-nowrap">
                            {(item.price * (item.qty || 1)).toLocaleString()}
                          </span>
                        </div>
                        
                        {item.options && Object.keys(item.options).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {Object.entries(item.options).map(([k, v]) => (
                              v && <span key={k} className="text-[10px] px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium border border-zinc-200 dark:border-zinc-700">{v}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-full p-0.5 shadow-inner">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 rounded-full hover:bg-white dark:hover:bg-zinc-700 shadow-sm transition-all"
                            onClick={() => onUpdateQty(idx, -1)}
                            disabled={item.qty <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-xs font-bold w-4 text-center tabular-nums">{item.qty}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 rounded-full hover:bg-white dark:hover:bg-zinc-700 shadow-sm transition-all"
                            onClick={() => onUpdateQty(idx, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                          onClick={() => onRemove(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-zinc-100 dark:border-zinc-800 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] z-20 pb-8">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Sous-total</span>
                <span>{total.toLocaleString()} FCFA</span>
              </div>
              <Separator className="bg-zinc-200 dark:bg-zinc-800" />
              <div className="flex justify-between items-center">
                <span className="font-bold text-xl tracking-tight">Total</span>
                <span className="font-bold text-2xl text-primary">{total.toLocaleString()} <span className="text-sm text-muted-foreground font-normal">FCFA</span></span>
              </div>
            </div>
            <Button 
              className="w-full h-14 text-lg font-bold shadow-[0_8px_25px_-5px_rgba(var(--primary),0.4)] rounded-2xl bg-gradient-to-r from-primary to-primary/90 hover:to-primary hover:scale-[1.02] transition-all duration-300" 
              onClick={onCheckout}
            >
              Commander ({cart.length})
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
