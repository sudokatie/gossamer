import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import sharp from "sharp";
import {
  isImage,
  optimizeImage,
  optimizeImages,
  generateSrcset,
  calculateSavings,
  defaultImageConfig,
  type ImageConfig,
  type OptimizedImage,
  type ResponsiveVariant,
} from "./images.js";

describe("isImage", () => {
  it("returns true for jpg", () => {
    assert.strictEqual(isImage("photo.jpg"), true);
    assert.strictEqual(isImage("photo.JPG"), true);
  });

  it("returns true for jpeg", () => {
    assert.strictEqual(isImage("photo.jpeg"), true);
  });

  it("returns true for png", () => {
    assert.strictEqual(isImage("image.png"), true);
  });

  it("returns true for webp", () => {
    assert.strictEqual(isImage("image.webp"), true);
  });

  it("returns true for gif", () => {
    assert.strictEqual(isImage("animation.gif"), true);
  });

  it("returns false for non-images", () => {
    assert.strictEqual(isImage("document.pdf"), false);
    assert.strictEqual(isImage("style.css"), false);
    assert.strictEqual(isImage("script.js"), false);
    assert.strictEqual(isImage("README.md"), false);
  });
});

describe("optimizeImage", () => {
  const testDir = "./test-images-temp";
  const inputDir = path.join(testDir, "input");
  const outputDir = path.join(testDir, "output");

  before(async () => {
    await fs.mkdir(inputDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });
  });

  after(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it("optimizes a JPEG image", async () => {
    const inputPath = path.join(inputDir, "test.jpg");
    await sharp({
      create: { width: 800, height: 600, channels: 3, background: { r: 255, g: 0, b: 0 } },
    })
      .jpeg({ quality: 100 })
      .toFile(inputPath);

    const outputPath = path.join(outputDir, "test.jpg");
    const result = await optimizeImage(inputPath, outputPath, { jpegQuality: 60 });

    assert.strictEqual(result.output, outputPath);
    assert.strictEqual(result.width, 800);
    assert.strictEqual(result.height, 600);
    assert.ok(result.optimizedSize < result.originalSize);
    
    const stat = await fs.stat(outputPath);
    assert.strictEqual(stat.size, result.optimizedSize);
  });

  it("resizes images larger than maxWidth", async () => {
    const inputPath = path.join(inputDir, "large.jpg");
    await sharp({
      create: { width: 3000, height: 2000, channels: 3, background: { r: 0, g: 255, b: 0 } },
    })
      .jpeg()
      .toFile(inputPath);

    const outputPath = path.join(outputDir, "large.jpg");
    const result = await optimizeImage(inputPath, outputPath, { maxWidth: 1920 });

    assert.strictEqual(result.width, 1920);
    assert.strictEqual(result.height, 1280);
  });

  it("generates WebP version", async () => {
    const inputPath = path.join(inputDir, "webp-test.jpg");
    await sharp({
      create: { width: 400, height: 300, channels: 3, background: { r: 0, g: 0, b: 255 } },
    })
      .jpeg()
      .toFile(inputPath);

    const outputPath = path.join(outputDir, "webp-test.jpg");
    const result = await optimizeImage(inputPath, outputPath, { generateWebp: true });

    assert.ok(result.webp !== undefined);
    assert.ok(result.webp!.includes(".webp"));
    
    const stat = await fs.stat(result.webp!);
    assert.ok(stat.size > 0);
  });

  it("skips WebP when disabled", async () => {
    const inputPath = path.join(inputDir, "no-webp.jpg");
    await sharp({
      create: { width: 400, height: 300, channels: 3, background: { r: 128, g: 128, b: 128 } },
    })
      .jpeg()
      .toFile(inputPath);

    const outputPath = path.join(outputDir, "no-webp.jpg");
    const result = await optimizeImage(inputPath, outputPath, { generateWebp: false });

    assert.strictEqual(result.webp, undefined);
  });

  it("generates responsive variants", async () => {
    const inputPath = path.join(inputDir, "responsive.jpg");
    await sharp({
      create: { width: 2000, height: 1500, channels: 3, background: { r: 255, g: 255, b: 0 } },
    })
      .jpeg()
      .toFile(inputPath);

    const outputPath = path.join(outputDir, "responsive.jpg");
    const result = await optimizeImage(inputPath, outputPath, {
      maxWidth: 1920,
      responsiveSizes: [640, 960],
    });

    assert.strictEqual(result.variants.length, 2);
    assert.strictEqual(result.variants[0].width, 640);
    assert.strictEqual(result.variants[1].width, 960);
    
    for (const variant of result.variants) {
      const stat = await fs.stat(variant.path);
      assert.strictEqual(stat.size, variant.size);
    }
  });
});

