import type { Page, FeedConfig } from "./types.js";
import { sortPosts } from "./posts.js";

/**
 * Generate HTML link tags for feed discovery.
 * These should be placed in the <head> of HTML documents.
 */
export function generateFeedDiscoveryLinks(config: FeedConfig): string {
  const baseUrl = config.baseUrl.replace(/\/$/, "");
  const title = escapeHtml(config.title);
  
  return `<link rel="alternate" type="application/rss+xml" title="${title}" href="${baseUrl}/feed.xml">
  <link rel="alternate" type="application/atom+xml" title="${title}" href="${baseUrl}/atom.xml">`;
}

const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

const escapeXml = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

const formatRfc822Date = (date: string | Date | undefined): string => {
  if (!date) return new Date().toUTCString();
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toUTCString();
};

const formatRfc3339Date = (date: string | Date | undefined): string => {
  if (!date) return new Date().toISOString();
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString();
};

export function generateRss(posts: Page[], config: FeedConfig): string {
  const sorted = sortPosts(posts).slice(0, config.limit ?? 20);
  const baseUrl = config.baseUrl.replace(/\/$/, "");
  const buildDate = formatRfc822Date(new Date());

  const items = sorted.map((post) => {
    const link = `${baseUrl}/${post.outputPath}`;
    const pubDate = formatRfc822Date(post.data.date);
    const description = post.data.description ?? post.content.slice(0, 280);

    return `    <item>
      <title>${escapeXml(post.data.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>
    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(config.title)}</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>${escapeXml(config.description ?? "")}</description>
    <language>${config.language ?? "en"}</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${escapeXml(baseUrl)}/feed.xml" rel="self" type="application/rss+xml"/>
${items.join("\n")}
  </channel>
</rss>
`;
}

export function generateAtom(posts: Page[], config: FeedConfig): string {
  const sorted = sortPosts(posts).slice(0, config.limit ?? 20);
  const baseUrl = config.baseUrl.replace(/\/$/, "");
  const updated = formatRfc3339Date(sorted[0]?.data.date ?? new Date());

  const entries = sorted.map((post) => {
    const link = `${baseUrl}/${post.outputPath}`;
    const updatedDate = formatRfc3339Date(post.data.date);
    const summary = post.data.description ?? post.content.slice(0, 280);

    return `  <entry>
    <title>${escapeXml(post.data.title)}</title>
    <link href="${escapeXml(link)}" rel="alternate"/>
    <id>${escapeXml(link)}</id>
    <updated>${updatedDate}</updated>
    <summary>${escapeXml(summary)}</summary>
  </entry>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(config.title)}</title>
  <link href="${escapeXml(baseUrl)}" rel="alternate"/>
  <link href="${escapeXml(baseUrl)}/atom.xml" rel="self"/>
  <id>${escapeXml(baseUrl)}/</id>
  <updated>${updated}</updated>
${entries.join("\n")}
</feed>
`;
}
