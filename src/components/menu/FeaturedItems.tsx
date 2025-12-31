import { useState, useRef } from "react";
import Image from "next/image";
import { Star, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MenuItem } from "@/types";

import { useRestaurantStore } from "@/stores/restaurant";

interface FeaturedItemsProps {
  items: (MenuItem & { available: boolean })[];
  onAdd: (item: MenuItem & { available: boolean }) => void;
}

export function FeaturedItems({ items, onAdd }: FeaturedItemsProps) {
  const { chefSpecial } = useRestaurantStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter only featured items, sorted by featuredOrder if available
  const featured = items
    .filter(item => item.featured === true)
    .sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0));

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
    <div className="py-8 space-y-6">
      <div className="px-4 max-w-[1400px] mx-auto flex items-center justify-between">
        <h2 className="text-xl font-black tracking-tight text-foreground uppercase">{chefSpecial.title}</h2>
      </div>
      
      <div className="relative group/featured max-w-[1400px] mx-auto px-4 md:px-16">
        {/* Desktop Navigation Arrows - Better positioned */}
        <button 
          onClick={() => scroll('left')}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white text-black p-3 rounded-full shadow-xl opacity-0 group-hover/featured:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-primary hover:text-white border border-zinc-100"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
        </button>
        
        <button 
          onClick={() => scroll('right')}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white text-black p-3 rounded-full shadow-xl opacity-0 group-hover/featured:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-primary hover:text-white border border-zinc-100"
        >
          <ChevronRight className="w-6 h-6" strokeWidth={2.5} />
        </button>

        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory px-4 md:px-0 gap-4 md:gap-6 pb-4 no-scrollbar"
        >
          {featured.map((item) => (
            <div 
              key={item.id} 
              className="snap-center shrink-0 w-[85vw] md:w-[500px] h-[160px] md:h-[280px] flex bg-zinc-950 rounded-[32px] relative border border-zinc-800/50 shadow-xl transition-all duration-300 hover:border-zinc-700 hover:shadow-2xl hover:-translate-y-1"
            >
              {/* Left Side - Content */}
              <div className="w-[65%] md:w-[50%] p-5 md:p-8 flex flex-col justify-between relative z-10 h-full">
                <div className="space-y-3">
                  <h3 className="font-black text-2xl md:text-3xl leading-[0.9] text-white tracking-tight line-clamp-2">
                    {item.name}
                  </h3>
                  <p className="text-zinc-400 text-xs md:text-sm font-medium line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 md:gap-3 mt-auto">
                  {/* Price Bubble - Compact Squircle */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-3 md:px-4 py-2 md:py-2.5 min-w-[70px] md:min-w-[80px] flex flex-col items-center justify-center shrink-0">
                    <span className="font-black text-lg md:text-xl text-primary leading-none">
                      {item.price.toLocaleString()}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase mt-0.5">FCFA</span>
                  </div>
                  
                  {/* Action Button - Compact Squircle */}
                  {item.available ? (
                    <button
                      onClick={() => onAdd(item)}
                      className="h-[45px] w-[45px] md:h-[50px] md:w-[50px] bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-transform hover:bg-primary/90 shrink-0"
                    >
                      <Plus className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" strokeWidth={3} />
                    </button>
                  ) : (
                     <div className="bg-zinc-800 text-zinc-400 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-zinc-700 shrink-0">
                        Épuisé
                     </div>
                  )}
                </div>
              </div>

              {/* Right Side - Image - Floating Rounded Block */}
              <div className="absolute top-3 right-3 bottom-3 w-[43%] md:w-[50%] rounded-3xl overflow-hidden bg-zinc-900 shadow-2xl group">
                {item.imageUrl ? (
                  <Image 
                    src={item.imageUrl} 
                    alt={item.name} 
                    fill 
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-2 text-center">
                    No Image
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-2">
        {featured.map((_, i) => (
          <div 
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === activeIndex ? 'w-6 bg-primary' : 'w-1.5 bg-zinc-300 dark:bg-zinc-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
