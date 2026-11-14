# A render at an open stream: Opus review, round 1

- **Family:** Anthropic. Opus 5.5 (`claude-opus-5-5`), through Claude Code's Agent tool on account `ide@expo.dev`, effort max, in a frozen worktree at `54d1fd2e9b` on `063bc57dd0`.
- **Method:** one brief (sha256 `b0d74e0a84f7de0fcbee4e50f4cb4e035bd26087eb617f25afa11c73c1b94cb1`), one reviewer, with semantics, correctness, simplicity, test, writing and verification passes. The reviewer read source and logs, ran no build or test, and wrote only in its scratch directory. The author is not a reviewer.
- **Transcription:** the final message, unedited; its paths name the review worktree and the author's logs, and its shas are of the reviewed history.

---

# Review record: `ide/render-settle-open-stream`, commit `54d1fd2e9b`, round 1

**Scope.** I read the commit and its message, every touched file in the frozen worktree, the code each change relies on, the cited LLP sections and the `open-*` logs. I did not build, run tests or open a browser. My only probes were `git`, `grep`, `sed` and file reads. Line numbers refer to `54d1fd2e9b`.

**Verdict.** The model is correct. The checkpoint lists each answered resource whose stream is open, and each runtime asks only that resource again. Code gaps and an unsupported Test Plan claim block the push (B1–B4).

## Blocking findings

### B1. The paint-order fixture now fails (pass 2 correctness, pass 6 verification)
- **Where:** `host/web/tests/paint-order/compare.mjs:38`. It fails at `host/web-js/render.mjs:209`.
- **Problem:** `compare.mjs` writes its own `__render` stand-in. That stand-in returns `pending` but no `open`. Line 47 renders each case through `renderer(dir)('/')`. `render.mjs:209` now reads `out.open.length` with no guard, so each case throws "undefined is not an object (evaluating 'out.open.length')". `open-bun-document-render.test.log` shows this same error for the other stand-in, which the amend fixed. `compare.mjs:115` then fails the run.
- **Effect:** `exact-web-js` runs `compare.mjs` in two tests: `paint_tests::server_client_and_adopted_paint_agree_on_the_chrome_corpus` and `paint_tests::waiting_rows_recompute_parent_and_sibling_facts_against_kernel`. Both assert that Bun exits with success (`host/web-js/src/paint_tests.rs:367-386`). `open-affected.log` selects `exact-web-js`, but the Test Plan does not run it.
- **Edit:** Write `pending:[],open:[]` in that stand-in. Run `cargo test -p exact-web-js --bins paint_tests` and add the result to the Test Plan.

### B2. An open stream of a list element appears nowhere in the checkpoint (pass 1 semantics)
- **Where:** `runner/src/runner/checkpoint.rs:102-105`, `:108-112` and `:134-137`. The effect is at `host/render/src/activation.rs:30-37`.
- **Problem:** A resource over a list asks through members. Each member is a copy of the list's row, placed after the declared rows (`runner/src/runner/each.rs:133-150`). `document_checkpoint` removes the ticket of every open stream from `pending`. It then lists `open` only for a declared row that holds a request of its own. The list's row holds none. So the elements' open streams are in neither list.
- **Effect:** An inferred JS page can get `Interaction`. The render has let the streams go, and nothing subscribes again until the reader acts. This breaks the commit's own rule: "An inferred page with an open stream activates at once in both renderers". Before the change, such a page was eager. The Bun renderer makes one `res` per element under the list's name (`host/web-js/each.js:23`), and `build.mjs:590` lists each in `open`.
- **Edit:** In `document_checkpoint`, collect the declared row of each open stream. Test `open_rows.contains(&i)` at line 134:
  ```rust
  let open_rows: Vec<usize> = (self.pending.iter())
      .filter(|p| !p.in_flight())
      .filter_map(|p| match p.target {
          Target::Resource(i) => Some(self.member(i).map_or(i, |m| m.family)),
          Target::Mutation(_) => None,
      })
      .collect();
  ```
  The boot rule stays correct, because a list's row in `refresh_next` asks each element again (`settlement.rs:458`). Add a runner test: a streaming resource over a list is listed as open. If lists of streams are out of scope, state that limit in LLP 1048.000 D6 and in the commit message.

### B3. A stream with frequent messages still holds a Rust render to its deadline (pass 1 semantics)
- **Where:** `host/render/src/lib.rs:784-806` and `:808-829`.
- **Problem (by reading):** The completion check runs only after a `drain()` that returns nothing. `drain()` returns at most one completion (`host/apple/src/executor_core.rs:691-735`), and each message of an open stream is one completion. If messages arrive faster than the render commits them, every `drain()` has a message. The loop then continues at line 806 until the deadline, and the page answers 503.
- **Comparison:** The Bun renderer's loop stops when `outstanding()` is false (`build.mjs:579-580`). An open stream does not count there, so the Bun renderer completes at any message rate.
- **Edit:** After the outcomes of one `drain()` are fulfilled and the deadline check passes, run the same completion check before `continue`. Put the predicate at lines 809-821 in one closure and call it from both places. A request asked by the last commit is already in `runner.pending()`, so the early return cannot skip it. `lib.rs` has 1,473 of 1,500 lines, so keep the edit small. To test it, the server in `stream.rs` can write events without a pause after the first one.

