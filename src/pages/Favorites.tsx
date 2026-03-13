import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Heart, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import MediaDetailModal from "@/components/MediaDetailModal";
import type { MediaItem } from "@/hooks/useMediaData";

const Favorites = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MediaItem | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchFavorites();
  }, [user]);

  const fetchFavorites = async () => {
    const { data } = await supabase
      .from("favorites")
      .select("*")
      .order("created_at", { ascending: false });
    setFavorites(data || []);
    setLoading(false);
  };

  const removeFavorite = async (id: string) => {
    await supabase.from("favorites").delete().eq("id", id);
    setFavorites((prev) => prev.filter((f) => f.id !== id));
    toast.success("Removed from favorites");
  };

  const toMediaItem = (f: any): MediaItem => ({
    id: f.id,
    title: f.title,
    image: f.image,
    link: f.link,
    extra: f.extra,
    mediaType: f.media_type,
  });

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center gap-4 py-4">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Heart className="h-5 w-5 text-primary" />
          <h1 className="font-display text-xl font-bold text-foreground">My Favorites</h1>
        </div>
      </header>

      <main className="container py-8">
        {loading ? (
          <p className="text-center text-muted-foreground py-12">Loading...</p>
        ) : favorites.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-display text-lg text-muted-foreground">No favorites yet</p>
            <p className="text-sm text-muted-foreground mt-1">Start adding movies and songs you love!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {favorites.map((fav, i) => (
              <motion.div
                key={fav.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group relative"
              >
                <div className="cursor-pointer" onClick={() => setSelected(toMediaItem(fav))}>
                  <div className={`overflow-hidden rounded-lg ${fav.media_type === "song" ? "aspect-square" : "aspect-[2/3]"}`}>
                    <img
                      src={fav.image || "/placeholder.svg"}
                      alt={fav.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                    />
                  </div>
                  <p className="mt-2 font-display font-semibold text-sm text-foreground truncate">{fav.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{fav.extra}</p>
                </div>
                <button
                  onClick={() => removeFavorite(fav.id)}
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-destructive/80 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <MediaDetailModal item={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default Favorites;
