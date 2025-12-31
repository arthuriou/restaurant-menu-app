"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Minus, Plus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { MenuItem } from "@/types";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);
  return matches;
}

interface ItemDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: (MenuItem & { available: boolean }) | null;
  qty: number;
  setQty: (qty: number) => void;
  options: Record<string, any>;
  setOptions: (options: any) => void;
  onAddToCart: () => void;
}

interface ItemDetailContentProps {
  item: MenuItem & { available: boolean };
  qty: number;
  setQty: (qty: number) => void;
  options: Record<string, any>;
  setOptions: (options: any) => void;
  onAddToCart: () => void;
  onClose: () => void;
}

function ItemDetailContent({ item, qty, setQty, options, setOptions, onAddToCart, onClose }: ItemDetailContentProps) {
  const selectedVariant = item.options?.find(opt => opt.type === 'variant' && options[opt.name]);
  
  // Calculate effective base price (promo or regular)
  const effectiveBasePrice = item.promotion && 
    Date.now() >= item.promotion.startDate && 
    Date.now() <= item.promotion.endDate
      ? item.promotion.price 
      : item.price;

  const basePrice = selectedVariant ? selectedVariant.price : effectiveBasePrice;
  const addonsTotal = item.options?.filter(opt => (opt.type === 'addon' || !opt.type) && options[opt.name])
    .reduce((sum, opt) => sum + opt.price, 0) || 0;
  const unitPrice = basePrice + addonsTotal;
  const totalPrice = unitPrice * qty;
  const noteRef = useRef<HTMLTextAreaElement>(null);

  const handleNoteFocus = () => {
    setTimeout(() => {
      noteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-zinc-900 relative">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-all shadow-lg border border-white/10"
      >
        <X className="w-5 h-5" strokeWidth={2.5} />
      </button>

      <div className="relative w-full h-[45vh] min-h-[320px] bg-zinc-100 dark:bg-zinc-800 shrink-0 rounded-b-[40px] overflow-hidden shadow-2xl z-10">
        {item.imageUrl ? (
          <>
            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" priority />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400">Pas d'image</div>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="h-full">
          <div className="px-4 pt-4 pb-32">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground mb-2">{item.name}</h2>
              {item.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              )}
            </div>

            {item.options && item.options.filter(opt => opt.type === 'variant').length > 0 && (
              <div className="mb-6">
                <Label className="text-sm font-bold mb-3 block">Choisissez votre variante</Label>
                <div className="space-y-2">
                  {item.options.filter(opt => opt.type === 'variant').map((option, idx) => {
                    const isSelected = !!options[option.name];
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          const newOptions = { ...options };
                          item.options?.filter(o => o.type === 'variant').forEach(o => {
                            delete newOptions[o.name];
                          });
                          if (!isSelected) newOptions[option.name] = true;
                          setOptions(newOptions);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
                          isSelected ? "border-primary bg-primary/5" : "border-zinc-200 dark:border-zinc-700 hover:border-primary/50"
                        )}
                      >
                        {option.imageUrl && (
                          <div className="relative w-14 h-14 rounded-md overflow-hidden shrink-0 bg-zinc-100">
                            <Image src={option.imageUrl} alt={option.name} fill className="object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{option.name}</div>
                          {option.description && (
                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{option.description}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-bold text-primary">{option.price.toLocaleString()} FCFA</span>
                          <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", isSelected ? "border-primary bg-primary" : "border-zinc-300")}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {item.options && item.options.filter(opt => opt.type === 'addon' || !opt.type).length > 0 && (
              <div className="mb-6">
                <Label className="text-sm font-bold mb-3 block">Suppléments</Label>
                <div className="space-y-2">
                  {item.options.filter(opt => opt.type === 'addon' || !opt.type).map((option, idx) => {
                    const isSelected = !!options[option.name];
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          const newOptions = { ...options };
                          if (isSelected) delete newOptions[option.name];
                          else newOptions[option.name] = true;
                          setOptions(newOptions);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
                          isSelected ? "border-primary bg-primary/5" : "border-zinc-200 dark:border-zinc-700 hover:border-primary/50"
                        )}
                      >
                        {option.imageUrl && (
                          <div className="relative w-12 h-12 rounded-md overflow-hidden shrink-0 bg-zinc-100">
                            <Image src={option.imageUrl} alt={option.name} fill className="object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{option.name}</div>
                          {option.description && (
                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{option.description}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {option.price > 0 && (
                            <span className="text-sm font-bold text-primary">+{option.price.toLocaleString()} FCFA</span>
                          )}
                          <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center", isSelected ? "border-primary bg-primary" : "border-zinc-300")}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mb-4">
              <Label className="text-sm font-bold mb-2 block">Instructions spéciales (optionnel)</Label>
              <Textarea 
                ref={noteRef}
                placeholder="Ex: Sans oignon, bien cuit..." 
                value={options.note || ''}
                onFocus={handleNoteFocus}
                onChange={(e) => setOptions({...options, note: e.target.value})}
                className="resize-none bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 min-h-[70px] rounded-lg text-sm"
              />
            </div>
          </div>
        </ScrollArea>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-4 z-20">
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
              <button 
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-8 h-8 rounded-md bg-white dark:bg-zinc-700 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-600 transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-bold w-8 text-center">{qty}</span>
              <button 
                onClick={() => setQty(qty + 1)}
                className="w-8 h-8 rounded-md bg-white dark:bg-zinc-700 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
           </div>
           <Button 
            className="flex-1 h-12 rounded-lg text-base font-bold bg-primary hover:bg-primary/90 text-white shadow-md" 
            onClick={onAddToCart}
           >
             Ajouter • {totalPrice.toLocaleString()} FC FA
           </Button>
        </div>
      </div>
    </div>
  );
}

export function ItemDetail({ open, onOpenChange, item, qty, setQty, options, setOptions, onAddToCart }: ItemDetailProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  if (!item) return null;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl p-0 bg-transparent border-none shadow-none overflow-visible" showCloseButton={false}>
          <DialogTitle className="sr-only">{item.name}</DialogTitle>
          <div className="relative w-full h-[85vh] max-h-[700px] bg-background rounded-xl overflow-hidden shadow-2xl border border-border">
            <ItemDetailContent item={item} qty={qty} setQty={setQty} options={options} setOptions={setOptions} onAddToCart={onAddToCart} onClose={() => onOpenChange(false)} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" hideDefaultClose className="max-h-[100dvh] h-[96dvh] rounded-t-2xl p-0 flex flex-col border-t-0 shadow-xl overflow-hidden">
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full z-50" />
        <ItemDetailContent item={item} qty={qty} setQty={setQty} options={options} setOptions={setOptions} onAddToCart={onAddToCart} onClose={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}