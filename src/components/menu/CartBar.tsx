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
          className="w-full h-[4.5rem] rounded-2xl shadow-[0_8px_30px_rgba(220,38,38,0.4)] bg-[#D32F2F] hover:bg-[#B71C1C] text-white transition-all duration-300 flex items-center justify-between px-5 animate-in slide-in-from-bottom-10 fade-in border-0"
          onClick={onViewCart}
        >
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-[10px] font-bold tracking-widest uppercase opacity-90">{itemCount} ARTICLE{itemCount > 1 ? 'S' : ''}</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-xl tracking-tight">{total.toLocaleString()}</span>
              <span className="text-[10px] font-medium opacity-80">FCFA</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 pl-4">
            <span className="font-bold text-sm">Voir le Panier</span>
            <div className="bg-white text-[#D32F2F] rounded-full p-1">
              <ChevronRight className="h-3 w-3 stroke-[4]" />
            </div>
          </div>
        </Button>
      </div>
    </div>
  );
}
