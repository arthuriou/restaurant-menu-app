import { MenuItem } from "@/types";
import Image from "next/image";
import { Plus, ShoppingBag } from "lucide-react";

interface MenuItemCardProps {
  item: MenuItem;
  onAdd: () => void;
}

export function MenuItemCard({ item, onAdd }: MenuItemCardProps) {
  return (
    <div 
      onClick={onAdd}
      className="group relative bg-white dark:bg-zinc-900 rounded-[2rem] p-3 shadow-lg hover:shadow-xl transition-all cursor-pointer flex gap-4 min-h-[140px] w-full !overflow-visible"
    >
      {/* Image Container - Left Side */}
      <div className="relative h-32 w-32 shrink-0 self-center">
        <div className="absolute inset-0 rounded-[1.5rem] overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-inner">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-300">
              <ShoppingBag className="w-10 h-10" />
            </div>
          )}
        </div>
      </div>

      {/* Content Container - Right Side */}
      <div className="flex-1 flex flex-col py-1 min-w-0 relative">
        <div className="space-y-1 pr-2">
          <h3 className="font-black text-xl uppercase leading-none text-zinc-900 dark:text-white line-clamp-2 tracking-tight">
            {item.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed font-medium">
            {item.description}
          </p>
        </div>

        {/* Price Tag - Overlapping Bottom Right */}
        <div className="absolute -bottom-8 -right-1 z-10">
          <div className="bg-primary text-white font-black text-lg px-5 py-2 rounded-[1rem] shadow-md transform transition-transform group-hover:scale-105 flex items-center justify-center min-w-[80px]">
            <span>{item.price.toLocaleString('fr-FR')} FCFA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
