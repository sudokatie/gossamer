/**
 * Image optimization for static site builds.
 * Uses sharp for resizing, compression, and format conversion.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import sharp from "sharp";

/** Configuration for image optimization */
export interface ImageConfig {
  /** Maximum width in pixels (default: 1920) */
  maxWidth?: number;
  /** Maximum height in pixels (optional) */
  maxHeight?: number;
  /** JPEG quality 1-100 (default: 80) */
  jpegQuality?: number;
  /** PNG compression level 0-9 (default: 9) */
  pngCompression?: number;
  /** WebP quality 1-100 (default: 80) */
  webpQuality?: number;
  /** Generate WebP versions (default: true) */
  generateWebp?: boolean;
  /** Generate responsive sizes (default: [640, 960, 1280]) */
  responsiveSizes?: number[];
  /** Add lazy loading attribute to img tags (default: true) */
  lazyLoading?: boolean;
}

/** Default image configuration */
export const defaultImageConfig: Required<ImageConfig> = {
  maxWidth: 1920,
  maxHeight: 0, // 0 = no limit
  jpegQuality: 80,
  pngCompression: 9,
  webpQuality: 80,
  generateWebp: true,
  responsiveSizes: [640, 960, 1280],
  lazyLoading: true,
};

/** Result of optimizing an image */
export interface OptimizedImage {
  /** Original filename */
  original: string;
  /** Optimized output path */
  output: string;
  /** Original size in bytes */
  originalSize: number;
  /** Optimized size in bytes */
  optimizedSize: number;
  /** Compression ratio (0-1, lower is better) */
  ratio: number;
  /** Width after optimization */
  width: number;
  /** Height after optimization */
  height: number;
  /** Generated responsive variants */
  variants: ResponsiveVariant[];
  /** WebP version path (if generated) */
  webp?: string;
}

/** A responsive image variant */
export interface ResponsiveVariant {
  /** Output path */
  path: string;
  /** Width in pixels */
  width: number;
  /** Size in bytes */
  size: number;
}

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

