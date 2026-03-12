import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ExternalLink, User } from "lucide-react";
import type { MediaItem } from "@/hooks/useMediaData";

interface MediaDetailModalProps {
  item: MediaItem | null;
  onClose: () => void;
}

const MediaDetailModal = ({ item, onClose }: MediaDetailModalProps) => {
  if (!item) return null;

  const isMovie = item.mediaType !== "song";
  const sourceLabel = isMovie
    ? item.link.includes("fzmovies.net")
      ? "fzmovies.net"
      : "thenkiri.com"
    : "trendybeatz.com";

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        {/* Blurred backdrop with cover image */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={item.image}
            alt=""
            className="h-full w-full object-cover scale-110 blur-3xl opacity-30"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        </div>

        {/* Bottom sheet / modal */}
        <motion.div
          key="sheet"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl p-6 mx-4 shadow-card"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex gap-4">
            <img
              src={item.image}
              alt={item.title}
              className={`rounded-lg object-cover shadow-card ${
                isMovie ? "w-28 aspect-[2/3]" : "w-28 aspect-square"
              }`}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-xl font-bold text-foreground">
                {item.title}
              </h2>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" /> {item.extra}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Source: {sourceLabel}
              </p>
            </div>
          </div>

          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 w-full flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-display font-semibold py-3 transition-all hover:shadow-glow hover:brightness-110 active:scale-[0.98]"
          >
            <Download className="h-4 w-4" />
            {isMovie ? "Watch / Download" : "Download MP3"}
          </a>
          <p className="mt-2 text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
            <ExternalLink className="h-3 w-3" />
            Opens on {sourceLabel}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MediaDetailModal;
