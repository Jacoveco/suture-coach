# Suture-Coach — Living Plan

_Last updated: 2026-08-22. This file reflects current status only — update it in place as milestones complete, don't append a history log._

## Product summary

Mobile-first Next.js app: trainees upload/capture a photo or video of a suturing practice attempt (simulators/training models only, never real patients), Claude's vision API analyzes technique, the app renders feedback + visual overlays (spacing/tension/symmetry). See `CLAUDE.md` for full product and compliance constraints.

## Where things stand right now

**Device setup (this machine):** fully done. git/Node.js LTS/GitHub CLI installed via winget; git identity configured; `gh` authenticated via a `GH_TOKEN` persisted as a Windows user env var (survives reboots/future sessions); repo is live at **https://github.com/Jacoveco/suture-coach** (private) with `gh auth setup-git` configured so plain `git push` works with no token wrangling. See the memory notes on this machine for the fine-grained-PAT gotchas that had to be worked around (repo-creation needs an account-level Administration permission the token didn't have; a repo created after the token was minted needs to be explicitly added to the token's repository list + Contents:Read-and-write).

**App scaffold:** Next.js 16.2.12 (App Router), React 19.2.4, TypeScript, Tailwind v4, ESLint — builds and lints cleanly (`npm run build`, `npx eslint .`). Root `AGENTS.md` adopted from the scaffold (points future coding sessions at `node_modules/next/dist/docs/`, since this Next.js version is newer than any training data). `.gitignore` extended for test artifacts + `.env.local.example` exception.

**Cross-machine + LAN access: done.** See `docs/DEVELOPMENT.md` for the full runbook. Summary:
- The app has zero OS-specific code (no hardcoded paths, no `process.platform` branching) — confirmed by grepping the source. `package.json` now pins `engines.node >= 20.11.0` and a `.nvmrc` (`24`) is checked in so a second machine (e.g. a MacBook) gets a matching Node version via `nvm use`.
- `next dev` already binds to `0.0.0.0` and prints a `Network:` URL on startup in this Next.js version — no config needed for that part.
- Verified the actual blocker for phone access is **not** firewall or binding, but Next.js's dev-only cross-origin protection: a same-origin page/script load doesn't send an `Origin` header so it already worked, but the dev server's Hot-Reload **WebSocket connection always sends `Origin`**, so without an allowlist entry, loading the app from a LAN IP silently broke live-reload from that device. Fixed by adding `allowedDevOrigins: ["192.168.*.*", "10.*.*.*"]` to `next.config.ts` — confirmed via direct `curl` with an `Origin` header that the LAN IP is now allowed while an unrelated origin still correctly gets a 403, then confirmed the full capture → analyze → feedback flow works when loaded via the machine's actual LAN IP in headless Chromium.
- This machine's Windows Firewall already had a rule allowing `node.exe` inbound on the "Public" profile, which is what this Wi-Fi network is categorized as — confirmed via `Get-NetFirewallRule`/`Get-NetConnectionProfile` rather than assumed. `docs/DEVELOPMENT.md` documents what to check if a different machine's firewall isn't preconfigured this way (both Windows and macOS).

**Analysis pipeline (M1 + M2): done.**
- `lib/env.ts` — Zod-validated env accessor (`ANTHROPIC_API_KEY` required; `ANALYSIS_MODEL`, `USE_FAKE_ANALYSIS`, `MAX_UPLOAD_SIZE_MB` optional with defaults).
- `lib/anthropic/client.ts` — the one Anthropic SDK client singleton.
- `lib/analysis/schema.ts` — the one Zod schema for `SutureAnalysis` (metrics, recommendations, normalized-coordinate annotations, disclaimer).
- `lib/analysis/prompt.ts` — the one system-prompt builder.
- `lib/analysis/analyzeSuture.ts` — the one function that calls the vision API. Uses `client.messages.parse()` + `zodOutputFormat()` (verified against the installed `@anthropic-ai/sdk` v0.120 source, not assumed from memory) for guaranteed-valid structured JSON output; model defaults to `claude-opus-5` via `ANALYSIS_MODEL`; thinking left on its adaptive default with `effort: "low"` for cost/latency (deliberately not disabling thinking — disabling it has known failure modes on this model family).
- `lib/analysis/fixtures.ts` — canned `SutureAnalysis` used both for `USE_FAKE_ANALYSIS=true` and as the shared test fixture (single source, no duplicate mock data).
- `lib/media/validate.ts` + `lib/media/extractFrames.ts` — upload validation and the pure frame-timestamp-selection logic (DOM-heavy extraction itself needs a real browser, so only the pure logic is unit-tested for now).
- Vitest configured (`vitest.config.mts`, jsdom environment) — `.env.local.example` written.

