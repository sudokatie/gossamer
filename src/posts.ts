import type { Page } from "./types.js";
import { applyTemplate } from "./template.js";

export function isPost(page: Page): boolean {
  return page.sourcePath.includes("/posts/") || page.sourcePath.startsWith("posts/");
}

export function sortPosts(posts: Page[]): Page[] {
  return [...posts].sort((a, b) => {
    const dateA = a.data.date || "0000-00-00";
    const dateB = b.data.date || "0000-00-00";
    return dateB.localeCompare(dateA);
  });
}

export function generatePostsIndex(posts: Page[], layout: string): string {
  const sorted = sortPosts(posts);
  
  const listItems = sorted.map(post => {
    const href = "/" + post.outputPath;
    const date = post.data.date 
      ? `<span class="date">${post.data.date}</span> ` 
      : "";
    return `<li>${date}<a href="${href}">${post.data.title}</a></li>`;
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
