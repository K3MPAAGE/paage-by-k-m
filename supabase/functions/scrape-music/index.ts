import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { page = 1, search = "" } = await req.json().catch(() => ({}));

    let url = "https://trendybeatz.com/music-download";
    if (search) {
      url = `https://trendybeatz.com/search?q=${encodeURIComponent(search)}`;
    }
    if (page > 1 && !search) {
      url = `https://trendybeatz.com/music-download?page=${page}`;
    }

    console.log("Fetching:", url);

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) {
      throw new Error("Failed to parse HTML");
    }

    const songs: Array<{
      id: string;
      title: string;
      artist: string;
      image: string;
      link: string;
    }> = [];

    // Parse music download links
    const links = doc.querySelectorAll("a[href]");
    const seen = new Set<string>();

    for (let i = 0; i < links.length; i++) {
      const a = links[i] as any;
      const href = a.getAttribute("href") || "";

      // Match download-mp3 links
      const mp3Match = href.match(/\/download-mp3\/(\d+)\/(.+)$/);
      if (!mp3Match) continue;

      const id = mp3Match[1];
      if (seen.has(id)) continue;
      seen.add(id);

      // Extract text content to find artist and title
      const textContent = a.textContent || "";
      const lines = textContent
        .split("\n")
        .map((l: string) => l.trim())
        .filter((l: string) => l && l !== "Discover" && l !== "|" && l !== "Stream" && !l.startsWith("🇳🇬") && !l.startsWith("🇬🇭") && !l.startsWith("🇿🇦") && l !== "Song of the Day" && l !== "Discover |");

      let artist = "";
      let title = "";

      // Usually: artist name, then song title
      if (lines.length >= 2) {
        artist = lines[0];
        title = lines[1];
      } else if (lines.length === 1) {
        title = lines[0];
      }

      if (!title) continue;

      // Get image
      let image = "";
      const img = a.querySelector("img");
      if (img) {
        image = img.getAttribute("src") || "";
        if (image && !image.startsWith("http")) {
          image = `https://trendybeatz.com${image}`;
        }
      }

      songs.push({
        id,
        title,
        artist,
        image,
        link: href.startsWith("http")
          ? href
          : `https://trendybeatz.com${href}`,
      });
    }

    console.log(`Found ${songs.length} songs`);

    return new Response(JSON.stringify({ success: true, data: songs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error scraping music:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to scrape",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
