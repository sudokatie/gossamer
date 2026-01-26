---
title: Gossamer Example Site
---

# Welcome to Gossamer

This is an example site built with [Gossamer](https://github.com/katieblackabee/gossamer), a static site generator that's actually simple.

## Features Demonstrated

- **Markdown to HTML** with CommonMark support
- **Front matter** for titles and metadata
- **Blog posts** with automatic date sorting
- **Smart typography** -- converts quotes and dashes
- **Footnotes** for references[^1]

## Quick Start

```bash
git clone https://github.com/katieblackabee/gossamer.git
cd gossamer && npm install && npm run build
node dist/cli.js new my-site
cd my-site
node ../dist/cli.js build
node ../dist/cli.js serve
```

## Links

- [About](about.html) -- Learn more about this example
- [Posts](posts/) -- Blog posts with dates

[^1]: Footnotes appear at the bottom of the page automatically.
