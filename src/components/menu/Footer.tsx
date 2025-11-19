import { Facebook, Instagram, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 py-12 pb-24">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Mon Restaurant</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto md:mx-0">
              Une expérience culinaire unique, alliant tradition et modernité pour le plaisir de vos papilles.
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Contact</h3>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground items-center md:items-start">
              <a href="#" className="flex items-center hover:text-primary transition-colors">
                <MapPin className="w-4 h-4 mr-2" /> Cocody, Abidjan
              </a>
              <a href="tel:+22507070707" className="flex items-center hover:text-primary transition-colors">
                <Phone className="w-4 h-4 mr-2" /> +225 07 07 07 07
              </a>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Suivez-nous</h3>
            <div className="flex justify-center md:justify-start gap-4">
              <a href="#" className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-primary hover:text-white transition-all">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-primary hover:text-white transition-all">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-muted-foreground">
          <p>© 2024 Mon Restaurant. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
