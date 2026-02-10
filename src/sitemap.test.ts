import { describe, it } from "node:test";
import * as assert from "node:assert";
import { generateSitemap } from "./sitemap.js";
import type { Page, SitemapConfig } from "./types.js";

const mockPages: Page[] = [
  {
    sourcePath: "index.md",
    outputPath: "index.html",
    slug: "index",
    content: "Home page",
    html: "<p>Home page</p>",
    data: { title: "Home", date: "2024-01-20" },
  },
  {
    sourcePath: "about.md",
    outputPath: "about.html",
    slug: "about",
    content: "About page",
    html: "<p>About page</p>",
    data: { title: "About", date: "2024-01-15" },
  },
  {
    sourcePath: "posts/2024-01-10-hello.md",
    outputPath: "posts/hello.html",
    slug: "hello",
    content: "Hello post",
    html: "<p>Hello post</p>",
    data: { title: "Hello", date: "2024-01-10" },
  },
  {
    sourcePath: "posts/_index.md",
    outputPath: "posts/index.html",
    slug: "posts",
    content: "Posts",
    html: "<p>Posts</p>",
    data: { title: "Posts", date: "2024-01-20" },
  },
  {
    sourcePath: "docs/guide.md",
    outputPath: "docs/guide.html",
    slug: "guide",
    content: "Guide",
    html: "<p>Guide</p>",
    data: { title: "Guide" },
  },
];

const mockConfig: SitemapConfig = {
  baseUrl: "https://example.com",
};

describe("sitemap", () => {
  describe("generateSitemap", () => {
    it("generates valid sitemap XML", () => {
      const sitemap = generateSitemap(mockPages, mockConfig);

      assert.ok(sitemap.includes('<?xml version="1.0" encoding="UTF-8"?>'));
      assert.ok(sitemap.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'));
      assert.ok(sitemap.includes("<urlset"));
    });

    it("includes all pages", () => {
      const sitemap = generateSitemap(mockPages, mockConfig);

      assert.ok(sitemap.includes("https://example.com/index.html"));
      assert.ok(sitemap.includes("https://example.com/about.html"));
      assert.ok(sitemap.includes("https://example.com/posts/hello.html"));
      assert.ok(sitemap.includes("https://example.com/docs/guide.html"));
    });

    it("includes lastmod from page date", () => {
      const sitemap = generateSitemap(mockPages, mockConfig);

      assert.ok(sitemap.includes("<lastmod>2024-01-20</lastmod>"));
      assert.ok(sitemap.includes("<lastmod>2024-01-15</lastmod>"));
      assert.ok(sitemap.includes("<lastmod>2024-01-10</lastmod>"));
    });

    it("assigns highest priority to homepage", () => {
      const sitemap = generateSitemap(mockPages, mockConfig);

      const homepageMatch = sitemap.match(/<url>\s*<loc>https:\/\/example\.com\/index\.html<\/loc>[\s\S]*?<priority>([\d.]+)<\/priority>/);
      assert.ok(homepageMatch);
      assert.strictEqual(homepageMatch[1], "1.0");
    });

    it("assigns high priority to posts index", () => {
      const sitemap = generateSitemap(mockPages, mockConfig);

      const postsIndexMatch = sitemap.match(/<url>\s*<loc>https:\/\/example\.com\/posts\/index\.html<\/loc>[\s\S]*?<priority>([\d.]+)<\/priority>/);
      assert.ok(postsIndexMatch);
      assert.strictEqual(postsIndexMatch[1], "0.9");
    });

    it("assigns lower priority to individual posts", () => {
      const sitemap = generateSitemap(mockPages, mockConfig);

      const postMatch = sitemap.match(/<url>\s*<loc>https:\/\/example\.com\/posts\/hello\.html<\/loc>[\s\S]*?<priority>([\d.]+)<\/priority>/);
      assert.ok(postMatch);
      assert.strictEqual(postMatch[1], "0.7");
    });

    it("includes changefreq", () => {
      const sitemap = generateSitemap(mockPages, mockConfig);

      // Posts should be yearly
      assert.ok(sitemap.match(/<loc>https:\/\/example\.com\/posts\/hello\.html<\/loc>[\s\S]*?<changefreq>yearly<\/changefreq>/));
      // Index pages should be weekly
      assert.ok(sitemap.match(/<loc>https:\/\/example\.com\/index\.html<\/loc>[\s\S]*?<changefreq>weekly<\/changefreq>/));
    });

    it("escapes XML special characters", () => {
      const pages: Page[] = [
        {
          sourcePath: "test.md",
          outputPath: "test&page.html",
          slug: "test",
          content: "Test",
          html: "<p>Test</p>",
          data: { title: "Test" },
        },
      ];

      const sitemap = generateSitemap(pages, mockConfig);

      assert.ok(sitemap.includes("test&amp;page.html"));
      assert.ok(!sitemap.includes("test&page.html"));
    });

    it("handles baseUrl with trailing slash", () => {
      const config = { baseUrl: "https://example.com/" };
      const sitemap = generateSitemap(mockPages, config);

      // Should not have double slashes
      assert.ok(!sitemap.includes("https://example.com//"));
    });
  });
});
