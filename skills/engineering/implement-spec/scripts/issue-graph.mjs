#!/usr/bin/env node

// Adapted from zhangyixiang's codex-personal-config at commit 10cf28f,
// skills/ship-issue-tree/scripts/issue-graph.mjs.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function usage() {
  return `Usage:
  node issue-graph.mjs --parent <issue-number> [--repo owner/name]
                       [--satisfied 12,13]

Reads GitHub native sub-issues and blocked-by relationships through gh.
Locally integrated child issues may be passed as --satisfied when their GitHub
issues intentionally remain open. The command is read-only and prints JSON.`;
}

function requiredValue(argv, index, argument) {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${argument} requires a value`);
  return value;
}

function parseArguments(argv) {
  let parent;
  let repository;
  const satisfied = new Set();

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--help' || argument === '-h') {
      return { help: true };
    }

    if (argument === '--parent') {
      parent = requiredValue(argv, index, argument);
      index += 1;
      continue;
    }

    if (argument === '--repo') {
      repository = requiredValue(argv, index, argument);
      index += 1;
      continue;
    }

    if (argument === '--satisfied') {
      const value = requiredValue(argv, index, argument);
      index += 1;

      for (const item of value?.split(',') ?? []) {
        if (!/^[1-9]\d*$/.test(item) || !Number.isSafeInteger(Number(item))) {
          throw new Error('--satisfied must be a comma-separated list of issue numbers');
        }

        satisfied.add(Number(item));
      }
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  if (!/^[1-9]\d*$/.test(parent ?? '') || !Number.isSafeInteger(Number(parent))) {
    throw new Error('--parent must be a positive issue number');
  }

  if (repository !== undefined && !/^[^/\s]+\/[^/\s]+$/.test(repository)) {
    throw new Error('--repo must use owner/name');
  }

  return {
    help: false,
    parent: Number(parent),
    repository,
    satisfied,
  };
}

async function runGh(arguments_) {
  const { stdout } = await execFileAsync('gh', arguments_, {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });

  return stdout.trim();
}

async function readJson(arguments_) {
  const output = await runGh(arguments_);
  return output === '' ? null : JSON.parse(output);
}

async function readPaginated(endpoint) {
  const pages = await readJson([
    'api',
    '--method',
    'GET',
    '--paginate',
    '--slurp',
    endpoint,
    '-f',
    'per_page=100',
  ]);

  if (!Array.isArray(pages)) {
    throw new Error(`Unexpected paginated response for ${endpoint}`);
  }

  return pages.flat();
}

function issueRepository(issue) {
  const match = issue.repository_url?.match(/\/repos\/([^/]+\/[^/]+)$/)
    ?? issue.html_url?.match(/^https?:\/\/[^/]+\/([^/]+\/[^/]+)\/issues\/\d+$/);
  if (!match) throw new Error(`Cannot identify repository for issue #${issue.number}`);
  return match[1];
}

function sameRepository(left, right) {
  return left.toLowerCase() === right.toLowerCase();
}

function issueSummary(issue) {
  return {
    number: issue.number,
    repository: issueRepository(issue),
    title: issue.title,
    state: issue.state,
    stateReason: issue.state_reason ?? null,
    url: issue.html_url,
  };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));

  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }

  const repository =
    options.repository ??
    (await runGh(['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner']));

  const parentEndpoint = `repos/${repository}/issues/${options.parent}`;
  const parent = await readJson(['api', parentEndpoint]);

  if (parent.pull_request !== undefined) {
    throw new Error(`#${options.parent} is a pull request, not a parent issue`);
  }

  if (parent.state !== 'open') throw new Error(`Parent #${options.parent} is not open`);

  const children = await readPaginated(`${parentEndpoint}/sub_issues`);
  if (children.some((child) => !sameRepository(issueRepository(child), repository))) {
    throw new Error('Cross-repository children require repository-qualified planning; this number-based helper supports same-repository children only');
  }
  const childNumbers = new Set(children.map((child) => child.number));
  const unknownSatisfied = [...options.satisfied].filter(
    (issueNumber) => !childNumbers.has(issueNumber),
  );

  if (unknownSatisfied.length > 0) {
    throw new Error(
      `--satisfied contains issues that are not children of #${options.parent}: ${unknownSatisfied.join(
        ', ',
      )}`,
    );
  }

  const enrichedChildren = await Promise.all(
    children.map(async (child, position) => {
      const blockers = await readPaginated(
        `repos/${repository}/issues/${child.number}/dependencies/blocked_by`,
      );
      const blockerSummaries = blockers.map((blocker) => ({
        ...issueSummary(blocker),
        isChild: sameRepository(issueRepository(blocker), repository) && childNumbers.has(blocker.number),
      }));
      const nativeOpenBlockers = blockerSummaries.filter((blocker) => blocker.state === 'open');
      const effectiveOpenBlockers = nativeOpenBlockers.filter(
        (blocker) => !(blocker.isChild && options.satisfied.has(blocker.number)),
      );

      return {
        ...issueSummary(child),
        position,
        labels: (child.labels ?? []).map((label) =>
          typeof label === 'string' ? label : label.name,
        ),
        blockedBy: blockerSummaries,
        nativeOpenBlockers: nativeOpenBlockers.map((blocker) => blocker.number),
        effectiveOpenBlockers: effectiveOpenBlockers.map((blocker) => blocker.number),
        satisfiedByCoordinator: options.satisfied.has(child.number),
        nativeDependencyReady: child.state === 'open' && nativeOpenBlockers.length === 0,
        effectiveDependencyReady:
          child.state === 'open' &&
          !options.satisfied.has(child.number) &&
          effectiveOpenBlockers.length === 0,
      };
    }),
  );

  const result = {
    schemaVersion: 1,
    repository,
    parent: issueSummary(parent),
    satisfied: [...options.satisfied].sort((left, right) => left - right),
    children: enrichedChildren,
    nativeDependencyReadyFrontier: enrichedChildren
      .filter((child) => child.nativeDependencyReady)
      .map((child) => child.number),
    effectiveReadyFrontier: enrichedChildren
      .filter((child) => child.effectiveDependencyReady)
      .map((child) => child.number),
    blockedOpen: enrichedChildren
      .filter(
        (child) =>
          child.state === 'open' &&
          !child.satisfiedByCoordinator &&
          !child.effectiveDependencyReady,
      )
      .map((child) => child.number),
    closed: enrichedChildren
      .filter((child) => child.state === 'closed')
      .map((child) => child.number),
    generatedAt: new Date().toISOString(),
  };

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

  if (children.length === 0) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  process.stderr.write(`issue-graph: ${error.message}\n`);
  process.exitCode = 1;
});
