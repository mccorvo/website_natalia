# Codex package — Natalia Corvo additional articles 25–34

Generated: 2026-04-26

## Scope

This package contains 10 new bilingual Polish/English nutrition articles for `nataliacorvo.com`, designed as the next batch after the existing 24-article source package.

## What is included

- `articles/` — 10 standalone Codex-ready Markdown source files.
- `ARTICLE_MANIFEST_25_34.md` — publishing queue and slugs.
- `article_manifest.csv` — machine-readable manifest.
- `article_index.json` — full metadata and source object.
- `ALL_ARTICLES_25_34_COMBINED.md` — all articles in one Markdown file.
- `snippets/BLOG_CARDS_25_34.html` — blog archive cards.
- `images/COVER_IMAGE_PLAN.md`, `images/cover_image_plan.csv`, `images/cover_image_prompts.json` — AI image prompts, alt text and stock fallback links.

## Implementation rules

- Publish each article at `/articles/{slug}`.
- Keep one bilingual page per article: Polish first, English second.
- Use the supplied `cover_image` path and generate/export the image as WebP.
- Use source URLs as visible links in the rendered article.
- Keep the safety note visible.
- Do not render the JSON-LD and blog-card snippets as body text; use them as implementation inputs.

## Image handling

For each article, the package provides a primary AI generation prompt and a stock-photo fallback search URL. The recommended image filename is `/images/blog/{slug}-cover.webp`.