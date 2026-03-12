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
    const { search = "" } = await req.json().catch(() => ({}));

    let url = "https://t4tsa.cc";
    if (search) {
      url = `https://t4tsa.cc/search?q=${encodeURIComponent(search)}`;
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

    const movies: Array<{
      id: string;
      title: string;
      image: string;
      link: string;
      type: string;
    }> = [];

    const seen = new Set<string>();

    // Try __NEXT_DATA__ first (Next.js SSR data)
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        console.log("Found __NEXT_DATA__, parsing...");
        
        // Traverse the data to find movie/series items
        const extractItems = (obj: any, path = ""): void => {
          if (!obj || typeof obj !== "object") return;
          
          if (Array.isArray(obj)) {
            for (const item of obj) {
              if (item && typeof item === "object") {
                // Look for items with tmdbId or id and title/name
                const id = item.tmdbId || item.id;
                const title = item.title || item.name;
                const posterPath = item.posterPath || item.poster_path;
                const mediaType = item.type || item.media_type || item.watchType;
                
                if (id && title && !seen.has(String(id))) {
                  seen.add(String(id));
                  
                  let image = "";
                  if (posterPath) {
                    image = posterPath.startsWith("http") 
                      ? posterPath 
                      : `https://image.tmdb.org/t/p/w500${posterPath}`;
                  }
                  
                  const isSeries = String(mediaType).toLowerCase().includes("series") || 
                                   String(mediaType).toLowerCase().includes("tv") ||
                                   String(id).startsWith("tt");
                  
                  movies.push({
                    id: String(id),
                    title,
                    image,
                    link: isSeries 
                      ? `https://t4tsa.cc/series/${id}` 
                      : `https://t4tsa.cc/movie/${id}`,
                    type: isSeries ? "series" : "movie",
                  });
                }
                extractItems(item, path + "[]");
              }
            }
          } else {
            for (const [key, value] of Object.entries(obj)) {
              extractItems(value, path + "." + key);
            }
          }
        };
        
        extractItems(nextData);
      } catch (e) {
        console.log("Failed to parse __NEXT_DATA__:", e);
      }
    }

    // Fallback: regex-based parsing of HTML
    if (movies.length === 0) {
      console.log("Falling back to regex parsing...");
      
      // Match links to /movie/ or /series/ pages
      const linkRegex = /href="((?:https?:\/\/t4tsa\.cc)?\/(?:movie|series)\/([^"]+))"/g;
      let match;
      
      while ((match = linkRegex.exec(html)) !== null) {
        const fullHref = match[1];
        const id = match[2];
        
        if (seen.has(id)) continue;
        seen.add(id);
        
        const isSeries = fullHref.includes("/series/");
        const link = fullHref.startsWith("http") ? fullHref : `https://t4tsa.cc${fullHref}`;
        
        // Find associated title - look for text near this link
        // Try to find an img alt or text content near the href
        const hrefPos = match.index;
        const surroundingHtml = html.substring(hrefPos, hrefPos + 2000);
        
        let title = "";
        // Try: alt attribute on img
        const altMatch = surroundingHtml.match(/alt="([^"]+)"/);
        if (altMatch) {
          title = altMatch[1];
        }
        // Try: text content after closing tags
        if (!title) {
          const textMatch = surroundingHtml.match(/>([^<]{2,50})</);
          if (textMatch && !textMatch[1].includes("http") && !textMatch[1].includes("{")) {
            title = textMatch[1].trim();
          }
        }
        
        if (!title) continue;
        
        // Find image - TMDB poster
        let image = "";
        const imgMatch = surroundingHtml.match(/(?:src|srcSet)="([^"]*image\.tmdb\.org[^"]*?)"/);
        if (imgMatch) {
          const imgUrl = imgMatch[1];
          const tmdbPath = imgUrl.match(/\/t\/p\/\w+(\/.+?\.jpg)/);
          if (tmdbPath) {
            image = `https://image.tmdb.org/t/p/w500${tmdbPath[1]}`;
          } else {
            image = imgUrl;
          }
        }
        // Also try the Next.js image proxy format
        if (!image) {
          const nextImgMatch = surroundingHtml.match(/url=([^&"]+)/);
          if (nextImgMatch) {
            image = decodeURIComponent(nextImgMatch[1]);
          }
        }
        
        movies.push({
          id,
          title,
          image,
          link,
          type: isSeries ? "series" : "movie",
        });
      }
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
