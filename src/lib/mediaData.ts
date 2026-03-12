import movie1 from "@/assets/movie1.jpg";
import movie2 from "@/assets/movie2.jpg";
import movie3 from "@/assets/movie3.jpg";
import movie4 from "@/assets/movie4.jpg";
import movie5 from "@/assets/movie5.jpg";
import movie6 from "@/assets/movie6.jpg";
import album1 from "@/assets/album1.jpg";
import album2 from "@/assets/album2.jpg";
import album3 from "@/assets/album3.jpg";
import album4 from "@/assets/album4.jpg";
import album5 from "@/assets/album5.jpg";
import album6 from "@/assets/album6.jpg";

export type MediaType = "movie" | "song";

export interface MediaItem {
  id: string;
  title: string;
  year: string;
  type: MediaType;
  genre: string;
  image: string;
  size: string;
  description: string;
  extra: string; // director for movies, artist for songs
}

export const mediaItems: MediaItem[] = [
  {
    id: "m1",
    title: "Eclipse Horizon",
    year: "2025",
    type: "movie",
    genre: "Sci-Fi",
    image: movie1,
    size: "2.4 GB",
    description: "An astronaut discovers an ancient portal on a distant planet that holds the key to humanity's survival.",
    extra: "Dir. Nolan Voss",
  },
  {
    id: "m2",
    title: "Neon Chase",
    year: "2024",
    type: "movie",
    genre: "Action",
    image: movie2,
    size: "1.8 GB",
    description: "A fugitive races through rain-soaked neon streets to clear his name before dawn.",
    extra: "Dir. Mika Tanaka",
  },
  {
    id: "m3",
    title: "The Hollowing",
    year: "2024",
    type: "movie",
    genre: "Horror",
    image: movie3,
    size: "1.5 GB",
    description: "A family inherits a mansion where the walls whisper and the shadows move on their own.",
    extra: "Dir. Elena Crow",
  },
  {
    id: "m4",
    title: "Tides of Gold",
    year: "2025",
    type: "movie",
    genre: "Romance",
    image: movie4,
    size: "1.2 GB",
    description: "Two strangers meet on a sun-drenched coast and discover that love can rewrite destiny.",
    extra: "Dir. Amir Patel",
  },
  {
    id: "m5",
    title: "Dragon's Reckoning",
    year: "2025",
    type: "movie",
    genre: "Fantasy",
    image: movie5,
    size: "3.1 GB",
    description: "The last dragonslayer must face an ancient beast to save a kingdom engulfed in flame.",
    extra: "Dir. Rhea Bjorn",
  },
  {
    id: "m6",
    title: "Total Mayhem",
    year: "2024",
    type: "movie",
    genre: "Comedy",
    image: movie6,
    size: "1.1 GB",
    description: "A birthday party goes hilariously wrong when a magician accidentally summons real chaos.",
    extra: "Dir. Jake Wu",
  },
  {
    id: "s1",
    title: "Neon Pulse",
    year: "2025",
    type: "song",
    genre: "Electronic",
    image: album1,
    size: "8.2 MB",
    description: "A high-energy synthwave track with pulsating basslines and cosmic melodies.",
    extra: "SYNKRO",
  },
  {
    id: "s2",
    title: "Velvet Whisper",
    year: "2024",
    type: "song",
    genre: "R&B",
    image: album2,
    size: "6.4 MB",
    description: "Sultry vocals over a smooth, minimal beat that captures late-night emotions.",
    extra: "Amara Cole",
  },
  {
    id: "s3",
    title: "Desert Mirage",
    year: "2024",
    type: "song",
    genre: "Psychedelic",
    image: album3,
    size: "7.8 MB",
    description: "A sprawling psychedelic journey through distorted guitars and swirling reverb.",
    extra: "The Sundials",
  },
  {
    id: "s4",
    title: "City Lights",
    year: "2025",
    type: "song",
    genre: "Hip-Hop",
    image: album4,
    size: "5.9 MB",
    description: "Hard-hitting bars over a dark trap beat inspired by the urban nightlife.",
    extra: "K. Razor",
  },
  {
    id: "s5",
    title: "Wildflower",
    year: "2024",
    type: "song",
    genre: "Indie Folk",
    image: album5,
    size: "5.1 MB",
    description: "Delicate acoustic fingerpicking paired with haunting harmonies about solitude.",
    extra: "Fern & Ivy",
  },
  {
    id: "s6",
    title: "Island Breeze",
    year: "2025",
    type: "song",
    genre: "Reggae",
    image: album6,
    size: "6.7 MB",
    description: "Feel-good island rhythms that transport you to a tropical paradise.",
    extra: "DJ Soleil",
  },
];
