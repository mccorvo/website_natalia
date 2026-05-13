# Deploy Lock

Current approved baseline:

- live site: `https://nataliacorvo.com/`
- latest verified deploy: `9dda1dc1-d2cb-4223-b89f-de74663a363c`
- baseline sync date: 2026-04-26

The live site and the synced `origin/main` commit are the baseline for every
future modification. If a protected page or shared asset differs between local
files and live, compare with live first and treat live as authoritative unless
Natalia explicitly approves a different source.

Protected surfaces:

- `index.html`
- `book.html`
- `blog.html`
- `autotest.html`
- `articles/`
- `children-eating-difficulties/index.html`
- `testimonials/`
- `css/styles.css`
- `css/autotest.css`
- `css/children-eating-difficulties.css`
- `js/main.js`
- `js/autotest.js`
- `js/autotest-config.mjs`
- `js/children-eating-difficulties.js`
- homepage, book, blog and testimonial images

Required workflow:

1. Start from latest `origin/main` in a clean worktree.
2. Inspect `git status --short`.
3. For protected surfaces, fetch/compare current live before editing.
4. Keep the diff limited to the approved files.
5. Run `npm run typecheck`, `npm run lint` and `npm run build`.
6. Show the changed file list before pushing.
7. Push only after explicit approval.

Deployment rules:

- Never deploy from a dirty repo root.
- Never run `tools/build_site.py` for production; it is disabled legacy code.
- If Natalia explicitly asks for a manual live deploy, create clean staging from
  live/current approved files, copy only the approved changed files, run a
  dry-run, then deploy from staging.