/** Check if a file is an image */
export function isImage(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

/** Optimize a single image file */
export async function optimizeImage(
  inputPath: string,
  outputPath: string,
  config: ImageConfig = {},
): Promise<OptimizedImage> {
  const cfg = { ...defaultImageConfig, ...config };
  const ext = path.extname(inputPath).toLowerCase();
  
  // Read original file
  const originalBuffer = await fs.readFile(inputPath);
  const originalSize = originalBuffer.length;
  
  // Get original dimensions
  const metadata = await sharp(inputPath).metadata();
  const originalWidth = metadata.width || 0;
  const originalHeight = metadata.height || 0;
  
  // Calculate target dimensions
  let targetWidth = originalWidth;
  let targetHeight = originalHeight;
  
  if (cfg.maxWidth && originalWidth > cfg.maxWidth) {
    targetWidth = cfg.maxWidth;
    targetHeight = Math.round((originalHeight * cfg.maxWidth) / originalWidth);
  }
  
  if (cfg.maxHeight && targetHeight > cfg.maxHeight) {
    targetHeight = cfg.maxHeight;
    targetWidth = Math.round((originalWidth * cfg.maxHeight) / originalHeight);
  }
  
  // Build sharp pipeline
  let pipeline = sharp(inputPath);
  
  // Resize if needed
  if (targetWidth !== originalWidth || targetHeight !== originalHeight) {
    pipeline = pipeline.resize(targetWidth, targetHeight, { fit: "inside" });
  }
  
  // Apply format-specific compression
  if (ext === ".jpg" || ext === ".jpeg") {
    pipeline = pipeline.jpeg({ quality: cfg.jpegQuality, mozjpeg: true });
  } else if (ext === ".png") {
    pipeline = pipeline.png({ compressionLevel: cfg.pngCompression });
  } else if (ext === ".webp") {
    pipeline = pipeline.webp({ quality: cfg.webpQuality });
  }
  
  // Write optimized image
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const outputBuffer = await pipeline.toBuffer();
  await fs.writeFile(outputPath, outputBuffer);
  
  const result: OptimizedImage = {
    original: inputPath,
    output: outputPath,
    originalSize,
    optimizedSize: outputBuffer.length,
    ratio: outputBuffer.length / originalSize,
    width: targetWidth,
    height: targetHeight,
    variants: [],
  };
  
  // Generate responsive variants
  if (cfg.responsiveSizes.length > 0) {
    for (const width of cfg.responsiveSizes) {
      if (width >= targetWidth) continue; // Skip sizes larger than optimized
      
      const variantPath = insertSuffix(outputPath, `-${width}w`);
      const variantBuffer = await sharp(inputPath)
        .resize(width, null, { fit: "inside" })
        .jpeg({ quality: cfg.jpegQuality, mozjpeg: ext === ".jpg" || ext === ".jpeg" })
        .png({ compressionLevel: cfg.pngCompression })
        .webp({ quality: cfg.webpQuality })
        .toBuffer();
      
      await fs.writeFile(variantPath, variantBuffer);
      
      result.variants.push({
        path: variantPath,
        width,
        size: variantBuffer.length,
      });
    }
  }
  
  // Generate WebP version
  if (cfg.generateWebp && ext !== ".webp" && ext !== ".gif") {
    const webpPath = replaceExtension(outputPath, ".webp");
    await sharp(inputPath)
      .resize(targetWidth, targetHeight, { fit: "inside" })
      .webp({ quality: cfg.webpQuality })
      .toFile(webpPath);
    
    result.webp = webpPath;
  }
  
  return result;
}

/** Process all images in a directory */
export async function optimizeImages(
  inputDir: string,
  outputDir: string,
  config: ImageConfig = {},
  relativePath: string = "",
): Promise<OptimizedImage[]> {
  const results: OptimizedImage[] = [];
  const currentDir = path.join(inputDir, relativePath);
  
  let entries;
  try {
    entries = await fs.readdir(currentDir, { withFileTypes: true });
  } catch {
    return results;
  }
  
  for (const entry of entries) {
    // Skip hidden files and directories
    if (entry.name.startsWith(".")) continue;
    if (entry.name.startsWith("_")) continue;
    
    const relPath = path.join(relativePath, entry.name);
    
    if (entry.isDirectory()) {
      const subResults = await optimizeImages(inputDir, outputDir, config, relPath);
      results.push(...subResults);
    } else if (isImage(entry.name)) {
      const sourcePath = path.join(inputDir, relPath);
      const destPath = path.join(outputDir, relPath);
      
      try {
        const result = await optimizeImage(sourcePath, destPath, config);
        results.push(result);
      } catch (err) {
        // Skip files that can't be processed (e.g., corrupted images)
        console.warn(`Warning: Could not optimize ${sourcePath}: ${err}`);
      }
    }
  }
  
  return results;
}

/** Generate srcset attribute for responsive images */
export function generateSrcset(basePath: string, variants: ResponsiveVariant[]): string {
  const parts = [basePath]; // Original is the largest
  
  for (const variant of variants) {
    const relativePath = path.basename(variant.path);
    parts.push(`${relativePath} ${variant.width}w`);
  }
  
  return parts.join(", ");
}

/** Insert a suffix before the file extension */
function insertSuffix(filepath: string, suffix: string): string {
  const ext = path.extname(filepath);
  const base = filepath.slice(0, -ext.length);
  return `${base}${suffix}${ext}`;
}

/** Replace file extension */
function replaceExtension(filepath: string, newExt: string): string {
  const ext = path.extname(filepath);
  return filepath.slice(0, -ext.length) + newExt;
}

/** Get total savings from optimization results */
export function calculateSavings(results: OptimizedImage[]): {
  totalOriginal: number;
  totalOptimized: number;
  savedBytes: number;
  savedPercent: number;
} {
  const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalOptimized = results.reduce((sum, r) => sum + r.optimizedSize, 0);
  const savedBytes = totalOriginal - totalOptimized;
  const savedPercent = totalOriginal > 0 ? (savedBytes / totalOriginal) * 100 : 0;
  
  return { totalOriginal, totalOptimized, savedBytes, savedPercent };
}
