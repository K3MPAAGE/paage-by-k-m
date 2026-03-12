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
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const html = await res.text();
    console.log("HTML length:", html.length);

    const songs: Array<{
      id: string;
      title: string;
      artist: string;
      image: string;
      link: string;
    }> = [];

    const seen = new Set<string>();

    // Regex to find download-mp3 links
    const linkRegex = /href="((?:https?:\/\/trendybeatz\.com)?\/download-mp3\/(\d+)\/([^"]+))"/g;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      const fullHref = match[1];
      const id = match[2];
      const slug = match[3];

      if (seen.has(id)) continue;
      seen.add(id);

      const link = fullHref.startsWith("http")
        ? fullHref
        : `https://trendybeatz.com${fullHref}`;

      // Parse title and artist from slug
      // Slug format: artist-name-song-title-ft-featured
      // Better: look in surrounding HTML for the actual text
      const hrefPos = match.index;
      const startPos = Math.max(0, hrefPos - 1500);
      const surroundingHtml = html.substring(startPos, hrefPos + 500);

      let artist = "";
      let title = "";
      let image = "";

      // Find the image for this item - look for img src near this link
      const imgMatches = [...surroundingHtml.matchAll(/src="(https?:\/\/trendybeatz\.com\/images\/[^"]+)"/g)];
      if (imgMatches.length > 0) {
        // Take the last image found before the link
        image = imgMatches[imgMatches.length - 1][1];
      }

      // Parse from slug as fallback
      const slugParts = decodeURIComponent(slug).replace(/-/g, " ").replace(/,/g, ",");
      
      // Try to find artist and title from HTML content near the link
      // Look for patterns like: <strong>Artist Name</strong> or bold text
      const textBlocks = surroundingHtml.match(/>([^<]{2,80})</g);
      if (textBlocks) {
        const cleanTexts = textBlocks
          .map((t: string) => t.replace(/^>|<$/g, "").trim())
          .filter((t: string) => 
            t.length > 1 && 
            !t.includes("http") && 
            !t.includes("{") &&
            !t.includes("Discover") &&
            !t.includes("Stream") &&
            t !== "|" &&
            !t.startsWith("🇳🇬") &&
            !t.startsWith("🇬🇭") &&
            !t.startsWith("🇿🇦") &&
            t !== "Naija" &&
            t !== "Music" &&
            t !== "Ghana" &&
            t !== "African" &&
            t !== "Song of the Day"
          );

        // Usually the last few text blocks before the link contain artist then title
        if (cleanTexts.length >= 2) {
          // Find the artist and title - they're typically the last 2 meaningful texts
          artist = cleanTexts[cleanTexts.length - 2] || "";
          title = cleanTexts[cleanTexts.length - 1] || "";
        } else if (cleanTexts.length === 1) {
          title = cleanTexts[0];
        }
      }

      // Fallback: parse from slug
      if (!title) {
        // Slug: artist-song-title-ft-featured
        const parts = slugParts.split(" ft ");
        const mainPart = parts[0];
        const words = mainPart.split(" ");
        // First 1-2 words are often the artist
        if (words.length > 2) {
          artist = words.slice(0, 2).join(" ");
          title = words.slice(2).join(" ");
        } else {
          title = mainPart;
        }
        if (parts[1]) {
          title += ` ft ${parts[1]}`;
        }
      }

      // Capitalize title
      title = title.replace(/\b\w/g, (c: string) => c.toUpperCase());

      if (!title) continue;

      songs.push({ id, title, artist, image, link });
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
