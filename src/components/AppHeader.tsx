import { Search, User, Heart, Music, LogOut, LogIn, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

interface AppHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const AppHeader = ({ searchQuery, onSearchChange }: AppHeaderProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container flex items-center justify-between gap-3 py-4">
        <div className="whitespace-nowrap shrink-0">
          <h1 className="font-display text-xl md:text-2xl font-bold tracking-tight text-foreground cursor-pointer" onClick={() => navigate("/")}>
            PAAGE <span className="text-primary">by K³M</span>
          </h1>
          <p className="text-[10px] text-muted-foreground leading-tight">
            Movies via TheNkiri + FzMovies · Music via trendybeatz.com
          </p>
        </div>

        <div className="relative flex-1 mx-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search movies & songs..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-full bg-card border border-border pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        <div className="relative shrink-0" ref={menuRef}>
          {user ? (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-sm hover:brightness-110 transition-all"
            >
              {user.user_metadata?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
            </button>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-display font-semibold hover:brightness-110 transition-all"
            >
              <LogIn className="h-4 w-4" /> Sign In
            </button>
          )}

          {menuOpen && user && (
            <div className="absolute right-0 top-12 w-48 bg-card border border-border rounded-xl shadow-card py-1 z-50">
              <button onClick={() => { navigate("/profile"); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors">
                <User className="h-4 w-4 text-muted-foreground" /> Profile
              </button>
              <button onClick={() => { navigate("/favorites"); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors">
                <Heart className="h-4 w-4 text-muted-foreground" /> Favorites
              </button>
              <button onClick={() => { navigate("/playlists"); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors">
                <Music className="h-4 w-4 text-muted-foreground" /> Playlists
              </button>
              <div className="h-px bg-border my-1" />
              <button onClick={() => { signOut(); setMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-secondary transition-colors">
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
