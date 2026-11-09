# Time-to-interactive beside an open stream: Opus review, round 1

- **Family:** Anthropic. Opus 5.5 (`claude-opus-5-5`), through Claude Code's Agent tool on account `ide@expo.dev`, effort max, in a frozen worktree at `0bf53f0141` on `41f28bca4e`.
- **Method:** one brief (sha256 `67e80a3d35335449f97eab37137b4404436a9da0b58bd44fad27bddfc408eb95`), one reviewer, with correctness, simplicity, test, writing and verification passes. The reviewer read source and logs, ran the branch's new test and probes of it, and wrote only in its scratch directory. The author is not a reviewer.
- **Transcription:** the final message, unedited; its paths name the review worktree and the author's logs, and its shas are of the reviewed history.

---

# Review: `ide/web-tti-open-stream`, round 1

This review covers commit `0bf53f0141` on upstream main `41f28bca4e`, read from the frozen worktree. The worktree is still clean. I wrote files only under `/private/tmp/claude-501/-Users-admin/7cad80d8-c41f-4763-8f63-d2fe1cb19835/scratchpad/review/scratch-tti/`.

## Summary

- **Code:** correct. The tickets' share of `inflight.n` always equals `Counting.size`. The new handling of a let-go request matches the runner.
- **Blocking findings:** none.
- **Main gap:** the test catches the reported bug. It does not pin the let-go behavior that the How section argues for, and some wrong versions of `outstanding()` pass it.
- **Evidence:** the test logs come from an earlier version of the test. When I ran the committed version, both Test Plan claims about it held.

## What I ran

Every run set `TMPDIR` to my scratch directory.

- **Committed test:** `bun test host/web-js/marks.test.mjs`, run from the review worktree, passes (3 `expect()` calls).
- **Against main:** I ran the committed test over `marks.js` from `41f28bca4e`. It fails at line 33. It received `[]` where it expected `['loading:1']`.
- **Wrong versions:** I wrote altered copies of `outstanding()` with `/private/tmp/claude-501/-Users-admin/7cad80d8-c41f-4763-8f63-d2fe1cb19835/scratchpad/review/scratch-tti/mut/variants.mjs` and ran each against the test. Results are in T1.
- **Scratch app bundle:** I read it without changes, in `/private/tmp/claude-501/-Users-admin/7cad80d8-c41f-4763-8f63-d2fe1cb19835/scratchpad/tti-app/target/web-dist/`.
- **Not run:** `scripts/affected.mjs`, because it calls `cargo`.

## Pass 1: Adversarial correctness — no findings

1. **The subtraction is exact.** `held.js:40-50` (`counted`) is the only code in the worktree that writes `t.counted` or `Counting`. Each call changes `inflight.n` and `Counting` together. So `inflight.n - Counting.size` is exactly the work in `inflight` that is not a ticket.
2. **Ticket states.** For each state, the ticket is either in both `inflight` and `Counting`, or in neither:
   - Queued in `Out` before its commit stands: in neither.
   - Sent and waiting (`rt.js:403`): in both.
   - A held ask, or an answer that waits only on its own timers (`held.js:44-45`): in neither.
   - A stream after its first message (`rt.js:408`): in neither. The resource keeps the ticket (`rt.js:479`).
   - An upload until its reply: in both. Its resource shows a value, so it names no request. This is unchanged from main.
   - A long poll after a reply (`rt.js:418`): in neither.
   - A stream or upload that `closeLetGo` closed (`rt.js:427-433`): in neither.
   - A plain request that its resource or mutation let go: in both, until its reply. The page then drops the reply (`rt.js:447`). On main this request read as `loading:1`. Now it reads as nothing.
3. **Parity with the runner.** The runner removes a let-go request from `pending` in three places: `enqueue` (`commit.rs:897`), `forget_ticket` (`commit.rs:814`) and mutation replacement (`commit.rs:599-607`). Its `outstanding()` reads only `pending` (`outstanding.rs:85`). So a let-go request never holds time-to-interactive (TTI) in the runner, and the web now does the same.
4. **One module instance.**
   - Only the page build bundles `marks.js` (`build.mjs:422`, `:457`). The server bundle does not import it.
   - `rt.js` and `marks.js` both import `./held.js`. That resolves to the same `gen/held.js` (`build.mjs:187-188`). The `exact-mounts` resolver changes only TypeScript-mount paths.
   - The scratch app's `.gen/marks.js` and `.gen/held.js` are identical to the branch files.
   - In its `app.js`, `Gr=new Set` occurs once. `outstanding()` computes `G.n-Gr.size`, and `counted` (`Qr`) adds to `Gr`. `send` calls `Qr(e,G)`, and `G={n:0}` is `inflight`.

