const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type SongItem = {
  id: string;
  title: string;
  artist: string;
  image: string;
  link: string;
};

const stopWords = new Set([
  "discover",
  "stream",
  "music",
  "naija",
  "ghana",
  "african",
  "song of the day",
  "|",
  "download",
]);

const decodeHtml = (text: string) =>
  text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const toTitleCase = (text: string) =>
  text
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");

const isNoise = (text: string) => {
  const t = text.trim().toLowerCase();
  if (!t) return true;
  if (stopWords.has(t)) return true;
  if (t === "--\u003e" || t === "→") return true;
  if (t.startsWith("featuring:")) return true;
  if (t.startsWith("🇳🇬") || t.startsWith("🇬🇭") || t.startsWith("🇿🇦")) return true;
  return false;
};

const parseFromSlug = (slug: string) => {
  const clean = decodeURIComponent(slug)
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = clean.split(" ");
  if (words.length <= 2) {
    return { artist: "", title: toTitleCase(clean) };
  }

  const ftIndex = words.findIndex((w) => w.toLowerCase() === "ft");
  const splitAt = words.length > 4 ? 2 : 1;
  const artist = toTitleCase(words.slice(0, splitAt).join(" "));
  const titleWords = words.slice(splitAt);

  const title = toTitleCase(
    ftIndex > splitAt
      ? [...words.slice(splitAt, ftIndex), "ft", ...words.slice(ftIndex + 1)].join(" ")
      : titleWords.join(" ")
  );

  return { artist, title };
};

const parseSongsFromHtml = (html: string): SongItem[] => {
  const results: SongItem[] = [];
  const regex = /href=["']((?:https?:\/\/trendybeatz\.com)?\/download-mp3\/(\d+)\/([^"']+))["']/gi;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const link = match[1].startsWith("http") ? match[1] : `https://trendybeatz.com${match[1]}`;
    const id = match[2];
    const slug = match[3];

    const around = html.substring(Math.max(0, match.index - 1800), match.index + 700);

    const imageMatches = [...around.matchAll(/src=["'](https?:\/\/trendybeatz\.com\/images\/[^"']+)["']/gi)];
    const image = imageMatches.length ? imageMatches[imageMatches.length - 1][1] : "/placeholder.svg";

    const textMatches = [...around.matchAll(/>([^<]{2,120})</g)]
      .map((m) => decodeHtml(m[1]))
      .filter((t) => !isNoise(t) && !t.includes("http") && !t.includes("{"));

    let artist = textMatches.length >= 2 ? textMatches[textMatches.length - 2] : "";
    let title = textMatches.length >= 1 ? textMatches[textMatches.length - 1] : "";

    const parsedFromSlug = parseFromSlug(slug);

    if (!title || isNoise(title) || title.includes("--")) {
      title = parsedFromSlug.title;
    }

    if (!artist || isNoise(artist)) {
      artist = parsedFromSlug.artist;
    }

    if (!title) continue;

    results.push({
      id,
      title: toTitleCase(title),
      artist: toTitleCase(artist),
      image,
      link,
    });
  }

  return results;
};

const fetchHtml = async (url: string) => {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      Connection: "keep-alive",
    },
  });

  if (!res.ok) {
    throw new Error(`Fetch failed [${res.status}] ${url}`);
  }

  return await res.text();
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { search = "" } = await req.json().catch(() => ({}));
    const query = String(search || "").trim().toLowerCase();

    // trendybeatz search is client-rendered, so fetch multiple listing pages and filter locally
    const pages = query ? 8 : 10;
    const urls = Array.from({ length: pages }, (_, i) =>
      i === 0
        ? "https://trendybeatz.com/music-download"
        : `https://trendybeatz.com/music-download?page=${i + 1}`
    );

    const allSongs: SongItem[] = [];
    const seen = new Set<string>();

    for (const url of urls) {
      try {
        console.log("Fetching:", url);
        const html = await fetchHtml(url);
        const parsed = parseSongsFromHtml(html);

        for (const song of parsed) {
          if (seen.has(song.id)) continue;
          seen.add(song.id);
          allSongs.push(song);
        }
      } catch (err) {
        console.log("Source failed:", url, err instanceof Error ? err.message : String(err));
      }
    }

    const filtered = query
      ? allSongs.filter(
          (song) =>
            song.title.toLowerCase().includes(query) || song.artist.toLowerCase().includes(query)
        )
      : allSongs;

    console.log(`Found ${filtered.length} songs`);

    return new Response(JSON.stringify({ success: true, data: filtered.slice(0, 300) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error scraping music:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to scrape music",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
