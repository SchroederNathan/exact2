# A render at an open stream: Opus review, round 2

- **Family:** Anthropic. Opus 5.5 (`claude-opus-5-5`), through Claude Code's Agent tool on account `ide@expo.dev`, effort max, in a frozen worktree at `01dede0fe4` (source `21103a9712`) on `063bc57dd0`.
- **Method:** one brief (sha256 `549ae6b9be954f1ead2f12800f7d1307d095d55a5f37e4afaf1827de643818bf`), one reviewer, with settlement, semantics and correctness, simplicity, test and writing, and verification passes. The reviewer read source and logs, ran no build or test, and wrote only in its scratch directory. The author is not a reviewer.
- **Transcription:** the final message, unedited; its paths name the review worktree and the author's logs, and its shas are of the reviewed history.

---

# Review record: `ide/render-settle-open-stream` at `01dede0fe4` (source `21103a9712`), round 2

**Scope.** I read these sources:
- the brief and the round-1 record;
- the range-diff since `54d1fd2e9b`, and the full source diff against `063bc57dd0`;
- the code that each change relies on: runner settlement, list members, the executor's drain, forget and stream delivery, the render host's projection and activation, `rt.js`, `each.js`, `render.mjs` and `build.mjs`;
- the cited LLP sections;
- every `open-r2-*` log, and the round-1 logs that the Test Plan still relies on.

I ran only `git`, file reads and `shasum`. I wrote only in my scratch directory. I built nothing and ran no test. Line numbers are from the frozen worktree. In this record, "the render host" is the Rust renderer (`host/render`), "the Bun renderer" is `host/web-js/render.mjs`, "the runner" is the wasm runtime, and "the JS runtime" is `rt.js`.

**Verdict.** The change is correct, and it is as small as I can find. I found no blocking issue. Five nonblocking findings ask for text edits. N1 completes round 1's N7. N2 makes the list rule's prose exact. N3 and N4 are wording. N5 fixes one verb in the Test Plan.

## Blocking findings

None.

## Nonblocking findings

### N1. `projects_as_booted` names the open-stream difference but still claims to be exact (pass 1, pass 3)
- **Where:** `host/render/src/lib.rs:165-175`, and the `Ids::Any` doc at `:147-149`.
- **Problem:** Line 167 says that "what could differ is only state fixed where a slot is first made". Lines 173-175 then name a second difference: a view that reads `pending(x)` of an open stream. The function does not check for it. It cannot, because a plan does not say which source streams. `Ids::Any` still says that the settled tree is projected "when it is provably the checkpoint boot's". A reader cannot tell if this is a known limit or a bug.
- **Effect (by reading):** On such a JavaScript page, the document shows the stream as not pending. The JS runtime asks the stream again at launch (`rt.js:463`, `:523`). For a TypeScript source, its first tree therefore reads `pending(x)` as true. If that changes the view's structure, the runtime stops adoption and builds the page again (`rt.js:636`). Round 1's N7 asked for this limit to be stated. The new comment states the difference, but not the limit.
- **Edit:** In line 167, write "what could differ is state fixed where a slot is first made". Replace lines 173-175 with: "One difference is not looked for, since a plan does not say which source streams: a view that reads `pending(x)` of an open stream reads false here and true in a boot whose source can answer at once, which asks the stream again (LLP 1048.000 D6). A runtime whose first tree differs so renders afresh." In `Ids::Any`, write "when it is the checkpoint boot's, but for that difference".

