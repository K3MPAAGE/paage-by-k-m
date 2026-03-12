import { Search } from "lucide-react";

interface AppHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const AppHeader = ({ searchQuery, onSearchChange }: AppHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container flex items-center justify-between gap-4 py-4">
        <div className="whitespace-nowrap">
          <h1 className="font-display text-xl md:text-2xl font-bold tracking-tight text-foreground">
            PAAGE <span className="text-primary">by K³M</span>
          </h1>
          <p className="text-[10px] text-muted-foreground leading-tight">
            Movies via t4tsa.cc · Music via trendybeatz.com
          </p>
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search movies & songs..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-full bg-card border border-border pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
