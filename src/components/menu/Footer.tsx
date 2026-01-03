import { Facebook, Instagram, MapPin, Phone, Mail, Clock } from "lucide-react";
import { useRestaurantStore } from "@/stores/restaurant";

export function Footer() {
  const { invoiceSettings, openingHours } = useRestaurantStore();

  const formatDayLong = (day: string) => {
    const map: Record<string, string> = {
      monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi', thursday: 'Jeudi',
      friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche'
    };
    return map[day] || day;
  };

  const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const todayIndex = new Date().getDay(); // 0=Sunday, 1=Monday, ...
  const todayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][todayIndex];

  return (
    <footer className="bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 pt-16 pb-12">
      <div className="max-w-md mx-auto px-6 text-center">
        
        {/* Section Horaires */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Nos Horaires</h3>
          </div>
          
          <div className="space-y-3 text-left max-w-[280px] mx-auto">
            {daysOrder.map((dayKey) => {
              const dayHours = openingHours[dayKey as keyof typeof openingHours];
              const isToday = dayKey === todayKey;
              const isOpen = !dayHours?.closed;
              
              return (
                <div 
                  key={dayKey} 
                  className={`flex items-center justify-between text-sm ${
                    isToday ? 'text-primary font-bold' : 'text-muted-foreground'
                  }`}
                >
                  <span className="capitalize w-24">{formatDayLong(dayKey)}</span>
                  
                  <div className={`flex-1 mx-3 border-b border-dotted ${
                    isToday ? 'border-primary/30' : 'border-zinc-300 dark:border-zinc-700'
                  } relative top-1`} />
                  
                  <div className="text-right w-24 tabular-nums">
                    {isOpen ? (
                      <span>{dayHours?.open} - {dayHours?.close}</span>
                    ) : (
                      <span className="text-zinc-400 italic text-xs">Fermé</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Open Today Badge */}
          <div className="mt-8 flex justify-center">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border ${
              openingHours[todayKey as keyof typeof openingHours]?.closed
                ? 'bg-red-500/5 text-red-600 border-red-500/20'
                : 'bg-green-500/5 text-green-600 border-green-500/20'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                openingHours[todayKey as keyof typeof openingHours]?.closed
                  ? 'bg-red-500'
                  : 'bg-green-500 animate-pulse'
              }`} />
              {openingHours[todayKey as keyof typeof openingHours]?.closed 
                ? "Fermé aujourd'hui" 
                : "Ouvert aujourd'hui"}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-16 h-px bg-zinc-200 dark:bg-zinc-800 mx-auto my-12" />

        {/* Contact & Socials */}
        <div className="space-y-8">
          {/* Réseaux sociaux */}
          <div className="flex justify-center gap-8">
            <a 
              href="#" 
              className="text-zinc-400 hover:text-primary transition-colors transform hover:scale-110 duration-200"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a 
              href="#" 
              className="text-zinc-400 hover:text-primary transition-colors transform hover:scale-110 duration-200"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
          </div>

          {/* Contact info */}
          <div className="space-y-4">
            {invoiceSettings.companyPhone && (
              <a 
                href={`tel:${invoiceSettings.companyPhone}`} 
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span className="font-medium">{invoiceSettings.companyPhone}</span>
              </a>
            )}
            {invoiceSettings.companyEmail && (
              <a 
                href={`mailto:${invoiceSettings.companyEmail}`} 
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span className="font-medium">{invoiceSettings.companyEmail}</span>
              </a>
            )}
            {invoiceSettings.companyAddress && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="font-medium">{invoiceSettings.companyAddress}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
          <p className="text-xs text-zinc-500 font-medium">
            © {new Date().getFullYear()} {invoiceSettings.companyName}. Tous droits réservés.
          </p>
          <div className="flex justify-center gap-6 text-xs">
            <a href="#" className="text-zinc-500 hover:text-primary transition-colors">Mentions légales</a>
            <a href="#" className="text-zinc-500 hover:text-primary transition-colors">Confidentialité</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
