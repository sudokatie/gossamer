import { Page } from "./types.js";

export interface SearchConfig {
  baseUrl: string;
  fields?: ("title" | "content" | "description")[];
}

export interface SearchDocument {
  id: string;
  title: string;
  url: string;
  content: string;
  description?: string;
}

export interface SearchIndex {
  version: string;
  documents: SearchDocument[];
  invertedIndex: Record<string, number[]>;
}

/**
 * Tokenize text into searchable terms
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

/**
 * Remove common stop words
 */
const STOP_WORDS = new Set([
  "the",
  "and",
  "but",
  "for",
  "not",
  "you",
  "all",
  "can",
  "had",
  "her",
  "was",
  "one",
  "our",
  "out",
  "are",
  "has",
  "his",
  "how",
  "its",
  "may",
  "new",
  "now",
  "old",
  "see",
  "way",
  "who",
  "did",
  "get",
  "let",
  "say",
  "she",
  "too",
  "use",
  "from",
  "have",
  "that",
  "this",
  "will",
  "with",
  "been",
  "into",
  "more",
  "some",
  "such",
  "than",
  "them",
  "then",
  "what",
  "when",
  "your",
  "also",
  "just",
  "over",
  "only",
  "very",
  "about",
  "which",
  "would",
  "could",
  "their",
  "there",
  "these",
  "other",
  "being",
  "those",
]);

export function removeStopWords(tokens: string[]): string[] {
  return tokens.filter((token) => !STOP_WORDS.has(token));
}

/**
 * Strip HTML tags from content
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Create a search document from a page
 */
export function createSearchDocument(
  page: Page,
  baseUrl: string
): SearchDocument {
  const url = baseUrl.replace(/\/$/, "") + "/" + page.slug;
  const content = stripHtml(page.html);

  return {
    id: page.slug,
    title: page.data.title,
    url,
    content: content.slice(0, 5000), // Limit content size
    description: page.data.description,
  };
}

/**
 * Build inverted index mapping terms to document indices
 */
export function buildInvertedIndex(
  documents: SearchDocument[],
  fields: ("title" | "content" | "description")[]
): Record<string, number[]> {
  const index: Record<string, Set<number>> = {};

  documents.forEach((doc, docIndex) => {
    const allTokens: string[] = [];

    if (fields.includes("title")) {
      allTokens.push(...tokenize(doc.title));
    }
    if (fields.includes("content")) {
      allTokens.push(...tokenize(doc.content));
    }
    if (fields.includes("description") && doc.description) {
      allTokens.push(...tokenize(doc.description));
    }

    const uniqueTokens = removeStopWords([...new Set(allTokens)]);

    for (const token of uniqueTokens) {
      if (!index[token]) {
        index[token] = new Set();
      }
      index[token].add(docIndex);
    }
  });

  // Convert sets to arrays
  const result: Record<string, number[]> = {};
  for (const [term, docSet] of Object.entries(index)) {
    result[term] = [...docSet];
  }
  return result;
}

/**
 * Generate a complete search index from pages
 */
export function generateSearchIndex(
  pages: Page[],
  config: SearchConfig
): SearchIndex {
  const fields = config.fields || ["title", "content", "description"];
  const documents = pages.map((page) =>
    createSearchDocument(page, config.baseUrl)
  );
  const invertedIndex = buildInvertedIndex(documents, fields);

  return {
    version: "1.0",
    documents,
    invertedIndex,
  };
}

/**
 * Generate search index JSON
 */
export function generateSearchIndexJson(
  pages: Page[],
  config: SearchConfig
): string {
  const index = generateSearchIndex(pages, config);
  return JSON.stringify(index);
}

/**
 * Generate a minimal search UI script
 */
export function generateSearchScript(): string {
  return `
(function() {
  let searchIndex = null;

  async function loadIndex() {
    if (searchIndex) return searchIndex;
    const response = await fetch('/search-index.json');
    searchIndex = await response.json();
    return searchIndex;
  }

  function tokenize(text) {
    return text.toLowerCase()
      .replace(/[^\\w\\s]/g, ' ')
      .split(/\\s+/)
      .filter(t => t.length > 2);
  }

  async function search(query) {
    const index = await loadIndex();
    const tokens = tokenize(query);
    if (tokens.length === 0) return [];

    const scores = new Map();
    
    for (const token of tokens) {
      const matches = index.invertedIndex[token] || [];
      for (const docIdx of matches) {
        scores.set(docIdx, (scores.get(docIdx) || 0) + 1);
      }
    }

    const results = [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([idx]) => index.documents[idx]);

    return results;
  }

  function renderResults(results, container) {
    if (results.length === 0) {
      container.innerHTML = '<p class="search-no-results">No results found</p>';
      return;
    }
    container.innerHTML = results.map(doc => 
      '<div class="search-result">' +
        '<a href="' + doc.url + '">' + doc.title + '</a>' +
        (doc.description ? '<p>' + doc.description + '</p>' : '') +
      '</div>'
    ).join('');
  }

  function init() {
    const form = document.querySelector('[data-search-form]');
    const input = document.querySelector('[data-search-input]');
    const results = document.querySelector('[data-search-results]');

    if (!form || !input || !results) return;

    let debounce = null;
    input.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(async () => {
        const query = input.value.trim();
        if (query.length < 2) {
          results.innerHTML = '';
          return;
        }
        const matches = await search(query);
        renderResults(matches, results);
      }, 200);
    });

    form.addEventListener('submit', (e) => e.preventDefault());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`.trim();
}

/**
 * Generate search page HTML
 */
export function generateSearchPage(title: string = "Search"): string {
  return `---
title: ${title}
---

<form data-search-form>
  <input type="search" data-search-input placeholder="Search..." aria-label="Search">
</form>

<div data-search-results></div>

<script src="/search.js"></script>
`;
}
