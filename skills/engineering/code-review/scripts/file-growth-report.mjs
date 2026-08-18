#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { lstat, readFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_LIMIT = 12;
const FORMAT_VERSION = 2;
const MAX_BUFFER = 64 * 1024 * 1024;

function usage() {
  return `Usage: node file-growth-report.mjs <fixed-point> [options]

Options:
  --head <ref>     Review an exact head ref (default: HEAD).
  --worktree       Include staged, unstaged, and untracked worktree changes.
  --limit <count>  Rows per ranking (default: ${DEFAULT_LIMIT}).
  --json           Emit machine-readable JSON.
  --help           Show this help.`;
}

function parseArgs(argv) {
  let fixedPoint;
  let head = "HEAD";
  let worktree = false;
  let json = false;
  let limit = DEFAULT_LIMIT;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--worktree") {
      worktree = true;
    } else if (argument === "--head") {
      const value = argv[index + 1];
      if (!value || value.startsWith("-")) {
        throw new Error("--head requires a ref");
      }
      head = value;
      index += 1;
    } else if (argument === "--json") {
      json = true;
    } else if (argument === "--help" || argument === "-h") {
      return { help: true };
    } else if (argument === "--limit") {
      const value = argv[index + 1];
      if (!value || !/^\d+$/.test(value) || Number(value) < 1) {
        throw new Error("--limit must be a positive integer");
      }
      limit = Number(value);
      index += 1;
    } else if (argument.startsWith("-")) {
      throw new Error(`unknown option: ${argument}`);
    } else if (fixedPoint) {
      throw new Error(`unexpected argument: ${argument}`);
    } else {
      fixedPoint = argument;
    }
  }

  if (!fixedPoint) throw new Error("fixed point is required");
  return { fixedPoint, head, worktree, json, limit, help: false };
}

function runGit(args, { cwd, allowFailure = false } = {}) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: null,
    maxBuffer: MAX_BUFFER,
  });

  if (result.error) throw result.error;
  if (result.status !== 0 && !allowFailure) {
    const detail = result.stderr?.toString("utf8").trim();
    throw new Error(detail || `git ${args.join(" ")} failed`);
  }
  return result;
}

function gitText(args, options) {
  return runGit(args, options).stdout.toString("utf8").trim();
}

function splitNul(buffer) {
  const fields = buffer.toString("utf8").split("\0");
  if (fields.at(-1) === "") fields.pop();
  return fields;
}

function sortPaths(paths) {
  return [...paths].sort((left, right) => {
    if (left < right) return -1;
    if (left > right) return 1;
    return 0;
  });
}

function resolveCommit(root, label, ref) {
  const result = runGit(
    [
      "-c",
      "core.warnAmbiguousRefs=true",
      "rev-parse",
      "--verify",
      "--end-of-options",
      `${ref}^{commit}`,
    ],
    { cwd: root, allowFailure: true },
  );
  const stderr = result.stderr?.toString("utf8").trim() ?? "";

  if (result.status !== 0) {
    throw new Error(`${label} does not resolve to a commit: ${ref}`);
  }
  if (/ambiguous/i.test(stderr)) {
    throw new Error(`${label} is ambiguous: ${ref}`);
  }

  const commits = result.stdout
    .toString("utf8")
    .split(/\r?\n/)
    .filter(Boolean);
  if (commits.length !== 1 || !/^[0-9a-f]{40,64}$/.test(commits[0])) {
    throw new Error(`${label} does not resolve to exactly one commit: ${ref}`);
  }
  return commits[0];
}

function resolveMergeBase(root, baseSha, headSha) {
  const result = runGit(["merge-base", "--all", baseSha, headSha], {
    cwd: root,
    allowFailure: true,
  });
  const mergeBases = result.stdout
    .toString("utf8")
    .split(/\r?\n/)
    .filter(Boolean);

  if (result.status !== 0 || mergeBases.length === 0) {
    throw new Error("fixed point and head have no merge base");
  }
  if (mergeBases.length !== 1) {
    throw new Error(
      `fixed point and head have multiple merge bases: ${mergeBases.join(", ")}`,
    );
  }
  return mergeBases[0];
}

