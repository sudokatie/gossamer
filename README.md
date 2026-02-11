# Gossamer

Static site generator that's actually simple. Zero JavaScript by default. Builds in milliseconds, not the heat death of the universe.

**[Live Example](https://blackabee.com/apps/gossamer/example/)** - See what it outputs

## Why Another Static Site Generator?

Because Gatsby has 1,847 dependencies. Because Next.js wants to be everything to everyone. Because Hugo's templating language was designed by someone who hates joy.

Gossamer does one thing: turns markdown into HTML. It does this quickly, with sensible defaults, and without requiring a PhD in configuration file syntax. It also optimizes your images, generates RSS feeds, and creates sitemaps.

## Install

```bash
npm install -g gossamer-ssg
```

Or if you prefer the scenic route:

```bash
git clone https://github.com/sudokatie/gossamer.git
cd gossamer
npm install
npm run build
npm link  # makes 'gossamer' command available globally
```

## Quick Start

```bash
# Create a new site
gossamer new my-site
cd my-site

# Build it
gossamer build

# Or serve with live reload
gossamer serve
```

That's it. You now have a website. No 47-step configuration process. No YAML files that are longer than your actual content.

## CLI Commands

### `gossamer new <directory>`

Creates a new site with starter files. Includes an index page, about page, and a sample blog post so you're not staring at an empty folder wondering what to do next.

```bash
gossamer new my-blog
```

### `gossamer build [directory]`

Builds your site to `_site/` (or wherever you want with `--output`).

```bash
# Build current directory
gossamer build

# Build specific directory
gossamer build ./my-site

# Custom output
gossamer build --output ./public
```

### `gossamer serve [directory]`

Starts a development server that actually watches for changes and rebuilds. Like magic, except it's just filesystem events.

```bash
# Serve current directory
gossamer serve

# Custom port for the commitment-phobic
gossamer serve --port 8080
```

## How It Works

1. Markdown files (`.md`) become HTML
2. Static assets (CSS, JS, images) get copied as-is
3. Your layout wraps each page (or you use the beautiful default)
4. Posts in `posts/` get a generated index

No build plugins. No middleware. No "ecosystem." Just files in, files out.

### File Structure

```
my-site/
  index.md          -> _site/index.html
  about.md          -> _site/about.html
  style.css         -> _site/style.css (copied)
  images/
    logo.png        -> _site/images/logo.png (copied)
  posts/
    2024-01-15-hello.md -> _site/posts/hello.html
    2024-01-20-world.md -> _site/posts/world.html
                        -> _site/posts/index.html (generated)
  _layout.html      -> (template, not copied)
```

### Ignored Files

Files starting with `.` or `_` are ignored:
- `.gitignore`, `.DS_Store` - dotfiles
- `_layout.html`, `_draft.md` - underscore-prefixed
- `node_modules/`, `dist/`, `_site/` - common build directories

## Front Matter

Add YAML at the top of your markdown files like a normal person:

```markdown
---
title: My Page Title
date: 2024-01-15
author: Katie
draft: true
---

# Content starts here
```

### Supported Fields

| Field | Description |
|-------|-------------|
| `title` | Page title (auto-extracted from first H1 if you're lazy) |
| `date` | Publication date (YYYY-MM-DD) |
| `draft` | If `true`, the page won't be built. Procrastination, codified. |
| `layout` | Custom layout file (future feature) |
| *anything* | Your custom fields work in templates too |

## Custom Layouts

Create `_layout.html` in your site root:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>{{title}} | My Site</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <nav>
    <a href="/">Home</a>
    <a href="/about.html">About</a>
  </nav>
  <main>
    {{content}}
  </main>
  <footer>Built with Gossamer, stubbornness, and caffeine</footer>
</body>
</html>
```

Template variables: `{{content}}`, `{{title}}`, `{{date}}`, `{{slug}}`, plus any custom front matter fields.

### Per-Directory Layouts

Different sections can have different looks:

```
my-site/
  _layout.html          <- default
  posts/
    _layout.html        <- blog posts use this
  docs/
    _layout.html        <- docs use this
```

Gossamer walks up the directory tree to find the nearest `_layout.html`. It's smarter than it looks.

## Posts

Files in `posts/` are treated as blog posts:

1. Sorted by date (newest first, like God intended)
2. Auto-generated index at `/posts/index.html`
3. Dates can be in filename (`2024-01-15-hello.md`) or front matter

## RSS/Atom Feeds

Want to let people subscribe to your blog like it's 2005? Pass feed config to enable RSS and Atom generation:

```typescript
import { build } from "gossamer-ssg";

await build({
  inputDir: "./content",
  outputDir: "./_site",
  feed: {
    title: "My Blog",
    baseUrl: "https://example.com",
    description: "Thoughts nobody asked for",
    language: "en",
    limit: 20,  // max posts in feed
  },
});
```

This generates:
- `feed.xml` - RSS 2.0 feed
- `atom.xml` - Atom 1.0 feed

Both are standard-compliant and will work with any feed reader that isn't abandonware.

**Feed Config Options:**

| Option | Required | Description |
|--------|----------|-------------|
| `title` | Yes | Your blog's name |
| `baseUrl` | Yes | Full URL with protocol (e.g., `https://example.com`) |
| `description` | No | What your blog is about |
| `language` | No | ISO language code (default: `en`) |
| `limit` | No | Max posts in feed (default: 20) |

Posts use their `description` front matter field for the feed summary. If not provided, the first 280 characters of content are used.

## Sitemap

For SEO purposes, enable sitemap generation:

```typescript
await build({
  inputDir: "./content",
  outputDir: "./_site",
  sitemap: {
    baseUrl: "https://example.com",
  },
});
```

This generates `sitemap.xml` with:
- All pages and posts
- Last modified dates from front matter
- Automatic priority assignment (homepage > posts index > posts > nested pages)
- Change frequency hints

Submit to Google Search Console and pretend like anyone will find your blog.

## Image Optimization

Optimize images during build for faster page loads:

```typescript
import { optimizeImages, calculateSavings } from "gossamer-ssg";

// Optimize all images in a directory
const results = await optimizeImages("./content", "./_site", {
  maxWidth: 1920,         // Resize larger images
  jpegQuality: 80,        // 1-100
  pngCompression: 9,      // 0-9
  generateWebp: true,     // Create .webp versions
  responsiveSizes: [640, 960, 1280],  // Generate srcset variants
});

// See what you saved
const savings = calculateSavings(results);
console.log(`Saved ${(savings.savedPercent).toFixed(1)}% (${savings.savedBytes} bytes)`);
```

**Features:**
- Resize images larger than maxWidth (preserving aspect ratio)
- JPEG compression with mozjpeg
- PNG compression
- Automatic WebP generation for modern browsers
- Responsive image variants for srcset
- Recursive directory processing
- Skips hidden files and corrupted images

**Default Config:**
| Option | Default | Description |
|--------|---------|-------------|
| `maxWidth` | 1920 | Maximum width in pixels |
| `maxHeight` | 0 | Maximum height (0 = no limit) |
| `jpegQuality` | 80 | JPEG quality 1-100 |
| `pngCompression` | 9 | PNG compression 0-9 |
| `webpQuality` | 80 | WebP quality 1-100 |
| `generateWebp` | true | Create .webp versions |
| `responsiveSizes` | [640, 960, 1280] | Widths for responsive variants |

## Default Theme

Without a custom layout, Gossamer uses a default theme that's actually good:

- Clean typography optimized for reading
- Automatic dark mode (follows system preference)
- Responsive design
- Styled code blocks, tables, blockquotes
- No JavaScript

You can build an entire blog and never touch CSS. Though you'll probably want to eventually. That's fine.

## Philosophy

- Markdown in, HTML out. That's the whole job.
- Beautiful defaults so you can ship something today.
- No configuration required. Zero-config is possible when you're not trying to do everything.
- No JavaScript in output unless you put it there.
- Builds in milliseconds because life is short.

## Troubleshooting

### "Command not found: gossamer"

```bash
npm link  # In the gossamer directory
```

### Changes not showing up

The dev server watches for changes, but if it's being stubborn:

1. Stop the server (Ctrl+C)
2. Delete `_site/`
3. `gossamer build && gossamer serve`

### Posts not appearing

- Must be in a `posts/` directory
- Must not have `draft: true` in front matter
- Must exist (check your file path)

## License

MIT
