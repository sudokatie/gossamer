import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { loadLayout, loadLayoutForFile, applyTemplate, getDefaultLayout } from "./template.js";
import type { Page } from "./types.js";

describe("loadLayout", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "gossamer-test-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("loads custom layout file", async () => {
    const customLayout = "<html>{{content}}</html>";
    await fs.writeFile(path.join(tempDir, "_layout.html"), customLayout);
    
    const result = await loadLayout(tempDir);
    
    assert.strictEqual(result, customLayout);
  });

  it("returns default layout when no custom layout exists", async () => {
    const result = await loadLayout(tempDir);
    
    assert.ok(result.includes("<!DOCTYPE html>"));
    assert.ok(result.includes("{{content}}"));
  });

  it("loads named layout file", async () => {
    const customLayout = "<html>custom</html>";
    await fs.writeFile(path.join(tempDir, "blog.html"), customLayout);
    
    const result = await loadLayout(tempDir, "blog.html");
    
    assert.strictEqual(result, customLayout);
  });
});

describe("loadLayoutForFile", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "gossamer-test-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("uses directory-specific layout", async () => {
    await fs.mkdir(path.join(tempDir, "posts"), { recursive: true });
    await fs.writeFile(path.join(tempDir, "_layout.html"), "<root>{{content}}</root>");
    await fs.writeFile(path.join(tempDir, "posts", "_layout.html"), "<posts>{{content}}</posts>");
    
    const filePath = path.join(tempDir, "posts", "hello.md");
    const result = await loadLayoutForFile(filePath, tempDir, "<default>{{content}}</default>");
    
    assert.strictEqual(result, "<posts>{{content}}</posts>");
  });

  it("falls back to parent directory layout", async () => {
    await fs.mkdir(path.join(tempDir, "posts"), { recursive: true });
    await fs.writeFile(path.join(tempDir, "_layout.html"), "<root>{{content}}</root>");
    
    const filePath = path.join(tempDir, "posts", "hello.md");
    const result = await loadLayoutForFile(filePath, tempDir, "<default>{{content}}</default>");
    
    assert.strictEqual(result, "<root>{{content}}</root>");
  });

  it("falls back to root layout when no layouts exist", async () => {
    await fs.mkdir(path.join(tempDir, "posts"), { recursive: true });
    
    const filePath = path.join(tempDir, "posts", "hello.md");
    const result = await loadLayoutForFile(filePath, tempDir, "<default>{{content}}</default>");
    
    assert.strictEqual(result, "<default>{{content}}</default>");
  });
});

describe("applyTemplate", () => {
  it("replaces content placeholder", () => {
    const page: Page = {
      sourcePath: "test.md",
      outputPath: "test.html",
      slug: "test",
      content: "# Hello",
      html: "<h1>Hello</h1>",
      data: { title: "Test" },
    };
    const layout = "<div>{{content}}</div>";
    
    const result = applyTemplate(page, layout);
    
    assert.strictEqual(result, "<div><h1>Hello</h1></div>");
  });

  it("replaces title placeholder", () => {
    const page: Page = {
      sourcePath: "test.md",
      outputPath: "test.html",
      slug: "test",
      content: "",
      html: "",
      data: { title: "My Title" },
    };
    const layout = "<title>{{title}}</title>";
    
    const result = applyTemplate(page, layout);
    
    assert.strictEqual(result, "<title>My Title</title>");
  });

  it("replaces date placeholder", () => {
    const page: Page = {
      sourcePath: "test.md",
      outputPath: "test.html",
      slug: "test",
      content: "",
      html: "",
      data: { title: "Test", date: "2024-01-15" },
    };
    const layout = "<span>{{date}}</span>";
    
    const result = applyTemplate(page, layout);
    
    assert.strictEqual(result, "<span>2024-01-15</span>");
  });

  it("replaces custom front matter variables", () => {
    const page: Page = {
      sourcePath: "test.md",
      outputPath: "test.html",
      slug: "test",
      content: "",
      html: "",
      data: { title: "Test", author: "Katie" },
    };
    const layout = "<span>{{author}}</span>";
    
    const result = applyTemplate(page, layout);
    
    assert.strictEqual(result, "<span>Katie</span>");
  });

  it("removes unresolved placeholders", () => {
    const page: Page = {
      sourcePath: "test.md",
      outputPath: "test.html",
      slug: "test",
      content: "",
      html: "",
      data: { title: "Test" },
    };
    const layout = "<span>{{unknown}}</span>";
    
    const result = applyTemplate(page, layout);
    
    assert.strictEqual(result, "<span></span>");
  });

  it("uses Untitled for missing title", () => {
    const page: Page = {
      sourcePath: "test.md",
      outputPath: "test.html",
      slug: "test",
      content: "",
      html: "",
      data: { title: "" },
    };
    const layout = "<title>{{title}}</title>";
    
    const result = applyTemplate(page, layout);
    
    assert.strictEqual(result, "<title>Untitled</title>");
  });
});

describe("getDefaultLayout", () => {
  it("returns valid HTML", () => {
    const layout = getDefaultLayout();
    
    assert.ok(layout.includes("<!DOCTYPE html>"));
    assert.ok(layout.includes("<html"));
    assert.ok(layout.includes("</html>"));
  });

  it("contains required placeholders", () => {
    const layout = getDefaultLayout();
    
    assert.ok(layout.includes("{{title}}"));
    assert.ok(layout.includes("{{content}}"));
  });

  it("includes dark mode support", () => {
    const layout = getDefaultLayout();
    
    assert.ok(layout.includes("prefers-color-scheme: dark"));
  });
});