function collectDiffPaths(root, revisions) {
  return sortPaths(
    splitNul(
      runGit(
        [
          "diff",
          "--name-only",
          "-z",
          "--find-renames",
          "--no-ext-diff",
          "--no-textconv",
          "--ignore-submodules=none",
          ...revisions,
          "--",
        ],
        { cwd: root },
      ).stdout,
    ),
  );
}

function collectPathLayers(root, mergeBaseSha, headSha, currentHeadSha) {
  return {
    committed: collectDiffPaths(root, [mergeBaseSha, headSha]),
    staged: collectDiffPaths(root, ["--cached", currentHeadSha]),
    unstaged: collectDiffPaths(root, []),
    untracked: sortPaths(
      splitNul(
        runGit(["ls-files", "--others", "--exclude-standard", "-z"], {
          cwd: root,
        }).stdout,
      ),
    ),
  };
}

export function parseNumstat(buffer) {
  const fields = splitNul(buffer);
  const entries = [];

  for (let index = 0; index < fields.length; index += 1) {
    const header = fields[index];
    const firstTab = header.indexOf("\t");
    const secondTab = header.indexOf("\t", firstTab + 1);
    if (firstTab < 0 || secondTab < 0) {
      throw new Error(`unexpected numstat field: ${JSON.stringify(header)}`);
    }

    const addedRaw = header.slice(0, firstTab);
    const deletedRaw = header.slice(firstTab + 1, secondTab);
    let path = header.slice(secondTab + 1);
    let oldPath = null;

    if (path === "") {
      oldPath = fields[index + 1];
      path = fields[index + 2];
      if (oldPath === undefined || path === undefined) {
        throw new Error("incomplete rename entry in numstat output");
      }
      index += 2;
    }

    entries.push({
      path,
      oldPath,
      added: addedRaw === "-" ? null : Number(addedRaw),
      deleted: deletedRaw === "-" ? null : Number(deletedRaw),
      binary: addedRaw === "-" || deletedRaw === "-",
    });
  }

  return entries;
}

function lineCount(buffer) {
  if (buffer.length === 0) return 0;
  let lines = buffer.at(-1) === 10 ? 0 : 1;
  for (const byte of buffer) {
    if (byte === 10) lines += 1;
  }
  return lines;
}

function isBinary(buffer) {
  return buffer.includes(0);
}

function isInside(root, path) {
  const fromRoot = relative(root, path);
  return (
    fromRoot !== ".." &&
    !fromRoot.startsWith(`..${sep}`) &&
    !fromRoot.startsWith(sep)
  );
}

