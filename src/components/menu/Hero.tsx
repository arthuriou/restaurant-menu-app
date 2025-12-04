"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRestaurantStore } from "@/stores/restaurant";

export function Hero() {
  const { specialOffers, invoiceSettings } = useRestaurantStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToSlide = (index: number) => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({
        left: width * index,
        behavior: 'smooth'
      });
      setActiveIndex(index);
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const width = scrollRef.current.offsetWidth;
      const index = Math.round(scrollLeft / width);
      setActiveIndex(index);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -width : width,
        behavior: 'smooth'
      });
    }
  };

  if (!specialOffers || specialOffers.length === 0) {
    return null;
  }

  return (
    <div className="pt-2 pb-4 space-y-3 relative group/hero">
      
      {/* Desktop Navigation Arrows */}
      {specialOffers.length > 1 && (
        <>
          <button 
            onClick={() => scroll('left')}
            className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-lg opacity-0 group-hover/hero:opacity-100 transition-opacity hover:bg-white"
          >
            <ChevronLeft className="w-6 h-6 text-black" />
          </button>
          
          <button 
            onClick={() => scroll('right')}
            className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-lg opacity-0 group-hover/hero:opacity-100 transition-opacity hover:bg-white"
          >
            <ChevronRight className="w-6 h-6 text-black" />
          </button>
        </>
      )}

      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory px-4 gap-4 pb-4 no-scrollbar"
      >
        {specialOffers.map((promo: any) => (
          <div key={promo.id} className="relative w-full shrink-0 aspect-[2.2/1] rounded-xl overflow-hidden shadow-2xl shadow-black/20 group snap-center">
            <Image 
              src={promo.imageUrl} 
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
                <span className="text-primary">{promo.title.split('\n')[1]}</span>
              </h2>
            </div>

            <div className="absolute right-4 bottom-4 bg-white text-black text-sm font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
              {promo.discount}
            </div>
          </div>
        ))}
      </div>

      {/* Indicators */}
      {specialOffers.length > 1 && (
        <div className="flex justify-center gap-2">
          {specialOffers.map((_: any, idx: number) => (
            <button 
              key={idx}
              onClick={() => scrollToSlide(idx)}
              className={`h-2 w-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                idx === activeIndex 
                  ? "bg-primary scale-125 shadow-sm" 
                  : "bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
