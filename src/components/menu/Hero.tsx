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
    <div className="pt-2 pb-2 space-y-3 relative group/hero">
      
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
          <div key={promo.id} className="relative w-full shrink-0 h-[280px] sm:h-[400px] rounded-[28px] overflow-hidden shadow-xl group snap-center">
            <Image 
              src={promo.imageUrl} 
              alt={promo.title}
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
              priority
            />
            {/* Gradient Overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
            
            <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-center items-start">
              {/* Glassmorphism Pill */}
              <div className="bg-white/20 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full mb-3 shadow-sm">
                <span className="text-white text-[10px] sm:text-xs font-bold tracking-widest uppercase drop-shadow-sm">
                  {promo.subtitle}
                </span>
              </div>
              
              {/* Main Title */}
              <h2 className="text-white font-black text-3xl sm:text-5xl leading-[0.95] drop-shadow-lg max-w-[85%]">
                {promo.title}
              </h2>
            </div>

            {/* Bottom Right Badge */}
            <div className="absolute right-5 bottom-5 bg-white text-black text-sm font-bold px-5 py-2 rounded-full shadow-xl flex items-center gap-2 transform transition-transform group-hover:scale-105">
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
