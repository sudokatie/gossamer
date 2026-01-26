export interface PageData {
  title: string;
  date?: string;
  draft?: boolean;
  layout?: string;
  [key: string]: unknown;
}

export interface Page {
  sourcePath: string;
  outputPath: string;
  slug: string;
  content: string;
  html: string;
  data: PageData;
}

export interface SiteConfig {
  inputDir: string;
  outputDir: string;
  drafts?: boolean;
}

export interface BuildResult {
  pages: number;
  assets: number;
  errors: string[];
  timeMs: number;
}

export interface ServerConfig extends SiteConfig {
  port: number;
  open?: boolean;
}