### N2. The prose says that a runtime shows a listed answer, but the runner never seeds a list (pass 2, pass 3)
- **Where:** the commit message, How, paragraph 2 ("A resource over a list is listed when its elements' streams are …" and "A runtime shows each such answer and asks it again"); `runner/tests/it/each.rs:219-220`.
- **Problem 1:** "when its elements' streams are" can mean all elements or any element. The code lists the list when the list has an answer and any element's stream is open (`runner/src/runner/checkpoint.rs:108-114`, `:133-145`).
- **Problem 2 (by reading; the cause is older than this branch):**
  - The checkpoint writes a list's answer with the list's state arguments, and these arguments are empty (`runner/src/runner/settlement.rs:404`).
  - `seed_checkpoint` skips an answer whose argument count is not the row's (`checkpoint.rs:184`). A list row's count is the count of its call's arguments (`contract/lower/src/resource_args.rs:39-44`).
  - Thus the runner seeds no list from a checkpoint. It shows no rendered answer for the list, and the boot rule (`runner/src/runner.rs:964-972`) never sees the list. The runner asks each element as a new member when the source can answer.
  - On the wasm runtime, "shows each such answer" is therefore false for a list.
  - The listing still has an effect: it keeps an inferred page from waiting for the reader (`host/render/src/activation.rs:32`). The each.rs test checks the listing, and that is the correct test.
- **Edit:** In How, write: "In the Rust renderer, a resource over a list is listed when any of its elements' streams is open, since its checkpoint lists no element's answer. The runner seeds no list from a checkpoint, so for a list the listing keeps an inferred page from waiting, and the runner asks its elements as it boots." In `each.rs:219-220`, write "when any of its elements' streams is open".

### N3. D6's `pending(x)` sentence does not say when the period starts (pass 3)
- **Where:** `llp/1048.000-pages-at-build.spec.md:228-229`; the commit message, How, paragraph 2, last sentence.
- **Problem:** "Until the new stream's first message, `pending(x)` is true" reads as "from boot". When the source cannot answer at boot, the runner shows the rendered answer as not pending until `data_ready` asks the stream (`runner.rs:965-966`; settlement reuses the seeded value). The JS runtime does the same for a Rust module (`rt.js:526-528`). `pending(x)` becomes true when the stream is asked again.
- **Edit:** "From that ask until the new stream's first message, `pending(x)` is true (LLP 1016.000 D1)." Use the same words in How. If D6 also states N1's limit, add: "A document projected from the settled render then differs in a view that reads it, and a runtime whose first tree differs so renders the page afresh."

### N4. Smaller wording items (pass 3)
- `runner/src/runner/in_flight.rs:138-139`: "a stream past its first message" also describes an upload after its first progress message. That upload stays in flight (`runner/src/runner.rs:300-301`). Edit: "Whether request `ticket` is a stream that has answered: open, no longer in flight (LLP 1016.000 D5). An upload is in flight until its reply (D10)."
- `runner/src/runner/checkpoint.rs:25-27`: "so the stream goes on" suggests that the render's stream continues. That stream ends with the render, and the runtime opens its own stream. Edit: "…and asks it again, which subscribes the runtime to it."
- `host/render/tests/it/stream.rs:35`: "as the server needs to send the next" is not accurate. The server sends without a pause. The sleep gives the transport time to deliver the next message. Edit: "Take long enough with each message for the next to arrive, so one always waits".
- `llp/1048.000-pages-at-build.spec.md:311-313`: the as-built list of the fields in `exact_runner::Checkpoint` does not include `open`, but line 322 now relies on it. Edit: add "and the answered resources whose stream was open".
- `QUEUE.md:12`: "In a render host test whose render waited for its stream to end" refers to a test that is in no file. Edit: "A render host's server-sent-events stream, from a loopback server that sent one event and then held the connection, was closed by the client 15.0 s later."
- The commit message's Why and How use three names for one component: "the Rust render host", "the render host" and "the Rust renderer". Edit: use one name.

### N5. The Test Plan says that the document suite "passes", and in the same paragraph names three failed tests (pass 4)
- **Where:** the commit message, Test Plan, paragraph 4, first two sentences.
- **Problem:** `open-r2-document.log` ends with 39 pass and 3 fail. The sentence says that the file passes, and then names the tests that failed. The facts are correct and complete, but the verb is incorrect. "Its two focusout tests" is also a count in prose, which the owner's rules exclude.
- **Edit:** "`host/web/tests/document.test.mjs`, against a Caltrain wasm dist built from this tree, passes but for its focusout tests and its served-document test, and its adoption tests pass. The focusout tests need a dist built with `EXACT_WEB_LINK=all` and stop at `Unlinked("animations")` on this one. The served-document test reached its 180 s limit during the first compile of `caltrain-render`, and passes alone."

