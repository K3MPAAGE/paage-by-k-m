import { useState, useMemo } from "react";
import AppHeader from "@/components/AppHeader";
import FilterChips, { type FilterValue } from "@/components/FilterChips";
import MediaGrid from "@/components/MediaGrid";
import MediaDetailModal from "@/components/MediaDetailModal";
import { mediaItems, type MediaItem } from "@/lib/mediaData";

const Index = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("All");
  const [selected, setSelected] = useState<MediaItem | null>(null);

  const filtered = useMemo(() => {
    let items = mediaItems;

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.genre.toLowerCase().includes(q) ||
          i.extra.toLowerCase().includes(q)
      );
    }

    if (filter === "Movies") items = items.filter((i) => i.type === "movie");
    if (filter === "Songs") items = items.filter((i) => i.type === "song");
    if (filter === "Trending") items = items.filter((_, idx) => idx % 2 === 0);
    if (filter === "Recently Added") items = items.filter((i) => i.year === "2025");

    return items;
  }, [search, filter]);

  const movies = filtered.filter((i) => i.type === "movie");
  const songs = filtered.filter((i) => i.type === "song");

  return (
    <div className="min-h-screen bg-background">
      <AppHeader searchQuery={search} onSearchChange={setSearch} />

      <main className="container pb-12">
        <FilterChips active={filter} onSelect={setFilter} />

        {movies.length === 0 && songs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <p className="font-display text-lg">No results found</p>
            <p className="text-sm mt-1">Try a different search or filter</p>
          </div>
        )}

        <MediaGrid title="🎬 Movies" items={movies} onSelect={setSelected} />
        <MediaGrid title="🎵 Songs" items={songs} onSelect={setSelected} />
      </main>

      <MediaDetailModal item={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default Index;
