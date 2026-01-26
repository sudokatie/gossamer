#!/usr/bin/env node

import { Command } from "commander";
import { build } from "./builder.js";
import { serve } from "./server.js";

const program = new Command();

program
  .name("gossamer")
  .description("Static site generator that's actually simple")
  .version("0.1.0");

program
  .command("build")
  .description("Build the site")
  .argument("[dir]", "Source directory", ".")
  .option("-o, --output <dir>", "Output directory", "_site")
  .action(async (dir: string, options: { output: string }) => {
    console.log("Building site...");
    try {
      const result = await build({
        inputDir: dir,
        outputDir: options.output,
      });
      console.log(`Done in ${result.timeMs}ms (${result.pages} pages, ${result.assets} assets)`);
    } catch (err) {
      console.error("Build failed:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program
  .command("serve")
  .description("Build and serve with live reload")
  .argument("[dir]", "Source directory", ".")
  .option("-o, --output <dir>", "Output directory", "_site")
  .option("-p, --port <port>", "Port to serve on", "3000")
  .action(async (dir: string, options: { output: string; port: string }) => {
    try {
      await serve({
        inputDir: dir,
        outputDir: options.output,
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