**Capture UI + API route + feedback/overlay UI (M3–M6): done.**
- `components/capture/MediaCapture.tsx` — native `<input type="file" capture="environment">` (camera) + a second library-picker input, client-side validation via `lib/media/validate.ts`, inline error text.
- `app/api/analyze/route.ts` — `POST` handler: parses multipart `media` file(s) + optional `notes`, validates, base64-encodes, calls `analyzeSuture()`, returns `{analysis}` or a typed `{error: {code, message}}`. `app/api/health/route.ts` added too.
- `components/feedback/FeedbackSummary.tsx` + `RecommendationList.tsx` — render metrics/scores/disclaimer and prioritized recommendations from a `SutureAnalysis`.
- `components/visualization/SutureOverlay.tsx` — SVG (`viewBox="0 0 1 1"`) overlay on top of the source image; each annotation is a focusable, accessibly-labeled `<g>`.
- `app/page.tsx` rewritten (placeholder removed) to wire the whole flow: capture → POST /api/analyze → analyzing/error/done states → overlay + feedback.
- **Gotcha hit and fixed**: a server-only route test (`route.test.ts`) that builds a real `Request`/`FormData`/`File` fails under Vitest's `jsdom` environment — jsdom ships its own `FormData`/`File` implementation whose webidl brand-check rejects Node's native `File` across the realm boundary (`assert(... webidl.is.File(value))` throws). Fixed with a per-file `// @vitest-environment node` directive on that test rather than restructuring the whole suite into node/jsdom projects. Also needed `vi.hoisted()` for `vi.mock()` factories referencing an outer `vi.fn()` (relying on the undocumented "mock"-prefix hoisting leniency was inconsistent), and an explicit `afterEach(cleanup)` in `vitest.setup.mts` (RTL's automatic cleanup only self-registers when it detects vitest's *global* test hooks, which aren't in scope since `vitest.config.mts` doesn't set `test.globals: true`).
- **Verified in a real browser, not just tests**: ran `next dev` with `USE_FAKE_ANALYSIS=true`, drove it with a small Playwright script at an iPhone-13 viewport (Chromium installed via `npx playwright install chromium`) — confirmed the heading/buttons render, a file upload triggers the analyzing state then the feedback summary + recommendations + correctly-positioned overlay annotations render, and zero console/page errors. Screenshots + driver script were scratch-only, not committed.
- **38 tests passing**, `npm run build` and `npx eslint .` both clean.

**Video support (M7): done.**
- `lib/media/extractFrames.ts` reworked so `extractFramesFromVideo()` returns ready-to-upload JPEG `File`s (via `canvas.toBlob`) instead of base64 strings — no wasteful base64 round-trip, and it flows through the exact same multipart path as a photo.
- `app/page.tsx`: `handleFileSelected` branches on `isVideoFile()`; a video goes through a new `"extracting"` flow state, calls `extractFramesFromVideo()`, and on success submits **all** extracted frames as separate `media` entries in one `/api/analyze` request (the route already accepted multiple entries via `formData.getAll("media")`, so no server change was needed). The middle extracted frame is used as the overlay preview image. Extraction failure surfaces a clear error ("try a different clip, or upload a photo instead") without ever calling the API.
- `app/page.test.tsx` — component tests mocking `extractFramesFromVideo` and `fetch`: photo path submits 1 file, video path submits all extracted frames, extraction failure shows an error and never calls the API, API failure and network failure both surface their respective error messages. **43 tests passing total.**
- **Verified with a real video in a real browser** (not just mocks): since no video files existed to test with and `ffmpeg` isn't installed on this machine, generated one — used `sharp` (already vendored by Next.js) to synthesize 30 solid-color JPEG frames, then muxed them into a WebM with Playwright's own bundled `ffmpeg` binary (`node_modules`-adjacent, ships for its video-recording feature) piped through its `image2pipe` demuxer. Uploaded that WebM through the real `MediaCapture` input in headless Chromium against `next dev` with `USE_FAKE_ANALYSIS=true`: confirmed the "Extracting frames…" state appeared, the API request fired with the extracted frames, and the feedback UI rendered with the overlay drawn on the actual middle extracted frame (visibly one of the synthetic colors) — zero console errors. All driver scripts, generated media, and screenshots were scratch-only and removed after.

**Playwright e2e suite (M8): done.**
- `playwright.config.ts` — `mobile-chrome` project using `devices["iPhone 13"]` (Playwright's iPhone preset actually launches **WebKit/Safari** by default, not Chromium — installed separately via `npx playwright install webkit`, since it's more representative of real iPhones anyway). `webServer` runs `npm run dev -- --port 3100` with `USE_FAKE_ANALYSIS=true` and `reuseExistingServer` outside CI.
- `tests/fixtures/images/synthetic-suture-sample.jpg` — a small SVG-rendered-to-JPEG line drawing (a "wound line" with stitch marks, explicitly labeled "not a real photo" in the image itself), generated via `sharp`. The only media file checked into the repo, per CLAUDE.md's synthetic-fixtures rule.
- `e2e/upload-analyze-feedback.spec.ts` — uploads the fixture image, asserts the analyzing state, feedback, an accessibly-labeled overlay annotation, and the disclaimer all render; a second test asserts the inline error path for an unsupported file type.
- **Two real bugs caught in the test script itself, not the app**, both fixed: (1) `page.getByRole("alert")` matched two elements — our own error `<p>` *and* Next.js's own `#__next-route-announcer__` div, which also carries `role="alert"` for screen-reader route-change announcements; fixed by asserting on the error text directly. (2) The overlay's accessible name comes from `annotation.note ?? annotation.label` (note takes priority) — the test asserted the `label` field and failed against the real component behavior, which matches what `SutureOverlay.test.tsx` already correctly asserts.
- Both e2e tests pass; full suite (`vitest`, `eslint`, `next build`) stays clean alongside it.

