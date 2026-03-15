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

const stopWords = new Set([
  "discover", "stream", "music", "naija", "ghana", "african",
  "song of the day", "|", "download",
]);

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
  const clean = decodeURIComponent(slug).replace(/-/g, " ").replace(/\s+/g, " ").trim();
  const words = clean.split(" ");
  if (words.length <= 2) return { artist: "", title: toTitleCase(clean) };
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

// Parse songs from the browse/listing pages
const parseSongsFromListingHtml = (html: string): SongItem[] => {
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
    if (!title || isNoise(title) || title.includes("--")) title = parsedFromSlug.title;
    if (!artist || isNoise(artist)) artist = parsedFromSlug.artist;
    if (!title) continue;

    results.push({ id, title: toTitleCase(title), artist: toTitleCase(artist), image, link });
  }
  return results;
};

// Parse songs from the search results page (different HTML structure)
const parseSongsFromSearchHtml = (html: string): SongItem[] => {
  const results: SongItem[] = [];
  // Search results use: <a href="/download-mp3/ID/SLUG"> with <h3> for title and <img> for image
  const blockRegex = /<a\s+href=["']((?:https?:\/\/trendybeatz\.com)?\/download-mp3\/(\d+)\/([^"']+))["'][^>]*>[\s\S]*?<\/a>/gi;

  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(html)) !== null) {
    const link = match[1].startsWith("http") ? match[1] : `https://trendybeatz.com${match[1]}`;
    const id = match[2];
    const slug = match[3];
    const block = match[0];

    // Extract image
    const imgMatch = block.match(/src=["'](https?:\/\/trendybeatz\.com\/images\/[^"']+)["']/i);
    const image = imgMatch ? imgMatch[1] : "/placeholder.svg";

    // Extract title from <h3>
    const h3Match = block.match(/<h3[^>]*>([^<]+)<\/h3>/i);
    const rawTitle = h3Match ? decodeHtml(h3Match[1]) : "";

    // Parse artist and title from the h3 text or slug
    let artist = "";
    let title = rawTitle;

    if (rawTitle) {
      // Titles often look like "Artist Name Song Title Ft Someone"
      // Try to split intelligently
      const ftMatch = rawTitle.match(/^(.+?)\s+(Ft\s+.+)$/i);
      if (ftMatch) {
        title = rawTitle; // Keep full title with ft
      }
    }

    if (!title) {
      const parsed = parseFromSlug(slug);
      artist = parsed.artist;
      title = parsed.title;
    }

    if (!title) continue;

    results.push({ id, title: toTitleCase(title), artist: toTitleCase(artist), image, link });
  }
  return results;
};

const fetchHtml = async (url: string) => {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      Connection: "keep-alive",
    },
  });
  if (!res.ok) throw new Error(`Fetch failed [${res.status}] ${url}`);
  return await res.text();
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { search = "", page = 1 } = await req.json().catch(() => ({}));
    const query = String(search || "").trim();
    const pageNum = Math.max(1, Number(page) || 1);

    const allSongs: SongItem[] = [];
    const seen = new Set<string>();

    if (query) {
      // Use the native search endpoint for search queries
      const searchUrl = `https://trendybeatz.com/search?search=${encodeURIComponent(query)}&submit=Search+source+code`;
      console.log("Searching:", searchUrl);
      
      try {
        const html = await fetchHtml(searchUrl);
        
        // Try search-specific parser first, fall back to listing parser
        let parsed = parseSongsFromSearchHtml(html);
        if (parsed.length === 0) {
          parsed = parseSongsFromListingHtml(html);
        }
        
        for (const song of parsed) {
          if (seen.has(song.id)) continue;
          seen.add(song.id);
          allSongs.push(song);
        }
        
        console.log(`Search found ${allSongs.length} results for "${query}"`);
      } catch (err) {
        console.error("Search failed:", err instanceof Error ? err.message : String(err));
      }

      // Also check artist page if we got few results
      if (allSongs.length < 10) {
        const artistSlug = query.toLowerCase().replace(/\s+/g, "-");
        const artistUrl = `https://trendybeatz.com/artist/${artistSlug}`;
        console.log("Trying artist page:", artistUrl);
        try {
          const html = await fetchHtml(artistUrl);
          const parsed = parseSongsFromListingHtml(html);
          for (const song of parsed) {
            if (seen.has(song.id)) continue;
            seen.add(song.id);
            allSongs.push(song);
          }
          console.log(`Artist page added ${parsed.length} songs`);
        } catch {
          // Artist page doesn't exist, that's fine
        }
      }

      return new Response(
        JSON.stringify({ success: true, data: allSongs, hasMore: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Browse mode: paginate through listing pages
    const pagesPerBatch = 10;
    const startPage = (pageNum - 1) * pagesPerBatch + 1;

    for (let i = startPage; i < startPage + pagesPerBatch; i++) {
      const url = i === 1
        ? "https://trendybeatz.com/music-download"
        : `https://trendybeatz.com/music-download?page=${i}`;
      try {
        console.log("Fetching:", url);
        const html = await fetchHtml(url);
        const parsed = parseSongsFromListingHtml(html);
        if (parsed.length === 0) break;
        for (const song of parsed) {
          if (seen.has(song.id)) continue;
          seen.add(song.id);
          allSongs.push(song);
        }
      } catch (err) {
        console.log("Source failed:", url, err instanceof Error ? err.message : String(err));
      }
    }

    const hasMore = allSongs.length >= pagesPerBatch * 5;
    console.log(`Found ${allSongs.length} songs (page ${pageNum})`);

    return new Response(
      JSON.stringify({ success: true, data: allSongs, hasMore }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error scraping music:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Failed to scrape music" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
