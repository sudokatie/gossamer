import * as fs from "node:fs/promises";
import * as path from "node:path";
import { parseMarkdown, extractDateFromFilename } from "./markdown.js";
import { applyTemplate } from "./template.js";
import type { Page, SiteConfig, BuildResult } from "./types.js";

const STATIC_EXTENSIONS = new Set([
  ".css", ".js", ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp",
  ".ico", ".woff", ".woff2", ".ttf", ".eot", ".pdf", ".mp3", ".mp4",
]);

const IGNORED_FILES = new Set([".DS_Store", "Thumbs.db", ".gitignore"]);

export async function build(config: SiteConfig): Promise<BuildResult> {
  const startTime = performance.now();
  
  const inputDir = path.resolve(config.inputDir);
  const outputDir = path.resolve(config.outputDir);
  
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });
  
  let customLayout: string | undefined;
  const layoutPath = path.join(inputDir, "_layout.html");
  try {
    customLayout = await fs.readFile(layoutPath, "utf-8");
  } catch {
    // no custom layout, use default
  }
  
  const pages: Page[] = [];
  const assetCount = { value: 0 };
  
  await processDirectory(inputDir, inputDir, outputDir, customLayout, pages, assetCount);
  
  const posts = pages.filter(p => p.sourcePath.includes("/posts/") && !p.sourcePath.endsWith("_index.md"));
  if (posts.length > 0) {
    await generatePostsIndex(posts, outputDir, customLayout);
  }
  
  const endTime = performance.now();
  
  return {
    pages: pages.length,
    assets: assetCount.value,
    timeMs: Math.round(endTime - startTime),
  };
}

async function processDirectory(
  dir: string,
  inputRoot: string,
  outputRoot: string,
  customLayout: string | undefined,
  pages: Page[],
  assetCount: { value: number },
): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.name.startsWith("_") || IGNORED_FILES.has(entry.name)) {
      continue;
    }
    
    const sourcePath = path.join(dir, entry.name);
    const relativePath = path.relative(inputRoot, sourcePath);
    
    if (entry.isDirectory()) {
      const outDir = path.join(outputRoot, relativePath);
      await fs.mkdir(outDir, { recursive: true });
      await processDirectory(sourcePath, inputRoot, outputRoot, customLayout, pages, assetCount);
    } else if (entry.name.endsWith(".md")) {
      const page = await processMarkdownFile(sourcePath, relativePath, outputRoot, customLayout);
      pages.push(page);
      console.log(`  ${relativePath} -> ${page.outputPath}`);
    } else if (STATIC_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      const outPath = path.join(outputRoot, relativePath);
      await fs.mkdir(path.dirname(outPath), { recursive: true });
      await fs.copyFile(sourcePath, outPath);
      assetCount.value++;
      console.log(`  [copied] ${relativePath}`);
    }
  }
}

async function processMarkdownFile(
  sourcePath: string,
  relativePath: string,
  outputRoot: string,
  customLayout: string | undefined,
): Promise<Page> {
  const content = await fs.readFile(sourcePath, "utf-8");
  const parsed = parseMarkdown(content, relativePath);
  
  if (!parsed.data.date) {
    const dateFromFilename = extractDateFromFilename(path.basename(relativePath));
    if (dateFromFilename) {
      parsed.data.date = dateFromFilename;
    }
  }
  
  const outputRelative = relativePath.replace(/\.md$/, ".html").replace(/^\d{4}-\d{2}-\d{2}-/, "");
  const outputPath = path.join(outputRoot, outputRelative);
  
  const page: Page = {
    ...parsed,
    outputPath: outputRelative,
  };
  
  const html = applyTemplate(page, customLayout);
  
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, html);
  
  return page;
}

async function generatePostsIndex(
  posts: Page[],
  outputRoot: string,
  customLayout: string | undefined,
): Promise<void> {
  const sorted = [...posts].sort((a, b) => {
    const dateA = a.data.date || "";
    const dateB = b.data.date || "";
    return dateB.localeCompare(dateA);
  });
  
  const listHtml = sorted.map(post => {
    const href = "/" + post.outputPath;
    const date = post.data.date ? `<span class="date">${post.data.date}</span>` : "";
    return `<li>${date} <a href="${href}">${post.data.title}</a></li>`;
  }).join("\n");
  
  const indexPage: Page = {
    sourcePath: "posts/_index.md",
    outputPath: "posts/index.html",
    slug: "posts",
    content: "",
    html: `<h1>Posts</h1>\n<ul>\n${listHtml}\n</ul>`,
    data: { title: "Posts" },
  };
  
  const html = applyTemplate(indexPage, customLayout);
  const outputPath = path.join(outputRoot, "posts", "index.html");
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, html);
  
  console.log("  [generated] posts/index.html");
}
