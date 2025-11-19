import Image from "next/image";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MenuItem } from "@/types";

interface MenuItemProps {
  item: MenuItem & { available: boolean };
  onAdd: () => void;
}

export function MenuItemCard({ item, onAdd }: MenuItemProps) {
  return (
    <div className="flex gap-4 p-4 bg-card rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800">
      <div className="relative h-24 w-24 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-100">
        {item.imageUrl ? (
          <Image 
            src={item.imageUrl} 
            alt={item.name} 
            fill 
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">No image</div>
        )}
        {!item.available && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white text-xs font-bold">Sold Out</span>
          </div>
        )}
      </div>
      
      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-base truncate pr-2">{item.name}</h3>
            <div className="flex items-center gap-1">
               {/* Placeholder for rating or spicy badge if needed */}
            </div>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-lg">{item.price.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">FCFA</span></span>
          <Button 
            size="icon" 
            className="h-8 w-8 rounded-full shadow-md" 
            onClick={onAdd}
            disabled={!item.available}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
