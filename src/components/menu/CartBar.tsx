import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CartBarProps {
  itemCount: number;
  total: number;
  onViewCart: () => void;
}

export function CartBar({ itemCount, total, onViewCart }: CartBarProps) {
  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
      <Button 
        className="w-full h-14 rounded-full shadow-xl flex items-center justify-between px-6 text-lg animate-in slide-in-from-bottom-10 fade-in"
        onClick={onViewCart}
      >
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-full p-1.5">
            <ShoppingBag className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold">{itemCount} item{itemCount > 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold">View Cart</span>
          <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-mono">
            {total.toLocaleString()}
          </span>
        </div>
      </Button>
    </div>
  );
}
