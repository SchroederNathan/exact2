# Time-to-interactive beside an open stream: Opus review, round 2

- **Family:** Anthropic. Opus 5.5 (`claude-opus-5-5`), through Claude Code's Agent tool on account `ide@expo.dev`, effort max, in a frozen worktree at `ba0128dbd0` (source `97414ca4e0`) on `41f28bca4e`.
- **Method:** one brief (sha256 `8bc65e08c404e8ba0cb0aea65f25588716c99daeadcd0912a7c7988502cc994e`), one reviewer, with a check of every round-1 settlement and correctness, simplicity, test, writing and verification passes over the branch as it stood. The reviewer read source and logs, ran the branch's test and wrong versions of `outstanding()` against it, and wrote in its scratch directory; the record says what one permitted selector run left in the worktree and how the reviewer removed it. The author is not a reviewer.
- **Transcription:** the final message, unedited; its paths name the review worktree and the author's logs, and its shas are of the reviewed history.

---

# Review: `ide/web-tti-open-stream`, round 2

This review covers two commits on upstream main `41f28bca4e`: the source commit `97414ca4e0` and the records commit `ba0128dbd0`. I read them in the frozen worktree `/private/tmp/claude-501/-Users-admin/7cad80d8-c41f-4763-8f63-d2fe1cb19835/scratchpad/review/tti-r2`. Its `HEAD` is `ba0128dbd0`, and `git status --porcelain --ignored` is now empty. I wrote scratch files only under `/private/tmp/claude-501/-Users-admin/7cad80d8-c41f-4763-8f63-d2fe1cb19835/scratchpad/review/scratch-tti-r2/`. One permitted probe also wrote into the worktree's `target/`. "Rule breach, undone" below says what happened and how I removed it.

## Summary

- **Code:** correct. `inflight.n - Counting.size` is exactly the work in `inflight` that has no ticket. The handling of a let-go request matches the runner.
- **Blocking findings:** none.
- **Settlements:** I agree with every round-1 settlement, including the declined braces.
- **Test:** it fails for every wrong version of `outstanding()` that I wrote.
- **Nonblocking findings:**
  - F1 and F2: the test's name and some comments do not match what the test does.
  - F3 and F5: two Test Plan sentences are inaccurate or have no evidence in the logs.
  - F4: the records title is longer than 72 characters.

## What I ran

- **The committed test:** `bun test host/web-js/marks.test.mjs`, run from the review worktree, passes with 4 `expect()` calls.
- **Wrong versions:** I ran the committed test against seven versions of `outstanding()`. Each version has its own copy under `/private/tmp/claude-501/-Users-admin/7cad80d8-c41f-4763-8f63-d2fe1cb19835/scratchpad/review/scratch-tti-r2/mut/`. `/private/tmp/claude-501/-Users-admin/7cad80d8-c41f-4763-8f63-d2fe1cb19835/scratchpad/review/scratch-tti-r2/mut/variants.mjs` writes them. The results are in Pass 2.
- **Selector:** I ran `bun scripts/affected.mjs --base upstream/main --why bun:host/web-js/marks.test.mjs` once.
- **Selector graph:** I used the selector's `Repo` and `Graph` through `bun -e`, with stand-in Cargo metadata, so no `cargo` ran. This traced `held.js` and `rt.js` to the test.
- **Scratch app:** I read its build in `/private/tmp/claude-501/-Users-admin/7cad80d8-c41f-4763-8f63-d2fe1cb19835/scratchpad/tti-app/target/web-dist/` and changed nothing.
- **Environment:** every Bun run set `TMPDIR` to my scratch directory and `BUN_RUNTIME_TRANSPILER_CACHE_PATH=0`.
- **Git:** my first `git status` ran without `GIT_OPTIONAL_LOCKS=0`. The worktree's index file (`.git/worktrees/tti-r2/index`) has the time 22:28:20, when that command ran. No tracked content changed. Later git commands set `GIT_OPTIONAL_LOCKS=0`.
- **Not run:** builds, browsers and other suites.

## Rule breach, undone

