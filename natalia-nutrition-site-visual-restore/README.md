# Natural Healing - Natalia Wcisło

Static bilingual website for Natalia Wcisło, a Polish nutrition professional in Dublin.

## Controlled Changes

The live site at `https://nataliacorvo.com/` and the synced `origin/main` commit are the clean baseline for all future work. For Codex or any automated edits, follow `AGENTS.md` and `DEPLOY_LOCK.md` before committing, pushing or deploying.

Current approved live baseline:

- latest verified deploy: `9dda1dc1-d2cb-4223-b89f-de74663a363c`
- baseline sync date: 2026-04-26

Safe workflow:

1. Fetch `origin/main`.
2. Create a fresh isolated worktree from `origin/main`.
3. Make only the files needed for the task.
4. Run `npm run typecheck`, `npm run lint`, `npm run build` and, on task branches, `npm run prepublish-check`.
5. Show `git diff --name-status origin/main...HEAD`.
6. Push to `main` only after explicit approval.

Do not deploy from a dirty root. If a manual production deploy is explicitly requested, create clean staging from live/current approved files, copy only the approved changed files, run a dry-run, then deploy from staging.

Current online backup:

- branch: `backup/current-online-20260426-0922-ist`
- tag: `backup-current-online-20260426-0922-ist`

## Pages

- `index.html` - home page with hero, intro, testimonials area, e-Book teaser and booking form
- `book.html` - coming-soon e-Book landing page
- `blog.html` - blog index with 10 starter articles
- `autotest.html` - non-diagnostic eating pattern self-check
- `children-eating-difficulties/index.html` - interactive parent guide for children's eating difficulties
- `testimonials/` - approved testimonial-style detail pages currently visible on the live site
- `articles/` - dedicated bilingual article pages

## Language

Polish is the default language. The PL / EN dropdown is handled in `js/main.js` and persists the user's choice in `localStorage`. The `/autotest` page also accepts `?lang=pl|en` via `js/autotest.js`; the question data lives in `js/autotest-config.mjs`.

## Photos

Optimized copies live in `assets/images/`:

- `natalia-hero.jpg`
- `natalia-hero-cutout.png`
- `Natalia_Corvo.png`
- `Natalia_Corvo_3.png`
- `depression-food-japan-cover.png`

Original source files are left untouched outside the site folder.
The current e-Book cover can be regenerated with `python3 tools/create_book_cover.py`.

## Placeholders

Do not add or alter testimonials unless the copy and images are explicitly approved.

The e-Book is positioned as `Depresja i jedzenie. Lekcja z Japonii` / `Depression and Food: A Lesson from Japan`. The current cover used by home and book is `assets/images/depression-food-japan-cover.png`.

## Forms

Forms use a `mailto:` fallback to `Dietolozki@gmail.com` and open the visitor's own email app. Visitors should not include highly sensitive medical details in contact forms.

## Eating disorders self-check

The self-check lives in `autotest.html`, with questions and scoring in `js/autotest-config.mjs`, interactions in `js/autotest.js` and page-specific styles in `css/autotest.css`. It is educational and non-diagnostic. Answers are kept in memory only, are not stored in `localStorage`/`sessionStorage`, are not added to URLs and are not sent anywhere.

## Legacy Generator

`tools/build_site.py` is intentionally disabled because the live protected pages are newer than the old generator source. Do not use it for deploys or full-site regeneration.
