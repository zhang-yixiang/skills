import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { parseNumstat } from "./file-growth-report.mjs";

const scriptPath = fileURLToPath(new URL("./file-growth-report.mjs", import.meta.url));
const skillDir = fileURLToPath(new URL("../", import.meta.url));

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function commitTree(cwd, tree, parents, message) {
  const args = ["commit-tree", tree];
  for (const parent of parents) args.push("-p", parent);
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    input: `${message}\n`,
  }).trim();
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

test("runs the CLI through a symlinked skill directory", () => {
  const linkedRoot = mkdtempSync(join(tmpdir(), "linked-code-review-"));
  const linkedSkillDir = join(linkedRoot, "code-review");
  symlinkSync(skillDir, linkedSkillDir, "dir");

  const result = spawnSync(
    process.execPath,
    [join(linkedSkillDir, "scripts", "file-growth-report.mjs"), "--help"],
    { encoding: "utf8" },
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: node file-growth-report\.mjs/);
});

test("reports an exact selected head instead of silently using current HEAD", () => {
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
  const selectedHead = git(cwd, ["rev-parse", "HEAD"]);

  writeFileSync(join(cwd, "later.ts"), "not in selected head\n");
  git(cwd, ["add", "."]);
  git(cwd, ["commit", "-qm", "later"]);

  const report = runReport(cwd, [base, "--head", selectedHead]);
  const byPath = new Map(report.files.map((file) => [file.path, file]));

  assert.equal(report.formatVersion, 2);
  assert.equal(report.target, "committed");
  assert.equal(report.resolved.baseSha, base);
  assert.equal(report.resolved.headSha, selectedHead);
  assert.equal(report.resolved.mergeBaseSha, base);
  assert.deepEqual(report.paths.committed.sort(), [
    "focused.ts",
    "large.ts",
    "renamed.ts",
  ]);
  assert.equal(byPath.get("large.ts").added, 5);
  assert.equal(byPath.get("large.ts").total, 705);
  assert.equal(byPath.get("focused.ts").added, 100);
  assert.equal(byPath.get("focused.ts").total, 101);
  assert.equal(byPath.get("renamed.ts").status, "R");
  assert.equal(byPath.get("renamed.ts").oldPath, "old.ts");
  assert.equal(byPath.has("later.ts"), false);
});

test("partitions committed, staged, unstaged, and untracked paths without mutating Git state", () => {
  const cwd = createRepo();
  writeFileSync(join(cwd, "committed.ts"), "base\n");
  writeFileSync(join(cwd, "staged.ts"), "base\n");
  writeFileSync(join(cwd, "unstaged.ts"), "base\n");
  git(cwd, ["add", "."]);
  git(cwd, ["commit", "-qm", "base"]);
  const base = git(cwd, ["rev-parse", "HEAD"]);

  writeFileSync(join(cwd, "committed.ts"), "base\ncommitted\n");
  git(cwd, ["add", "."]);
  git(cwd, ["commit", "-qm", "committed"]);

  writeFileSync(join(cwd, "staged.ts"), "base\nstaged\n");
  git(cwd, ["add", "staged.ts"]);
  writeFileSync(join(cwd, "unstaged.ts"), "base\nunstaged\n");
  writeFileSync(join(cwd, "untracked.ts"), "one\ntwo\nthree\n");
  const statusBefore = git(cwd, ["status", "--porcelain=v1", "-z"]);

  const committedReport = runReport(cwd, [base]);
  assert.deepEqual(committedReport.paths, {
    committed: ["committed.ts"],
    staged: ["staged.ts"],
    unstaged: ["unstaged.ts"],
    untracked: ["untracked.ts"],
  });
  assert.deepEqual(
    committedReport.files.map((file) => file.path),
    ["committed.ts"],
  );

  const worktreeReport = runReport(cwd, [base, "--worktree"]);
  const byPath = new Map(worktreeReport.files.map((file) => [file.path, file]));

  assert.equal(
    worktreeReport.target,
    "committed + staged + unstaged + untracked",
  );
  assert.equal(byPath.get("committed.ts").added, 1);
  assert.equal(byPath.get("staged.ts").added, 1);
  assert.equal(byPath.get("unstaged.ts").added, 1);
  assert.equal(byPath.get("untracked.ts").added, 3);
  assert.equal(byPath.get("untracked.ts").status, "A");
  assert.equal(byPath.get("untracked.ts").untracked, true);
  assert.equal(git(cwd, ["status", "--porcelain=v1", "-z"]), statusBefore);
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
  assert.match(
    result.stderr,
    /fixed point does not resolve to a commit: missing-ref/,
  );
});

