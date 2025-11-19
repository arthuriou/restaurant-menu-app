import { UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  table: string;
  onTableClick?: () => void;
}

export function Header({ table, onTableClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="flex items-center justify-between px-4 h-14 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2 font-bold text-lg text-primary">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <span>Panaroma</span>
        </div>
        
        <Badge 
          variant="outline" 
          className="text-sm px-3 py-1 border-primary/20 bg-primary/5 text-primary cursor-pointer hover:bg-primary/10 transition-colors"
          onClick={onTableClick}
        >
          {table || "Choisir table"}
        </Badge>
      </div>
    </header>
  );
}
