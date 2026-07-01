# Deploy Lock

Current approved baseline:

- live site: `https://nataliacorvo.com/`
- canonical repository: `mccorvo/website_natalia`
- site working directory: `natalia-nutrition-site`
- Cloudflare Worker: `nataliacorvo`
- latest verified deploy: `9dda1dc1-d2cb-4223-b89f-de74663a363c`
- baseline sync date: 2026-04-26

Legacy repository warning:

- `mccorvo/nataliacorvo` is not the production source of truth.
- Do not run publication, deployment or article automation from that repository.
- If a local Codex automation points to `mccorvo/nataliacorvo`, keep it paused
  until it is deliberately migrated to this canonical repository.

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
- Run deploy commands from `natalia-nutrition-site`, not from the repository root.
- Required GitHub secrets for deployment are `CLOUDFLARE_ACCOUNT_ID` and
  `CLOUDFLARE_API_TOKEN`.
- `OPENAI_API_KEY` is required only for the weekly trend article publisher. Keep
  the weekly workflow disabled until that secret is intentionally added.
- Never run `tools/build_site.py` for production; it is disabled legacy code.
- If Natalia explicitly asks for a manual live deploy, create clean staging from
  live/current approved files, copy only the approved changed files, run a
  dry-run, then deploy from staging.

Post-change live verification:

1. Check `https://nataliacorvo.com/`, `/blog` and `/sitemap.xml`.
2. Check at least two recently changed article URLs.
3. Check any newly published cover image returns `200` with an image content type.
4. Compare `blog.html` and `sitemap.xml` hashes with the deployed files when the
   change is expected to match the repository exactly.
