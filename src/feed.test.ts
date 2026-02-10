import { describe, it } from "node:test";
import * as assert from "node:assert";
import { generateRss, generateAtom } from "./feed.js";
import type { Page, FeedConfig } from "./types.js";

const mockPosts: Page[] = [
  {
    sourcePath: "posts/2024-01-20-second.md",
    outputPath: "posts/second.html",
    slug: "second",
    content: "Second post content",
    html: "<p>Second post content</p>",
    data: {
      title: "Second Post",
      date: "2024-01-20",
      description: "The second post",
    },
  },
  {
    sourcePath: "posts/2024-01-15-first.md",
    outputPath: "posts/first.html",
    slug: "first",
    content: "First post content here",
    html: "<p>First post content here</p>",
    data: {
      title: "First Post",
      date: "2024-01-15",
    },
  },
];

const mockConfig: FeedConfig = {
  title: "Test Blog",
  baseUrl: "https://example.com",
  description: "A test blog",
  language: "en",
  limit: 10,
};

describe("feed", () => {
  describe("generateRss", () => {
    it("generates valid RSS 2.0 feed", () => {
      const rss = generateRss(mockPosts, mockConfig);

      assert.ok(rss.includes('<?xml version="1.0" encoding="UTF-8"?>'));
      assert.ok(rss.includes('<rss version="2.0"'));
      assert.ok(rss.includes("<title>Test Blog</title>"));
      assert.ok(rss.includes("<link>https://example.com</link>"));
      assert.ok(rss.includes("<description>A test blog</description>"));
    });

    it("includes posts as items", () => {
      const rss = generateRss(mockPosts, mockConfig);

      assert.ok(rss.includes("<title>First Post</title>"));
      assert.ok(rss.includes("<title>Second Post</title>"));
      assert.ok(rss.includes("https://example.com/posts/first.html"));
      assert.ok(rss.includes("https://example.com/posts/second.html"));
    });

    it("sorts posts by date descending", () => {
      const rss = generateRss(mockPosts, mockConfig);

      const secondIndex = rss.indexOf("Second Post");
      const firstIndex = rss.indexOf("First Post");
      assert.ok(secondIndex < firstIndex, "Second post (newer) should appear before First post");
    });

    it("uses description from front matter if available", () => {
      const rss = generateRss(mockPosts, mockConfig);

      assert.ok(rss.includes("<description>The second post</description>"));
    });

    it("falls back to content snippet for description", () => {
      const rss = generateRss(mockPosts, mockConfig);

      assert.ok(rss.includes("<description>First post content here</description>"));
    });

    it("respects limit config", () => {
      const config = { ...mockConfig, limit: 1 };
      const rss = generateRss(mockPosts, config);

      assert.ok(rss.includes("Second Post"));
      assert.ok(!rss.includes("First Post"));
    });

    it("escapes XML special characters", () => {
      const posts: Page[] = [
        {
          sourcePath: "posts/test.md",
          outputPath: "posts/test.html",
          slug: "test",
          content: "Content with <html> & \"quotes\"",
          html: "<p>Content</p>",
          data: {
            title: "Title with <tags> & ampersands",
            date: "2024-01-01",
          },
        },
      ];

      const rss = generateRss(posts, mockConfig);

      assert.ok(rss.includes("&lt;tags&gt;"));
      assert.ok(rss.includes("&amp; ampersands"));
      assert.ok(!rss.includes("<tags>"));
    });
  });

  describe("generateAtom", () => {
    it("generates valid Atom feed", () => {
      const atom = generateAtom(mockPosts, mockConfig);

      assert.ok(atom.includes('<?xml version="1.0" encoding="UTF-8"?>'));
      assert.ok(atom.includes('xmlns="http://www.w3.org/2005/Atom"'));
      assert.ok(atom.includes("<title>Test Blog</title>"));
      assert.ok(atom.includes('href="https://example.com"'));
    });

    it("includes posts as entries", () => {
      const atom = generateAtom(mockPosts, mockConfig);

      assert.ok(atom.includes("<entry>"));
      assert.ok(atom.includes("<title>First Post</title>"));
      assert.ok(atom.includes("<title>Second Post</title>"));
    });

    it("uses RFC 3339 date format", () => {
      const atom = generateAtom(mockPosts, mockConfig);

      // RFC 3339 format: YYYY-MM-DDTHH:MM:SS.sssZ
      assert.ok(atom.match(/<updated>2024-01-\d{2}T/));
    });

    it("includes self link", () => {
      const atom = generateAtom(mockPosts, mockConfig);

      assert.ok(atom.includes('href="https://example.com/atom.xml" rel="self"'));
    });
  });
});
