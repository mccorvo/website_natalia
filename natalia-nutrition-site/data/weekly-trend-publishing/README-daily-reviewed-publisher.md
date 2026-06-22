# Daily Reviewed Nutrition Publisher

This automation publishes at most one article per Europe/Dublin day from the explicit 40-slug queue in `automation-state.json`.

## Where It Lives

- Workflow: `.github/workflows/daily-reviewed-nutrition-publisher.yml`
- CLI: `tools/publish_reviewed_daily_article.mjs`
- Testable gate logic: `tools/lib/reviewed_daily_publisher.mjs`
- State: `data/weekly-trend-publishing/automation-state.json`
- Draft source branch: `origin/codex/draft-50-more-polish-nutrition-articles`
- Draft package root: `natalia-nutrition-site/data/weekly-trend-publishing/drafts/2026-06/`

The workflow runs at `0 8,9 * * *` UTC. The double UTC schedule is deliberate: the script itself only publishes at 09:00 Europe/Dublin, so daylight saving changes do not move the local publishing time.

## State And Queue

`automation-state.json` contains the only eligible queue. Draft-branch slugs outside that queue, the first 10 already published manually, `_remediation/`, checkpoints and unpublished draft folders are excluded.

Each run records:

- next queued slug;
- published slugs and URLs;
- blocked slugs and reasons;
- local attempt date;
- image source, license, attribution and alt text;
- editorial review result;
- publication commit when a live article is committed.

## Dry Run

Run from `natalia-nutrition-site`:

```bash
npm run reviewed-daily:dry-run
```

Force a queued slug through the same dry-run gates:

```bash
node tools/publish_reviewed_daily_article.mjs --dry-run --force-slug=straczki-bez-wzdec
```

Dry-run never writes public files or state. It reports whether the selected slug would proceed to editorial review or be blocked.

## Publish, Force, And Skip

Scheduled publish:

```bash
npm run reviewed-daily:publish
```

Manual force, still with all safety gates:

```bash
node tools/publish_reviewed_daily_article.mjs --publish --force-slug=straczki-bez-wzdec --ignore-time
```

Manual skip/block:

```bash
node tools/publish_reviewed_daily_article.mjs --skip-slug=straczki-bez-wzdec --reason="Needs human editorial rewrite before publication."
```

The script refuses to publish from a dirty worktree and refuses draft, remediation, checkpoint, cache, log, lockfile or temporary files in the runtime diff.

## Editorial Gate

Real publish mode requires an `OPENAI_API_KEY` so the script can run a final editorial review. If the review cannot run, or if it returns anything other than `pass`, the slug is marked `blocked_needs_editorial_revision`.

The deterministic gate also checks:

- bilingual PL/EN content completeness;
- real HTTP source URLs;
- topic-specific source confirmation in `qa.md`;
- YMYL safety note;
- no unsupported cure, medication-change or guarantee language;
- no duplicate/reused image source;
- non-generic PL/EN alt text;
- license and attribution for external images;
- no shared fallback image, watermark, logo or recognizable-person dependency.

## Image Gate

The publisher copies only the slug-specific `cover.jpg` from the draft package into `assets/images/blog/{slug}-cover.jpg` after all gates pass. It does not reuse existing live image source URLs, does not accept generic draft alt text, and records image provenance in state.

If the image is not strong enough, the article is not published. The current dry-run behavior may block early drafts whose image metadata still says “cover image for draft”; that is intentional.
