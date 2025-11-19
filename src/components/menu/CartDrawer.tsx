"use client";

import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
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
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full p-0 bg-zinc-50/50 dark:bg-zinc-950/50 backdrop-blur-xl">
        <SheetHeader className="px-6 py-4 border-b bg-background/50">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-full">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <SheetTitle>Votre Panier</SheetTitle>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4 p-6 text-center">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-2">
                <ShoppingBag className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-lg font-medium">Votre panier est vide</p>
              <p className="text-sm max-w-xs">Ajoutez des plats délicieux pour commencer votre commande.</p>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="mt-4">
                Retour au menu
              </Button>
            </div>
          ) : (
            <ScrollArea className="flex-1 px-4">
              <div className="py-4 space-y-4">
                {cart.map((item, idx) => (
                  <div key={idx} className="bg-background rounded-xl p-3 shadow-sm border border-border/50 flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Image Placeholder or Real Image if we had it in OrderItem (we don't currently store img url in OrderItem, but we could. For now, simple layout) */}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-semibold truncate pr-2">{item.name}</h4>
                        <span className="font-bold text-primary whitespace-nowrap">
                          {(item.price * (item.qty || 1)).toLocaleString()}
                        </span>
                      </div>
                      
                      {item.options && Object.keys(item.options).length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {Object.entries(item.options).map(([k, v]) => (
                            v && <Badge key={k} variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-normal bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">{v}</Badge>
                          ))}
                        </div>
                      )}
                      
                      {item.note && (
                        <p className="text-xs text-muted-foreground italic mb-3 bg-zinc-50 dark:bg-zinc-900 p-1.5 rounded border border-zinc-100 dark:border-zinc-800">
                          "{item.note}"
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800 rounded-full p-0.5">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-full hover:bg-background shadow-sm"
                            onClick={() => onUpdateQty(idx, -1)}
                            disabled={item.qty <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-bold w-4 text-center tabular-nums">{item.qty}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-full hover:bg-background shadow-sm"
                            onClick={() => onUpdateQty(idx, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
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
          <div className="p-6 bg-background border-t shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-10">
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Sous-total</span>
                <span>{total.toLocaleString()} FCFA</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-xl text-primary">{total.toLocaleString()} FCFA</span>
              </div>
            </div>
            <Button className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20 rounded-xl" onClick={onCheckout}>
              Commander ({cart.length})
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
