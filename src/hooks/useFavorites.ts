import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { MediaItem } from "@/hooks/useMediaData";

export function useFavorites() {
  const { user } = useAuth();
  const [favoriteLinks, setFavoriteLinks] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setFavoriteLinks(new Set());
      return;
    }
    supabase
      .from("favorites")
      .select("link")
      .then(({ data }) => {
        setFavoriteLinks(new Set((data || []).map((f) => f.link)));
      });
  }, [user]);

  const toggleFavorite = useCallback(
    async (item: MediaItem) => {
      if (!user) {
        toast.error("Sign in to save favorites");
        return;
      }
      const isFav = favoriteLinks.has(item.link);
      if (isFav) {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("link", item.link);
        setFavoriteLinks((prev) => {
          const next = new Set(prev);
          next.delete(item.link);
          return next;
        });
        toast.success("Removed from favorites");
      } else {
        await supabase.from("favorites").insert({
          user_id: user.id,
          title: item.title,
          image: item.image,
          link: item.link,
          extra: item.extra,
          media_type: item.mediaType,
        });
        setFavoriteLinks((prev) => new Set(prev).add(item.link));
        toast.success("Added to favorites!");
      }
    },
    [user, favoriteLinks]
  );

  const isFavorite = useCallback((link: string) => favoriteLinks.has(link), [favoriteLinks]);

  return { toggleFavorite, isFavorite };
}
