# CODEX publishing instructions — Natalia Corvo / Natural Healing blog

Generated: 2026-04-26

## Scope

Use this package to publish the **new articles only**. The first 10 articles already live on the site must be treated as final. Do not rewrite, rename or move those existing URLs unless a separate task explicitly asks for it.

Publish one article at a time, using the corresponding file in `articles/`. Each article file contains:

- normalized YAML frontmatter;
- Polish title and English title;
- Polish article body first;
- English article body second;
- FAQ;
- safety note;
- source URLs;
- suggested JSON-LD;
- suggested blog-card snippet.

## Site architecture to preserve

Use the current site pattern:

- one bilingual page per article;
- canonical URL: `https://nataliacorvo.com/articles/{slug}`;
- Polish first, English second;
- no `/pl/`, `/en/`, `/it/`, `/blog/pl/`, `/blog/en/` article URLs;
- no Italian content;
- blog archive cards link to `/articles/{slug}`.

Do not create language-split versions unless a later project decision introduces full reciprocal `hreflang`.

## Critical non-cannibalization rule

Do **not** publish the old draft `dieta-dash-nadcisnienie`.

The live blog already has a DASH article. This package replaces the old draft with:

`dieta-przy-nadcisnieniu-sol-potas-alkohol`

That article targets the broader query cluster around diet for hypertension, hidden salt, potassium, alcohol and daily food choices. It may mention DASH as a supporting model, but its H1, meta title, slug and intro must not target `dieta DASH` as the primary query.

## Implementation flow per article

For each article, do the following in a single small commit:

1. Open the relevant file in `articles/NN_slug.md`.
2. Create a static article page using the same visual template as the existing live articles.
3. Preserve the slug, canonical URL, title, metadata, source URLs, safety note and PL/EN order.
4. Add the article card to the blog archive using the supplied card snippet or equivalent site component.
5. Add 2–4 contextual internal links inside the article body where natural.
6. Add the article to any sitemap/index mechanism used by the site.
7. Run the project build and fix broken links or template errors.
8. Check the rendered HTML source for canonical, meta description and JSON-LD.
9. Do not batch-publish multiple articles in one commit unless explicitly requested.

## Article page requirements

Each article page must include:

- one visible combined H1 containing the PL title and EN title, matching the current site style;
- `Published` and `Updated` dates;
- quick takeaways if the page template supports them;
- PL section with clear H2 headings;
- EN section with clear H2 headings;
- FAQ section;
- educational safety note;
- sources/further reading;
- CTA block to booking page;
- `Read also / Czytaj także` links.

## Metadata requirements

For each page:

- `<title>` should use `meta_title_pl` or a combined PL/EN title that remains concise.
- `<meta name="description">` should use `meta_description_pl` as the primary description.
- canonical must equal `https://nataliacorvo.com/articles/{slug}`.
- Open Graph and Twitter metadata should use the same canonical URL and meta description.
- Use one relevant cover image with descriptive PL alt text.

Recommended image naming:

`/images/blog/{slug}-cover.webp`

Recommended alt format:

`{short PL description of the food/clinical topic}`

Do not use empty alt text unless the image is purely decorative.

## Structured data for SEO and AI crawling

Each page should include JSON-LD. Minimum:

- `BlogPosting`
- `FAQPage` when FAQ is rendered on the page

For clinical/patient-intent articles, also add `MedicalWebPage` if the existing site schema approach can support it without breaking validation. The suggested JSON-LD block inside each article file may be used as a starting point.

The JSON-LD should include:

- `@context`
- `@type`
- `headline`
- `description`
- `url`
- `mainEntityOfPage`
- `inLanguage: ["pl-PL", "en-GB"]`
- `author: Natalia Wcisło`
- `publisher: Natural Healing`
- `datePublished`
- `dateModified`
- FAQ questions and answers where present.

## AI crawling and answer-engine readiness

Make the rendered page easy for crawlers and answer engines to parse:

- render article text in server/static HTML, not only client-side JavaScript;
- use semantic headings in order;
- keep FAQ text visible on the page, not hidden behind inaccessible accordions;
- keep source URLs as crawlable anchor tags;
- do not block article pages in `robots.txt`;
- do not add `noindex`;
- avoid generic anchor text such as only “click here”;
- include concise answer-first paragraphs near the top;
- make red flags and safety boundaries explicit;
- preserve PL and EN text as normal readable text, not as images.

## YMYL safety rules

These are nutrition and health-related pages. Do not overclaim.

Use safe wording:

- “może wspierać” / “may support”;
- “warto omówić z lekarzem” / “discuss with a clinician”;
- “nie zastępuje diagnozy, leczenia ani zmiany leków” / “does not replace diagnosis, treatment or medication changes”.

Never write:

- that diet cures Hashimoto, PCOS, diabetes, CKD, IBD, endometriosis or any other disease;
- that supplements replace medication;
- that readers should stop medication;
- absolute food bans unless clinically correct, such as strict gluten-free diet in confirmed celiac disease;
- one universal diet for all patients with CKD, IBD, stones or pregnancy-related conditions.

## Internal linking rules

Use internal links to strengthen topical clusters, but do not force them.

Recommended high-value hubs already live:

- healthy plate hub: `/articles/talerz-zdrowego-zywienia`
- healthy weight management: `/articles/odchudzanie-bez-efektu-jojo`
- Mediterranean diet: `/articles/dieta-srodziemnomorska-praktyka`
- DASH: `/articles/dieta-dash-cisnienie-serce`
- gluten-free general: `/articles/dieta-bezglutenowa-kiedy-potrzebna`
- vegan diet: `/articles/dieta-weganska-zbilansowana`
- intermittent fasting: `/articles/post-przerywany-dla-kogo`
- insulin resistance: `/articles/insulinoopornosc-dieta-nawyki`
- anti-inflammatory diet: `/articles/dieta-przeciwzapalna-fakty`
- gut/microbiota: `/articles/jelita-mikrobiota-trawienie`
- protein: `/articles/bialko-w-diecie`
- breakfast: `/articles/zdrowe-sniadania-proste-pomysly`
- meal planning: `/articles/planowanie-posilkow-brak-czasu`
- booking page: `/umow-wizyte` or the current booking route used by the site.

If any listed live URL is named differently in the codebase, use the actual existing route and keep the article source unchanged.

## QA checklist before marking an article complete

- [ ] Article URL resolves at `/articles/{slug}`.
- [ ] Blog archive card appears and links correctly.
- [ ] Canonical URL is correct.
- [ ] No Italian content is present.
- [ ] No old `/blog/pl`, `/blog/en`, `/blog/it` canonical remains.
- [ ] Author is `Natalia Wcisło`; publisher is `Natural Healing`.
- [ ] Safety note is visible.
- [ ] Sources are visible and clickable.
- [ ] JSON-LD validates syntactically.
- [ ] No duplicate H1s beyond the intended bilingual current-site style.
- [ ] Internal links are relevant and not broken.
- [ ] Article is not `noindex`.
- [ ] Build passes.

## Publication order

Use `ARTICLE_MANIFEST.md` or `article_index.json`. The recommended order is already encoded in the `order` field.
