import * as http from "node:http";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { watch } from "chokidar";
import { build } from "./builder.js";
import type { SiteConfig } from "./types.js";

interface ServeConfig extends SiteConfig {
  port: number;
}

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

export async function serve(config: ServeConfig): Promise<void> {
  const outputDir = path.resolve(config.outputDir);
  
  console.log("Building site...");
  const result = await build(config);
  console.log(`Built in ${result.timeMs}ms`);
  
  const server = http.createServer(async (req, res) => {
    let urlPath = req.url || "/";
    
    if (urlPath.endsWith("/")) {
      urlPath += "index.html";
    }
    
    if (!path.extname(urlPath)) {
      urlPath += ".html";
    }
    
    const filePath = path.join(outputDir, urlPath);
    
    try {
      const content = await fs.readFile(filePath);
      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
    }
  });
  
  server.listen(config.port, () => {
    console.log(`Server running at http://localhost:${config.port}`);
  });
  
  const watcher = watch(config.inputDir, {
    ignored: [config.outputDir, /(^|[\/\\])\../, /node_modules/],
    persistent: true,
  });
  
  let rebuildTimeout: NodeJS.Timeout | null = null;
  
  watcher.on("change", () => {
    if (rebuildTimeout) clearTimeout(rebuildTimeout);
    rebuildTimeout = setTimeout(async () => {
      console.log("\nRebuilding...");
      const result = await build(config);
      console.log(`Rebuilt in ${result.timeMs}ms`);
    }, 100);
  });
  
  console.log("Watching for changes...");
}