describe("optimizeImages", () => {
  const testDir = "./test-images-bulk-temp";
  const inputDir = path.join(testDir, "input");
  const outputDir = path.join(testDir, "output");

  before(async () => {
    await fs.mkdir(inputDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });
  });

  after(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it("processes all images in directory", async () => {
    await sharp({
      create: { width: 400, height: 300, channels: 3, background: { r: 255, g: 0, b: 0 } },
    })
      .jpeg()
      .toFile(path.join(inputDir, "a.jpg"));

    await sharp({
      create: { width: 500, height: 400, channels: 4, background: { r: 0, g: 255, b: 0, alpha: 1 } },
    })
      .png()
      .toFile(path.join(inputDir, "b.png"));

    const results = await optimizeImages(inputDir, outputDir, {
      generateWebp: false,
      responsiveSizes: [],
    });

    assert.strictEqual(results.length, 2);
  });

  it("processes images in subdirectories", async () => {
    await fs.mkdir(path.join(inputDir, "subdir"), { recursive: true });
    
    await sharp({
      create: { width: 200, height: 200, channels: 3, background: { r: 0, g: 0, b: 255 } },
    })
      .jpeg()
      .toFile(path.join(inputDir, "subdir", "nested.jpg"));

    const results = await optimizeImages(inputDir, outputDir, {
      generateWebp: false,
      responsiveSizes: [],
    });

    // Results include both previous test images and the nested one
    assert.ok(results.some(r => r.output.includes("subdir")));
  });

  it("skips hidden files", async () => {
    await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 128, g: 128, b: 128 } },
    })
      .jpeg()
      .toFile(path.join(inputDir, ".hidden.jpg"));

    // Clean up other images first
    const entries = await fs.readdir(inputDir);
    for (const entry of entries) {
      if (entry !== ".hidden.jpg") {
        await fs.rm(path.join(inputDir, entry), { recursive: true, force: true });
      }
    }

    const results = await optimizeImages(inputDir, outputDir, {
      generateWebp: false,
      responsiveSizes: [],
    });

    assert.strictEqual(results.length, 0);
  });
});

describe("generateSrcset", () => {
  it("generates srcset string", () => {
    const variants: ResponsiveVariant[] = [
      { path: "/images/photo-640w.jpg", width: 640, size: 50000 },
      { path: "/images/photo-960w.jpg", width: 960, size: 100000 },
    ];

    const srcset = generateSrcset("/images/photo.jpg", variants);

    assert.ok(srcset.includes("/images/photo.jpg"));
    assert.ok(srcset.includes("photo-640w.jpg 640w"));
    assert.ok(srcset.includes("photo-960w.jpg 960w"));
  });

  it("handles empty variants", () => {
    const srcset = generateSrcset("/images/photo.jpg", []);
    assert.strictEqual(srcset, "/images/photo.jpg");
  });
});

describe("calculateSavings", () => {
  it("calculates total savings", () => {
    const results: OptimizedImage[] = [
      {
        original: "a.jpg",
        output: "a.jpg",
        originalSize: 100000,
        optimizedSize: 60000,
        ratio: 0.6,
        width: 800,
        height: 600,
        variants: [],
      },
      {
        original: "b.jpg",
        output: "b.jpg",
        originalSize: 200000,
        optimizedSize: 100000,
        ratio: 0.5,
        width: 1200,
        height: 900,
        variants: [],
      },
    ];

    const savings = calculateSavings(results);

    assert.strictEqual(savings.totalOriginal, 300000);
    assert.strictEqual(savings.totalOptimized, 160000);
    assert.strictEqual(savings.savedBytes, 140000);
    assert.ok(Math.abs(savings.savedPercent - 46.67) < 1);
  });

  it("handles empty results", () => {
    const savings = calculateSavings([]);

    assert.strictEqual(savings.totalOriginal, 0);
    assert.strictEqual(savings.totalOptimized, 0);
    assert.strictEqual(savings.savedBytes, 0);
    assert.strictEqual(savings.savedPercent, 0);
  });
});

describe("defaultImageConfig", () => {
  it("has sensible defaults", () => {
    assert.strictEqual(defaultImageConfig.maxWidth, 1920);
    assert.strictEqual(defaultImageConfig.jpegQuality, 80);
    assert.strictEqual(defaultImageConfig.generateWebp, true);
    assert.ok(defaultImageConfig.responsiveSizes.includes(640));
  });
});
