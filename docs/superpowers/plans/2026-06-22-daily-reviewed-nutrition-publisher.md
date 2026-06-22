# Daily Reviewed Nutrition Publisher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a daily 09:00 Europe/Dublin automation that attempts exactly one reviewed PL/EN nutrition article from the explicit 40-slug queue and blocks unsafe or weak entries instead of publishing them.

**Architecture:** Add a conservative Node publisher under `natalia-nutrition-site/tools/` with pure testable helpers for queue/state/QA/diff safety and a CLI for dry-run, publish, force, and skip operations. Add persistent JSON state in `natalia-nutrition-site/data/weekly-trend-publishing/automation-state.json` and a GitHub Actions schedule that runs at both DST-safe UTC hours, lets the script gate to 09:00 Europe/Dublin, commits only reviewed state/page/image changes, tests before deploy, and deploys only after a successful publication.

**Tech Stack:** Node ESM, `node:test`, static HTML files, GitHub Actions, Wrangler deploy.

---

## File Structure

- Create `natalia-nutrition-site/tools/lib/reviewed_daily_publisher.mjs`: queue constants, state validation, next-slug selection, editorial/image gate evaluation, safe file/path checks, and small rendering helpers.
- Create `natalia-nutrition-site/tools/publish_reviewed_daily_article.mjs`: CLI wrapper around the library for `--dry-run`, `--publish`, `--force-slug`, `--skip-slug`, and `--reason`.
- Create `natalia-nutrition-site/tools/reviewed_daily_publisher.test.mjs`: TDD coverage for the required dry-run/safety behaviors.
- Create `natalia-nutrition-site/data/weekly-trend-publishing/automation-state.json`: initial state with exactly the 40 requested slugs and next run `2026-06-23T09:00:00+01:00`.
- Create `natalia-nutrition-site/data/weekly-trend-publishing/README-daily-reviewed-publisher.md`: operator notes for state, dry-run, force, skip, image gates, and blocked statuses.
- Create `.github/workflows/daily-reviewed-nutrition-publisher.yml`: DST-safe scheduled job at `0 8,9 * * *`.
- Modify `natalia-nutrition-site/package.json`: add typecheck/test coverage for the new files and a documented dry-run script.

### Task 1: Queue And Safety Tests

**Files:**
- Create: `natalia-nutrition-site/tools/reviewed_daily_publisher.test.mjs`
- Create: `natalia-nutrition-site/tools/lib/reviewed_daily_publisher.mjs`
- Modify: `natalia-nutrition-site/package.json`

- [ ] **Step 1: Write failing tests**

```js
import assert from "node:assert/strict";
import test from "node:test";

import {
  REVIEWED_DAILY_QUEUE,
  assertSafeChangedFiles,
  evaluateDraftGates,
  selectNextQueueItem,
} from "./lib/reviewed_daily_publisher.mjs";

test("reviewed queue contains exactly the remaining 40 slugs and starts after the manual 10", () => {
  assert.equal(REVIEWED_DAILY_QUEUE.length, 40);
  assert.equal(REVIEWED_DAILY_QUEUE[0], "straczki-bez-wzdec");
  assert.equal(REVIEWED_DAILY_QUEUE.at(-1), "zamienniki-slodyczy-bez-obsesji");
  assert.throws(() => selectNextQueueItem({ queue: REVIEWED_DAILY_QUEUE, published: [], blocked: [], forceSlug: "anemia-w-ciazy-zelazo" }), /not in the reviewed 40-slug queue/);
});
```

- [ ] **Step 2: Verify the tests fail**

Run: `npm run test -- tools/reviewed_daily_publisher.test.mjs`
Expected: FAIL because the test file and exported helpers do not exist yet.

- [ ] **Step 3: Implement minimal helper exports**

Add `REVIEWED_DAILY_QUEUE`, `selectNextQueueItem`, `evaluateDraftGates`, and `assertSafeChangedFiles` in `tools/lib/reviewed_daily_publisher.mjs`. Keep the module free of process exits so tests can assert errors.

- [ ] **Step 4: Verify the new tests pass**

Run: `node --test tools/reviewed_daily_publisher.test.mjs`
Expected: PASS.

### Task 2: Blocking Gate Tests

