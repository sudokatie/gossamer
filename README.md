# Gossamer

Static site generator that's actually simple. Zero JS by default, builds in milliseconds.

**[Live Example](https://blackabee.com/apps/gossamer/example/)** - See what Gossamer outputs

## Install

```bash
git clone https://github.com/katieblackabee/gossamer.git
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

## CLI Commands

### `gossamer new <directory>`

Creates a new site with starter files:
- `index.md` - Homepage
- `about.md` - About page
- `posts/` - Blog posts directory with example post

```bash
gossamer new my-blog
```

### `gossamer build [directory]`

Builds your site to `_site/` (or custom output with `--output`).

```bash
# Build current directory
gossamer build

# Build specific directory
gossamer build ./my-site

# Custom output
gossamer build --output ./public
```

**Options:**
- `-o, --output <dir>` - Output directory (default: `_site`)

### `gossamer serve [directory]`

Starts a development server with file watching. Rebuilds automatically on changes.

```bash
# Serve current directory
gossamer serve

# Custom port
gossamer serve --port 8080
```

**Options:**
- `-p, --port <number>` - Server port (default: `3000`)
- `-o, --output <dir>` - Output directory (default: `_site`)

## How It Works

1. Markdown files (`.md`) are converted to HTML
2. Static assets (CSS, JS, images) are copied as-is
3. The default layout (or your custom `_layout.html`) wraps each page
4. Posts in `posts/` get a generated index page

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

Add YAML front matter to your markdown files:

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
| `title` | Page title (auto-extracted from first H1 if not set) |
| `date` | Publication date (YYYY-MM-DD format) |
| `draft` | If `true`, page is skipped during build |
| `layout` | Custom layout file (future feature) |
| *custom* | Any field can be used in templates |

### Date in Filename

Posts can have dates in their filename:

```
posts/2024-01-15-hello-world.md
```

This becomes `/posts/hello-world.html` with date `2024-01-15`.

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
  <header>
    <nav>
      <a href="/">Home</a>
      <a href="/about.html">About</a>
      <a href="/posts/">Blog</a>
    </nav>
  </header>
  <main>
    {{content}}
  </main>
  <footer>
    <p>&copy; 2024 My Site</p>
  </footer>
</body>
</html>
```

### Template Variables

| Variable | Description |
|----------|-------------|
| `{{content}}` | The rendered HTML content |
| `{{title}}` | Page title (or "Untitled") |
| `{{date}}` | Page date (if set) |
| `{{slug}}` | URL-friendly page name |
| `{{*}}` | Any front matter field |

Unresolved variables are removed from output.

### Per-Directory Layouts

You can have different layouts for different sections:

```
my-site/
  _layout.html          <- default layout
  posts/
    _layout.html        <- posts use this layout
    hello.md
  docs/
    _layout.html        <- docs use this layout
    getting-started.md
```

Gossamer walks up the directory tree to find the nearest `_layout.html`.

## Posts

Markdown files in a `posts/` directory are treated as blog posts:

1. Sorted by date (newest first)
2. Auto-generated index at `/posts/index.html`
3. Dates can be in filename or front matter

### Example Post

`posts/2024-01-15-hello-world.md`:

```markdown
---
title: Hello World
---

This is my first post!
```

Outputs to: `_site/posts/hello-world.html`

## Markdown Features

Gossamer uses [marked](https://marked.js.org/) with GitHub Flavored Markdown (GFM):

- **Bold** and *italic*
- [Links](https://example.com)
- `inline code` and code blocks
- Lists (ordered and unordered)
- Blockquotes
- Images
- Tables (GFM)
- Task lists (GFM)
- Strikethrough (GFM)

### Tables Example

```markdown
| Name  | Role      |
|-------|-----------|
| Katie | Developer |
| Jordan | Designer |
```

### Code Blocks

````markdown
```javascript
const greeting = "Hello, world!";
console.log(greeting);
```
````

## Default Theme

Without a custom `_layout.html`, Gossamer uses a beautiful default theme:

- Clean typography optimized for reading
- Automatic dark mode (follows system preference)
- Responsive design
- Styled code blocks, tables, blockquotes
- No JavaScript

## Philosophy

- Markdown in, HTML out
- Beautiful defaults that work out of the box
- No configuration required
- No JavaScript in output (unless you add it)
- Builds in milliseconds, not seconds

## Troubleshooting

### "Command not found: gossamer"

Make sure you linked the package globally:

```bash
cd /path/to/gossamer
npm link
```

Or run directly:

```bash
node /path/to/gossamer/dist/cli.js build
```

### Changes not showing up

The dev server watches for changes, but if something seems stuck:

1. Stop the server (Ctrl+C)
2. Delete `_site/` directory
3. Run `gossamer build` then `gossamer serve`

### Posts not appearing in index

Posts must be in a `posts/` directory and not marked as draft:

```markdown
---
draft: true  <- This post won't appear
---
```

### Layout not being used

Make sure your layout file:
- Is named `_layout.html` (with underscore)
- Is in the site root or the page's directory
- Contains `{{content}}` placeholder

## License

MIT
