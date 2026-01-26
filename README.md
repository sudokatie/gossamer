# Gossamer

Static site generator that's actually simple. Zero JS by default, builds in milliseconds.

## Install

```bash
npm install -g gossamer
```

## Usage

### Create a new site

```bash
gossamer new my-site
cd my-site
```

### Build

```bash
gossamer build
```

Output goes to `_site/` by default.

### Serve with live reload

```bash
gossamer serve
```

## How it works

1. Put markdown files in a directory
2. Run `gossamer build`
3. Get a website

That's it.

### File structure

```
my-site/
  index.md          -> index.html
  about.md          -> about.html
  posts/
    2024-01-15-hello.md -> posts/hello.html
  style.css         -> style.css (copied)
  _layout.html      -> (used as template)
```

### Front matter

```markdown
---
title: My Page
date: 2024-01-15
---

# Content here
```

### Custom layout

Create `_layout.html` in your site root:

```html
<!DOCTYPE html>
<html>
<head>
  <title>{{title}}</title>
</head>
<body>
  {{content}}
</body>
</html>
```

Use `{{title}}`, `{{date}}`, `{{content}}` and any front matter variables.

### Posts

Put markdown files in a `posts/` directory. They'll be:
- Sorted by date (from filename or front matter)
- Listed at `/posts/index.html`

Date in filename: `2024-01-15-my-post.md`

## Philosophy

- Markdown in, HTML out
- Beautiful defaults
- No configuration required
- No JavaScript in output
- Builds in milliseconds

## License

MIT
