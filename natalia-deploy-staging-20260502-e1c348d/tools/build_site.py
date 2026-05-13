"""Disabled legacy generator.

The live website at https://nataliacorvo.com/ is the approved baseline for
protected pages and shared assets. This old generator is intentionally disabled
because running it could overwrite current live-approved HTML/CSS/JS with stale
versions.

For future changes, edit the approved files directly from a clean worktree,
compare protected surfaces against live when needed, and deploy only from clean
staging with the explicitly approved files.
"""

from __future__ import annotations


def main() -> None:
    raise SystemExit(
        "tools/build_site.py is disabled. Use the current live/origin-main "
        "baseline and the controlled workflow in AGENTS.md and DEPLOY_LOCK.md."
    )


if __name__ == "__main__":
    main()
