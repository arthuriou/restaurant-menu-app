import { UtensilsCrossed, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRestaurantStore } from "@/stores/restaurant";

interface HeaderProps {
  table: { id: string; label: string } | null;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  onTableClick?: () => void;
}

export function Header({ table, orderType, onTableClick }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { invoiceSettings } = useRestaurantStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/50 transition-colors duration-300">
      <div className="flex h-14 items-center justify-between px-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          {invoiceSettings.logoUrl ? (
            <img 
              src={invoiceSettings.logoUrl} 
              alt="Logo" 
              className="h-8 w-8 object-contain rounded-md" 
            />
          ) : (
            <div className="bg-primary rounded-lg p-1.5 shadow-lg shadow-primary/20">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>
          )}
          <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            {invoiceSettings.companyName || "Restaurant"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full w-8 h-8 bg-muted/50 hover:bg-muted transition-all"
            >
              {theme === "dark" ? (
                <Moon className="h-4 w-4 text-primary" />
              ) : (
                <Sun className="h-4 w-4 text-orange-500" />
              )}
            </Button>
          )}

          {orderType !== 'takeaway' && (
            <div 
              className="flex flex-col items-end cursor-pointer active:opacity-70 transition-opacity"
              onClick={onTableClick}
            >
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Table
              </span>
              <span className="text-sm font-bold text-primary leading-none">
                {table?.label || "---"}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
