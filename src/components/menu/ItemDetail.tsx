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
    <div className="flex flex-col h-full md:flex-row md:h-auto">
      {/* Image Section */}
      <div className="relative h-64 w-full md:w-1/2 md:h-auto flex-shrink-0">
        {item.imageUrl && (
          <Image 
            src={item.imageUrl} 
            alt={item.name} 
            fill 
            className="object-cover rounded-t-[2rem] md:rounded-l-lg md:rounded-tr-none"
          />
        )}
        {/* Mobile Handle Indicator */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/80 rounded-full backdrop-blur-sm md:hidden" />
      </div>

      {/* Details Section */}
      <div className="flex-1 overflow-hidden flex flex-col bg-background md:w-1/2 md:h-[600px]">
        <ScrollArea className="flex-1 px-6 pt-6">
          <div className="pb-24 space-y-6">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-2xl font-bold">{item.name}</h2>
                <span className="text-xl font-bold text-primary">{item.price.toLocaleString()} FCFA</span>
              </div>
              <p className="text-muted-foreground">{item.description}</p>
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
        </ScrollArea>

        <div className="p-4 border-t bg-background/80 backdrop-blur-sm absolute bottom-0 left-0 right-0 md:relative">
          <div className="flex items-center gap-4 max-w-md mx-auto">
            <div className="flex items-center gap-3 bg-zinc-100 rounded-full p-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 rounded-full hover:bg-white shadow-sm"
                onClick={() => setQty(Math.max(1, qty - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-bold w-4 text-center">{qty}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 rounded-full hover:bg-white shadow-sm"
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
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-background">
          <ItemDetailContent 
            item={item} 
            qty={qty} 
            setQty={setQty} 
            options={options} 
            setOptions={setOptions} 
            onAddToCart={onAddToCart} 
          />
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
