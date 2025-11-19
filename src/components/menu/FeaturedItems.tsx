import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Plus, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MenuItem } from "@/types";

interface FeaturedItemsProps {
  items: (MenuItem & { available: boolean })[];
  onAdd: (item: MenuItem & { available: boolean }) => void;
}

export function FeaturedItems({ items, onAdd }: FeaturedItemsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sélectionner quelques items "populaires" (ici les 3 premiers pour l'exemple)
  const featured = items.slice(0, 3);

  if (featured.length === 0) return null;

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const width = scrollRef.current.offsetWidth;
      // Assuming items take up roughly 85% width + gap, but for simplicity in snap-mandatory
      // we can approximate index based on scroll position relative to item width.
      // However, since it's snap-x, usually scrollLeft / itemWidth works best.
      // Here items are w-[85%] or w-[300px]. Let's use the container center point logic or simple division.
      // For a simple approximation:
      const index = Math.round(scrollLeft / (scrollRef.current.scrollWidth / featured.length));
      setActiveIndex(Math.min(Math.max(0, index), featured.length - 1));
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      const itemWidth = width * 0.85; // Approximate item width
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -itemWidth : itemWidth,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="py-6 space-y-4 relative group/featured">
      <div className="px-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-0.5">Must Try</p>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Spécial du Chef</h2>
        </div>
        <Link href="/specials" className="flex items-center text-primary text-sm font-bold hover:opacity-80 transition-opacity">
          Voir tout <ChevronRight className="w-4 h-4 ml-0.5" />
        </Link>
      </div>
      
      {/* Desktop Navigation Arrows */}
      <button 
        onClick={() => scroll('left')}
        className="hidden md:flex absolute left-2 top-1/2 z-10 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-lg opacity-0 group-hover/featured:opacity-100 transition-opacity hover:bg-white"
      >
        <ChevronLeft className="w-6 h-6 text-black" />
      </button>
      
      <button 
        onClick={() => scroll('right')}
        className="hidden md:flex absolute right-2 top-1/2 z-10 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-lg opacity-0 group-hover/featured:opacity-100 transition-opacity hover:bg-white"
      >
        <ChevronRight className="w-6 h-6 text-black" />
      </button>

      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory px-4 gap-4 pb-4 no-scrollbar"
      >
        {featured.map((item) => (
          <div 
            key={item.id} 
            className="snap-center shrink-0 w-[85%] sm:w-[300px] relative group rounded-xl overflow-hidden shadow-lg bg-card border border-white/10"
          >
            <div className="relative h-48 w-full">
              {item.imageUrl ? (
                <Image 
                  src={item.imageUrl} 
                  alt={item.name} 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-muted-foreground">No Image</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-black text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                4.9
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <h3 className="font-bold text-lg leading-tight mb-1">{item.name}</h3>
              <p className="text-white/80 text-xs line-clamp-1 mb-3">{item.description}</p>
              
              <div className="flex items-center justify-between">
                <span className="font-bold text-xl">{item.price.toLocaleString()} <span className="text-sm font-normal opacity-80">FCFA</span></span>
                <Button 
                  size="sm" 
                  className="rounded-full bg-white text-black hover:bg-white/90 font-bold shadow-lg active:scale-95 transition-all"
                  onClick={() => onAdd(item)}
                >
                  Ajouter <Plus className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Indicators */}
      <div className="flex justify-center gap-2">
        {featured.map((_, idx) => (
          <div 
            key={idx}
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              idx === activeIndex 
                ? "bg-primary scale-125 shadow-sm" 
                : "bg-zinc-300 dark:bg-zinc-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
