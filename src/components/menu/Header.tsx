import { UtensilsCrossed } from "lucide-react";

interface HeaderProps {
  table: { id: string; label: string } | null;
  onTableClick?: () => void;
}

export function Header({ table, onTableClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="flex h-14 items-center justify-between px-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-primary rounded-lg p-1.5">
            <UtensilsCrossed className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Panaroma</span>
        </div>

        <div 
          className="flex flex-col items-end cursor-pointer active:opacity-70 transition-opacity"
          onClick={onTableClick}
        >
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            {table?.id === 'takeaway' ? 'Mode' : 'Table N°'}
          </span>
          <span className="text-sm font-bold text-primary leading-none">
            {table?.id === 'takeaway' ? 'À emporter' : (table?.label || "---")}
          </span>
        </div>
      </div>
    </header>
  );
}
