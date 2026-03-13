import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import type { MediaItem } from "@/hooks/useMediaData";

interface MediaCardProps {
  item: MediaItem;
  index: number;
  onClick: (item: MediaItem) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (item: MediaItem) => void;
}

const MediaCard = ({ item, index, onClick, isFavorite, onToggleFavorite }: MediaCardProps) => {
  const isMovie = item.mediaType !== "song";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.5) }}
      className="group cursor-pointer relative"
    >
      <div onClick={() => onClick(item)}>
        <div
          className={`relative overflow-hidden rounded-lg ${
            isMovie ? "aspect-[2/3]" : "aspect-square"
          }`}
        >
          <img
            src={item.image}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <div className="mt-2 px-0.5">
          <p className="font-display font-semibold text-sm text-foreground truncate">
            {item.title}
          </p>
          <p className="text-xs text-muted-foreground truncate">{item.extra}</p>
        </div>
      </div>
      {onToggleFavorite && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(item); }}
          className={`absolute top-2 right-2 h-7 w-7 rounded-full flex items-center justify-center transition-all ${
            isFavorite
              ? "bg-primary text-primary-foreground"
              : "bg-background/60 text-muted-foreground opacity-0 group-hover:opacity-100"
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${isFavorite ? "fill-current" : ""}`} />
        </button>
      )}
    </motion.div>
  );
};

export default MediaCard;
