#!/usr/bin/env node

import { Command } from "commander";
import { build } from "./builder.js";
import { serve } from "./server.js";
import { loadConfig } from "./config.js";

const program = new Command();

program
  .name("gossamer")
  .description("Static site generator that's actually simple")
  .version("0.1.0");

program
  .command("build")
  .description("Build the site")
  .argument("[dir]", "Source directory", ".")
  .option("-o, --output <dir>", "Output directory")
  .option("--drafts", "Include draft pages")
  .action(async (dir: string, options: { output?: string; drafts?: boolean }) => {
    console.log("Building site...");
    try {
      const config = await loadConfig({
        inputDir: dir,
        outputDir: options.output,
        drafts: options.drafts,
      });
      const result = await build(config);
      console.log(`Done in ${result.timeMs}ms (${result.pages} pages, ${result.assets} assets)`);
      if (result.errors.length > 0) {
        console.log(`Warnings: ${result.errors.length}`);
        result.errors.forEach(e => console.log(`  - ${e}`));
      }
    } catch (err) {
      console.error("Build failed:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program
  .command("serve")
  .description("Build and serve with live reload")
  .argument("[dir]", "Source directory", ".")
  .option("-o, --output <dir>", "Output directory")
  .option("-p, --port <port>", "Port to serve on", "3000")
  .option("--drafts", "Include draft pages")
  .action(async (dir: string, options: { output?: string; port: string; drafts?: boolean }) => {
    try {
      const config = await loadConfig({
        inputDir: dir,
        outputDir: options.output,
        drafts: options.drafts,
      });
      await serve({
        ...config,
        port: parseInt(options.port, 10),
      });
    } catch (err) {
      console.error("Server failed:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program
  .command("new")
  .description("Create a new site")
  .argument("<name>", "Site name")
  .action(async (name: string) => {
    try {
      const { createNewSite } = await import("./scaffold.js");
      await createNewSite(name);
    } catch (err) {
      console.error("Failed to create site:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program.parse();
