import { cn } from "@/lib/utils";
import type { Category } from "@/types";

interface CategoryNavProps {
  categories: Category[];
  selectedCategory: string;
  onSelect: (id: string) => void;
}

export function CategoryNav({ categories, selectedCategory, onSelect }: CategoryNavProps) {
  return (
    <div className="sticky top-[60px] z-40 bg-background/95 backdrop-blur pb-2 pt-1 border-b border-zinc-100 dark:border-zinc-800">
      <div className="flex overflow-x-auto gap-2 px-4 py-2 no-scrollbar max-w-md mx-auto">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={cn(
              "whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all",
              selectedCategory === cat.id
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