- **What happened:** the brief allows `bun scripts/affected.mjs --base upstream/main --why <suite id>`. I ran it once from the review worktree, at about 22:37. The script runs `cargo metadata`. During the run, a `target/` directory appeared in the worktree, with the birth time 22:37:00.
- **What it held:**
  - Cargo's `CACHEDIR.TAG` and `.rustc_info.json`.
  - A `debug/` directory with `.cargo-lock`, `.fingerprint`, `build` and `deps`.
  - In total: 13,000 files, 3.6 GB apparent size. Almost all files have birth times before 22:30, so they are copies of earlier build output.
- **Context:** this machine's `~/.cargo/config.toml` sets `rustc-wrapper = kache`. I did not find which process copied the files.
- **What I did:**
  - I wrote a description to `/private/tmp/claude-501/-Users-admin/7cad80d8-c41f-4763-8f63-d2fe1cb19835/scratchpad/review/scratch-tti-r2/target-side-effect.txt`.
  - I removed the worktree's `target/`.
  - The Bun install cache did not change. I compared it before and after the run.
- **Afterward:** the `bun -e` graph probe ran no `cargo`, and no `target/` appeared.
- **For later briefs:** do not list this command for a frozen worktree. Another option is to point Cargo's target directory into the scratch directory, but I did not test it.

## Pass 1: Settlements — no findings

| Round-1 finding | Settlement | My view |
|---|---|---|
| C1, `import.meta.dirname` | Accepted | Agree. Line 10 uses it. The imports are now only `resolve` and `pathToFileURL`. |
| T1, check the let-go request | Accepted | Agree. Line 39 fails for the "counted holders" and "resources only" versions. |
| T2, name inputs by path | Accepted | Agree. Lines 14–15 give both paths from the root. The selector reaches both files (Pass 3). |
| W1, comment in `outstanding()` | Accepted | Agree. Line 29 is accurate and names `Counting`. |
| W2, comma and the mutation's comment | Accepted | Agree (lines 7 and 31). |
| W3, names written out | Accepted | Agree. `directory` and `ticket` replace `dir` and `t`. |
| W4, braces | Declined | Agree. The owner's rule says "prefer". Every single-statement body in `marks.js` has no braces, for example lines 20, 21, 32, 33, 40 and 147–149. Braces on two lines would put both forms in one nine-line function. If the owner wants braces, a change to the whole file belongs in its own commit. |
| W5, Why names the timed answer | Accepted | Agree. The Why names it and cites `counted`. |
| W6, How | Accepted | Agree. The text matches the proposal. The citations hold: `enqueue` (`commit.rs:897`) and `forget_ticket` (`commit.rs:814`) remove a let-go request from `pending`. |
| W7, browser run | Accepted | Agree. The text matches the proposal and the probe script. |
| V1, logs from the committed test | Accepted | Agree. The three `marks` logs are from 22:27:23–22:27:33, after the final commits at 22:27:13 and 22:27:22. Both failing logs quote the committed test's lines. |

The records commit describes these settlements accurately. Its hash claim holds. The record's text after its header has the sha256 `970dbc06…f8fe46`, and so does `tti-r1-final.md`.

## Pass 2: Correctness, simplicity, tests and writing

### Correctness — no findings

1. `counted` (`held.js:46–47`) changes `t.counted`, `inflight.n` and `Counting` together. No other code writes `t.counted` or `Counting`. So `inflight.n - Counting.size` is the work in `inflight` that has no ticket.
2. Every write of a ticket's `waiting` flag calls `counted` (`rt.js:403`, `:408`, `:418` and `:430`).
3. `send` runs only for resource tickets (`rt.js:478` and `:523`) and mutation tickets (`rt.js:562` and `:601`). So `Counting` holds only their tickets, whether still held or let go.
4. The change alters two cases. Both match the commit message:
   - Some tickets that a resource holds are not counted by `inflight`. These tickets no longer hide page loading. They are an answered stream, a held ask and an answer that waits only on its own timers.
   - A plain request that its resource or mutation let go no longer reads as loading. The runner removes such a request from `pending` in three places: `enqueue` (`commit.rs:897`), `forget_ticket` (`commit.rs:814`) and mutation replacement in `run_action_inner` (`commit.rs:607`). The runner's `outstanding()` reads only `pending` (`outstanding.rs:85`).
