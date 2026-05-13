# Codex Operating Rules

This repository treats the current live website and the synced `origin/main` commit as the only clean baseline.

Current approved baseline:

- live site: `https://nataliacorvo.com/`
- latest approved deploy in this cleanup: `9dda1dc1-d2cb-4223-b89f-de74663a363c`
- baseline sync date: 2026-04-26

If live and local/GitHub ever disagree, fetch and compare live first before touching protected pages.

## Required Workflow

- Always start work from the latest `origin/main` in a clean, isolated worktree.
- Never base commits, pushes, or deploys on the user's local dirty checkout.
- Ignore unrelated local changes outside the isolated worktree.
- Keep each task diff limited to the files needed for that task.
- Treat `tools/build_site.py` as disabled legacy code. Do not regenerate protected pages from it.
- Before pushing, show the exact changed file list from `git diff --name-status origin/main...HEAD`.
- Before pushing, run:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npm run prepublish-check`
- Push only the task commit(s) to `main` after explicit user approval.
- Do not deploy from the repo root if the worktree is dirty.
- For any manual production deploy explicitly requested by the user, build a clean staging directory from live/current approved files, copy only the approved changed files, run a dry-run, then deploy from staging.
- After pushing or deploying, verify the changed live pages/assets on `https://nataliacorvo.com/`.

## Backup Baseline

Earlier known-good online backup from 2026-04-26 is saved on GitHub as:

- branch: `backup/current-online-20260426-0922-ist`
- tag: `backup-current-online-20260426-0922-ist`

Use these only for comparison or recovery, not as a normal working branch.
