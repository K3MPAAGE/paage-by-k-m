import { cn } from "@/lib/utils";

const filters = ["All", "Movies", "Songs"] as const;
export type FilterValue = (typeof filters)[number];

interface FilterChipsProps {
  active: FilterValue;
  onSelect: (filter: FilterValue) => void;
}

const FilterChips = ({ active, onSelect }: FilterChipsProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto py-4 scrollbar-none">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onSelect(filter)}
          className={cn(
            "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all",
            active === filter
              ? "bg-primary text-primary-foreground shadow-glow"
              : "bg-card text-muted-foreground hover:text-foreground border border-border"
          )}
        >
          {filter}
        </button>
      ))}
    </div>
  );
};

export default FilterChips;
