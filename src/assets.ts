import * as fs from "node:fs/promises";
import * as path from "node:path";

const STATIC_EXTENSIONS = new Set([
  ".css", ".js", ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp",
  ".ico", ".woff", ".woff2", ".ttf", ".eot", ".pdf", ".mp3", ".mp4",
  ".json", ".xml", ".txt",
]);

const IGNORED_FILES = new Set([
  ".DS_Store", 
  "Thumbs.db", 
  ".gitignore",
  ".git",
  "node_modules",
  "dist",
  "_site",
]);

export function isStaticAsset(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return STATIC_EXTENSIONS.has(ext);
}

export function shouldIgnore(filename: string): boolean {
  if (filename.startsWith(".")) return true;
  if (filename.startsWith("_")) return true;
  if (IGNORED_FILES.has(filename)) return true;
  return false;
}

export async function copyAssets(
  inputDir: string,
  outputDir: string,
  relativePath: string = "",
): Promise<number> {
  let count = 0;
  const currentDir = path.join(inputDir, relativePath);
  const entries = await fs.readdir(currentDir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (shouldIgnore(entry.name)) continue;
    
    const relPath = path.join(relativePath, entry.name);
    const sourcePath = path.join(inputDir, relPath);
    const destPath = path.join(outputDir, relPath);
    
    if (entry.isDirectory()) {
      await fs.mkdir(destPath, { recursive: true });
      count += await copyAssets(inputDir, outputDir, relPath);
    } else if (isStaticAsset(entry.name)) {
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.copyFile(sourcePath, destPath);
      count++;
    }
  }
  
  return count;
}
