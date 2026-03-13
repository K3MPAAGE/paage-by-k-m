import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { MediaItem } from "@/hooks/useMediaData";

export function usePlaylists() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("playlists")
      .select("id, name")
      .order("created_at", { ascending: false })
      .then(({ data }) => setPlaylists(data || []));
  }, [user]);

  const addToPlaylist = useCallback(
    async (playlistId: string, item: MediaItem) => {
      if (!user) return;
      const { error } = await supabase.from("playlist_items").insert({
        playlist_id: playlistId,
        title: item.title,
        image: item.image,
        link: item.link,
        extra: item.extra,
        media_type: item.mediaType,
      });
      if (error) {
        toast.error("Failed to add to playlist");
        return;
      }
      toast.success("Added to playlist!");
    },
    [user]
  );

  return { playlists, addToPlaylist };
}
