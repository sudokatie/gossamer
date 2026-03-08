import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { Page, FeedConfig } from "./types.js";
import { generateFeedDiscoveryLinks } from "./feed.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cachedDefaultLayout: string | null = null;

async function loadDefaultLayout(): Promise<string> {
  if (cachedDefaultLayout) return cachedDefaultLayout;
  
  const templatePath = path.resolve(__dirname, "..", "templates", "default.html");
  try {
    cachedDefaultLayout = await fs.readFile(templatePath, "utf-8");
    return cachedDefaultLayout;
  } catch {
    cachedDefaultLayout = getFallbackLayout();
    return cachedDefaultLayout;
  }
}

function getFallbackLayout(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{title}}</title>
  <style>
    :root { --text: #222; --bg: #fff; --accent: #0066cc; --muted: #666; --max-width: 42rem; }
    @media (prefers-color-scheme: dark) { :root { --text: #e0e0e0; --bg: #1a1a1a; --accent: #6db3f2; --muted: #999; } }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; font-size: 18px; line-height: 1.6; color: var(--text); background: var(--bg); padding: 2rem 1rem; }
    main { max-width: var(--max-width); margin: 0 auto; }
    h1, h2, h3, h4 { margin: 1.5em 0 0.5em; line-height: 1.3; }
    p, ul, ol, pre, blockquote, table { margin: 1em 0; }
    a { color: var(--accent); }
    code { font-family: monospace; background: rgba(128,128,128,0.1); padding: 0.1em 0.3em; border-radius: 3px; }
    pre { background: rgba(128,128,128,0.1); padding: 1em; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid rgba(128,128,128,0.3); padding: 0.5em 0.75em; text-align: left; }
    .footnotes { margin-top: 3em; padding-top: 1em; border-top: 1px solid rgba(128,128,128,0.3); font-size: 0.9em; }
  </style>
</head>
<body><main>{{content}}</main></body>
</html>`;
}

export async function loadLayout(inputDir: string, layoutName?: string): Promise<string> {
  const layoutFile = layoutName || "_layout.html";
  const layoutPath = path.join(inputDir, layoutFile);
  
  try {
    return await fs.readFile(layoutPath, "utf-8");
  } catch {
    return await loadDefaultLayout();
  }
}

export async function loadLayoutForFile(
  filePath: string,
  inputRoot: string,
  rootLayout: string,
): Promise<string> {
  const fileDir = path.dirname(filePath);
  let currentDir = fileDir;
  
  while (currentDir.startsWith(inputRoot) || currentDir === inputRoot) {
    const layoutPath = path.join(currentDir, "_layout.html");
    try {
      return await fs.readFile(layoutPath, "utf-8");
    } catch {
      if (currentDir === inputRoot) break;
      currentDir = path.dirname(currentDir);
    }
  }
  
  return rootLayout;
}

export interface TemplateOptions {
  feedConfig?: FeedConfig;
}

export function applyTemplate(page: Page, layout: string, options?: TemplateOptions): string {
  let result = layout;
  
  result = result.replace(/\{\{content\}\}/g, page.html);
  result = result.replace(/\{\{title\}\}/g, page.data.title || "Untitled");
  
  if (page.data.date) {
    result = result.replace(/\{\{date\}\}/g, page.data.date);
  }
  
  // Inject feed discovery links if configured
  if (options?.feedConfig) {
    const feedLinks = generateFeedDiscoveryLinks(options.feedConfig);
    result = result.replace(/\{\{feed_links\}\}/g, feedLinks);
    
    // Also inject before </head> if {{feed_links}} not present
    if (!layout.includes("{{feed_links}}") && result.includes("</head>")) {
      result = result.replace("</head>", `  ${feedLinks}\n</head>`);
    }
  } else {
    result = result.replace(/\{\{feed_links\}\}/g, "");
  }
  
  for (const [key, value] of Object.entries(page.data)) {
    if (typeof value === "string") {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      result = result.replace(regex, value);
    }
  }
  
  result = result.replace(/\{\{[^}]+\}\}/g, "");
  
  return result;
}

export async function getDefaultLayout(): Promise<string> {
  return await loadDefaultLayout();
}