5. The scratch app's `app.js` has one copy of `counted`. The text `recount??=` occurs once in it and in no other chunk. So `marks.js` and `rt.js` share one `Counting`.

### Simplicity — no findings

- The change removes a loop, a counter and the `Mutations` import.
- The test copies files as `held-count.test.mjs` does, so it needs no `mock.module`.
- The stand-in still exports `Mutations`. This lets main's `marks.js` load for the negative run. It also models a ticket that a mutation holds.

### Tests

These are the results of the committed test for each version of `outstanding()`:

| Version | Result |
|---|---|
| The branch | Passes |
| Main | Fails at line 36: `[]`, not `['loading:1']` |
| Subtracts only the counted tickets that a resource or mutation holds | Fails at line 39: `loading:2` |
| Subtracts every resource's ticket and ignores mutations | Fails at line 39: `loading:2` |
| Subtracts the counted tickets of resources and every mutation ticket | Fails at line 39: `loading:2` |
| Subtracts nothing | Fails at line 27: `loading:1` |
| Reports no loading | Fails at line 36: `[]` |

**F1 — nonblocking — Pass 2 — `host/web-js/marks.test.mjs:12`**
- **Problem:** the test's name covers only the open stream. Line 39 checks the other direction: a let-go request adds no loading. If line 39 fails, the output shows a name about hidden loading.
- **Edit:**
  ```js
  test('an open stream hides none of the page loading that holds time-to-interactive, and a let-go request adds none', async () => {
  ```

**F2 — nonblocking — Pass 2 — `host/web-js/marks.test.mjs:28`, `:34`, `:37`**
- **Problem:** the owner's rule asks that a comment start with what the code does. Line 31 does this ("Send a mutation's request"). Lines 28, 34 and 37 start with a noun phrase. Lines 34 and 37 are new since round 1.
- **Edit:**
  ```js
      // Deliver the stream's first message: its resource shows it and keeps the ticket for the messages to come
      // Start the page's own loading (a Markdown module, say)
      // Add a request that its resource let go: it stays in `inflight` until its reply, which lands nowhere, and holds no TTI
  ```

### Writing

**F3 — nonblocking — Pass 2 — message, Test Plan, paragraph 1, sentences 2, 3 and 5**
- **Problem (a):** sentence 2 says that the stand-in `rt.js` "counts tickets as `send` does". The stand-in only exports data (`marks.test.mjs:16–17`). The test's `setWaiting` counts the tickets through `counted`. The test's own comment on line 8 says this correctly.
- **Problem (b):** sentence 3 says "that loading reads as `[]`, not `loading:1`". `[]` is the whole return value, but `loading:1` is one entry.
- **Problem (c):** sentence 5 ends with "which the stand-in models". The test models it, not the stand-in.
- **Edit:**
  - Sentence 2: "It runs `marks.js` and `held.js` as they are, over a stand-in `rt.js`, and counts tickets as `send` does."
  - Sentence 3: "…beside the answered stream and a mutation's request, `outstanding()` returns `[]`, not `['loading:1']`."
  - Sentence 5: "…keeping an answered stream's ticket out of `inflight`, which the test models."

**F4 — nonblocking — Pass 2 — records commit `ba0128dbd0`, title**
- **Problem:** the title has 74 characters. The owner's rule asks for 72 or fewer.
- **Edit:** "Records: Opus reviews of time-to-interactive beside an open stream" (66 characters). This title also covers the round-2 record when the author adds it.

## Pass 3: Verification

