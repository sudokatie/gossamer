export interface PageData {
  title: string;
  date?: string;
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
  layoutFile?: string;
}

export interface BuildResult {
  pages: number;
  assets: number;
  timeMs: number;
}
