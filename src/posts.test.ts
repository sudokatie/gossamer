import { describe, it } from "node:test";
import assert from "node:assert";
import { isPost, sortPosts, generatePostsIndex } from "./posts.js";
import type { Page } from "./types.js";

describe("isPost", () => {
  it("identifies pages in posts directory", () => {
    const page: Page = {
      sourcePath: "posts/hello.md",
      outputPath: "posts/hello.html",
      slug: "hello",
      content: "",
      html: "",
      data: { title: "Hello" },
    };
    
    assert.strictEqual(isPost(page), true);
  });

  it("identifies pages in nested posts directory", () => {
    const page: Page = {
      sourcePath: "blog/posts/hello.md",
      outputPath: "blog/posts/hello.html",
      slug: "hello",
      content: "",
      html: "",
      data: { title: "Hello" },
    };
    
    assert.strictEqual(isPost(page), true);
  });

  it("rejects pages outside posts directory", () => {
    const page: Page = {
      sourcePath: "about.md",
      outputPath: "about.html",
      slug: "about",
      content: "",
      html: "",
      data: { title: "About" },
    };
    
    assert.strictEqual(isPost(page), false);
  });

  it("rejects pages in similar-named directories", () => {
    const page: Page = {
      sourcePath: "my-posts-archive/hello.md",
      outputPath: "my-posts-archive/hello.html",
      slug: "hello",
      content: "",
      html: "",
      data: { title: "Hello" },
    };
    
    assert.strictEqual(isPost(page), false);
  });
});

describe("sortPosts", () => {
  it("sorts by date descending", () => {
    const posts: Page[] = [
      {
        sourcePath: "posts/old.md",
        outputPath: "posts/old.html",
        slug: "old",
        content: "",
        html: "",
        data: { title: "Old Post", date: "2024-01-01" },
      },
      {
        sourcePath: "posts/new.md",
        outputPath: "posts/new.html",
        slug: "new",
        content: "",
        html: "",
        data: { title: "New Post", date: "2024-01-15" },
      },
      {
        sourcePath: "posts/middle.md",
        outputPath: "posts/middle.html",
        slug: "middle",
        content: "",
        html: "",
        data: { title: "Middle Post", date: "2024-01-08" },
      },
    ];
    
    const sorted = sortPosts(posts);
    
    assert.strictEqual(sorted[0].data.title, "New Post");
    assert.strictEqual(sorted[1].data.title, "Middle Post");
    assert.strictEqual(sorted[2].data.title, "Old Post");
  });

  it("handles posts without dates", () => {
    const posts: Page[] = [
      {
        sourcePath: "posts/with-date.md",
        outputPath: "posts/with-date.html",
        slug: "with-date",
        content: "",
        html: "",
        data: { title: "With Date", date: "2024-01-15" },
      },
      {
        sourcePath: "posts/no-date.md",
        outputPath: "posts/no-date.html",
        slug: "no-date",
        content: "",
        html: "",
        data: { title: "No Date" },
      },
    ];
    
    const sorted = sortPosts(posts);
    
    assert.strictEqual(sorted.length, 2);
    assert.strictEqual(sorted[0].data.title, "With Date");
    assert.strictEqual(sorted[1].data.title, "No Date");
  });

  it("returns empty array for empty input", () => {
    const sorted = sortPosts([]);
    
    assert.deepStrictEqual(sorted, []);
  });
});

describe("generatePostsIndex", () => {
  it("generates HTML with post list", () => {
    const posts: Page[] = [
      {
        sourcePath: "posts/hello.md",
        outputPath: "posts/hello.html",
        slug: "hello",
        content: "",
        html: "",
        data: { title: "Hello World", date: "2024-01-15" },
      },
    ];
    const layout = "<html><body>{{content}}</body></html>";
    
    const result = generatePostsIndex(posts, layout);
    
    assert.ok(result.includes("Hello World"));
    assert.ok(result.includes("hello.html"));
    assert.ok(result.includes("2024-01-15"));
  });

  it("sorts posts by date", () => {
    const posts: Page[] = [
      {
        sourcePath: "posts/old.md",
        outputPath: "posts/old.html",
        slug: "old",
        content: "",
        html: "",
        data: { title: "Old Post", date: "2024-01-01" },
      },
      {
        sourcePath: "posts/new.md",
        outputPath: "posts/new.html",
        slug: "new",
        content: "",
        html: "",
        data: { title: "New Post", date: "2024-01-15" },
      },
    ];
    const layout = "{{content}}";
    
    const result = generatePostsIndex(posts, layout);
    
    const newIndex = result.indexOf("New Post");
    const oldIndex = result.indexOf("Old Post");
    assert.ok(newIndex < oldIndex, "New post should appear before old post");
  });

  it("uses Posts as default title", () => {
    const posts: Page[] = [];
    const layout = "<title>{{title}}</title>{{content}}";
    
    const result = generatePostsIndex(posts, layout);
    
    assert.ok(result.includes("<title>Posts</title>"));
  });
});
