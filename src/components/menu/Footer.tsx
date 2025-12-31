import { Facebook, Instagram, MapPin, Phone, Mail, Clock, CheckCircle, XCircle } from "lucide-react";
import { useRestaurantStore } from "@/stores/restaurant";

export function Footer() {
  const { invoiceSettings, openingHours } = useRestaurantStore();

  const formatDay = (day: string) => {
    const map: Record<string, string> = {
      monday: 'Lun', tuesday: 'Mar', wednesday: 'Mer', thursday: 'Jeu',
      friday: 'Ven', saturday: 'Sam', sunday: 'Dim'
    };
    return map[day] || day;
  };

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
    <footer className="bg-zinc-50 dark:bg-zinc-950 border-t border-border/20 pt-8 pb-12">
      <div className="max-w-md mx-auto px-6">
        
        {/* Unified Footer Card */}
        <div className="bg-white dark:bg-zinc-900/50 rounded-2xl p-6 border border-border/40 shadow-sm text-center">
          
          {/* Section Horaires */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-base uppercase tracking-wider text-muted-foreground">Nos Horaires</h3>
            </div>
            
            <div className="space-y-2.5 text-left">
              {daysOrder.map((dayKey) => {
                const dayHours = openingHours[dayKey as keyof typeof openingHours];
                const isToday = dayKey === todayKey;
                const isOpen = !dayHours?.closed;
                
                return (
                  <div 
                    key={dayKey} 
                    className={`flex items-center justify-between text-sm py-1 ${
                      isToday ? 'text-primary font-bold' : 'text-muted-foreground'
                    }`}
                  >
                    <span className="capitalize w-20">{formatDayLong(dayKey)}</span>
                    
                    {/* Ligne pointillée plus subtile */}
                    <div className={`flex-1 mx-3 border-b border-dashed ${
                      isToday ? 'border-primary/30' : 'border-border/40'
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
            <div className="mt-6 flex justify-center">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
                openingHours[todayKey as keyof typeof openingHours]?.closed
                  ? 'bg-red-500/10 text-red-600 border-red-500/20'
                  : 'bg-green-500/10 text-green-600 border-green-500/20'
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
          <div className="w-full h-px bg-border/40 my-8" />

          {/* Contact & Socials */}
          <div className="space-y-6">
            {/* Réseaux sociaux */}
            <div className="flex justify-center gap-6">
              <a 
                href="#" 
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-6 h-6" />
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-6 h-6" />
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
          <div className="pt-6 mt-8 border-t border-border/40 space-y-3">
            <p className="text-xs text-muted-foreground font-medium">
              © {new Date().getFullYear()} {invoiceSettings.companyName}. Tous droits réservés.
            </p>
            <div className="flex justify-center gap-4 text-xs">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">Mentions légales</a>
              <span className="text-border">•</span>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">Confidentialité</a>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
