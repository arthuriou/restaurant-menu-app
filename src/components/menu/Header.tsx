import { UtensilsCrossed, Moon, Sun, Bell } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRestaurantStore } from "@/stores/restaurant";

interface HeaderProps {
  table: { id: string; label: string } | null;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  onCallServer?: () => void;
}

export function Header({ table, orderType, onCallServer }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { invoiceSettings } = useRestaurantStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border/5 transition-all duration-300">
      <div className="flex h-14 items-center justify-between px-4 max-w-md mx-auto relative">
        
        {/* Left: Back/Menu (Placeholder for now, or Theme) */}
        <div className="flex items-center w-12">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full w-8 h-8 text-muted-foreground hover:text-foreground"
          >
            {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </div>

        {/* Center: Logo/Name + Table (ONLY if dine-in) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5">
          {invoiceSettings.logoUrl ? (
            <img 
              src={invoiceSettings.logoUrl} 
              alt="Logo" 
              className="h-6 w-auto object-contain max-w-[120px]" 
            />
          ) : (
            <span className="font-black text-lg tracking-tight uppercase">
              {invoiceSettings.companyName || "GOOD FOOD"}
            </span>
          )}
          {mounted && orderType === 'dine-in' && table && (
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Table {table.label}
            </span>
          )}
        </div>

        {/* Right: Actions (Bell) */}
        <div className="flex items-center justify-end w-12 gap-1">
          {onCallServer && (
             <Button
              variant="ghost"
              size="icon"
              onClick={onCallServer}
              className="rounded-full w-8 h-8 text-primary hover:bg-primary/10"
            >
              <Bell className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