## Results by pass

### Pass 1: settlements
No blocking findings. I agree with each settlement. Only N1 remains, for the wording of N7.
- **B1.** The stand-in at `compare.mjs:38` now returns `open:[]`. `git grep __render` finds no other stand-in. The paint tests pass in `open-r2-paint.log` and `open-r2-paint-final.log`.
- **B2, with round-1 N1.** The code is the edit that round 1 proposed. The listing is correct. See N2 for the prose.
- **B3, the different edit.** I agree with it, and it is simpler than one closure called from two places.
  - The check runs at the start of each loop pass, after `hand_out` and `settle_aborts`. It thus also runs after each fulfilled reply, after the requests from that reply are handed out.
  - The check can give a different result from main only when each remaining ticket is refused, busy, a re-ask's wait or an open stream. In that state, an undrained outcome can only be a later message or the end of an open stream, or an outcome for a ticket that the runner no longer holds. `Executor::forget` drops it (`host/apple/src/executor_forget.rs:72-78`).
  - A one-shot request in flight still prevents completion.
  - There is one new effect. If a stream ends just after its first message, the checkpoint lists it as open, and the runtime asks it one more time. This is harmless.
  - `drain()` returns one completion at most (`host/render/src/executor.rs:83`). Undelivered messages of one stream coalesce into one (`host/apple/src/executor_stream.rs:245-300`). With the fix, `parsed == 1` is therefore exact, and it does not depend on the 5 ms sleep. The flood control parsed 649 messages, so the test detects the old order.
- **B4.** The suite now runs against a dist built from this tree. See N5 for the verb.
- **N2 to N6, N8 to N13.** Each edit is in the tree.
- **N7.** I agree with a statement rather than a change. A check of every plan that reads `pending(x)` would remove the direct projection from most plans, and a plan does not say which source streams. But the statement is incomplete (N1).
- **Records commit.** `open-r1.opus.final.md` and the body of the record have the same sha256 (`4363963823bb06a01902960f8f84664fa33d6d7c7d22269d5490f585229e13d8`), and `cmp` finds them identical. The round-1 brief's sha256 is `b0d74e0a…b1`, as the record says.

### Pass 2: semantics and correctness
No blocking findings. N2 is about prose. I checked these points:
- The settle rule is the `clock settle` rule of LLP 1016.000 D5: an open stream is not in flight.
- `is_open_stream` (`in_flight.rs:140-142`) does not include an upload, which stays in flight until its reply. It also does not include a long poll that received only heartbeats, because a heartbeat counts no message (`commit.rs:1166-1171`). `stream_tests.rs:359-364` checks the long poll.
- All tickets come from `next_ticket`: requests, tools, module work, the background round and devices. Thus `is_open_stream` cannot match a ticket of another kind by number.
- The list rule maps a member to its family. When an element is in flight, the list is pending (`pending_families`), so the list is not answered and not open. A member that has left holds no ticket.
- The Bun renderer's `open` and `continuing` divide the resources that hold a ticket by `pending()` (`build.mjs:590`). An upload, and a long poll after a heartbeat, stay pending (`rt.js:408`, `:418`, `:480`), so they stay in `continuing`. The render host gives the same result.
- `rt.js:1426` reads `open` one time. `baked` reads it only when the page kept the answer (`rt.js:463`). A deferred checkpoint is the full text, so it keeps `open` (`render.mjs:214-215`).
- A route that declares `interaction` keeps it in both renderers (`activation.rs:62-78`, `render.mjs:204`). LLP 1048.000 says this.
- A `cached` route with a stream now gets a 200 page that shows the stream's first message, with the cache lifetime (`serve.rs:1340`). Before, it got a 503 at the deadline. Each reader's runtime subscribes again. I think that this is correct.
- When a render settles, it aborts the stream. `forget` aborts the running stream. The rustls transport also shuts down the socket on an abort (`rustls_http.rs:524-528`), so a connection to a silent server also closes. The test's server is not silent, so the test uses the reader's path, not this one.

