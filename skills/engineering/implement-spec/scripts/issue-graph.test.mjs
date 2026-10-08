import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const script = fileURLToPath(new URL('./issue-graph.mjs', import.meta.url));
const repo = 'owner/project';
const issue = (number, state = 'open', repository = repo) => ({
  number, title: `Issue ${number}`, state,
  html_url: `https://github.com/${repository}/issues/${number}`,
  repository_url: `https://api.github.com/repos/${repository}`,
  labels: [{ name: 'ready' }],
});
function fixture(children = [issue(2), issue(3)], blockers = {}) {
  const data = {
    [`repos/${repo}/issues/1`]: issue(1),
    [`repos/${repo}/issues/1/sub_issues`]: children.map(child => [child]),
  };
  for (const child of children) data[`repos/${repo}/issues/${child.number}/dependencies/blocked_by`] = blockers[child.number] ?? [[]];
  return data;
}
function run(data, args = []) {
  const dir = mkdtempSync(join(tmpdir(), 'issue-graph-test-'));
  try {
    writeFileSync(join(dir, 'data.json'), JSON.stringify(data));
    writeFileSync(join(dir, 'gh'), `#!${process.execPath}\nconst fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync(process.env.GH_TEST_LOG, JSON.stringify(args) + '\\n');
if(args[0] === 'repo') { console.log('owner/project'); process.exit(0); }
const endpoint = args.find(arg => arg.startsWith('repos/'));
const data = JSON.parse(fs.readFileSync(process.env.GH_TEST_DATA));
if(!(endpoint in data)) { console.error('Unexpected endpoint: ' + endpoint); process.exit(1); }
console.log(JSON.stringify(data[endpoint]));\n`, { mode: 0o755 });
    const result = spawnSync(process.execPath, [script, '--parent', '1', ...args], {
      encoding: 'utf8', env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, GH_TEST_DATA: join(dir, 'data.json'), GH_TEST_LOG: join(dir, 'calls') },
    });
    let calls = [];
    try { calls = readFileSync(join(dir, 'calls'), 'utf8').trim().split('\n').map(JSON.parse); } catch {}
    for (const call of calls) {
      assert.ok(call[0] === 'repo' || call[0] === 'api');
      if (call.includes('--method')) assert.equal(call[call.indexOf('--method') + 1], 'GET');
    }
    return { ...result, calls, json: result.stdout ? JSON.parse(result.stdout) : null };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

test('pagination, closed blockers, and native versus locally satisfied frontier', () => {
  const data = fixture([issue(2), issue(3), issue(4, 'closed')], { 3: [[issue(2)], [issue(9, 'closed')]] });
  const result = run(data, ['--repo', repo, '--satisfied', '2']);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.json.nativeDependencyReadyFrontier, [2]);
  assert.deepEqual(result.json.effectiveReadyFrontier, [3]);
  assert.deepEqual(result.json.closed, [4]);
  assert.deepEqual(result.json.children[1].nativeOpenBlockers, [2]);
  assert.deepEqual(result.json.children[1].effectiveOpenBlockers, []);
  assert.deepEqual(result.json.children[1].labels, ['ready']);
  const lists = result.calls.filter(call => call.includes('--paginate'));
  assert.equal(lists.length, 4);
  assert.ok(lists.every(call => call.includes('--slurp') && call.includes('per_page=100')));
});
test('foreign same-number blocker cannot be satisfied by local child', () => {
  const result = run(fixture(undefined, { 3: [[issue(2, 'open', 'other/project')]] }), ['--satisfied', '2']);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.json.effectiveReadyFrontier, []);
  assert.deepEqual(result.json.blockedOpen, [3]);
  assert.equal(result.json.children[1].blockedBy[0].isChild, false);
  assert.equal(result.json.children[1].blockedBy[0].repository, 'other/project');
});
test('cannot invent satisfied child', () => {
  const result = run(fixture(), ['--satisfied', '999']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /not children/);
});
test('closed parent and PR are rejected', () => {
  for (const parent of [{ ...issue(1), state: 'closed' }, { ...issue(1), pull_request: {} }]) {
    const result = run({ ...fixture(), [`repos/${repo}/issues/1`]: parent });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /not open|pull request/);
  }
});
test('empty child list is explicit exit 2 with empty graph', () => {
  const result = run(fixture([]));
  assert.equal(result.status, 2, result.stderr);
  assert.deepEqual(result.json.children, []);
  assert.deepEqual(result.json.effectiveReadyFrontier, []);
});
test('cyclic dependencies do not produce an executable frontier', () => {
  const result = run(fixture(undefined, { 2: [[issue(3)]], 3: [[issue(2)]] }));
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.json.effectiveReadyFrontier, []);
  assert.deepEqual(result.json.blockedOpen, [2, 3]);
});
test('unsupported cross-repository children fail instead of aliasing local numbers', () => {
  const result = run(fixture([issue(2, 'open', 'other/project')]));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Cross-repository children/);
});
test('missing and invalid options fail before calling gh', () => {
  for (const args of [['--satisfied'], ['--repo'], ['--satisfied', '0'], ['--parent', '9007199254740993'], ['--repo', 'bad'], ['--unknown']]) {
    const result = run(fixture(), args);
    assert.equal(result.status, 1, args.join(' '));
    assert.equal(result.calls.length, 0);
  }
});
