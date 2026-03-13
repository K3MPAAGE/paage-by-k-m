import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Plus, Music, Trash2, Share2, Globe, Lock } from "lucide-react";
import { motion } from "framer-motion";

const Playlists = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchPlaylists();
  }, [user]);

  const fetchPlaylists = async () => {
    const { data } = await supabase
      .from("playlists")
      .select("*, playlist_items(count)")
      .order("created_at", { ascending: false });
    setPlaylists(data || []);
    setLoading(false);
  };

  const createPlaylist = async () => {
    if (!newName.trim() || !user) return;
    const { error } = await supabase.from("playlists").insert({
      user_id: user.id,
      name: newName.trim(),
      description: newDesc.trim(),
    });
    if (error) {
      toast.error("Failed to create playlist");
      return;
    }
    toast.success("Playlist created!");
    setNewName("");
    setNewDesc("");
    setShowCreate(false);
    fetchPlaylists();
  };

  const deletePlaylist = async (id: string) => {
    await supabase.from("playlists").delete().eq("id", id);
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
    toast.success("Playlist deleted");
  };

  const togglePublic = async (id: string, current: boolean) => {
    await supabase.from("playlists").update({ is_public: !current }).eq("id", id);
    setPlaylists((prev) => prev.map((p) => (p.id === id ? { ...p, is_public: !current } : p)));
    toast.success(!current ? "Playlist is now public" : "Playlist is now private");
  };

  const sharePlaylist = (shareId: string) => {
    const url = `${window.location.origin}/playlist/${shareId}`;
    navigator.clipboard.writeText(url);
    toast.success("Share link copied to clipboard!");
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Music className="h-5 w-5 text-primary" />
            <h1 className="font-display text-xl font-bold text-foreground">My Playlists</h1>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-display font-semibold hover:brightness-110 transition-all"
          >
            <Plus className="h-4 w-4" /> New
          </button>
        </div>
      </header>

      <main className="container max-w-lg py-8 space-y-4">
        {/* Create form */}
        {showCreate && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-4 space-y-3">
            <input
              type="text"
              placeholder="Playlist name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full rounded-lg bg-background border border-border px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full rounded-lg bg-background border border-border px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="flex gap-2">
              <button onClick={createPlaylist} className="flex-1 rounded-lg bg-primary text-primary-foreground py-2 text-sm font-display font-semibold hover:brightness-110">Create</button>
              <button onClick={() => setShowCreate(false)} className="px-4 rounded-lg border border-border text-muted-foreground text-sm hover:text-foreground">Cancel</button>
            </div>
          </motion.div>
        )}

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Loading...</p>
        ) : playlists.length === 0 && !showCreate ? (
          <div className="text-center py-20">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-display text-lg text-muted-foreground">No playlists yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first playlist!</p>
          </div>
        ) : (
          playlists.map((pl, i) => (
            <motion.div
              key={pl.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 group"
            >
              <div
                className="flex-1 cursor-pointer"
                onClick={() => navigate(`/playlist/${pl.share_id}`)}
              >
                <h3 className="font-display font-semibold text-foreground">{pl.name}</h3>
                {pl.description && <p className="text-xs text-muted-foreground mt-0.5">{pl.description}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  {pl.playlist_items?.[0]?.count || 0} items · {pl.is_public ? "Public" : "Private"}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => togglePublic(pl.id, pl.is_public)} className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
                  {pl.is_public ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </button>
                {pl.is_public && (
                  <button onClick={() => sharePlaylist(pl.share_id)} className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
                    <Share2 className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => deletePlaylist(pl.id)} className="h-8 w-8 rounded-full hover:bg-destructive/20 flex items-center justify-center text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </main>
    </div>
  );
};

export default Playlists;
