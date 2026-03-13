import type { MediaItem } from "@/hooks/useMediaData";
import MediaCard from "./MediaCard";

interface MediaGridProps {
  title: string;
  items: MediaItem[];
  onSelect: (item: MediaItem) => void;
  isFavorite?: (link: string) => boolean;
  onToggleFavorite?: (item: MediaItem) => void;
}

const MediaGrid = ({ title, items, onSelect, isFavorite, onToggleFavorite }: MediaGridProps) => {
  if (items.length === 0) return null;

  const isMovies = items[0]?.mediaType !== "song";

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
          <MediaCard
            key={item.id}
            item={item}
            index={i}
            onClick={onSelect}
            isFavorite={isFavorite?.(item.link)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </section>
  );
};

export default MediaGrid;
