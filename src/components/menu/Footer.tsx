import { Facebook, Instagram, MapPin, Phone, Mail, Twitter } from "lucide-react";

import { useRestaurantStore } from "@/stores/restaurant";

export function Footer() {
  const { invoiceSettings, openingHours } = useRestaurantStore();

  const formatDay = (day: string) => {
    const map: Record<string, string> = {
      monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi', thursday: 'Jeudi',
      friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche'
    };
    return map[day] || day;
  };

  return (
    <footer className="bg-zinc-100 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 py-12 border-t border-border/40">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Section */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent inline-block">
              {invoiceSettings.companyName}
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {invoiceSettings.footerMessage || "Une expérience culinaire inoubliable."}
            </p>
            <div className="flex gap-4">
              <SocialLink icon={<Facebook className="w-5 h-5" />} href="#" />
              <SocialLink icon={<Instagram className="w-5 h-5" />} href="#" />
              {/* <SocialLink icon={<Twitter className="w-5 h-5" />} href="#" /> */}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-foreground">Nous trouver</h4>
            <ul className="space-y-4 text-zinc-500 dark:text-zinc-400">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-1" />
                <span className="whitespace-pre-line">{invoiceSettings.companyAddress}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <span>{invoiceSettings.companyPhone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <span>{invoiceSettings.companyEmail}</span>
              </li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-foreground">Horaires</h4>
            <ul className="space-y-2 text-zinc-500 dark:text-zinc-400 text-sm">
              {Object.entries(openingHours).map(([day, hours]) => (
                <li key={day} className="flex justify-between">
                  <span>{formatDay(day)}</span>
                  <span className="text-foreground font-medium">
                    {hours.closed ? 'Fermé' : `${hours.open} - ${hours.close}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-zinc-500">
          <p>© {new Date().getFullYear()} {invoiceSettings.companyName}. Tous droits réservés.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary transition-colors">Mentions légales</a>
            <a href="#" className="hover:text-primary transition-colors">Confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ icon, href }: { icon: React.ReactNode, href: string }) {
  return (
    <a 
      href={href} 
      className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 hover:scale-110"
    >
      {icon}
    </a>
  );
}

function FooterLink({ href, children }: { href: string, children: React.ReactNode }) {
  return (
    <a 
      href={href} 
      className="text-zinc-400 hover:text-primary transition-colors flex items-center gap-2 group"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      {children}
    </a>
  );
}
