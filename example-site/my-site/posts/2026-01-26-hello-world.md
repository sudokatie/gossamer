---
title: Hello World
date: 2026-01-26
---

# Hello World

This is the first post on the example site.

Gossamer automatically detects posts in the `posts/` directory and sorts them by date. The date can come from:

1. The `date` field in front matter
2. The filename (YYYY-MM-DD prefix)

## Code Highlighting

Gossamer passes through fenced code blocks:

```javascript
const gossamer = require('gossamer');
gossamer.build({ source: '.', output: '_site' });
```

## Tables (GFM)

| Feature | Supported |
|---------|-----------|
| Markdown | Yes |
| Front matter | Yes |
| Posts | Yes |
| Layouts | Yes |
| Dev server | Yes |
