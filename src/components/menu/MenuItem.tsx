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
    <div className="group relative flex gap-4 p-3 bg-card/50 hover:bg-card/80 backdrop-blur-sm rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-white/20 transition-all duration-300">
      <div className="relative h-28 w-28 flex-shrink-0 rounded-xl overflow-hidden bg-zinc-100 shadow-inner">
        {item.imageUrl ? (
          <Image 
            src={item.imageUrl} 
            alt={item.name} 
            fill 
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">No image</div>
        )}
        {!item.available && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
            <span className="text-white text-xs font-bold px-2 py-1 bg-red-500/80 rounded-full">Épuisé</span>
          </div>
        )}
      </div>
      
      <div className="flex flex-col justify-between flex-1 min-w-0 py-1">
        <div>
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-base truncate pr-2 text-foreground/90">{item.name}</h3>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">{item.description}</p>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-lg text-primary">{item.price.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">FCFA</span></span>
          <Button 
            size="icon" 
            className="h-9 w-9 rounded-full shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-transform active:scale-95" 
            onClick={onAdd}
            disabled={!item.available}
          >
            <Plus className="h-5 w-5 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
}
