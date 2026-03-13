import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Music } from "lucide-react";
import { motion } from "framer-motion";
import MediaDetailModal from "@/components/MediaDetailModal";
import type { MediaItem } from "@/hooks/useMediaData";

const PlaylistDetail = () => {
  const { shareId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [selected, setSelected] = useState<MediaItem | null>(null);

  useEffect(() => {
    if (!shareId) return;
    fetchPlaylist();
  }, [shareId, user]);

  const fetchPlaylist = async () => {
    const { data: pl } = await supabase
      .from("playlists")
      .select("*")
      .eq("share_id", shareId)
      .single();

    if (!pl) {
      setLoading(false);
      return;
    }

    setPlaylist(pl);
    setIsOwner(user?.id === pl.user_id);

    const { data: items } = await supabase
      .from("playlist_items")
      .select("*")
      .eq("playlist_id", pl.id)
      .order("position");

    setItems(items || []);
    setLoading(false);
  };

  const removeItem = async (id: string) => {
    await supabase.from("playlist_items").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Removed from playlist");
  };

  const toMediaItem = (item: any): MediaItem => ({
    id: item.id,
    title: item.title,
    image: item.image,
    link: item.link,
    extra: item.extra,
    mediaType: item.media_type,
  });

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;

  if (!playlist) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <p className="font-display text-lg text-muted-foreground">Playlist not found</p>
      <button onClick={() => navigate("/")} className="text-primary hover:underline text-sm">Go home</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center gap-4 py-4">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">{playlist.name}</h1>
            {playlist.description && <p className="text-xs text-muted-foreground">{playlist.description}</p>}
          </div>
        </div>
      </header>

      <main className="container py-8">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-display text-lg text-muted-foreground">This playlist is empty</p>
            <p className="text-sm text-muted-foreground mt-1">Add items from the home page</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group relative"
              >
                <div className="cursor-pointer" onClick={() => setSelected(toMediaItem(item))}>
                  <div className={`overflow-hidden rounded-lg ${item.media_type === "song" ? "aspect-square" : "aspect-[2/3]"}`}>
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                    />
                  </div>
                  <p className="mt-2 font-display font-semibold text-sm text-foreground truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.extra}</p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-destructive/80 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <MediaDetailModal item={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default PlaylistDetail;