async function readTargetBuffer({ root, path, worktree, headSha }) {
  if (worktree) {
    const absolute = resolve(root, path);
    if (!isInside(root, absolute)) throw new Error(`path leaves repository: ${path}`);
    try {
      const stat = await lstat(absolute);
      if (!stat.isFile()) return null;
      return await readFile(absolute);
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
  }

  const result = runGit(["cat-file", "blob", `${headSha}:${path}`], {
    cwd: root,
    allowFailure: true,
  });
  return result.status === 0 ? result.stdout : null;
}

function existsAtBase(root, mergeBase, path) {
  return (
    runGit(["cat-file", "-e", `${mergeBase}:${path}`], {
      cwd: root,
      allowFailure: true,
    }).status === 0
  );
}

async function collectUntracked(root, paths) {
  const entries = [];

  for (const path of paths) {
    const buffer = await readTargetBuffer({
      root,
      path,
      worktree: true,
      headSha: null,
    });
    if (buffer === null) continue;
    const binary = isBinary(buffer);
    const total = binary ? null : lineCount(buffer);
    entries.push({
      path,
      oldPath: null,
      added: total,
      deleted: binary ? null : 0,
      binary,
      total,
      status: "A",
      untracked: true,
    });
  }

  return entries;
}

async function enrichEntry(entry, { root, mergeBase, headSha, worktree }) {
  const buffer = await readTargetBuffer({
    root,
    path: entry.path,
    worktree,
    headSha,
  });
  const binary = entry.binary || (buffer !== null && isBinary(buffer));
  let status = "M";
  if (entry.oldPath) status = "R";
  else if (buffer === null) status = "D";
  else if (!existsAtBase(root, mergeBase, entry.path)) status = "A";

  return {
    ...entry,
    binary,
    total: binary || buffer === null ? null : lineCount(buffer),
    status,
    untracked: false,
  };
}

function sortByAdded(left, right) {
  return (
    (right.added ?? -1) - (left.added ?? -1) ||
    (right.total ?? -1) - (left.total ?? -1) ||
    left.path.localeCompare(right.path)
  );
}

function sortByTotal(left, right) {
  return (
    (right.total ?? -1) - (left.total ?? -1) ||
    (right.added ?? -1) - (left.added ?? -1) ||
    left.path.localeCompare(right.path)
  );
}

function pad(value, width) {
  return String(value ?? "-").padStart(width);
}

function renderRows(files) {
  if (files.length === 0) return "  (none)";
  return files
    .map(
      (file) =>
        `${pad(file.added, 7)} ${pad(file.deleted, 7)} ${pad(file.total, 7)}  ${file.status}  ${file.path}`,
    )
    .join("\n");
}

function renderText(report) {
  const textFiles = report.files.filter((file) => !file.binary && file.status !== "D");
  const byAdded = [...textFiles].sort(sortByAdded).slice(0, report.limit);
  const byTotal = [...textFiles].sort(sortByTotal).slice(0, report.limit);
  const binaryCount = report.files.filter((file) => file.binary).length;

  return [
    "File growth report (review signal only; line count is not a violation)",
    `base input:  ${report.input.fixedPoint}`,
    `base commit: ${report.resolved.baseSha}`,
    `head input:  ${report.input.head}`,
    `head commit: ${report.resolved.headSha}`,
    `merge base:  ${report.resolved.mergeBaseSha}`,
    `scope:       ${report.target}`,
    `path layers: committed ${report.paths.committed.length}, staged ${report.paths.staged.length}, unstaged ${report.paths.unstaged.length}, untracked ${report.paths.untracked.length}`,
    `changed:     ${report.files.length} files (${textFiles.length} reviewable text, ${binaryCount} binary)`,
    "",
    `Most added lines (top ${report.limit})`,
    "  added deleted   total  S  path",
    renderRows(byAdded),
    "",
    `Largest resulting files (top ${report.limit})`,
    "  added deleted   total  S  path",
    renderRows(byTotal),
  ].join("\n");
}

export async function buildReport({
  fixedPoint,
  head = "HEAD",
  worktree = false,
  limit = DEFAULT_LIMIT,
  cwd,
}) {
  const root = gitText(["rev-parse", "--show-toplevel"], { cwd });
  const baseSha = resolveCommit(root, "fixed point", fixedPoint);
  const headSha = resolveCommit(root, "head", head);
  const currentHeadSha = resolveCommit(root, "current HEAD", "HEAD");
  const mergeBaseSha = resolveMergeBase(root, baseSha, headSha);

  if (worktree && headSha !== currentHeadSha) {
    throw new Error(
      `--worktree requires --head to resolve to current HEAD (${currentHeadSha})`,
    );
  }

  const paths = collectPathLayers(root, mergeBaseSha, headSha, currentHeadSha);
  const diffArgs = [
    "diff",
    "--numstat",
    "-z",
    "--find-renames",
    "--no-ext-diff",
    "--no-textconv",
    "--ignore-submodules=none",
    mergeBaseSha,
  ];
  if (!worktree) diffArgs.push(headSha);
  diffArgs.push("--");

  const parsed = parseNumstat(runGit(diffArgs, { cwd: root }).stdout);
  const files = [];
  for (const entry of parsed) {
    files.push(
      await enrichEntry(entry, {
        root,
        mergeBase: mergeBaseSha,
        headSha,
        worktree,
      }),
    );
  }
  if (worktree) files.push(...(await collectUntracked(root, paths.untracked)));

  return {
    formatVersion: FORMAT_VERSION,
    repositoryRoot: root,
    input: {
      fixedPoint,
      head,
      worktree,
    },
    resolved: {
      baseSha,
      headSha,
      mergeBaseSha,
      currentHeadSha,
    },
    paths,
    target: worktree
      ? "committed + staged + unstaged + untracked"
      : "committed",
    limit,
    files,
  };
}

export async function main(argv = process.argv.slice(2), cwd = process.cwd()) {
  const options = parseArgs(argv);
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }

  const report = await buildReport({ ...options, cwd });
  process.stdout.write(
    options.json ? `${JSON.stringify(report, null, 2)}\n` : `${renderText(report)}\n`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`file-growth-report: ${error.message}\n`);
    process.exitCode = 1;
  });
}
