import { MenuItem } from "@/types";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { getEffectivePrice } from "@/lib/price-utils";
import { cn } from "@/lib/utils";

interface MenuItemCardProps {
  item: MenuItem;
  onAdd: () => void;
}

export function MenuItemCard({ item, onAdd }: MenuItemCardProps) {
  const isAvailable = item.available !== false;
  const { currentPrice, originalPrice, isOnPromo, discountPercent } = getEffectivePrice(item);

  return (
    <div 
      onClick={isAvailable ? onAdd : undefined}
      className={cn(
        "group relative bg-white dark:bg-zinc-900 rounded-[2rem] p-3 shadow-lg hover:shadow-xl transition-all flex gap-4 min-h-[140px] w-full !overflow-visible",
        isAvailable ? "cursor-pointer" : "cursor-not-allowed opacity-60 grayscale"
      )}
    >
      {/* Promo Badge */}
      {isOnPromo && isAvailable && (
        <div className="absolute top-2 left-2 z-20 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md animate-pulse">
          -{discountPercent}%
        </div>
      )}

      {/* Unavailable Overlay */}
      {!isAvailable && (
        <div className="absolute inset-0 z-50 rounded-[2rem] flex items-center justify-center bg-black/20">
          <div className="bg-red-500 text-white font-bold text-sm px-4 py-2 rounded-full shadow-lg transform -rotate-6">
            Oops épuisé !
          </div>
        </div>
      )}

      {/* Image Container - Left Side */}
      <div className="relative h-32 w-32 shrink-0 self-center">
        <div className="absolute inset-0 rounded-[1.5rem] overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-inner">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className={cn(
                "object-cover transition-transform duration-500",
                isAvailable && "group-hover:scale-110"
              )}
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
        {isAvailable && (
          <div className="absolute -bottom-8 -right-1 z-10">
            <div className={cn(
              "text-white font-black px-5 py-2 rounded-[1rem] shadow-md transform transition-transform flex items-center justify-center min-w-[80px]",
              "group-hover:scale-105",
              isOnPromo ? "bg-green-500" : "bg-primary"
            )}>
              {isOnPromo && originalPrice && (
                <span className="line-through text-xs opacity-70 mr-2">
                  {originalPrice.toLocaleString('fr-FR')}
                </span>
              )}
              <span className="text-lg">{currentPrice.toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
