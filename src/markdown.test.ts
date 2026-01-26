import { describe, it } from "node:test";
import assert from "node:assert";
import { parseMarkdown, extractDateFromFilename } from "./markdown.js";

describe("parseMarkdown", () => {
  it("extracts front matter data", () => {
    const content = `---
title: Test Page
date: "2024-01-15"
---

# Hello World

Some content here.`;

    const result = parseMarkdown(content, "test.md");
    
    assert.strictEqual(result.data.title, "Test Page");
    assert.strictEqual(result.data.date, "2024-01-15");
  });

  it("extracts title from H1 if not in front matter", () => {
    const content = `# My Title

Some content.`;

    const result = parseMarkdown(content, "test.md");
    
    assert.strictEqual(result.data.title, "My Title");
  });

  it("uses slug as title fallback", () => {
    const content = `Some content without a title.`;

    const result = parseMarkdown(content, "my-page.md");
    
    assert.strictEqual(result.data.title, "my-page");
  });

  it("converts markdown to HTML", () => {
    const content = `# Hello

**Bold** and *italic*.`;

    const result = parseMarkdown(content, "test.md");
    
    assert.ok(result.html.includes("<h1>"));
    assert.ok(result.html.includes("<strong>Bold</strong>"));
    assert.ok(result.html.includes("<em>italic</em>"));
  });

  it("renders GFM tables", () => {
    const content = `| Name | Value |
| ---- | ----- |
| Foo  | Bar   |`;

    const result = parseMarkdown(content, "test.md");
    
    assert.ok(result.html.includes("<table>"));
    assert.ok(result.html.includes("<th>Name</th>"));
    assert.ok(result.html.includes("<td>Foo</td>"));
  });

  it("extracts slug from path", () => {
    const content = `# Test`;
    
    const result = parseMarkdown(content, "posts/my-post.md");
    
    assert.strictEqual(result.slug, "my-post");
  });

  it("removes date prefix from slug", () => {
    const content = `# Test`;
    
    const result = parseMarkdown(content, "2024-01-15-hello-world.md");
    
    assert.strictEqual(result.slug, "hello-world");
  });
});

describe("markdown extensions", () => {
  it("renders footnotes", () => {
    const content = `Here is a footnote reference[^1].

[^1]: Here is the footnote content.`;

    const result = parseMarkdown(content, "test.md");
    
    assert.ok(result.html.includes("footnote"));
    assert.ok(result.html.includes("Here is the footnote content"));
  });

  it("applies smart typography", () => {
    const content = `"Hello" -- she said... It's nice.`;

    const result = parseMarkdown(content, "test.md");
    
    // Smartypants uses HTML entities: &#8220; (left quote), &#8221; (right quote), &#8217; (apostrophe)
    assert.ok(result.html.includes("&#8220;") || result.html.includes("\u201C")); // Left double quote
    assert.ok(result.html.includes("&#8217;") || result.html.includes("\u2019")); // Apostrophe
    assert.ok(result.html.includes("&#8230;") || result.html.includes("\u2026")); // Ellipsis
  });

  it("renders strikethrough", () => {
    const content = `This is ~~deleted~~ text.`;

    const result = parseMarkdown(content, "test.md");
    
    assert.ok(result.html.includes("<del>") || result.html.includes("~~"));
  });
});

describe("extractDateFromFilename", () => {
  it("extracts YYYY-MM-DD date", () => {
    assert.strictEqual(extractDateFromFilename("2024-01-15-hello.md"), "2024-01-15");
  });

  it("returns undefined for no date", () => {
    assert.strictEqual(extractDateFromFilename("hello.md"), undefined);
  });

  it("handles date at start only", () => {
    assert.strictEqual(extractDateFromFilename("post-2024-01-15.md"), undefined);
  });
});
