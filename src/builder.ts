import * as fs from "node:fs/promises";
import * as path from "node:path";
import { parseMarkdown, extractDateFromFilename } from "./markdown.js";
import { applyTemplate, loadLayout, loadLayoutForFile } from "./template.js";
import { isStaticAsset, shouldIgnore, copyAssets } from "./assets.js";
import { isPost, generatePostsIndex } from "./posts.js";
import { generateRss, generateAtom } from "./feed.js";
import { generateSitemap } from "./sitemap.js";
import type { Page, SiteConfig, BuildResult } from "./types.js";

export async function build(config: SiteConfig): Promise<BuildResult> {
  const startTime = performance.now();
  const errors: string[] = [];
  
  const inputDir = path.resolve(config.inputDir);
  const outputDir = path.resolve(config.outputDir);
  
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });
  
  const layout = await loadLayout(inputDir);
  const pages: Page[] = [];
  
  await processDirectory(inputDir, inputDir, outputDir, layout, pages, errors, config.drafts);
  
  const posts = pages.filter(p => isPost(p) && !p.sourcePath.endsWith("_index.md"));
  const customPostsIndex = pages.find(p => p.sourcePath === "posts/_index.md" || p.sourcePath.endsWith("/posts/_index.md"));
  
  if (posts.length > 0 && !customPostsIndex) {
    // Only generate posts index if there's no custom _index.md
    const postsIndexHtml = generatePostsIndex(posts, layout);
    const postsIndexPath = path.join(outputDir, "posts", "index.html");
    await fs.mkdir(path.dirname(postsIndexPath), { recursive: true });
    await fs.writeFile(postsIndexPath, postsIndexHtml);
    console.log("  [generated] posts/index.html");
  }
  
  // Generate RSS/Atom feeds if configured
  if (config.feed && posts.length > 0) {
    const rss = generateRss(posts, config.feed);
    const atom = generateAtom(posts, config.feed);
    
    await fs.writeFile(path.join(outputDir, "feed.xml"), rss);
    await fs.writeFile(path.join(outputDir, "atom.xml"), atom);
    console.log("  [generated] feed.xml, atom.xml");
  }
  
  // Generate sitemap if configured
  if (config.sitemap && pages.length > 0) {
    const sitemap = generateSitemap(pages, config.sitemap);
    await fs.writeFile(path.join(outputDir, "sitemap.xml"), sitemap);
    console.log("  [generated] sitemap.xml");
  }
  
  console.log("Copying assets...");
  const assetCount = await copyAssets(inputDir, outputDir);
  
  const endTime = performance.now();
  
  return {
    pages: pages.length,
    assets: assetCount,
    errors,
    timeMs: Math.round(endTime - startTime),
  };
}

async function processDirectory(
  dir: string,
  inputRoot: string,
  outputRoot: string,
  rootLayout: string,
  pages: Page[],
  errors: string[],
  includeDrafts?: boolean,
): Promise<void> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (err) {
    errors.push(`Failed to read directory: ${dir}`);
    return;
  }
  
  const sortedEntries = entries.sort((a, b) => a.name.localeCompare(b.name));
  
  for (const entry of sortedEntries) {
    if (shouldIgnore(entry.name)) continue;
    
    const sourcePath = path.join(dir, entry.name);
    const relativePath = path.relative(inputRoot, sourcePath);
    
    if (entry.isDirectory()) {
      const outDir = path.join(outputRoot, relativePath);
      await fs.mkdir(outDir, { recursive: true });
      await processDirectory(sourcePath, inputRoot, outputRoot, rootLayout, pages, errors, includeDrafts);
    } else if (entry.name.endsWith(".md")) {
      try {
        const page = await processMarkdownFile(sourcePath, relativePath, inputRoot, outputRoot, rootLayout, includeDrafts);
        
        if (!page) {
          console.log(`  [skipped draft] ${relativePath}`);
          continue;
        }
        
        pages.push(page);
        console.log(`  ${relativePath} -> ${page.outputPath}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`Failed to process ${relativePath}: ${message}`);
        console.error(`  [error] ${relativePath}: ${message}`);
      }
    }
  }
}

async function processMarkdownFile(
  sourcePath: string,
  relativePath: string,
  inputRoot: string,
  outputRoot: string,
  rootLayout: string,
  includeDrafts?: boolean,
): Promise<Page | null> {
  const content = await fs.readFile(sourcePath, "utf-8");
  const parsed = parseMarkdown(content, relativePath);
  
  if (parsed.data.draft && !includeDrafts) {
    return null;
  }
  
  if (!parsed.data.date) {
    const dateFromFilename = extractDateFromFilename(path.basename(relativePath));
    if (dateFromFilename) {
      parsed.data.date = dateFromFilename;
    }
  }
  
  // Load layout: front matter layout > directory layout > root layout
  let layout: string;
  if (parsed.data.layout) {
    layout = await loadLayout(inputRoot, parsed.data.layout);
  } else {
    layout = await loadLayoutForFile(sourcePath, inputRoot, rootLayout);
  }
  
  let outputRelative = relativePath
    .replace(/\.md$/, ".html")
    .replace(/\/\d{4}-\d{2}-\d{2}-/, "/")
    .replace(/_index\.html$/, "index.html");  // _index.md -> index.html
  
  if (outputRelative.match(/^\d{4}-\d{2}-\d{2}-/)) {
    outputRelative = outputRelative.replace(/^\d{4}-\d{2}-\d{2}-/, "");
  }
  
  const outputPath = path.join(outputRoot, outputRelative);
  
  const page: Page = {
    ...parsed,
    outputPath: outputRelative,
  };
  
  const html = applyTemplate(page, layout);
  
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, html);
  
  return page;
}
