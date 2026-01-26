import { describe, it } from "node:test";
import assert from "node:assert";
import { loadConfig, getDefaults } from "./config.js";

describe("getDefaults", () => {
  it("returns default configuration", () => {
    const defaults = getDefaults();
    
    assert.strictEqual(defaults.inputDir, ".");
    assert.strictEqual(defaults.outputDir, "_site");
    assert.strictEqual(defaults.drafts, false);
  });
});

describe("loadConfig", () => {
  it("uses defaults when no options provided", async () => {
    const config = await loadConfig({});
    
    assert.ok(config.inputDir.endsWith(process.cwd()) || config.inputDir === process.cwd());
    assert.ok(config.outputDir.includes("_site"));
    assert.strictEqual(config.drafts, false);
  });

  it("handles undefined values in options", async () => {
    const config = await loadConfig({
      inputDir: ".",
      outputDir: undefined,
      drafts: undefined,
    });
    
    assert.ok(config.outputDir.includes("_site"));
    assert.strictEqual(config.drafts, false);
  });

  it("overrides defaults with provided options", async () => {
    const config = await loadConfig({
      inputDir: "/tmp/test",
      outputDir: "/tmp/output",
      drafts: true,
    });
    
    assert.strictEqual(config.inputDir, "/tmp/test");
    assert.strictEqual(config.outputDir, "/tmp/output");
    assert.strictEqual(config.drafts, true);
  });

  it("resolves relative paths to absolute", async () => {
    const config = await loadConfig({
      inputDir: ".",
      outputDir: "dist",
    });
    
    assert.ok(config.inputDir.startsWith("/"));
    assert.ok(config.outputDir.startsWith("/"));
  });
});