### B4. The Test Plan says a suite passes, but the log shows its adoption tests were skipped (pass 6 verification)
- **Where:** Test Plan, paragraph 4: "…and `host/web/tests/document.test.mjs`, pass, each in its own process."
- **Problem:** `open-bun-document.test.log` shows 31 pass and 11 skip. The skip lines say there was no current Caltrain wasm dist and no `EXACT_WEB_LINK=all` dist. The skipped tests include the ones where the wasm runtime adopts a rendered page, for example "the render server's page is the document, and the runtime adopts it" (`document.test.mjs:368`). That path reads the changed `checkpoint` and `read_checkpoint` and the runner's checkpoint boot.
- **Edit:** Build the dist the skip line names (`bun host/web/build.mjs caltrain-web --wasm`) and run the suite again. Otherwise, write that those tests were skipped and why.

## Nonblocking findings

- **N1 (pass 3 simplicity).** `checkpoint.rs:134-137` is the same predicate as `Runner::streaming(i)` (`commit.rs:1086-1092`). Edit: call `self.streaming(i)` and remove `Target` from the import at line 4. The B2 edit replaces these lines anyway.

- **N2 (pass 1 semantics, pass 5 writing).** A route that declares `interaction`.
  - `activation.rs:62-78` changes a declared `interaction` to `Inferred` only when `state.pending` is not empty. An open stream was in `pending` before this change and is not now.
  - So on the render host, such a page now keeps `interaction`. The Bun renderer always did this (`render.mjs:204`).
  - I think this is correct: the author's declaration wins, and D6's "Interaction pages" bullet overrides it only for pending answers or continuous handlers.
  - The problem is that the commit's reason for the inferred rule ("since its runtime has a stream to subscribe again") also fits this route, and nothing states the choice.
  - Edit: add "A route that declares `interaction` keeps it, and its stream is asked again when the reader first acts" to How and to `llp/1048.000-pages-at-build.spec.md:270-282`.

- **N3 (pass 5 writing).** Two LLP passages are now stale.
  - LLP 1048.007 D1 (`:29-41`) lists when an undeclared route waits. Both renderers now also require no open stream (`activation.rs:32`, `render.mjs:54`), but D1 does not say so. Edit: add "**No stream is open.** Its runtime subscribes again (LLP 1048.000 D6)."
  - LLP 1048.000 lines 317-318 say a seeded answer is asked again "only when its arguments or inputs change". Edit: add "or when its stream was open (D6)".

- **N4 (pass 4 tests).** `host/render/tests/it/stream.rs:49-67`.
  - The server thread is detached, so the test does not show the How claim that a settled render lets the stream go. By reading, the claim holds: `lib.rs:507-512` forgets every ticket before it pools the executor, and the core aborts a running stream (`executor_core.rs:627-636`, `executor_forget.rs:141-151`).
  - The comment at lines 49-52 explains the negative control with the transport's 15 s limit. `QUEUE.md` lists that limit as a defect to remove.
  - Edit: keep the `JoinHandle` and return the last `read` result. After the render's assertions, join the thread and assert `Ok(0)`. Reword the comment: "A render that waited for the stream to end would end at its deadline, or when its transport gave up on the silent body, with the stream no longer open."

- **N5 (pass 4 tests).** `open` has no test at the lowest level. Edit, in `host/web/tests/it/page.rs`:
  - Add `,"open":["a"]` to the text at line 146 and assert `read.open == ["a"]`.
  - In `a_checkpoint_reads_back_as_the_runner_wrote_it` (line 116), assert that the JSON has no `"open"` key.

- **N6 (pass 4 tests).** Long polls. The settle rule needs `is_open_stream` to be false after a heartbeat and true after the first event. The code is right, because a heartbeat counts no message (`commit.rs:1168-1171`), but no Rust test pins it. Edit: in `stream_tests.rs:334`, assert `!r.is_open_stream(ticket)` and `listed(&r) == (["progress"], [])` after the heartbeat, and the opposite after `message("5", 0)`.

- **N7 (pass 1 semantics).** `pending(x)` and the settled-tree shortcut.
  - A runner booted from a checkpoint with `open` asks the stream at boot when its source is ready. Its first tree then reads `pending(x)` true, but the settled runner reads it false.
  - `projects_as_booted` (`lib.rs:165-191`) claims the two trees differ only in state that a slot fixes when it is made. That is no longer true for a view that reads `pending(x)` of an open stream.
  - The JS runtime also varies: it reads true for a TypeScript source (`rt.js:521-524`) and false for a Rust module that is not ready (`rt.js:528-529`).
  - The worst result is one fresh render instead of adoption.
  - Edit: state this limit in the `projects_as_booted` comment and in the new D6 bullet.

