import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { parseNumstat } from "./file-growth-report.mjs";

const scriptPath = fileURLToPath(new URL("./file-growth-report.mjs", import.meta.url));

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function createRepo() {
  const cwd = mkdtempSync(join(tmpdir(), "file-growth-report-"));
  git(cwd, ["init", "-q"]);
  git(cwd, ["config", "user.email", "test@example.com"]);
  git(cwd, ["config", "user.name", "Test User"]);
  return cwd;
}

function lines(count, prefix) {
  return Array.from({ length: count }, (_, index) => `${prefix}-${index + 1}`).join("\n") + "\n";
}

function runReport(cwd, args) {
  return JSON.parse(execFileSync(process.execPath, [scriptPath, ...args, "--json"], { cwd, encoding: "utf8" }));
}

test("parseNumstat handles ordinary, renamed, and binary entries", () => {
  const buffer = Buffer.from(
    [
      "3\t1\tsrc/file.ts",
      "1\t0\t",
      "old.ts",
      "new.ts",
      "-\t-\timage.png",
      "",
    ].join("\0"),
  );

  assert.deepEqual(parseNumstat(buffer), [
    { path: "src/file.ts", oldPath: null, added: 3, deleted: 1, binary: false },
    { path: "new.ts", oldPath: "old.ts", added: 1, deleted: 0, binary: false },
    { path: "image.png", oldPath: null, added: null, deleted: null, binary: true },
  ]);
});

test("reports both concentrated additions and already-large changed files at HEAD", () => {
  const cwd = createRepo();
  writeFileSync(join(cwd, "large.ts"), lines(700, "large"));
  writeFileSync(join(cwd, "focused.ts"), "export {};\n");
  writeFileSync(join(cwd, "old.ts"), "old\n");
  git(cwd, ["add", "."]);
  git(cwd, ["commit", "-qm", "base"]);
  const base = git(cwd, ["rev-parse", "HEAD"]);

  writeFileSync(join(cwd, "large.ts"), readFileSync(join(cwd, "large.ts"), "utf8") + lines(5, "more"));
  writeFileSync(join(cwd, "focused.ts"), readFileSync(join(cwd, "focused.ts"), "utf8") + lines(100, "focused"));
  git(cwd, ["mv", "old.ts", "renamed.ts"]);
  writeFileSync(join(cwd, "renamed.ts"), "old\nnew\n");
  git(cwd, ["add", "."]);
  git(cwd, ["commit", "-qm", "change"]);

  const report = runReport(cwd, [base]);
  const byPath = new Map(report.files.map((file) => [file.path, file]));

  assert.equal(report.target, "HEAD");
  assert.equal(report.mergeBase, base);
  assert.equal(byPath.get("large.ts").added, 5);
  assert.equal(byPath.get("large.ts").total, 705);
  assert.equal(byPath.get("focused.ts").added, 100);
  assert.equal(byPath.get("focused.ts").total, 101);
  assert.equal(byPath.get("renamed.ts").status, "R");
  assert.equal(byPath.get("renamed.ts").oldPath, "old.ts");
});

test("--worktree includes tracked and untracked files", () => {
  const cwd = createRepo();
  writeFileSync(join(cwd, "tracked.ts"), "base\n");
  git(cwd, ["add", "."]);
  git(cwd, ["commit", "-qm", "base"]);
  const base = git(cwd, ["rev-parse", "HEAD"]);

  writeFileSync(join(cwd, "tracked.ts"), "base\nchanged\n");
  writeFileSync(join(cwd, "untracked.ts"), "one\ntwo\nthree\n");

  const report = runReport(cwd, [base, "--worktree"]);
  const byPath = new Map(report.files.map((file) => [file.path, file]));

  assert.equal(report.target, "worktree");
  assert.equal(byPath.get("tracked.ts").added, 1);
  assert.equal(byPath.get("tracked.ts").total, 2);
  assert.equal(byPath.get("untracked.ts").added, 3);
  assert.equal(byPath.get("untracked.ts").status, "A");
  assert.equal(byPath.get("untracked.ts").untracked, true);
});

test("fails clearly when the fixed point does not resolve", () => {
  const cwd = createRepo();
  writeFileSync(join(cwd, "file.ts"), "content\n");
  git(cwd, ["add", "."]);
  git(cwd, ["commit", "-qm", "base"]);

  const result = spawnSync(process.execPath, [scriptPath, "missing-ref"], {
    cwd,
    encoding: "utf8",
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /fixed point does not resolve: missing-ref/);
});
