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

    let url = "https://t4tsa.cc";
    if (search) {
      url = `https://t4tsa.cc/search?q=${encodeURIComponent(search)}`;
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

    const movies: Array<{
      id: string;
      title: string;
      image: string;
      link: string;
      type: string;
    }> = [];

    // Parse movie links - they follow pattern /movie/{id} or /series/{id}
    const links = doc.querySelectorAll("a[href]");
    const seen = new Set<string>();

    for (let i = 0; i < links.length; i++) {
      const a = links[i] as any;
      const href = a.getAttribute("href") || "";
      
      // Match movie and series links
      const movieMatch = href.match(/\/(movie|series)\/([a-zA-Z0-9]+)$/);
      if (!movieMatch) continue;

      const id = movieMatch[2];
      if (seen.has(id)) continue;
      seen.add(id);

      const mediaType = movieMatch[1]; // "movie" or "series"

      // Get title from the text content or nested elements
      let title = "";
      const strong = a.querySelector("strong");
      if (strong) {
        title = strong.textContent?.trim() || "";
      }
      if (!title) {
        title = a.textContent?.trim() || "";
      }
      if (!title) continue;

      // Get image
      let image = "";
      const img = a.querySelector("img");
      if (img) {
        const src = img.getAttribute("src") || "";
        // Extract the original TMDB URL from Next.js image proxy
        const tmdbMatch = src.match(/url=([^&]+)/);
        if (tmdbMatch) {
          image = decodeURIComponent(tmdbMatch[1]);
        } else {
          image = src;
        }
      }

      movies.push({
        id,
        title,
        image: image || `https://image.tmdb.org/t/p/w500/placeholder.jpg`,
        link: href.startsWith("http") ? href : `https://t4tsa.cc${href}`,
        type: mediaType === "series" ? "series" : "movie",
      });
    }

    console.log(`Found ${movies.length} items`);

    return new Response(JSON.stringify({ success: true, data: movies }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error scraping movies:", error);
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
