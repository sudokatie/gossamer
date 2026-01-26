import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { createNewSite } from "./scaffold.js";

describe("createNewSite", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "gossamer-scaffold-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("creates site directory", async () => {
    const sitePath = path.join(tempDir, "my-site");
    
    await createNewSite(sitePath);
    
    const stat = await fs.stat(sitePath);
    assert.ok(stat.isDirectory());
  });

  it("creates posts subdirectory", async () => {
    const sitePath = path.join(tempDir, "my-site");
    
    await createNewSite(sitePath);
    
    const stat = await fs.stat(path.join(sitePath, "posts"));
    assert.ok(stat.isDirectory());
  });

  it("creates index.md", async () => {
    const sitePath = path.join(tempDir, "my-site");
    
    await createNewSite(sitePath);
    
    const content = await fs.readFile(path.join(sitePath, "index.md"), "utf-8");
    assert.ok(content.includes("title: Home"));
    assert.ok(content.includes("Welcome"));
  });

  it("creates about.md", async () => {
    const sitePath = path.join(tempDir, "my-site");
    
    await createNewSite(sitePath);
    
    const content = await fs.readFile(path.join(sitePath, "about.md"), "utf-8");
    assert.ok(content.includes("title: About"));
  });

  it("creates first post with today's date", async () => {
    const sitePath = path.join(tempDir, "my-site");
    const today = new Date().toISOString().split("T")[0];
    
    await createNewSite(sitePath);
    
    const files = await fs.readdir(path.join(sitePath, "posts"));
    assert.ok(files.some(f => f.startsWith(today)));
    assert.ok(files.some(f => f.includes("hello-world")));
  });

  it("throws error for non-empty directory", async () => {
    const sitePath = path.join(tempDir, "existing");
    await fs.mkdir(sitePath);
    await fs.writeFile(path.join(sitePath, "file.txt"), "content");
    
    await assert.rejects(
      () => createNewSite(sitePath),
      /already exists and is not empty/
    );
  });

  it("allows empty existing directory", async () => {
    const sitePath = path.join(tempDir, "empty-dir");
    await fs.mkdir(sitePath);
    
    await createNewSite(sitePath);
    
    const files = await fs.readdir(sitePath);
    assert.ok(files.includes("index.md"));
  });

  it("throws error if path is a file", async () => {
    const sitePath = path.join(tempDir, "a-file");
    await fs.writeFile(sitePath, "content");
    
    await assert.rejects(
      () => createNewSite(sitePath),
      /not a directory/
    );
  });
});