**Outside the diff, not a finding:** under the agent, a device hold (`files.js:70-75`) adds to `inflight` with no ticket in `Counting`, so it reads as loading. The runner skips device holds (`outstanding.rs:86`). Main has the same behavior.

## Pass 2: Code simplicity

`marks.js` has no findings. The new code drops a loop, a counter and the `Mutations` import.

**C1 — nonblocking — `host/web-js/marks.test.mjs:4-5`, `:10`**
- **Problem:** the test finds its directory with `dirname(fileURLToPath(import.meta.url))`. The owner's rules require `import.meta.dirname`. Bun supports it, and `host/web/tests/stand-ins.mjs` uses it.
- **Edit:** use `const ROOT = resolve(import.meta.dirname, '../..');`. Import only `resolve` from `node:path` and only `pathToFileURL` from `node:url`.

## Pass 3: Test optimization

The test level, its reliability and its stand-in have no findings:
- It runs the real `marks.js` and `held.js`.
- It repeats `send`'s two `counted` calls for a stream (`rt.js:403`, `:408`) and keeps the ticket on the resource (`rt.js:479`). The cited `js-runtime` test (`host/web/tests/js-runtime.test.mjs:338`) shows the real `send` doing this.
- It copies files to a temporary directory, as `held-count.test.mjs` does, so it does not need `mock.module`.
- The `Mutations` export and `rt.Mutations.push` are necessary. I removed the push and ran the test: main's `marks.js` then passes it.

**T1 — nonblocking — `host/web-js/marks.test.mjs:33`; message, How, paragraph 1**
- **Problem:** no assertion pins the let-go behavior that the How section argues for. These wrong versions of `outstanding()` pass the committed test:
  - "Counted holders": it subtracts only the counted tickets that a resource or mutation holds. A let-go request then reads as loading.
  - "Resources only": it subtracts every resource's ticket and ignores mutations. In this test, the counted mutation request cancels out the answered stream's uncounted ticket.
- **Edit:** add these lines after line 33:
  ```js
      // Let go of a plain request while it is in flight: it stays in `inflight` until its reply, which lands nowhere
      const superseded = {};
      setWaiting(superseded, true);
      expect(outstanding()).toEqual(['loading:1']);
  ```
- **Effect, measured:** the branch passes, main still fails at line 33, and both wrong versions fail at the new assertion (line 37).

**T2 — nonblocking — `host/web-js/marks.test.mjs:14`, `:18-20`**
- **Problem:** `docs/testing.md` says a test must name what it reads, so that `scripts/affected.mjs` selects it when those files change. This test names `marks.js` and `held.js` in two forms:
  - as entries of an array that is not inside a path call;
  - in `resolve(dir, …)` calls, whose base the selector does not resolve.
- **What the selector does:** I read `affected.mjs` (`contextOf` at 726-748, `references` at 503-566). Neither form resolves to `host/web-js/marks.js` or `host/web-js/held.js`. `references` skips the `'host/web-js'` literal because it is the test's own directory (line 558).
- **Result:** a commit that changes only `marks.js` or `held.js` will probably not select this test. The daily full run still runs it. I worked this out by reading only, because I could not run the selector. `held-count.test.mjs:14` has the same pattern.
- **Edit:** replace line 14 with:
  ```js
    cpSync(resolve(ROOT, 'host/web-js/marks.js'), resolve(directory, 'marks.js'));
    cpSync(resolve(ROOT, 'host/web-js/held.js'), resolve(directory, 'held.js'));
  ```
  The selector adds a literal with a slash that resolves from the root to a repository file as an input (lines 550-564).

## Pass 4: Writing quality

**W1 — nonblocking — `host/web-js/marks.js:29`**
- **Problem:** the comment uses "holds" and "counts" for the same counter. It also does not name the set that the code subtracts.
- **Edit:** `// Count everything in `inflight` that is not a ticket (`Counting`) as the page's own loading (Markdown, canvas, motion, GPU)`

**W2 — nonblocking — `host/web-js/marks.test.mjs:7-9`, `:27-30`**
- **Problem (a):** "as they are over a stand-in rt.js" can be read as "as they behave over a stand-in".
- **Problem (b):** the comment at line 27 covers only the stream. Line 30 sends the mutation's request.
- **Edit (a):** write "as they are, over a stand-in rt.js".
- **Edit (b):** put this comment before line 30: `// Send a mutation's request: `inflight` counts it, and it holds no TTI`