| Test Plan claim | Evidence | Result |
|---|---|---|
| The new test passes | `tti-marks.log` (22:27:23) shows 1 pass and 4 `expect()` calls. My run gives the same. | Holds |
| On main, the test fails once the page's loading starts, with `[]` | `tti-marks-negative.log` (22:27:32) fails at `marks.test.mjs:36:27` and quotes the committed lines 31–36. My run with main's `marks.js` gives the same. | Holds |
| The last assertion fails for the "counted holders" version | `tti-marks-holders-variant.log` (22:27:33) fails at 39:27 with `loading:2`. My version gives the same. | Holds |
| The `js-runtime` stream test passes and shows the ticket kept out of `inflight` | `tti-js-runtime-stream.log` shows 1 pass, 66 filtered out and 7 `expect()` calls. The test at `js-runtime.test.mjs:338` has 7 `expect()` calls. It reads `inflight.n` as 0 after the first message and finds the ticket after the second. The branch changes neither that file nor `rt.js`. | Holds |
| `affected.mjs --why` selects the test for `marks.js` or `held.js` | No log in the evidence list | True, but see F5 |
| No other suite bundles `marks.js` | No tracked `app.json` and no test sets `launch`. Only `build.mjs:422` copies `marks.js`, and only for a web launch module. | Holds by reading |
| The scratch app builds | `tti-web-build.log`. Its `app.json` has `"launch": ["observe"]`. Its `.gen/marks.js` differs from the branch only in the line-29 comment. `.gen/held.js` is identical. `.gen/rt.js` differs only in the build's `DEVELOPMENT_STORE` value. | Holds |
| Its `app.js` subtracts the size of the `Set` that `counted` fills for `send` | No log. In `app.js`, `sp()` computes `G.n-Gr.size`. `Qr` adds `e` to `Gr` or deletes it. `ks` calls `Qr(e,G)`. `G={n:0}`. | Holds by reading |
| Playwright's Chromium reports `settled`, with `interactive` after `present` | `tti-browser-probe.log` shows `settled`, `present` 332 and `interactive` 341.2. The probe calls `chromium.launch()` from `playwright-core`. | Holds |
| The run checks linking and settling, not the subtraction | The probe's `trace` is empty. | Holds |
| Caps reports only `PresenterIOS.swift`, which is over the cap on main | `tti-caps.log` shows one violation, at 1504 lines. `wc -l` gives 1503 on main. The log (22:16:51) is older than the final commits. The branch changes only `QUEUE.md`, `marks.js` (168 lines), `marks.test.mjs` (43 lines) and a file in `llp/reviews/`. | Holds |

**F5 — nonblocking — Pass 3 — message, Test Plan, paragraph 1, sentence 6**
- **Problem (a):** no listed log supports the claim that `bun scripts/affected.mjs --why` selects the new test for a change to `marks.js` or `held.js`. `tti-affected.log` (21:40) is not in the evidence list. It shows a full selection from before the path fix, and it selects the test only because the test itself changed.
- **Problem (b):** `--why` needs a suite id. It explains a selection but does not make one, and it shows only changed inputs. `held.js` does not change on this branch, so `--why` cannot show it.
- **What I found:** the claim is true.
  - `--why` traces `host/web-js/marks.js` to the literal `"host/web-js/marks.js"` in the test.
  - The selector's graph traces `host/web-js/held.js` to its own literal in the same way.
- **Edit:** "The test names `host/web-js/marks.js` and `host/web-js/held.js` by their paths, so `scripts/affected.mjs` selects it when either changes; `bun scripts/affected.mjs --base upstream/main --why bun:host/web-js/marks.test.mjs` traces `marks.js` to its path in the test." Keep that run's output with the logs. In a fresh worktree, the run can create `target/` (see "Rule breach, undone").

## Outside the diff (not findings)

- `host/web-js/held-count.test.mjs:14` names `ts-fetch.js` and `held.js` only as array entries. The selector's graph reaches neither file from that test. So a change to `held.js` alone does not select that test. The new test does not have this gap.
- Round 1 noted that a device hold under the agent (`files.js:70–75`) adds to `inflight` with no ticket. So `outstanding()` reads the hold as loading. The runner skips device holds (`outstanding.rs:86`). Main has the same behavior.

**Recommended before push:** F3, F4 and F5. F1 and F2 are optional.

READY