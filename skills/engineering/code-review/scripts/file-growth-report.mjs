#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { lstat, readFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_LIMIT = 12;
const MAX_BUFFER = 64 * 1024 * 1024;

function usage() {
  return `Usage: node file-growth-report.mjs <fixed-point> [options]

Options:
  --worktree       Include staged, unstaged, and untracked worktree changes.
  --limit <count>  Rows per ranking (default: ${DEFAULT_LIMIT}).
  --json           Emit machine-readable JSON.
  --help           Show this help.`;
}

function parseArgs(argv) {
  let fixedPoint;
  let worktree = false;
  let json = false;
  let limit = DEFAULT_LIMIT;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--worktree") {
      worktree = true;
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
  return { fixedPoint, worktree, json, limit, help: false };
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

async function readTargetBuffer({ root, path, worktree }) {
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

  const result = runGit(["cat-file", "blob", `HEAD:${path}`], {
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

async function collectUntracked(root) {
  const paths = splitNul(
    runGit(["ls-files", "--others", "--exclude-standard", "-z"], {
      cwd: root,
    }).stdout,
  );
  const entries = [];

  for (const path of paths) {
    const buffer = await readTargetBuffer({ root, path, worktree: true });
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

async function enrichEntry(entry, { root, mergeBase, worktree }) {
  const buffer = await readTargetBuffer({ root, path: entry.path, worktree });
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
    `fixed point: ${report.fixedPoint}`,
    `merge base:  ${report.mergeBase}`,
    `target:      ${report.target}`,
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

export async function buildReport({ fixedPoint, worktree, limit, cwd }) {
  const root = gitText(["rev-parse", "--show-toplevel"], { cwd });
  const fixedResult = runGit(
    ["rev-parse", "--verify", "--end-of-options", `${fixedPoint}^{commit}`],
    { cwd: root, allowFailure: true },
  );
  if (fixedResult.status !== 0) throw new Error(`fixed point does not resolve: ${fixedPoint}`);

  const fixedCommit = fixedResult.stdout.toString("utf8").trim();
  const mergeBase = gitText(["merge-base", fixedCommit, "HEAD"], { cwd: root });
  const diffArgs = ["diff", "--numstat", "-z", "--find-renames", mergeBase];
  if (!worktree) diffArgs.push("HEAD");
  diffArgs.push("--");

  const parsed = parseNumstat(runGit(diffArgs, { cwd: root }).stdout);
  const files = [];
  for (const entry of parsed) {
    files.push(await enrichEntry(entry, { root, mergeBase, worktree }));
  }
  if (worktree) files.push(...(await collectUntracked(root)));

  return {
    fixedPoint,
    fixedCommit,
    mergeBase,
    target: worktree ? "worktree" : "HEAD",
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
