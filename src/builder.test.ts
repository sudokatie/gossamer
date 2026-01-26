import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { build } from "./builder.js";

describe("build", () => {
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

  it("builds a simple markdown file", async () => {
    await fs.writeFile(
      path.join(inputDir, "index.md"),
      "---\ntitle: Home\n---\n\n# Welcome\n\nHello world."
    );

    const result = await build({ inputDir, outputDir });

    assert.strictEqual(result.pages, 1);
    assert.strictEqual(result.errors.length, 0);
    
    const output = await fs.readFile(path.join(outputDir, "index.html"), "utf-8");
    assert.ok(output.includes("<h1>Welcome</h1>"));
    assert.ok(output.includes("<title>Home</title>"));
  });

  it("copies static assets", async () => {
    await fs.writeFile(path.join(inputDir, "index.md"), "# Test");
    await fs.writeFile(path.join(inputDir, "style.css"), "body { color: red; }");

    const result = await build({ inputDir, outputDir });

    assert.strictEqual(result.assets, 1);
    
    const css = await fs.readFile(path.join(outputDir, "style.css"), "utf-8");
    assert.strictEqual(css, "body { color: red; }");
  });

  it("handles nested directories", async () => {
    await fs.mkdir(path.join(inputDir, "docs"), { recursive: true });
    await fs.writeFile(path.join(inputDir, "index.md"), "# Home");
    await fs.writeFile(path.join(inputDir, "docs", "guide.md"), "# Guide");

    const result = await build({ inputDir, outputDir });

    assert.strictEqual(result.pages, 2);
    
    const homeExists = await fs.stat(path.join(outputDir, "index.html")).then(() => true).catch(() => false);
    const guideExists = await fs.stat(path.join(outputDir, "docs", "guide.html")).then(() => true).catch(() => false);
    
    assert.ok(homeExists);
    assert.ok(guideExists);
  });

  it("generates posts index", async () => {
    await fs.mkdir(path.join(inputDir, "posts"), { recursive: true });
    await fs.writeFile(
      path.join(inputDir, "posts", "2024-01-15-hello.md"),
      "---\ntitle: Hello\ndate: \"2024-01-15\"\n---\n\n# Hello"
    );

    await build({ inputDir, outputDir });

    const indexExists = await fs.stat(path.join(outputDir, "posts", "index.html")).then(() => true).catch(() => false);
    assert.ok(indexExists);
    
    const indexContent = await fs.readFile(path.join(outputDir, "posts", "index.html"), "utf-8");
    assert.ok(indexContent.includes("Hello"));
  });

  it("skips draft pages by default", async () => {
    await fs.writeFile(
      path.join(inputDir, "draft.md"),
      "---\ntitle: Draft\ndraft: true\n---\n\n# Draft"
    );
    await fs.writeFile(path.join(inputDir, "published.md"), "# Published");

    const result = await build({ inputDir, outputDir });

    assert.strictEqual(result.pages, 1);
    
    const draftExists = await fs.stat(path.join(outputDir, "draft.html")).then(() => true).catch(() => false);
    assert.ok(!draftExists);
  });

  it("includes drafts when configured", async () => {
    await fs.writeFile(
      path.join(inputDir, "draft.md"),
      "---\ntitle: Draft\ndraft: true\n---\n\n# Draft"
    );

    const result = await build({ inputDir, outputDir, drafts: true });

    assert.strictEqual(result.pages, 1);
    
    const draftExists = await fs.stat(path.join(outputDir, "draft.html")).then(() => true).catch(() => false);
    assert.ok(draftExists);
  });

  it("uses custom layout", async () => {
    await fs.writeFile(
      path.join(inputDir, "_layout.html"),
      "<html><body>CUSTOM:{{content}}</body></html>"
    );
    await fs.writeFile(path.join(inputDir, "index.md"), "# Test");

    await build({ inputDir, outputDir });

    const output = await fs.readFile(path.join(outputDir, "index.html"), "utf-8");
    assert.ok(output.includes("CUSTOM:"));
    assert.ok(output.includes("<h1>Test</h1>"));
  });

  it("uses per-directory layout", async () => {
    await fs.mkdir(path.join(inputDir, "blog"), { recursive: true });
    await fs.writeFile(
      path.join(inputDir, "_layout.html"),
      "<html>ROOT:{{content}}</html>"
    );
    await fs.writeFile(
      path.join(inputDir, "blog", "_layout.html"),
      "<html>BLOG:{{content}}</html>"
    );
    await fs.writeFile(path.join(inputDir, "index.md"), "# Home");
    await fs.writeFile(path.join(inputDir, "blog", "post.md"), "# Post");

    await build({ inputDir, outputDir });

    const homeOutput = await fs.readFile(path.join(outputDir, "index.html"), "utf-8");
    const blogOutput = await fs.readFile(path.join(outputDir, "blog", "post.html"), "utf-8");
    
    assert.ok(homeOutput.includes("ROOT:"));
    assert.ok(blogOutput.includes("BLOG:"));
  });

  it("ignores dotfiles and underscore files", async () => {
    await fs.writeFile(path.join(inputDir, ".gitignore"), "node_modules");
    await fs.writeFile(path.join(inputDir, "_layout.html"), "<html>{{content}}</html>");
    await fs.writeFile(path.join(inputDir, "index.md"), "# Test");

    const result = await build({ inputDir, outputDir });

    assert.strictEqual(result.pages, 1);
    assert.strictEqual(result.assets, 0);
  });

  it("strips date prefix from post URLs", async () => {
    await fs.mkdir(path.join(inputDir, "posts"), { recursive: true });
    await fs.writeFile(
      path.join(inputDir, "posts", "2024-01-15-my-post.md"),
      "# My Post"
    );

    await build({ inputDir, outputDir });

    const postExists = await fs.stat(path.join(outputDir, "posts", "my-post.html")).then(() => true).catch(() => false);
    const datedExists = await fs.stat(path.join(outputDir, "posts", "2024-01-15-my-post.html")).then(() => true).catch(() => false);
    
    assert.ok(postExists);
    assert.ok(!datedExists);
  });

  it("returns timing information", async () => {
    await fs.writeFile(path.join(inputDir, "index.md"), "# Test");

    const result = await build({ inputDir, outputDir });

    assert.ok(typeof result.timeMs === "number");
    assert.ok(result.timeMs >= 0);
  });

  it("cleans output directory before build", async () => {
    await fs.writeFile(path.join(outputDir, "old-file.html"), "old content");
    await fs.writeFile(path.join(inputDir, "index.md"), "# New");

    await build({ inputDir, outputDir });

    const oldExists = await fs.stat(path.join(outputDir, "old-file.html")).then(() => true).catch(() => false);
    assert.ok(!oldExists);
  });

  it("uses layout from front matter", async () => {
    await fs.writeFile(
      path.join(inputDir, "custom.html"),
      "<html>CUSTOM-LAYOUT:{{content}}</html>"
    );
    await fs.writeFile(
      path.join(inputDir, "page.md"),
      "---\ntitle: Test\nlayout: custom.html\n---\n\n# Hello"
    );

    await build({ inputDir, outputDir });

    const output = await fs.readFile(path.join(outputDir, "page.html"), "utf-8");
    assert.ok(output.includes("CUSTOM-LAYOUT:"));
  });

  it("uses custom _index.md for posts instead of generated index", async () => {
    await fs.mkdir(path.join(inputDir, "posts"), { recursive: true });
    await fs.writeFile(
      path.join(inputDir, "posts", "_index.md"),
      "---\ntitle: My Blog\n---\n\n# Custom Posts Index\n\nThis is my custom index."
    );
    await fs.writeFile(
      path.join(inputDir, "posts", "2024-01-15-hello.md"),
      "---\ntitle: Hello\ndate: \"2024-01-15\"\n---\n\n# Hello"
    );

    await build({ inputDir, outputDir });

    const indexContent = await fs.readFile(path.join(outputDir, "posts", "index.html"), "utf-8");
    assert.ok(indexContent.includes("Custom Posts Index"));
    assert.ok(!indexContent.includes("[generated]"));
  });
});