**W3 — nonblocking — `host/web-js/marks.test.mjs:13-20`, `:21`, `:35`**
- **Problem:** the owner's rules ask for whole words. `dir` is the rule's own example of what to avoid, and `t` is a ticket.
- **Edit:** rename `dir` to `directory`, and the helper's `t` to `ticket`.

**W4 — nonblocking — `host/web-js/marks.js:28`, `:31`; `host/web-js/marks.test.mjs:14`**
- **Problem:** the owner's rules prefer braces on single-statement bodies, and these lines have none. The rest of `marks.js` also has none, so the owner must choose between the rule and the file's style.
- **Edit, if the rule applies:** use `for (…) { if (…) { out.push(…); } }` and `if (loading > 0) { out.push(…); }`. The T2 edit removes the loop at test line 14.

**W5 — nonblocking — message, Why, paragraph 1, last sentence**
- **Problem:** the sentence leaves out the third ticket that a resource holds while `inflight` does not count it: an answer that waits only on its own timers (`held.js:44`).
- **Edit:** "…but no longer counts in `inflight`, and neither a held ask (LLP 1016.000 D9) nor an answer that waits only on its own timers counts there (`held.js` `counted`), so each such ticket hid…"

**W6 — nonblocking — message, How, paragraph 1**
- **Problem (a):** the parity argument cites the placeholder filter. The real reason is that the runner removes a let-go request from `pending`.
- **Problem (b):** "its resource" leaves out a let-go mutation request, which also changes.
- **Problem (c):** "counts now" and "still holds" can be read as "after this commit" and "as before".
- **Problem (d):** "subtracts `Counting`" means its size.
- **Edit:** "`outstanding()` subtracts the size of `Counting` (`host/web-js/held.js`), the set of tickets that `inflight` is counting, as `wakes.js` does to tell the page's own loading from requests. A request holds TTI only through a resource that shows its placeholder. A request that its resource or mutation has let go stays in `inflight` until its reply, which lands nowhere, so it no longer reads as loading. The runner does the same: it removes a let-go request from `pending` (`runner/src/runner/commit.rs`, `enqueue` and `forget_ticket`), so its `outstanding()` (`runner/src/runner/outstanding.rs`) never sees it."

**W7 — nonblocking — message, Test Plan, paragraph 2, last sentence**
- **Problem (a), "in Chrome":** `tti-probe.mjs` calls `chromium.launch()` from `playwright-core` with no `channel` and no `executablePath`, so it does not request Chrome.
- **Problem (b), the bundle claim:** no log shows "its bundle subtracts the set `counted` fills". I confirmed it in the bundle (Pass 1, item 4).
- **Problem (c), what the run covers:** the app's only resource answers at once, and the probe's `trace` is empty. Nothing was in flight, so the run does not exercise the subtraction.
- **Edit:** "…builds with `bun exact.mjs web-build`. In its `app.js`, `outstanding()` subtracts the size of the same `Set` that `counted` fills for `send`. In Playwright's Chromium, `exact.observe()` reports the outcome `settled`, with `interactive` after `present`. The app has nothing in flight, so this run checks that the bundle links and settles, not the subtraction."

## Pass 5: Verification

| Test Plan claim | Result |
|---|---|
| The new test passes | Holds when I run it. `tti-marks.log` (21:35) is older than the commit (21:41). |
| It fails on main at its last assertion | Holds when I run it. See V1 for the log. |
| The `js-runtime` stream test passes and shows the ticket kept out of `inflight` | Holds. The log (7 `expect()` calls) matches the test at line 338. That test reads `inflight.n` as 0 after the first message and still finds the ticket after the second. The branch does not change this file. |
| No other suite bundles `marks.js` | Holds by reading. No `app.json` in the worktree has `launch`. Only `build.mjs` copies `marks.js`, and only for an app with a web launch module. `modules/observe/tests/wire.test.mjs` imports the service directly. |
| The scratch app builds and settles | Partly holds. `app.json` has `"launch": ["observe"]`, and the build log is clean. The probe log shows `settled`, with `present` at 332 and `interactive` at 341.2. See W7 for the rest. |
| Caps reports only `PresenterIOS.swift` | Holds. `tti-caps.log` shows that file at 1504 lines. The branch does not change it. |

**V1 — nonblocking — `logs/tti-marks.log`, `logs/tti-marks-negative.log`**
- **Problem:** `tti-marks-negative.log` shows an earlier version of the test. That version calls the helper `wait`, fails at line 32, and ran in `/Users/admin/Developer/exact-web`. The committed test uses `setWaiting`, and its last assertion is at line 33.
- **Edit:** generate both logs again from the committed test, or cite the runs in this review.

**Recommended before merge:** T1, T2, W6 and W7. The other findings are optional.

READY