- **N8 (pass 5 writing).** Commit message, Why and How.
  - "When a page changes hands" is figurative. Write "When the runtime adopts a page".
  - Remove "as a browser's `EventSource` reconnects only its own stream". An `EventSource` reconnection sends `Last-Event-ID`, but this ask starts a new subscription.
  - "A rendered page's checkpoint also marks no answer…" is true only of the Rust renderer. Write "The Rust renderer's checkpoint…".
  - In How, the `forget` call lets the stream go, not the return to the pool. Write "lets go of its requests, which aborts the stream, and returns its executor to the worker's pool".
  - Put `ibex2` in backticks.

- **N9 (pass 6 verification).** Test Plan precision.
  - The full four-crate run (`open-cargo-test.log`) used the earlier test name `…_and_stays_listed`, so the tree changed after it. On `54d1fd2e9b`, only the new and changed tests ran. Edit: rerun the four crates or name the tree that the full run covered.
  - The Bun renderer's edits (`build.mjs:590`, `render.mjs:54`) have no logged negative control. By reading, the JS test's assertions catch each edit. Edit: say so, or run the controls.
  - Edit: write "Only the renders ask the peer for the page's label."
  - "Firefox is excluded" is misleading. The failing tests loop over Chromium, Firefox and WebKit in turn (`document-render.test.mjs:747`, `:804`, `:838`), so their WebKit part never ran. Edit: "In the tests that drive Chromium, Firefox and WebKit in turn, Firefox fails to launch ("Could not find profile folder"), so their WebKit part did not run; their Chromium part passes."
  - Add "overlay" to the list of `js-runtime.test.mjs` failures that also fail on main.

- **N10 (pass 5 writing).** LLP 1048.000 lines 225-227. Edit: "…and asking again subscribes the reader's runtime to it. The page's other answers are not asked again because of it."

- **N11 (pass 5 writing).** `rt.js:1416` cites "LLP 1048.000 D4" for the checkpoint. The checkpoint is D6. The change edits this comment, so fix the citation in the same edit.

- **N12 (pass 4 tests).** `document-agent.test.mjs:103`. The 30 s limit includes an app build, and `open-document-agent.log` shows the build reaching that limit. Edit: raise the limit to 60 s, as the test that ends at line 870 does.

- **N13 (pass 5 writing).** The comment at `lib.rs:813-815` is true only for a resource's stream. A mutation's open stream also lets the render settle, and the checkpoint lists it nowhere. This matches the Bun renderer. Edit: add "A mutation's stream ends with the render."

## Results by pass

**Pass 1, semantics.** Findings: B2, B3, N2 and N7.
- **Model.** The per-resource `open` list is correct. D6 says a checkpoint answer is an answer the runtime already has.
  - The page-wide `revalidate` asks every answer again; `open-neg-js-pagewide.log` shows the extra label request.
  - Listing an open stream in `pending` would overload that field. The activation rules read `pending` as a partial document (`activation.rs:31`, `:63`; `render.mjs:54`).
- **Rendered answer.** "Show the rendered answer, ask its source again" is correct in both runtimes.
  - The runner asks at boot or at `data_ready` (`runner.rs:964-972`).
  - The JS runtime asks at launch (`rt.js:463`).
  - While the new stream waits for its first message, `pending(x)` is true (LLP 1016.000 D1).
- **Runner's open-stream definition.** It is exact for uploads, held asks, timed asks, long polls and stale rows (`commit.rs:1434`). Elements are not covered (B2).
- **Bun renderer's open-stream definition.** It is exact for the same cases. It lists an element once per element, which does no harm.

**Pass 2, correctness.** B1. No other findings.
- `read_checkpoint` still refuses unknown fields.
- Both renderers write `open` only when it has entries.
- A page without an open stream keeps the same bytes, so its digest does not change (`page.rs:552`).
- A deferred checkpoint keeps `open`.

**Pass 3, simplicity.** N1 only. The change adds no apparatus.

**Pass 4, tests.** N4, N5, N6 and N12.
- The negative controls are the right ones, and their failing lines match the committed files.
- `open-neg-boot.log` also removes the listing, which the checkpoint test does not read. This does no harm.

**Pass 5, writing.** N2, N3, N8, N10, N11 and N13.

**Pass 6, verification.** B1, B4 and N9.
- The other claims match the logs: the negative controls, the reruns, formatting, Clippy, boot and difftest.
- There is no caps log. The changed files are within the 1,500-line cap; the largest is `document-render.test.mjs` at 1,498 lines.

NOT READY
