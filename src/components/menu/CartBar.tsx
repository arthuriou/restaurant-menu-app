import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CartBarProps {
  itemCount: number;
  total: number;
  onViewCart: () => void;
}

export function CartBar({ itemCount, total, onViewCart }: CartBarProps) {
  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="w-full max-w-md pointer-events-auto">
        <Button 
          className="w-full min-h-[64px] h-auto rounded-xl shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3 animate-in slide-in-from-bottom-10 fade-in border-0"
          onClick={onViewCart}
        >
          <span className="font-bold text-base sm:text-lg tracking-wide uppercase whitespace-nowrap">
            ALLEZ AU PANIER ({itemCount})
          </span>
          
          <div className="flex items-baseline gap-1 bg-white/20 px-3 py-1 rounded-lg shrink-0">
            <span className="font-bold text-base sm:text-lg">{total.toLocaleString()}</span>
            <span className="text-xs font-medium opacity-90">FCFA</span>
          </div>
        </Button>
      </div>
    </div>
  );
}
