import { describe, it } from "node:test";
import assert from "node:assert";
import {
  tokenize,
  removeStopWords,
  stripHtml,
  createSearchDocument,
  buildInvertedIndex,
  generateSearchIndex,
  generateSearchIndexJson,
  generateSearchScript,
  generateSearchPage,
  SearchDocument,
} from "./search.js";
import { Page } from "./types.js";

describe("tokenize", () => {
  it("converts text to lowercase", () => {
    const tokens = tokenize("Hello World");
    assert.ok(tokens.includes("hello"));
    assert.ok(tokens.includes("world"));
  });

  it("removes punctuation", () => {
    const tokens = tokenize("Hello, world! How are you?");
    assert.ok(!tokens.some((t) => t.includes(",")));
    assert.ok(!tokens.some((t) => t.includes("!")));
    assert.ok(!tokens.some((t) => t.includes("?")));
  });

  it("filters short tokens", () => {
    const tokens = tokenize("a is to be or not");
    assert.ok(!tokens.includes("a"));
    assert.ok(!tokens.includes("is"));
    assert.ok(!tokens.includes("to"));
    assert.ok(!tokens.includes("be"));
    assert.ok(!tokens.includes("or"));
    assert.ok(tokens.includes("not"));
  });

  it("splits on whitespace", () => {
    const tokens = tokenize("one two  three\tfour\nfive");
    assert.deepStrictEqual(tokens, ["one", "two", "three", "four", "five"]);
  });
});

describe("removeStopWords", () => {
  it("removes common stop words", () => {
    const tokens = ["the", "quick", "brown", "fox", "and", "lazy", "dog"];
    const filtered = removeStopWords(tokens);
    assert.ok(!filtered.includes("the"));
    assert.ok(!filtered.includes("and"));
    assert.ok(filtered.includes("quick"));
    assert.ok(filtered.includes("brown"));
  });

  it("preserves non-stop words", () => {
    const tokens = ["javascript", "programming", "language"];
    const filtered = removeStopWords(tokens);
    assert.deepStrictEqual(filtered, tokens);
  });
});

describe("stripHtml", () => {
  it("removes HTML tags", () => {
    const html = "<p>Hello <strong>world</strong></p>";
    const text = stripHtml(html);
    assert.strictEqual(text, "Hello world");
  });

  it("handles nested tags", () => {
    const html = "<div><p><span>Nested</span> content</p></div>";
    const text = stripHtml(html);
    assert.strictEqual(text, "Nested content");
  });

  it("normalizes whitespace", () => {
    const html = "<p>Multiple   spaces</p>\n<p>And newlines</p>";
    const text = stripHtml(html);
    assert.strictEqual(text, "Multiple spaces And newlines");
  });

  it("handles empty string", () => {
    assert.strictEqual(stripHtml(""), "");
  });
});

describe("createSearchDocument", () => {
  it("creates document from page", () => {
    const page: Page = {
      sourcePath: "posts/hello.md",
      outputPath: "posts/hello/index.html",
      slug: "posts/hello",
      content: "# Hello\n\nThis is content",
      html: "<h1>Hello</h1><p>This is content</p>",
      data: {
        title: "Hello World",
        description: "A test post",
      },
    };

    const doc = createSearchDocument(page, "https://example.com");

    assert.strictEqual(doc.id, "posts/hello");
    assert.strictEqual(doc.title, "Hello World");
    assert.strictEqual(doc.url, "https://example.com/posts/hello");
    assert.strictEqual(doc.content, "Hello This is content");
    assert.strictEqual(doc.description, "A test post");
  });

  it("handles trailing slash in baseUrl", () => {
    const page: Page = {
      sourcePath: "about.md",
      outputPath: "about/index.html",
      slug: "about",
      content: "About",
      html: "<p>About</p>",
      data: { title: "About" },
    };

    const doc = createSearchDocument(page, "https://example.com/");

    assert.strictEqual(doc.url, "https://example.com/about");
  });

  it("limits content length", () => {
    const longContent = "x".repeat(10000);
    const page: Page = {
      sourcePath: "long.md",
      outputPath: "long/index.html",
      slug: "long",
      content: longContent,
      html: `<p>${longContent}</p>`,
      data: { title: "Long" },
    };

    const doc = createSearchDocument(page, "https://example.com");

    assert.ok(doc.content.length <= 5000);
  });
});

