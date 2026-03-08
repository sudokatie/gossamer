export interface PageData {
  title: string;
  date?: string;
  draft?: boolean;
  layout?: string;
  description?: string;
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

export interface FeedConfig {
  title: string;
  baseUrl: string;
  description?: string;
  language?: string;
  limit?: number;
}

export interface SitemapConfig {
  baseUrl: string;
}

export interface SearchConfig {
  baseUrl: string;
  fields?: ("title" | "content" | "description")[];
}

export interface SiteConfig {
  inputDir: string;
  outputDir: string;
  drafts?: boolean;
  feed?: FeedConfig;
  sitemap?: SitemapConfig;
  search?: SearchConfig;
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
