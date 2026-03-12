import type { MediaItem } from "@/lib/mediaData";
import MediaCard from "./MediaCard";

interface MediaGridProps {
  title: string;
  items: MediaItem[];
  onSelect: (item: MediaItem) => void;
}

const MediaGrid = ({ title, items, onSelect }: MediaGridProps) => {
  if (items.length === 0) return null;

  const isMovies = items[0]?.type === "movie";

  return (
    <section className="mb-8">
      <h2 className="font-display text-lg font-semibold text-foreground mb-3">
        {title}
      </h2>
      <div
        className={`grid gap-4 ${
          isMovies
            ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
        }`}
      >
        {items.map((item, i) => (
          <MediaCard key={item.id} item={item} index={i} onClick={onSelect} />
        ))}
      </div>
    </section>
  );
};

export default MediaGrid;
