import { cn } from "@/lib/utils";
import type { Category } from "@/types";

interface CategoryNavProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelect: (id: string) => void;
}

export function CategoryNav({ categories, selectedCategory, onSelect }: CategoryNavProps) {
  return (
    <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-sm border-b border-border/5 py-2">
      <div className="flex overflow-x-auto gap-2 px-4 no-scrollbar max-w-md mx-auto items-center">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={cn(
              "whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-200",
              selectedCategory === cat.id
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
