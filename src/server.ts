import * as http from "node:http";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { build } from "./builder.js";
import { watch } from "./watcher.js";
import type { ServerConfig } from "./types.js";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".pdf": "application/pdf",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
};

export async function serve(config: ServerConfig): Promise<void> {
  const outputDir = path.resolve(config.outputDir);
  
  console.log("Building site...");
  const result = await build(config);
  console.log(`Built in ${result.timeMs}ms (${result.pages} pages, ${result.assets} assets)`);
  
  const server = createServer(outputDir);
  
  server.listen(config.port, () => {
    console.log(`\nServer running at http://localhost:${config.port}`);
    console.log("Watching for changes...\n");
  });
  
  watch(config.inputDir, config.outputDir, async (filepath, event) => {
    console.log(`\n[${event}] ${filepath}`);
    console.log("Rebuilding...");
    const result = await build(config);
    console.log(`Rebuilt in ${result.timeMs}ms`);
  });
}

function createServer(outputDir: string): http.Server {
  return http.createServer(async (req, res) => {
    const timestamp = new Date().toISOString().slice(11, 19);
    let urlPath = decodeURIComponent(req.url || "/");
    
    if (urlPath.endsWith("/")) {
      urlPath += "index.html";
    }
    
    if (!path.extname(urlPath)) {
      urlPath += ".html";
    }
    
    const filePath = path.join(outputDir, urlPath);
    
    try {
      const content = await fs.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
      console.log(`[${timestamp}] 200 ${req.url}`);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
      console.log(`[${timestamp}] 404 ${req.url}`);
    }
  });
}
