const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type MovieItem = {
  id: string;
  title: string;
  image: string;
  link: string;
  type: "movie" | "series";
  source: "nkiri" | "fzmovies";
};

const decodeHtml = (text: string) =>
  text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, "-")
    .replace(/\s+/g, " ")
    .trim();

const stripTags = (text: string) => decodeHtml(text.replace(/<[^>]+>/g, " "));

const toAbsoluteUrl = (href: string, base: string) => {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
};

const slugFromUrl = (url: string) => {
  try {
    const pathname = new URL(url).pathname.replace(/\/+$/, "");
    return pathname.split("/").filter(Boolean).pop() || pathname;
  } catch {
    return url;
  }
};

const toTitleCase = (text: string) =>
  text
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");

const parseNkiri = (html: string): MovieItem[] => {
  const results: MovieItem[] = [];

  const articleRegex = /<article[\s\S]*?<\/article>/gi;
  const articles = html.match(articleRegex) || [];

  for (const article of articles) {
    const hrefMatch =
      article.match(/<a[^>]+href="([^"]+)"[^>]*class="thumbnail-link[^\"]*"/i) ||
      article.match(/<a[^>]+href="([^"]+)"[^>]*title="Continue Reading"/i);
    if (!hrefMatch?.[1]) continue;

    const link = toAbsoluteUrl(hrefMatch[1], "https://thenkiri.com");
    if (!/(thenkiri\.com|nkiri\.ink)/i.test(link)) continue;

    const title =
      stripTags(article.match(/<span class="screen-reader-text">([\s\S]*?)<\/span>/i)?.[1] || "") ||
      decodeHtml(article.match(/alt="([^"]+)"/i)?.[1] || "") ||
      toTitleCase(decodeURIComponent(slugFromUrl(link)).replace(/-/g, " "));

    const image =
      toAbsoluteUrl(article.match(/<img[^>]+src="([^"]+)"/i)?.[1] || "", "https://thenkiri.com") ||
      "/placeholder.svg";

    if (!title) continue;

    const isSeries = /tv series|season|s\d{2}|complete/i.test(title);

    results.push({
      id: `nkiri-${slugFromUrl(link)}`,
      title,
      image,
      link,
      type: isSeries ? "series" : "movie",
      source: "nkiri",
    });
  }

  return results;
};

const parseFzMovies = (html: string): MovieItem[] => {
  const results: MovieItem[] = [];
  const regex =
    /href=["']((?:https?:\/\/(?:www\.)?fzmovies\.website)?\/movie-([^"'#?]+?)--hmp4\.htm[^"']*)["']/gi;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const link = toAbsoluteUrl(match[1], "https://fzmovies.net");
    const slug = match[2];

    const around = html.substring(Math.max(0, match.index - 300), match.index + 500);
    const anchorText = stripTags(around.match(/<a[^>]*>\s*([\s\S]*?)\s*<\/a>/i)?.[1] || "");

    const titleFromSlug = toTitleCase(
      decodeURIComponent(slug)
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    );

    const title = anchorText && anchorText.length < 120 ? anchorText : titleFromSlug;
    if (!title) continue;

    results.push({
      id: `fz-${slug.toLowerCase()}`,
      title,
      image: "/placeholder.svg",
      link,
      type: "movie",
      source: "fzmovies",
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

    const nkiriUrls = query
      ? [
          `https://thenkiri.com/?s=${encodeURIComponent(query)}`,
          `https://nkiri.ink/?s=${encodeURIComponent(query)}`,
        ]
      : [
          "https://thenkiri.com/?s=2026",
          "https://thenkiri.com/?s=2025",
          "https://thenkiri.com/?s=2024",
        ];

    const fzUrls = query
      ? [
          `https://fzmovies.net/csearch.php?searchname=${encodeURIComponent(query)}&searchby=name&category=hollywood&pg=1`,
          `https://www.fzmovies.net/csearch.php?searchname=${encodeURIComponent(query)}&searchby=name&category=hollywood&pg=1`,
        ]
      : [
          "https://fzmovies.net/csearch.php?searchname=2026&searchby=name&category=hollywood&pg=1",
          "https://fzmovies.net/csearch.php?searchname=2025&searchby=name&category=hollywood&pg=1",
        ];

    const allItems: MovieItem[] = [];
    const seen = new Set<string>();

    for (const url of [...nkiriUrls, ...fzUrls]) {
      try {
        console.log("Fetching:", url);
        const html = await fetchHtml(url);

        const parsed = /(thenkiri\.com|nkiri\.ink)/i.test(url)
          ? parseNkiri(html)
          : parseFzMovies(html);

        for (const item of parsed) {
          if (seen.has(item.id)) continue;
          seen.add(item.id);
          allItems.push(item);
        }
      } catch (err) {
        console.log("Source failed:", url, err instanceof Error ? err.message : String(err));
      }
    }

    const filtered = query
      ? allItems.filter((item) => item.title.toLowerCase().includes(query))
      : allItems;

    console.log(`Found ${filtered.length} items`);

    return new Response(JSON.stringify({ success: true, data: filtered.slice(0, 300) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error scraping movies:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to scrape movies",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
