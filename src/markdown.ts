import { marked } from "marked";
import matter from "gray-matter";
import type { Page, PageData } from "./types.js";

marked.setOptions({
  gfm: true,
  breaks: false,
});

export function parseMarkdown(content: string, sourcePath: string): Omit<Page, "outputPath"> {
  const { data, content: markdownContent } = matter(content);
  const pageData = data as PageData;
  
  if (!pageData.title) {
    const firstHeading = markdownContent.match(/^#\s+(.+)$/m);
    pageData.title = firstHeading ? firstHeading[1] : extractSlug(sourcePath);
  }
  
  const html = marked.parse(markdownContent, { async: false }) as string;
  const slug = extractSlug(sourcePath);
  
  return {
    sourcePath,
    slug,
    content: markdownContent,
    html,
    data: pageData,
  };
}

function extractSlug(sourcePath: string): string {
  const filename = sourcePath.split("/").pop() || "";
  const withoutExt = filename.replace(/\.md$/, "");
  const withoutDate = withoutExt.replace(/^\d{4}-\d{2}-\d{2}-/, "");
  return withoutDate;
}

export function extractDateFromFilename(filename: string): string | undefined {
  const match = filename.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : undefined;
}
