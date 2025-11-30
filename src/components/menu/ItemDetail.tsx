"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MenuItem } from "@/types";

// Hook simple pour détecter le desktop
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
  const [activeTab, setActiveTab] = useState<'details' | 'addons'>('details');

  // Calculate dynamic price with options
  const optionsTotal = item.options?.reduce((acc, opt) => {
    return acc + (options[opt.name] ? opt.price : 0);
  }, 0) || 0;
  const unitPrice = item.price + optionsTotal;

  return (
    <div className="flex flex-col h-full w-full bg-background relative">
      {/* Header Section with Curve */}
      <div className="relative h-[35vh] w-full shrink-0">
        {/* Background Curve */}
        <div className="absolute inset-0 bg-primary rounded-b-[100%] scale-x-[1.5] origin-top overflow-hidden shadow-lg z-0">
           {/* Optional: Add a subtle pattern or gradient here if needed */}
        </div>

        {/* Close Button (Mobile Only) */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-50 p-2 rounded-full border-2 border-white/50 bg-black/5 text-zinc-900 hover:bg-black/10 transition-colors md:hidden backdrop-blur-sm"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image */}
        <div className="absolute inset-x-0 -bottom-20 z-10 flex justify-center">
          <div className="relative w-56 h-56 md:w-64 md:h-64 rounded-full shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] overflow-hidden">
             {item.imageUrl ? (
              <Image 
                src={item.imageUrl} 
                alt={item.name} 
                fill 
                className="object-cover scale-110 hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-400">Pas d'image</div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col pt-24 px-6 pb-28 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="flex flex-col items-center text-center space-y-6 pb-8">
            
            {/* Title & Price */}
            <div className="space-y-2 w-full">
              <div className="flex items-center justify-between">
                 <h2 className="text-2xl font-bold text-foreground text-left">{item.name}</h2>
                 <span className="text-xl font-bold text-primary whitespace-nowrap">{unitPrice.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">FCFA</span></span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-4 w-full justify-center">
              <button 
                onClick={() => setActiveTab('details')}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 shadow-sm ${
                  activeTab === 'details' 
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25' 
                    : 'bg-white dark:bg-zinc-800 text-foreground hover:bg-zinc-50'
                }`}
              >
                Détails
              </button>
              <button 
                onClick={() => setActiveTab('addons')}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 shadow-sm ${
                  activeTab === 'addons' 
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25' 
                    : 'bg-white dark:bg-zinc-800 text-foreground hover:bg-zinc-50'
                }`}
              >
                Options
              </button>
            </div>

            {/* Tab Content */}
            <div className="w-full text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeTab === 'details' ? (
                <div className="space-y-4">
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Options du plat si elles existent */}
                  {item.options && item.options.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Options disponibles</Label>
                      <div className="flex flex-wrap gap-2">
                        {item.options.map((option, idx) => {
                          const isSelected = !!options[option.name];
                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                const newOptions = { ...options };
                                if (isSelected) {
                                  delete newOptions[option.name];
                                } else {
                                  newOptions[option.name] = true;
                                }
                                setOptions(newOptions);
                              }}
                              className={`flex flex-col items-center rounded-xl border-2 px-4 py-3 text-sm font-medium cursor-pointer transition-all duration-200 select-none ${
                                isSelected 
                                  ? "border-primary bg-primary/10 text-primary" 
                                  : "border-zinc-200 dark:border-zinc-800 bg-background hover:border-primary/50"
                              }`}
                            >
                              <span className="font-semibold">{option.name}</span>
                              {option.price > 0 && (
                                <span className={`text-xs font-bold ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                                  +{option.price.toLocaleString()} FCFA
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        💡 Les options avec supplément seront ajoutées au prix total
                      </p>
                    </div>
                  )}

                  {/* Note (toujours disponible) */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Note</Label>
                    <Textarea 
                      placeholder="Sans oignon, peu salé..." 
                      value={options.note || ''}
                      onChange={(e) => setOptions({...options, note: e.target.value})}
                      className="resize-none bg-zinc-50 border-zinc-200 min-h-[80px] rounded-xl"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>
        </ScrollArea>
      </div>

      {/* Bottom Action Bar */}
      <div className="absolute bottom-8 left-6 right-6 z-20">
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-2 shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex items-center justify-between pl-2 pr-2 gap-4">
           
           {/* Qty Selector */}
           <div className="flex items-center gap-4 bg-transparent p-1.5 pl-2 pr-2">
              <button 
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-10 rounded-full bg-primary text-white shadow-md shadow-primary/20 flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
              >
                <Minus className="h-5 w-5" />
              </button>
              <span className="font-bold w-6 text-center text-xl">{qty}</span>
              <button 
                onClick={() => setQty(qty + 1)}
                className="w-10 h-10 rounded-full bg-primary text-white shadow-md shadow-primary/20 flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
              >
                <Plus className="h-5 w-5" />
              </button>
           </div>

           {/* Add to Cart Button */}
           <Button 
            className="flex-1 h-14 rounded-[1.5rem] text-lg font-bold shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90 text-white" 
            onClick={onAddToCart}
           >
             Ajouter au panier
           </Button>
        </div>
      </div>
    </div>
  );
}

export function ItemDetail({ 
  open, 
  onOpenChange, 
  item, 
  qty, 
  setQty, 
  options, 
  setOptions, 
  onAddToCart 
}: ItemDetailProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (!item) return null;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="sm:max-w-4xl p-0 bg-transparent border-none shadow-none overflow-visible duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95" 
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">{item.name}</DialogTitle>
          <div className="relative w-full">
            {/* Close Button - Moved outside/corner */}
            <div className="absolute -top-12 right-0 md:-right-12 z-50">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white/90 hover:bg-white dark:bg-zinc-800/90 dark:hover:bg-zinc-800 backdrop-blur-md h-10 w-10 shadow-lg transition-all hover:scale-105 active:scale-95"
                onClick={() => onOpenChange(false)}
              >
                <span className="sr-only">Fermer</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-zinc-900 dark:text-white"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </Button>
            </div>

            {/* Main Content Wrapper */}
            <div className="relative w-full h-[85vh] max-h-[800px] bg-background rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-black/5">
               <ItemDetailContent 
                item={item} 
                qty={qty} 
                setQty={setQty} 
                options={options} 
                setOptions={setOptions} 
                onAddToCart={onAddToCart}
                onClose={() => onOpenChange(false)}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" hideDefaultClose className="h-[92vh] rounded-t-[2.5rem] p-0 flex flex-col border-t-0 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] duration-500 ease-out overflow-hidden">
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/40 rounded-full z-50" />
        <ItemDetailContent 
          item={item} 
          qty={qty} 
          setQty={setQty} 
          options={options} 
          setOptions={setOptions} 
          onAddToCart={onAddToCart}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}