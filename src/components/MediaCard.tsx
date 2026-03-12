import { motion } from "framer-motion";
import type { MediaItem } from "@/lib/mediaData";

interface MediaCardProps {
  item: MediaItem;
  index: number;
  onClick: (item: MediaItem) => void;
}

const MediaCard = ({ item, index, onClick }: MediaCardProps) => {
  const isMovie = item.type === "movie";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group cursor-pointer"
      onClick={() => onClick(item)}
    >
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
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="mt-2 px-0.5">
        <p className="font-display font-semibold text-sm text-foreground truncate">
          {item.title}
        </p>
        <p className="text-xs text-muted-foreground">{item.year}</p>
      </div>
    </motion.div>
  );
};

export default MediaCard;
