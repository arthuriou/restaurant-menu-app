"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  options: {
    cuisson?: string;
    sauce?: string;
    note?: string;
  };
  setOptions: (options: any) => void;
  onAddToCart: () => void;
}

interface ItemDetailContentProps {
  item: MenuItem & { available: boolean };
  qty: number;
  setQty: (qty: number) => void;
  options: {
    cuisson?: string;
    sauce?: string;
    note?: string;
  };
  setOptions: (options: any) => void;
  onAddToCart: () => void;
}

function ItemDetailContent({ item, qty, setQty, options, setOptions, onAddToCart }: ItemDetailContentProps) {
  return (
    <div className="flex flex-col h-full md:flex-row w-full">
      {/* Image Section */}
      <div className="relative h-48 sm:h-64 w-full md:w-1/2 md:h-full flex-shrink-0 group overflow-hidden">
        {item.imageUrl && (
          <>
            <Image 
              src={item.imageUrl} 
              alt={item.name} 
              fill 
              className="object-cover transition-transform duration-700 group-hover:scale-105 rounded-t-[2rem] md:rounded-l-[2rem] md:rounded-tr-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/5 opacity-60" />
          </>
        )}
        {/* Mobile Handle Indicator */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/80 rounded-full backdrop-blur-sm md:hidden z-10" />
      </div>

      {/* Details Section */}
      <div className="flex-1 flex flex-col bg-background md:w-1/2 h-full relative">
        <ScrollArea className="flex-1">
          <div className="px-4 pt-4 md:px-6 md:pt-6 pb-32"> {/* Added padding bottom to avoid overlap with footer */}
            <div className="space-y-4 md:space-y-6">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl md:text-2xl font-bold leading-tight">{item.name}</h2>
                  <span className="text-lg md:text-xl font-bold text-primary whitespace-nowrap ml-4">{item.price.toLocaleString()} FCFA</span>
                </div>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{item.description}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Cuisson</Label>
                  <RadioGroup 
                    value={options.cuisson} 
                    onValueChange={(v) => setOptions({...options, cuisson: v})}
                    className="flex flex-wrap gap-2"
                  >
                    {['Saignant', 'À point', 'Bien cuit'].map((opt) => (
                      <div key={opt}>
                        <RadioGroupItem value={opt} id={`c-${opt}`} className="peer sr-only" />
                        <Label
                          htmlFor={`c-${opt}`}
                          className="flex items-center justify-center rounded-full border-2 border-muted bg-transparent px-4 py-2 text-sm font-medium ring-offset-background transition-all hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer"
                        >
                          {opt}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold">Sauce</Label>
                  <RadioGroup 
                    value={options.sauce} 
                    onValueChange={(v) => setOptions({...options, sauce: v})}
                    className="flex flex-wrap gap-2"
                  >
                    {['Barbecue', 'Mayonnaise', 'Piment'].map((opt) => (
                      <div key={opt}>
                        <RadioGroupItem value={opt} id={`s-${opt}`} className="peer sr-only" />
                        <Label
                          htmlFor={`s-${opt}`}
                          className="flex items-center justify-center rounded-full border-2 border-muted bg-transparent px-4 py-2 text-sm font-medium ring-offset-background transition-all hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer"
                        >
                          {opt}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold">Demande spéciale</Label>
                  <Textarea 
                    placeholder="Sans oignon, peu salé..." 
                    value={options.note || ''}
                    onChange={(e) => setOptions({...options, note: e.target.value})}
                    className="resize-none bg-zinc-50 border-zinc-200"
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Sticky Footer */}
        <div className="p-4 border-t bg-background/80 backdrop-blur-sm absolute bottom-0 left-0 right-0 z-10">
          <div className="flex items-center gap-4 max-w-md mx-auto">
            <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800 rounded-full p-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 rounded-full hover:bg-white dark:hover:bg-zinc-700 shadow-sm"
                onClick={() => setQty(Math.max(1, qty - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-bold w-8 text-center">{qty}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 rounded-full hover:bg-white dark:hover:bg-zinc-700 shadow-sm"
                onClick={() => setQty(qty + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button className="flex-1 h-12 rounded-full text-lg shadow-lg shadow-primary/20" onClick={onAddToCart}>
              Ajouter {(item.price * qty).toLocaleString()}
            </Button>
          </div>
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
          className="sm:max-w-4xl p-0 bg-transparent border-none shadow-none overflow-visible" 
          showCloseButton={false}
        >
          <div className="relative w-full">
            {/* Close Button - Moved outside/corner */}
            <div className="absolute -top-12 right-0 md:-right-12 z-50">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white/90 hover:bg-white dark:bg-zinc-800/90 dark:hover:bg-zinc-800 backdrop-blur-md h-10 w-10 shadow-lg transition-all hover:scale-105"
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
            <div className="flex flex-col md:flex-row h-full md:h-[600px] bg-background rounded-[2rem] overflow-hidden shadow-2xl">
               <ItemDetailContent 
                item={item} 
                qty={qty} 
                setQty={setQty} 
                options={options} 
                setOptions={setOptions} 
                onAddToCart={onAddToCart} 
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-[2rem] p-0 flex flex-col">
        <ItemDetailContent 
          item={item} 
          qty={qty} 
          setQty={setQty} 
          options={options} 
          setOptions={setOptions} 
          onAddToCart={onAddToCart} 
        />
      </SheetContent>
    </Sheet>
  );
}
