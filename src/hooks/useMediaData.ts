import { useInfiniteQuery } from "@tanstack/react-query";
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

type MovieResponse = { success: boolean; data: ScrapedMovie[]; hasMore: boolean; error?: string };
type MusicResponse = { success: boolean; data: ScrapedSong[]; hasMore: boolean; error?: string };

async function fetchMovies(search = "", page = 1): Promise<MovieResponse> {
  const { data, error } = await supabase.functions.invoke("scrape-movies", {
    body: { search, page },
  });
  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || "Failed to fetch movies");
  return data;
}

async function fetchMusic(search = "", page = 1): Promise<MusicResponse> {
  const { data, error } = await supabase.functions.invoke("scrape-music", {
    body: { search, page },
  });
  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || "Failed to fetch music");
  return data;
}

export function useMovies(search = "") {
  return useInfiniteQuery({
    queryKey: ["movies", search],
    queryFn: ({ pageParam = 1 }) => fetchMovies(search, pageParam),
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.hasMore ? (lastPageParam as number) + 1 : undefined,
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useMusic(search = "") {
  return useInfiniteQuery({
    queryKey: ["music", search],
    queryFn: ({ pageParam = 1 }) => fetchMusic(search, pageParam),
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.hasMore ? (lastPageParam as number) + 1 : undefined,
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
