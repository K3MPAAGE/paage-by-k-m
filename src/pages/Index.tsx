import { useState, useMemo } from "react";
import AppHeader from "@/components/AppHeader";
import FilterChips, { type FilterValue } from "@/components/FilterChips";
import MediaGrid from "@/components/MediaGrid";
import MediaDetailModal from "@/components/MediaDetailModal";
import { useMovies, useMusic, type MediaItem } from "@/hooks/useMediaData";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("All");
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (query: string) => {
    setSearch(query);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => setDebouncedSearch(query), 500);
    setSearchTimeout(timeout);
  };

  const { data: movies = [], isLoading: moviesLoading } = useMovies(debouncedSearch);
  const { data: songs = [], isLoading: songsLoading } = useMusic(debouncedSearch);

  const movieItems: MediaItem[] = useMemo(
    () =>
      movies.map((m) => ({
        id: m.id,
        title: m.title,
        image: m.image,
        link: m.link,
        extra: m.type === "series" ? "TV Series" : "Movie",
        mediaType: m.type as "movie" | "series",
      })),
    [movies]
  );

  const songItems: MediaItem[] = useMemo(
    () =>
      songs.map((s) => ({
        id: s.id,
        title: s.title,
        image: s.image,
        link: s.link,
        extra: s.artist,
        mediaType: "song" as const,
      })),
    [songs]
  );

  const filteredMovies =
    filter === "Songs" ? [] : movieItems;
  const filteredSongs =
    filter === "Movies" ? [] : songItems;

  const isLoading = moviesLoading || songsLoading;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader searchQuery={search} onSearchChange={handleSearchChange} />

      <main className="container pb-12">
        <FilterChips active={filter} onSelect={setFilter} />

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="font-display text-lg">Loading content...</p>
          </div>
        )}

        {!isLoading && filteredMovies.length === 0 && filteredSongs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <p className="font-display text-lg">No results found</p>
            <p className="text-sm mt-1">Try a different search or filter</p>
          </div>
        )}

        {!isLoading && (
          <>
            <MediaGrid title="🎬 Movies & Series" items={filteredMovies} onSelect={setSelected} />
            <MediaGrid title="🎵 Music" items={filteredSongs} onSelect={setSelected} />
          </>
        )}
      </main>

      <MediaDetailModal item={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default Index;
