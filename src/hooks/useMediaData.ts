import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ScrapedMovie {
  id: string;
  title: string;
  image: string;
  link: string;
  type: "movie" | "series";
}

export interface ScrapedSong {
  id: string;
  title: string;
  artist: string;
  image: string;
  link: string;
}

export type MediaItem = {
  id: string;
  title: string;
  image: string;
  link: string;
  extra: string;
  mediaType: "movie" | "series" | "song";
};

async function fetchMovies(search = ""): Promise<ScrapedMovie[]> {
  const { data, error } = await supabase.functions.invoke("scrape-movies", {
    body: { search },
  });
  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || "Failed to fetch movies");
  return data.data;
}

async function fetchMusic(search = ""): Promise<ScrapedSong[]> {
  const { data, error } = await supabase.functions.invoke("scrape-music", {
    body: { search },
  });
  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || "Failed to fetch music");
  return data.data;
}

export function useMovies(search = "") {
  return useQuery({
    queryKey: ["movies", search],
    queryFn: () => fetchMovies(search),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useMusic(search = "") {
  return useQuery({
    queryKey: ["music", search],
    queryFn: () => fetchMusic(search),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
