"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";

const PROMOS = [
  {
    id: 1,
    title: "KEEP CALM &\nDRINK BEER",
    subtitle: "Offre Spéciale",
    discount: "-20% OFF",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop",
    color: "text-primary"
  },
  {
    id: 2,
    title: "BURGER\nSUPREME",
    subtitle: "Nouveauté",
    discount: "HOT",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1899&auto=format&fit=crop",
    color: "text-orange-500"
  },
  {
    id: 3,
    title: "SUSHI\nPLATTER",
    subtitle: "Partagez",
    discount: "NEW",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=2070&auto=format&fit=crop",
    color: "text-red-500"
  }
];

export function Hero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const width = scrollRef.current.offsetWidth;
      const index = Math.round(scrollLeft / width);
      setActiveIndex(index);
    }
  };

  return (
    <div className="pt-2 pb-4 space-y-3">
      <div className="px-5">
        <h1 className="text-2xl font-bold tracking-tight">Bienvenue chez <span className="text-primary">Panaroma</span> 👋</h1>
      </div>
      
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory px-4 gap-4 pb-4 no-scrollbar"
      >
        {PROMOS.map((promo) => (
          <div key={promo.id} className="relative w-full shrink-0 aspect-[2.2/1] rounded-3xl overflow-hidden shadow-2xl shadow-black/20 group snap-center">
            <Image 
              src={promo.image} 
              alt={promo.title}
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
              priority
            />
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-500" />
            
            <div className="absolute inset-0 flex flex-col justify-center p-6">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 self-start px-3 py-1 rounded-full mb-3">
                <span className="text-white text-[10px] font-bold tracking-wider uppercase">{promo.subtitle}</span>
              </div>
              <h2 className="text-white font-black text-3xl leading-none drop-shadow-lg whitespace-pre-line">
                {promo.title.split('\n')[0]}<br/>
                <span className={promo.color}>{promo.title.split('\n')[1]}</span>
              </h2>
            </div>

            <div className="absolute right-4 bottom-4 bg-white text-black text-sm font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
              {promo.discount}
            </div>
          </div>
        ))}
      </div>

      {/* Indicators */}
      <div className="flex justify-center gap-2">
        {PROMOS.map((_, idx) => (
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