test("rejects a fixed-point ref that is not a commit", () => {
  const cwd = createRepo();
  writeFileSync(join(cwd, "file.ts"), "content\n");
  git(cwd, ["add", "."]);
  git(cwd, ["commit", "-qm", "base"]);
  const blob = git(cwd, ["hash-object", "-w", "file.ts"]);
  git(cwd, ["update-ref", "refs/tags/blob-ref", blob]);

  const result = spawnSync(process.execPath, [scriptPath, "blob-ref"], {
    cwd,
    encoding: "utf8",
  });

  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /fixed point does not resolve to a commit: blob-ref/,
  );
});

test("rejects an ambiguous fixed-point ref", () => {
  const cwd = createRepo();
  writeFileSync(join(cwd, "file.ts"), "base\n");
  git(cwd, ["add", "."]);
  git(cwd, ["commit", "-qm", "base"]);
  const base = git(cwd, ["rev-parse", "HEAD"]);

  writeFileSync(join(cwd, "file.ts"), "next\n");
  git(cwd, ["add", "."]);
  git(cwd, ["commit", "-qm", "next"]);
  git(cwd, ["branch", "collision", base]);
  git(cwd, ["tag", "collision", "HEAD"]);

  const result = spawnSync(process.execPath, [scriptPath, "collision"], {
    cwd,
    encoding: "utf8",
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /fixed point is ambiguous: collision/);
});

test("rejects --worktree when --head is not current HEAD", () => {
  const cwd = createRepo();
  writeFileSync(join(cwd, "file.ts"), "base\n");
  git(cwd, ["add", "."]);
  git(cwd, ["commit", "-qm", "base"]);
  const base = git(cwd, ["rev-parse", "HEAD"]);

  writeFileSync(join(cwd, "file.ts"), "next\n");
  git(cwd, ["add", "."]);
  git(cwd, ["commit", "-qm", "next"]);

  const result = spawnSync(
    process.execPath,
    [scriptPath, base, "--head", base, "--worktree"],
    { cwd, encoding: "utf8" },
  );

  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /--worktree requires --head to resolve to current HEAD/,
  );
});

test("rejects histories with no merge base", () => {
  const cwd = createRepo();
  writeFileSync(join(cwd, "file.ts"), "base\n");
  git(cwd, ["add", "."]);
  git(cwd, ["commit", "-qm", "base"]);
  const tree = git(cwd, ["rev-parse", "HEAD^{tree}"]);
  const orphan = commitTree(cwd, tree, [], "orphan");

  const result = spawnSync(process.execPath, [scriptPath, orphan], {
    cwd,
    encoding: "utf8",
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /fixed point and head have no merge base/);
});

test("rejects histories with multiple merge bases", () => {
  const cwd = createRepo();
  writeFileSync(join(cwd, "file.ts"), "base\n");
  git(cwd, ["add", "."]);
  git(cwd, ["commit", "-qm", "base"]);
  const base = git(cwd, ["rev-parse", "HEAD"]);
  const tree = git(cwd, ["rev-parse", "HEAD^{tree}"]);
  const leftParent = commitTree(cwd, tree, [base], "left parent");
  const rightParent = commitTree(cwd, tree, [base], "right parent");
  const leftTip = commitTree(
    cwd,
    tree,
    [leftParent, rightParent],
    "left tip",
  );
  const rightTip = commitTree(
    cwd,
    tree,
    [rightParent, leftParent],
    "right tip",
  );

  const result = spawnSync(
    process.execPath,
    [scriptPath, leftTip, "--head", rightTip],
    { cwd, encoding: "utf8" },
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /fixed point and head have multiple merge bases/);
});
