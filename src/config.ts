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
    Object.assign(config, fileConfig);
  } catch {
    // No config file, use defaults
  }
  
  Object.assign(config, cliOptions);
  
  config.inputDir = path.resolve(config.inputDir);
  config.outputDir = path.resolve(config.outputDir);
  
  return config;
}
