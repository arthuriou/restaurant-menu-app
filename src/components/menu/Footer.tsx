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
    <footer className="bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 border-t border-border/20">
      <div className="max-w-md mx-auto px-4 py-8 space-y-8">
        
        {/* Horaires de la semaine - Gamifiés */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 rounded-2xl blur-2xl" />
          <div className="relative bg-card/80 backdrop-blur-sm border-2 border-primary/20 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2 justify-center mb-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-black text-base uppercase tracking-wider bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
                Nos Horaires
              </h3>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {daysOrder.map((dayKey, idx) => {
                const dayHours = openingHours[dayKey as keyof typeof openingHours];
                const isToday = dayKey === todayKey;
                const isOpen = !dayHours?.closed;
                
                return (
                  <div 
                    key={dayKey} 
                    className={`group relative overflow-hidden rounded-xl transition-all duration-300 ${
                      isToday 
                        ? 'bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border-2 border-primary/40 shadow-lg shadow-primary/20 scale-105' 
                        : 'bg-zinc-50/50 dark:bg-zinc-900/30 border border-border/30 hover:border-primary/30 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        {isToday && (
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        )}
                        <span className={`text-sm font-bold transition-colors ${
                          isToday 
                            ? 'text-primary' 
                            : 'text-foreground group-hover:text-primary'
                        }`}>
                          {formatDay(dayKey)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isOpen ? (
                          <>
                            <span className={`text-xs font-medium ${
                              isToday ? 'text-primary font-bold' : 'text-muted-foreground'
                            }`}>
                              {dayHours?.open || '--:--'} - {dayHours?.close || '--:--'}
                            </span>
                            <CheckCircle className={`w-4 h-4 ${isToday ? 'text-primary' : 'text-green-500'}`} />
                          </>
                        ) : (
                          <>
                            <span className="text-xs font-medium text-muted-foreground">Fermé</span>
                            <XCircle className="w-4 h-4 text-zinc-400" />
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Animated gradient on hover */}
                    {!isToday && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Fun badge */}
            <div className="mt-4 flex justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-full">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-xs font-bold text-primary">
                  {openingHours[todayKey as keyof typeof openingHours]?.closed 
                    ? "Fermé aujourd'hui" 
                    : "Ouvert aujourd'hui !"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Réseaux sociaux */}
        <div className="flex justify-center gap-4">
          <a 
            href="#" 
            className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all hover:scale-110"
            aria-label="Facebook"
          >
            <Facebook className="w-5 h-5" />
          </a>
          <a 
            href="#" 
            className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all hover:scale-110"
            aria-label="Instagram"
          >
            <Instagram className="w-5 h-5" />
          </a>
        </div>

        {/* Contact info */}
        <div className="space-y-3 text-center">
          {invoiceSettings.companyPhone && (
            <a 
              href={`tel:${invoiceSettings.companyPhone}`} 
              className="group flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-all"
            >
              <div className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:bg-primary/10 transition-colors">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium">{invoiceSettings.companyPhone}</span>
            </a>
          )}
          {invoiceSettings.companyEmail && (
            <a 
              href={`mailto:${invoiceSettings.companyEmail}`} 
              className="group flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-all"
            >
              <div className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:bg-primary/10 transition-colors">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium">{invoiceSettings.companyEmail}</span>
            </a>
          )}
          {invoiceSettings.companyAddress && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium line-clamp-2">{invoiceSettings.companyAddress}</span>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-border/20 space-y-3">
          <p className="text-xs text-muted-foreground text-center font-medium">
            © {new Date().getFullYear()} {invoiceSettings.companyName}. Tous droits réservés.
          </p>
          <div className="flex justify-center gap-4 text-xs">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">Mentions légales</a>
            <span className="text-border">•</span>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">Confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
