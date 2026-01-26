import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { SiteConfig } from "./types.js";

const DEFAULT_CONFIG: SiteConfig = {
  inputDir: ".",
  outputDir: "_site",
  drafts: false,
};

export function getDefaults(): SiteConfig {
  return { ...DEFAULT_CONFIG };
}

export async function loadConfig(cliOptions: Partial<SiteConfig>): Promise<SiteConfig> {
  const config = { ...DEFAULT_CONFIG };
  
  const configPath = path.join(cliOptions.inputDir || ".", "gossamer.json");
  try {
    const fileContent = await fs.readFile(configPath, "utf-8");
    const fileConfig = JSON.parse(fileContent) as Partial<SiteConfig>;
    // Only merge defined values from file config
    for (const [key, value] of Object.entries(fileConfig)) {
      if (value !== undefined) {
        (config as Record<string, unknown>)[key] = value;
      }
    }
  } catch {
    // No config file, use defaults
  }
  
  // Only merge defined values from CLI options
  for (const [key, value] of Object.entries(cliOptions)) {
    if (value !== undefined) {
      (config as Record<string, unknown>)[key] = value;
    }
  }
  
  config.inputDir = path.resolve(config.inputDir);
  config.outputDir = path.resolve(config.outputDir);
  
  return config;
}