### Pass 3: simplicity, tests and writing
No blocking findings. N1, N2, N3 and N4 apply.
- **Simplicity.** The change adds no apparatus. Each part is the smallest that I can find: one predicate, one moved check, and one field that each renderer writes and each runtime reads. The boot rule copies `seed_kept_modules` (`kept.rs:382-385`). `push_names` and `read_names` remove duplicated code.
- **Tests.** Each rule has a test at the lowest level that shows it. In the stream test, the real server is the purpose of the test. The 5 ms sleep is not a wait: it keeps a message ready so that the negative control fails. The new `Listener` source is necessary, because `Receiver` gives only one-shot answers, and the runner's unit tests cannot compile Contract.
- **Writing.** The commit message has Why, How and Test Plan sections, each underlined, in the indicative mood. Its numbers are measured values, except "two focusout tests" (N5). The title has 67 characters.

### Pass 4: verification
No blocking findings. N5 applies. The logs support each other claim:
- **Tree.** The logs ran before the last amend (committer time 07:13). The failed lines in the later controls agree with the committed files. The full run uses the committed test names.
- **Four crates.** `open-r2-cargo-test.log` fails only `a_burst_of_photo_uploads_goes_three_at_a_time_and_leaves_other_streams_their_places` ("an outcome within five seconds: Timeout"). `open-r2-rerun-burst.log` passes that test alone.
- **Rust controls.** Each control fails at the line that agrees with the Test Plan:
  - `stream.rs:90`, settle rule: `Deadline` after 60.34 s;
  - `stream.rs:91`, completion check: 649 messages parsed, 19.63 s;
  - `stream.rs:113`, activation rule: `Interaction`;
  - `stream_tests.rs:207` and `:364`, listing;
  - `each.rs:245`, list rule;
  - `checkpoint.rs:231` and `:240`, boot rule, from round 1. `contract/cli/tests/it/checkpoint.rs` and `runner/src/runner.rs` did not change after round 1.
- **Bun and runtime controls.** `document-agent.test.mjs:73` fails without `open` and without the activation rule. `:75` fails with the old `continuing`. The round-1 runtime controls still apply, because after round 1, `rt.js` changed only in a comment and the test changed only in its time limit. `open-r2-document-agent.log` shows that the whole file passes.
- **Other Bun suites.** The build, held, long-poll, resource-inspection, store-reader and stream-abort suites, `document-render.test.mjs` and `js-runtime.test.mjs` have round-1 logs. After round 1, `host/web-js` changed only in the limit and the comment above. No later Rust change reaches these suites. Each failure in the branch's `js-runtime` log also occurs in `open-main-js-runtime.log`.
- **Checks.** The format, Clippy, boot and difftest logs pass. There is no caps log. `PresenterIOS.swift` has 1,503 lines on main. Each changed source file has fewer than 1,500 lines; the largest is `document-render.test.mjs`, with 1,498.

## Outside the branch (no effect on the verdict)
- **O1.** The JS runtime keys kept answers by resource name (`rt.js:1427`). Each list element's `res` uses the list's name (`each.js:23`). Thus each element starts from one shared entry (`rt.js:461-462`). From the render host, that entry is the whole list with empty arguments. From the Bun renderer, it is the last element's answer. An element is asked again when its arguments are different (`rt.js:494`), or, with this branch, when the list is `open`. Until then, the element shows that shared entry. Edit: add a `QUEUE.md` line.
- **O2.** `host/web-js/checkpoint.js:5` cites "LLP 1048.000 D4" for the checkpoint. The correct section is D6, as round 1's N11 fixed in `rt.js`.

READY
