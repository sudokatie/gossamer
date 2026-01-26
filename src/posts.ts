import type { Page } from "./types.js";
import { applyTemplate } from "./template.js";

export function isPost(page: Page): boolean {
  return page.sourcePath.includes("/posts/") || page.sourcePath.startsWith("posts/");
}

function normalizeDate(date: unknown): string {
  if (!date) return "0000-00-00";
  if (date instanceof Date) return date.toISOString().slice(0, 10);
  return String(date);
}

export function sortPosts(posts: Page[]): Page[] {
  return [...posts].sort((a, b) => {
    const dateA = normalizeDate(a.data.date);
    const dateB = normalizeDate(b.data.date);
    return dateB.localeCompare(dateA);
  });
}

export function generatePostsIndex(posts: Page[], layout: string): string {
  const sorted = sortPosts(posts);
  
  const listItems = sorted.map(post => {
    // Use relative path from posts/index.html - just the filename
    const filename = post.outputPath.replace(/^posts\//, "");
    const dateStr = normalizeDate(post.data.date);
    const date = dateStr !== "0000-00-00"
      ? `<span class="date">${dateStr}</span> ` 
      : "";
    return `<li>${date}<a href="${filename}">${post.data.title}</a></li>`;
  });
  
  const html = `<h1>Posts</h1>\n<ul>\n${listItems.join("\n")}\n</ul>`;
  
  const indexPage: Page = {
    sourcePath: "posts/_index",
    outputPath: "posts/index.html",
    slug: "posts",
    content: "",
    html,
    data: { title: "Posts" },
  };
  
  return applyTemplate(indexPage, layout);
}