describe("buildInvertedIndex", () => {
  it("builds index from documents", () => {
    const docs: SearchDocument[] = [
      {
        id: "1",
        title: "JavaScript Guide",
        url: "/1",
        content: "Learn JavaScript programming",
      },
      {
        id: "2",
        title: "Python Guide",
        url: "/2",
        content: "Learn Python programming",
      },
    ];

    const index = buildInvertedIndex(docs, ["title", "content"]);

    // Both docs have "guide" and "learn" and "programming"
    assert.deepStrictEqual(index["guide"], [0, 1]);
    assert.deepStrictEqual(index["learn"], [0, 1]);
    assert.deepStrictEqual(index["programming"], [0, 1]);

    // Only first doc has "javascript"
    assert.deepStrictEqual(index["javascript"], [0]);

    // Only second doc has "python"
    assert.deepStrictEqual(index["python"], [1]);
  });

  it("respects field selection", () => {
    const docs: SearchDocument[] = [
      {
        id: "1",
        title: "JavaScript Guide",
        url: "/1",
        content: "Python programming here",
        description: "Description text",
      },
    ];

    const titleOnly = buildInvertedIndex(docs, ["title"]);
    assert.ok(titleOnly["javascript"]);
    assert.ok(titleOnly["guide"]);
    assert.ok(!titleOnly["python"]);
    assert.ok(!titleOnly["description"]);

    const contentOnly = buildInvertedIndex(docs, ["content"]);
    assert.ok(!contentOnly["javascript"]);
    assert.ok(contentOnly["python"]);
  });

  it("handles empty documents", () => {
    const docs: SearchDocument[] = [];
    const index = buildInvertedIndex(docs, ["title", "content"]);
    assert.deepStrictEqual(index, {});
  });
});

describe("generateSearchIndex", () => {
  it("generates complete index", () => {
    const pages: Page[] = [
      {
        sourcePath: "test.md",
        outputPath: "test/index.html",
        slug: "test",
        content: "Test content",
        html: "<p>Test content</p>",
        data: { title: "Test Page" },
      },
    ];

    const index = generateSearchIndex(pages, { baseUrl: "https://example.com" });

    assert.strictEqual(index.version, "1.0");
    assert.strictEqual(index.documents.length, 1);
    assert.strictEqual(index.documents[0].title, "Test Page");
    assert.ok(index.invertedIndex["test"]);
  });

  it("uses default fields", () => {
    const pages: Page[] = [
      {
        sourcePath: "test.md",
        outputPath: "test/index.html",
        slug: "test",
        content: "Content",
        html: "<p>Content</p>",
        data: { title: "Title", description: "Description" },
      },
    ];

    const index = generateSearchIndex(pages, { baseUrl: "https://example.com" });

    // All fields should be indexed by default
    assert.ok(index.invertedIndex["title"]);
    assert.ok(index.invertedIndex["content"]);
    assert.ok(index.invertedIndex["description"]);
  });
});

describe("generateSearchIndexJson", () => {
  it("returns valid JSON string", () => {
    const pages: Page[] = [
      {
        sourcePath: "test.md",
        outputPath: "test/index.html",
        slug: "test",
        content: "Test",
        html: "<p>Test</p>",
        data: { title: "Test" },
      },
    ];

    const json = generateSearchIndexJson(pages, { baseUrl: "https://example.com" });
    const parsed = JSON.parse(json);

    assert.strictEqual(parsed.version, "1.0");
    assert.ok(Array.isArray(parsed.documents));
    assert.ok(typeof parsed.invertedIndex === "object");
  });
});

describe("generateSearchScript", () => {
  it("returns JavaScript code", () => {
    const script = generateSearchScript();
    assert.ok(script.includes("function"));
    assert.ok(script.includes("search"));
    assert.ok(script.includes("loadIndex"));
  });

  it("includes search functionality", () => {
    const script = generateSearchScript();
    assert.ok(script.includes("search-index.json"));
    assert.ok(script.includes("data-search-form"));
    assert.ok(script.includes("data-search-input"));
    assert.ok(script.includes("data-search-results"));
  });
});

describe("generateSearchPage", () => {
  it("generates search page with default title", () => {
    const page = generateSearchPage();
    assert.ok(page.includes("title: Search"));
    assert.ok(page.includes("data-search-form"));
    assert.ok(page.includes("data-search-input"));
    assert.ok(page.includes("data-search-results"));
    assert.ok(page.includes("/search.js"));
  });

  it("uses custom title", () => {
    const page = generateSearchPage("Find Posts");
    assert.ok(page.includes("title: Find Posts"));
  });
});
