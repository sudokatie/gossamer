import type { Page, SitemapConfig } from "./types.js";

const escapeXml = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

const formatW3CDate = (date: string | Date | undefined): string => {
  if (!date) return new Date().toISOString().slice(0, 10);
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
};

export function generateSitemap(pages: Page[], config: SitemapConfig): string {
  const baseUrl = config.baseUrl.replace(/\/$/, "");

  const urls = pages.map((page) => {
    const loc = `${baseUrl}/${page.outputPath}`;
    const lastmod = formatW3CDate(page.data.date);
    const priority = getPriority(page);
    const changefreq = getChangeFreq(page);

    return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
}

function getPriority(page: Page): number {
  const path = page.outputPath.toLowerCase();
  
  // Homepage is most important
  if (path === "index.html") return 1.0;
  
  // Posts index is high priority
  if (path === "posts/index.html") return 0.9;
  
  // Individual posts
  if (path.startsWith("posts/")) return 0.7;
  
  // Top-level pages
  if (!path.includes("/")) return 0.8;
  
  // Everything else
  return 0.5;
}

function getChangeFreq(page: Page): string {
  const path = page.outputPath.toLowerCase();
  
  // Posts rarely change
  if (path.startsWith("posts/") && path !== "posts/index.html") {
    return "yearly";
  }
  
  // Index pages change more often
  if (path.endsWith("index.html")) {
    return "weekly";
  }
  
  // Default for other pages
  return "monthly";
}