**Cross-machine + LAN access: done** (see above) — pushed as commit `4910eae`.

Pushed to GitHub through commit `4910eae`; M8 is the next commit.

## Architecture decisions already made (see full rationale worked out with a planning subagent, condensed here)

- **Capture**: native `<input type="file" accept="image/*,video/*" capture="environment">`, not a custom camera component.
- **Video → frames**: client-side `<video>`+`<canvas>` extraction (seek N timestamps, draw, `toBlob`), not ffmpeg.wasm.
- **Analysis API call**: single canonical module `lib/analysis/analyzeSuture.ts` — the only place the Anthropic SDK is imported. Model: **`claude-opus-5`** by default, overridable via `ANALYSIS_MODEL` env var (documented as an explicit cost/quality tradeoff the user can revisit — Sonnet 5 is the cheaper alternative if Opus proves too costly at volume). Structured JSON output via `output_config.format` (json_schema) using `client.messages.parse()` + `zodOutputFormat()` from `@anthropic-ai/sdk/helpers/zod` — not tool-use, not assistant prefill (prefill is a 400 on this model family anyway). Leave `thinking` on its adaptive default (don't disable it — disabling has known failure modes: tool-call-as-plain-text and `<thinking>` tag leakage); control cost/latency via `output_config.effort: "low"` or `"medium"` instead.
- **Schema** (`lib/analysis/schema.ts`, Zod): `summary`, `metrics.{spacing,tension,symmetry}` (score + note), `recommendations[]` (title/detail/priority), `annotations[]` (normalized 0–1 coordinates for overlay rendering), `disclaimer` (model restates "training tool, not diagnostic").
- **Overlays**: SVG with `viewBox="0 0 1 1"`, not canvas — normalized coordinates map directly, and it's RTL-testable.
- **API route**: `POST /api/analyze`, stateless — no DB/blob storage in v1 (persistence explicitly deferred as a compliance decision point per CLAUDE.md's Data Handling section, not defaulted in).
- **Env vars**: `ANTHROPIC_API_KEY` (required, server-only), `ANALYSIS_MODEL` (optional override), `USE_FAKE_ANALYSIS` (bypass real API for e2e/dev), `MAX_UPLOAD_SIZE_MB`.
- **Testing**: Vitest workspace (`node` env for `lib/**`, `jsdom` for `components/**`), tests co-located with source; Playwright e2e in top-level `e2e/`; one shared `tests/fixtures/` (synthetic image + canned mock API responses) reused everywhere; Anthropic SDK always mocked in tests, never called for real.

## Milestones

| # | Milestone | Status |
|---|---|---|
| M0 | Repo scaffold, tooling, GitHub push, trivial passing test | **Done** |
| M1 | Env validation (`lib/env.ts`) + Anthropic client singleton + Zod schema w/ tests | **Done** |
| M2 | Canonical `analyzeSuture()` + prompt builder, unit-tested against a mocked SDK | **Done** |
| M3 | Capture UI (photo path, mobile-first) | **Done** |
| M4 | `/api/analyze` route (photo only) | **Done** |
| M5 | Feedback UI (`FeedbackSummary`, `RecommendationList`) | **Done** |
| M6 | Visualization overlay (`SutureOverlay`, SVG) | **Done** |
| M7 | Video support (client-side frame extraction) | **Done** |
| M8 | Full Playwright e2e + optional CI | **Done** (CI not set up — no CI provider configured yet, only `forbidOnly`/`retries` are CI-aware) |
| M9 | Polish & compliance pass (disclaimer visibility, error-state audit, v2 backlog) | Not started — **next up** |

## Next session — pick up here

1. **M9**: disclaimer-visibility check (already covered by the e2e test, but worth a deliberate audit of every state, not just the happy path), error-state audit (network failure, oversized file, unsupported codec, model refusal — some already have unit/component coverage, confirm all of them), v2 backlog note in this file.
2. **CI**: no GitHub Actions workflow exists yet. `npm run test`, `npm run e2e` (needs `npx playwright install` in the workflow), `npm run build`, and `npx eslint .` would all need to run on push/PR — confirm with the user whether they want this before adding it (per the original plan's M8 note).
3. Real device check still outstanding: everything so far has been verified via headless Chromium/WebKit at an emulated iPhone-13 viewport, not an actual phone. `docs/DEVELOPMENT.md` now documents how to reach the dev server from a real phone on the same Wi-Fi — worth doing that pass before calling v1 done, especially for the camera-capture (`capture="environment"`) affordance, which emulation can't truly exercise.

## Full architecture reference

See the approved plan file from this session for the complete scaffold layout, folder structure, and per-milestone definition-of-done detail: `C:\Users\jacov\.claude\plans\firstly-i-want-to-zazzy-quill.md` (local to this machine, not part of the repo).
