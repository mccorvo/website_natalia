# Article source contract

Codex should treat every file in `articles/` as a structured source, not as raw HTML.

Required frontmatter keys:

- `slug`
- `canonical_url`
- `datePublished`
- `dateModified`
- `language_mode`
- `inLanguage`
- `author`
- `publisher`
- `category_pl`
- `category_en`
- `title_pl`
- `title_en`
- `meta_title_pl`
- `meta_title_en`
- `meta_description_pl`
- `meta_description_en`
- `internal_links`
- `read_also`

Required rendered blocks:

1. H1/title block with PL and EN titles.
2. Published/updated line.
3. PL content.
4. EN content.
5. FAQ.
6. Safety note.
7. Sources.
8. Read also.
9. CTA to booking.

Do not render the `JSON-LD suggested block` or `Blog card suggested snippet` as visible article content. Use them as implementation inputs.