**Files:**
- Modify: `natalia-nutrition-site/tools/reviewed_daily_publisher.test.mjs`
- Modify: `natalia-nutrition-site/tools/lib/reviewed_daily_publisher.mjs`

- [ ] **Step 1: Add failing tests for editorial/image/daily gates**

```js
test("content QA failure blocks instead of publishing", () => {
  const result = evaluateDraftGates({ article: { sources: [], content: {} }, qaText: "", usedImageSources: new Set() });
  assert.equal(result.status, "blocked_needs_editorial_revision");
  assert.match(result.reasons.join("\\n"), /source/i);
});

test("image QA rejects reused or generic covers", () => {
  const article = { image: { source_url: "https://commons.wikimedia.org/wiki/File:Used.jpg", alt_pl: "Cover image for draft", alt_en: "Cover image for draft" }, sources: [{ url: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet" }], content: { pl: { sections: [["A", "B"]] }, en: { sections: [["A", "B"]] } } };
  const result = evaluateDraftGates({ article, qaText: "Shared NCI fallback image: not used.", usedImageSources: new Set(["https://commons.wikimedia.org/wiki/File:Used.jpg"]) });
  assert.equal(result.status, "blocked_needs_editorial_revision");
  assert.match(result.reasons.join("\\n"), /image/i);
});
```

- [ ] **Step 2: Verify the tests fail**

Run: `node --test tools/reviewed_daily_publisher.test.mjs`
Expected: FAIL because `evaluateDraftGates` is still too permissive.

- [ ] **Step 3: Implement the deterministic gates**

Require PL and EN content, meaningful sections, real source URLs, a safety note, no detox/cure/guarantee claims, topic-specific QA text, a unique image source, non-generic handwritten alt text, no shared fallback, no watermark/logo/person language, and no `_remediation` or checkpoint paths.

- [ ] **Step 4: Verify tests pass**

Run: `node --test tools/reviewed_daily_publisher.test.mjs`
Expected: PASS.

### Task 3: CLI, State, And Workflow

**Files:**
- Create: `natalia-nutrition-site/tools/publish_reviewed_daily_article.mjs`
- Create: `natalia-nutrition-site/data/weekly-trend-publishing/automation-state.json`
- Create: `.github/workflows/daily-reviewed-nutrition-publisher.yml`
- Modify: `natalia-nutrition-site/package.json`

- [ ] **Step 1: Write failing CLI dry-run test**

Add a test that calls the library with an initial state and asserts `dryRun` returns the next slug without writing public files.

- [ ] **Step 2: Verify test fails**

Run: `node --test tools/reviewed_daily_publisher.test.mjs`
Expected: FAIL because the dry-run runner is not implemented.

- [ ] **Step 3: Implement CLI and initial state**

The CLI must support:

```bash
node tools/publish_reviewed_daily_article.mjs --dry-run
node tools/publish_reviewed_daily_article.mjs --publish
node tools/publish_reviewed_daily_article.mjs --dry-run --force-slug=straczki-bez-wzdec
node tools/publish_reviewed_daily_article.mjs --skip-slug=straczki-bez-wzdec --reason="Needs human editorial rewrite"
```

The initial state must contain the 40-slug queue, empty `published`, empty `blocked`, `next_slug: "straczki-bez-wzdec"`, and `next_run_scheduled_for: "2026-06-23T09:00:00+01:00"`.

- [ ] **Step 4: Add GitHub Actions schedule**

Use `0 8,9 * * *`, fetch the draft branch, run the publisher, run `npm run typecheck`, `npm run test`, `npm run lint`, `npm run build`, commit only if the publisher changed files, push the branch, and run `npm run deploy` only when an article was actually published.

### Task 4: Docs And Final Verification

**Files:**
- Create: `natalia-nutrition-site/data/weekly-trend-publishing/README-daily-reviewed-publisher.md`

- [ ] **Step 1: Document operation**

Document where the automation lives, how to view state, how to dry-run, force, skip, image provenance requirements, blocked statuses, and why the workflow runs twice in UTC.

- [ ] **Step 2: Run final checks**

Run:

```bash
npm run typecheck
npm run test
npm run lint
npm run build
npm run prepublish-check
```

Expected: PASS after the implementation commit exists. `prepublish-check` may fail before committing because it requires at least one commit ahead of `origin/main`.
