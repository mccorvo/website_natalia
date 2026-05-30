# QA for `gestosc-energetyczna-polskich-potraw`

Draft created: 2026-05-31

## Scope

- [x] Created package for selected rank 6 only.
- [x] Used slug from shortlist: `gestosc-energetyczna-polskich-potraw`.
- [x] Created files only under `data/weekly-trend-publishing/drafts/2026-06/gestosc-energetyczna-polskich-potraw/`.
- [x] Did not edit `manifest.json`.
- [x] Did not edit public site files, `articles/`, `assets/images/blog/`, `css/`, `js/`, `blog.html`, `sitemap.xml`, `index.html`, `book.html` or testimonials.
- [x] Did not deploy.
- [x] Did not commit.

## Required files

- [x] `article.json`
- [x] `draft.html`
- [x] `cover.jpg`
- [x] `sources.md`
- [x] `qa.md`

## Language and content

- [x] PL content appears first.
- [x] EN version is complete rather than a summary.
- [x] No Italian article body content added.
- [x] Primary topic matches shortlist rank 6: energy density of Polish meals.
- [x] Draft includes practical Polish-meal examples: soups, bigos, gołąbki, pierogi, kopytka, kotlet, kanapki and breakfasts.
- [x] Draft avoids miracle claims, disease-treatment claims and supplement/medication advice.

## Draft indexing policy

- [x] `draft.html` includes `<meta name="robots" content="noindex, nofollow">`.
- [x] `draft.html` includes `<meta name="googlebot" content="noindex, nofollow">`.
- [x] `draft.html` does not include a canonical link tag.
- [x] `article.json` marks `include_canonical_link` as `false` and `public_url` as `null`.

## YMYL safety

- [x] PL YMYL safety note included.
- [x] EN YMYL safety note included.
- [x] Red flags include chronic illness, medication context, pregnancy/lactation, eating-disorder history, restrictive eating and unintended weight loss.
- [x] Article states that it is educational and not a substitute for diagnosis, treatment or individual consultation.

## Sources and image

- [x] Sources are real URLs and listed in `sources.md`.
- [x] Public-health sources are included: NCEZ, Pacjent.gov.pl, WHO, CDC, EFSA.
- [x] Peer-reviewed/PMC sources are included for energy-density evidence.
- [x] Used `/tmp/natalia-draft-cover.jpg` as `cover.jpg` because it was available.
- [x] Cover image attribution included in `article.json` and `sources.md`.
- [x] Cover attribution identifies Wikimedia Commons public domain image: `Good Food Display - NCI Visuals Online.jpg`.

## Fresh verification performed

- [ ] `jq` validates `article.json`.
- [ ] Required file count verified.
- [ ] Protected files unchanged check reviewed.
- [ ] `draft.html` checked for `noindex,nofollow`.
- [ ] `draft.html` checked for absence of canonical link tag.
