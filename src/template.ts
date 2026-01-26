import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { Page } from "./types.js";

const DEFAULT_LAYOUT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{title}}</title>
  <style>
    :root {
      --text: #222;
      --bg: #fff;
      --accent: #0066cc;
      --muted: #666;
      --max-width: 42rem;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --text: #e0e0e0;
        --bg: #1a1a1a;
        --accent: #6db3f2;
        --muted: #999;
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 18px;
      line-height: 1.6;
      color: var(--text);
      background: var(--bg);
      padding: 2rem 1rem;
    }
    main {
      max-width: var(--max-width);
      margin: 0 auto;
    }
    h1, h2, h3, h4 { margin: 1.5em 0 0.5em; line-height: 1.3; }
    h1 { font-size: 2rem; }
    h2 { font-size: 1.5rem; }
    h3 { font-size: 1.25rem; }
    p, ul, ol, pre, blockquote, table { margin: 1em 0; }
    ul, ol { padding-left: 1.5em; }
    a { color: var(--accent); }
    a:hover { text-decoration: none; }
    code {
      font-family: "SF Mono", Monaco, Consolas, monospace;
      font-size: 0.9em;
      background: rgba(128,128,128,0.1);
      padding: 0.1em 0.3em;
      border-radius: 3px;
    }
    pre {
      background: rgba(128,128,128,0.1);
      padding: 1em;
      overflow-x: auto;
      border-radius: 4px;
    }
    pre code { background: none; padding: 0; }
    blockquote {
      border-left: 3px solid var(--accent);
      padding-left: 1em;
      color: var(--muted);
      font-style: italic;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    th, td {
      border: 1px solid rgba(128,128,128,0.3);
      padding: 0.5em 0.75em;
      text-align: left;
    }
    th { background: rgba(128,128,128,0.1); }
    img { max-width: 100%; height: auto; }
    .date { color: var(--muted); font-size: 0.9em; }
    hr { border: none; border-top: 1px solid rgba(128,128,128,0.3); margin: 2em 0; }
  </style>
</head>
<body>
  <main>
    {{content}}
  </main>
</body>
</html>`;

export async function loadLayout(inputDir: string, layoutName?: string): Promise<string> {
  const layoutFile = layoutName || "_layout.html";
  const layoutPath = path.join(inputDir, layoutFile);
  
  try {
    return await fs.readFile(layoutPath, "utf-8");
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export function applyTemplate(page: Page, layout: string): string {
  let result = layout;
  
  result = result.replace(/\{\{content\}\}/g, page.html);
  result = result.replace(/\{\{title\}\}/g, page.data.title || "Untitled");
  
  if (page.data.date) {
    result = result.replace(/\{\{date\}\}/g, page.data.date);
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

export function getDefaultLayout(): string {
  return DEFAULT_LAYOUT;
}
