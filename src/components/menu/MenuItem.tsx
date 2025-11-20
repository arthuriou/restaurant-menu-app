import Image from "next/image";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MenuItem } from "@/types";

interface MenuItemProps {
  item: MenuItem & { available: boolean };
  onAdd: () => void;
}

export function MenuItemCard({ item, onAdd }: MenuItemProps) {
  return (
    <div 
      className="group relative flex flex-col bg-card rounded-[1.5rem] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-border/40 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-500 active:scale-[0.98] cursor-pointer"
      onClick={onAdd}
    >
      <div className="flex flex-row items-center p-3 gap-4">
        {/* Image Left - Circular */}
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full shadow-sm">
          {item.imageUrl ? (
            <Image 
              src={item.imageUrl} 
              alt={item.name} 
              fill 
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
              <span className="text-xs">No img</span>
            </div>
          )}
        </div>

        {/* Content Middle */}
        <div className="flex flex-col flex-1 min-w-0 space-y-1">
          <h3 className="font-bold text-base leading-tight text-foreground line-clamp-1">{item.name}</h3>
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed opacity-90">{item.description}</p>
          <div className="pt-1 font-bold text-base text-primary">
            {item.price.toLocaleString()} <span className="text-[10px] font-medium text-muted-foreground">FCFA</span>
          </div>
        </div>
        
        {/* Action Right */}
        <div className="shrink-0">
          <Button 
            size="sm" 
            className="h-9 px-4 rounded-full bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 font-bold text-xs transition-transform active:scale-95" 
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            disabled={!item.available}
          >
            Ajouter
          </Button>
        </div>
      </div>
    </div>
  );
}
