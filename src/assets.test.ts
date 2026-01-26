import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { isStaticAsset, shouldIgnore, copyAssets } from "./assets.js";

describe("isStaticAsset", () => {
  it("recognizes CSS files", () => {
    assert.strictEqual(isStaticAsset("style.css"), true);
  });

  it("recognizes JavaScript files", () => {
    assert.strictEqual(isStaticAsset("app.js"), true);
  });

  it("recognizes image files", () => {
    assert.strictEqual(isStaticAsset("photo.jpg"), true);
    assert.strictEqual(isStaticAsset("logo.png"), true);
    assert.strictEqual(isStaticAsset("icon.svg"), true);
    assert.strictEqual(isStaticAsset("animation.gif"), true);
    assert.strictEqual(isStaticAsset("image.webp"), true);
  });

  it("recognizes font files", () => {
    assert.strictEqual(isStaticAsset("font.woff"), true);
    assert.strictEqual(isStaticAsset("font.woff2"), true);
    assert.strictEqual(isStaticAsset("font.ttf"), true);
    assert.strictEqual(isStaticAsset("font.eot"), true);
  });

  it("recognizes document files", () => {
    assert.strictEqual(isStaticAsset("doc.pdf"), true);
  });

  it("rejects markdown files", () => {
    assert.strictEqual(isStaticAsset("readme.md"), false);
  });

  it("rejects HTML files", () => {
    assert.strictEqual(isStaticAsset("_layout.html"), false);
  });

  it("rejects unknown extensions", () => {
    assert.strictEqual(isStaticAsset("file.xyz"), false);
  });
});

describe("shouldIgnore", () => {
  it("ignores dotfiles", () => {
    assert.strictEqual(shouldIgnore(".gitignore"), true);
    assert.strictEqual(shouldIgnore(".DS_Store"), true);
  });

  it("ignores underscore-prefixed files", () => {
    assert.strictEqual(shouldIgnore("_layout.html"), true);
    assert.strictEqual(shouldIgnore("_draft.md"), true);
  });

  it("ignores node_modules", () => {
    assert.strictEqual(shouldIgnore("node_modules"), true);
  });

  it("ignores output directories", () => {
    assert.strictEqual(shouldIgnore("_site"), true);
    assert.strictEqual(shouldIgnore("dist"), true);
  });

  it("allows normal files", () => {
    assert.strictEqual(shouldIgnore("index.md"), false);
    assert.strictEqual(shouldIgnore("style.css"), false);
    assert.strictEqual(shouldIgnore("posts"), false);
  });
});

describe("copyAssets", () => {
  let inputDir: string;
  let outputDir: string;

  beforeEach(async () => {
    inputDir = await fs.mkdtemp(path.join(os.tmpdir(), "gossamer-input-"));
    outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "gossamer-output-"));
  });

  afterEach(async () => {
    await fs.rm(inputDir, { recursive: true, force: true });
    await fs.rm(outputDir, { recursive: true, force: true });
  });

  it("copies CSS files", async () => {
    await fs.writeFile(path.join(inputDir, "style.css"), "body { color: red; }");
    
    const count = await copyAssets(inputDir, outputDir);
    
    assert.strictEqual(count, 1);
    const content = await fs.readFile(path.join(outputDir, "style.css"), "utf-8");
    assert.strictEqual(content, "body { color: red; }");
  });

  it("copies nested assets", async () => {
    await fs.mkdir(path.join(inputDir, "images"), { recursive: true });
    await fs.writeFile(path.join(inputDir, "images", "logo.png"), "PNG DATA");
    
    const count = await copyAssets(inputDir, outputDir);
    
    assert.strictEqual(count, 1);
    const content = await fs.readFile(path.join(outputDir, "images", "logo.png"), "utf-8");
    assert.strictEqual(content, "PNG DATA");
  });

  it("ignores markdown files", async () => {
    await fs.writeFile(path.join(inputDir, "index.md"), "# Hello");
    await fs.writeFile(path.join(inputDir, "style.css"), "body {}");
    
    const count = await copyAssets(inputDir, outputDir);
    
    assert.strictEqual(count, 1);
    const files = await fs.readdir(outputDir);
    assert.ok(!files.includes("index.md"));
    assert.ok(files.includes("style.css"));
  });

  it("ignores dotfiles and underscore files", async () => {
    await fs.writeFile(path.join(inputDir, ".gitignore"), "node_modules");
    await fs.writeFile(path.join(inputDir, "_layout.html"), "<html>");
    await fs.writeFile(path.join(inputDir, "style.css"), "body {}");
    
    const count = await copyAssets(inputDir, outputDir);
    
    assert.strictEqual(count, 1);
  });

  it("returns zero for empty directory", async () => {
    const count = await copyAssets(inputDir, outputDir);
    
    assert.strictEqual(count, 0);
  });
});
