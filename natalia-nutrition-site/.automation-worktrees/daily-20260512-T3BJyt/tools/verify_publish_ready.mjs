import { execFileSync } from "node:child_process";

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

git(["fetch", "origin", "main", "--prune"]);

const branch = git(["branch", "--show-current"]);
if (!branch) {
  fail("Publish check failed: HEAD is detached. Use a named task branch in an isolated worktree.");
}

if (branch === "main") {
  fail("Publish check failed: do not work or publish directly from the local main branch.");
}

const dirty = git(["status", "--porcelain"]);
if (dirty) {
  fail(`Publish check failed: working tree is not clean.\n${dirty}`);
}

const [behind, ahead] = git(["rev-list", "--left-right", "--count", "origin/main...HEAD"])
  .split(/\s+/)
  .map(Number);

if (behind !== 0) {
  fail(`Publish check failed: branch is behind origin/main by ${behind} commit(s). Rebase/recreate from the latest origin/main.`);
}

if (ahead === 0) {
  fail("Publish check failed: branch has no commits ahead of origin/main.");
}

const files = git(["diff", "--name-status", "origin/main...HEAD"]);
if (!files) {
  fail("Publish check failed: no changed files found against origin/main.");
}

console.log(`Publish check passed on branch ${branch}.`);
console.log(`Commits ahead of origin/main: ${ahead}`);
console.log("Files to publish:");
console.log(files);
