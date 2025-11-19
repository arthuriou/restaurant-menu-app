import Image from "next/image";

export function Hero() {
  return (
    <div className="px-4 pt-6 pb-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Welcome to Panaroma</h1>
      
      <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden shadow-lg">
        <Image 
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop" 
          alt="Delicious Food"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
          <p className="text-white font-bold text-xl">Keep Calm &<br/>Drink Beer</p>
          <div className="absolute right-4 bottom-4 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">
            $5 OFF
          </div>
        </div>
      </div>
    </div>
  );
}
