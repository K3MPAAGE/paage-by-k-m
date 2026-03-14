import { useState, useMemo } from "react";
import AppHeader from "@/components/AppHeader";
import FilterChips, { type FilterValue } from "@/components/FilterChips";
import MediaGrid from "@/components/MediaGrid";
import MediaDetailModal from "@/components/MediaDetailModal";
import { useMovies, useMusic, type MediaItem } from "@/hooks/useMediaData";
import { useFavorites } from "@/hooks/useFavorites";
import { usePlaylists } from "@/hooks/usePlaylists";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("All");
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const { toggleFavorite, isFavorite } = useFavorites();
  const { playlists, addToPlaylist } = usePlaylists();

  const handleSearchChange = (query: string) => {
    setSearch(query);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => setDebouncedSearch(query), 500);
    setSearchTimeout(timeout);
  };

  const {
    data: moviesData,
    isLoading: moviesLoading,
    fetchNextPage: fetchMoreMovies,
    hasNextPage: hasMoreMovies,
    isFetchingNextPage: isFetchingMoreMovies,
  } = useMovies(debouncedSearch);

  const {
    data: songsData,
    isLoading: songsLoading,
    fetchNextPage: fetchMoreSongs,
    hasNextPage: hasMoreSongs,
    isFetchingNextPage: isFetchingMoreSongs,
  } = useMusic(debouncedSearch);

  const movieItems: MediaItem[] = useMemo(
    () =>
      (moviesData?.pages ?? []).flatMap((page) =>
        page.data.map((m) => ({
          id: m.id,
          title: m.title,
          image: m.image,
          link: m.link,
          extra: m.type === "series" ? "TV Series" : "Movie",
          mediaType: m.type as "movie" | "series",
        }))
      ),
    [moviesData]
  );

  const songItems: MediaItem[] = useMemo(
    () =>
      (songsData?.pages ?? []).flatMap((page) =>
        page.data.map((s) => ({
          id: s.id,
          title: s.title,
          image: s.image,
          link: s.link,
          extra: s.artist,
          mediaType: "song" as const,
        }))
      ),
    [songsData]
  );

  const filteredMovies = filter === "Songs" ? [] : movieItems;
  const filteredSongs = filter === "Movies" ? [] : songItems;
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
            <MediaGrid
              title="🎬 Movies & Series"
              items={filteredMovies}
              onSelect={setSelected}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
            />
            {filter !== "Songs" && hasMoreMovies && (
              <div className="flex justify-center my-6">
                <button
                  onClick={() => fetchMoreMovies()}
                  disabled={isFetchingMoreMovies}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-display font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {isFetchingMoreMovies && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isFetchingMoreMovies ? "Loading more movies..." : "Load More Movies"}
                </button>
              </div>
            )}

            <MediaGrid
              title="🎵 Music"
              items={filteredSongs}
              onSelect={setSelected}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
            />
            {filter !== "Movies" && hasMoreSongs && (
              <div className="flex justify-center my-6">
                <button
                  onClick={() => fetchMoreSongs()}
                  disabled={isFetchingMoreSongs}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-display font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {isFetchingMoreSongs && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isFetchingMoreSongs ? "Loading more songs..." : "Load More Songs"}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <MediaDetailModal
        item={selected}
        onClose={() => setSelected(null)}
        isFavorite={selected ? isFavorite(selected.link) : false}
        onToggleFavorite={toggleFavorite}
        playlists={playlists}
        onAddToPlaylist={addToPlaylist}
      />
    </div>
  );
};

export default Index;
