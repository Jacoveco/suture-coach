# Suture-Coach — Living Plan

_Last updated: 2026-07-29. This file reflects current status only — update it in place as milestones complete, don't append a history log._

## Product summary

Mobile-first Next.js app: trainees upload/capture a photo or video of a suturing practice attempt (simulators/training models only, never real patients), Claude's vision API analyzes technique, the app renders feedback + visual overlays (spacing/tension/symmetry). See `CLAUDE.md` for full product and compliance constraints.

## Where things stand right now

**Device setup (this machine):**
- git, Node.js LTS, GitHub CLI installed via winget. ✅
- git identity configured (`jacoveco` / `jacoveco@gmail.com`). ✅
- `gh` authenticated via `GH_TOKEN` — a fine-grained PAT persisted as a **Windows user environment variable** (not via `gh auth login`, which had an unrelated stdin/validation quirk in this shell — `GH_TOKEN` is the officially-supported path and works). This persists across reboots and future sessions automatically. ✅
- **BLOCKED:** `gh repo create` failed — `GraphQL: Resource not accessible by personal access token (createRepository)`. The fine-grained PAT lacks the **Administration: Read and write** *account permission* (this is separate from repository-level permissions and is required to create new repos). **Next session, resolve one of:**
  - (a) You create the empty private repo `suture-coach` on github.com yourself, then I add it as `origin` and push, or
  - (b) You edit the token's permissions to add Administration: Read and write (account-level), then I retry `gh repo create suture-coach --private --source=. --remote=origin --push`.
- Local git repo is initialized at `c:\vscodeProjects` with one commit (`ee5d808`, "Initial Next.js scaffold for suture-coach") — **not yet pushed anywhere**, since no GitHub remote exists yet.

**App scaffold:**
- `create-next-app` scaffold in place: Next.js 16.2.12 (App Router), React 19.2.4, TypeScript, Tailwind v4, ESLint. ✅
- Root `AGENTS.md` adopted from the scaffold — tells future coding sessions to read `node_modules/next/dist/docs/` before writing Next.js-specific code, since this Next.js version is newer than any training data. `CLAUDE.md`'s existing `@AGENTS.md` import now resolves to real content. ✅
- `.gitignore` extended with Playwright/test-artifact ignores and a `!.env.local.example` exception so the example env file doesn't get swallowed by the broad `.env*` rule. ✅
- **Not yet done:** `npm install` verification / `npm run dev` smoke test on this machine (dependencies were installed during scaffold, but haven't been re-verified since the file move into the repo root).

**Application code:** none yet beyond the placeholder `app/page.tsx` from `create-next-app`. M1 onward (below) has not started.

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
| M0 | Repo scaffold, tooling, GitHub push, trivial passing test | **In progress** — scaffold done, GitHub push blocked (see above), no tests configured yet |
| M1 | Env validation (`lib/env.ts`) + Anthropic client singleton + Zod schema w/ tests | Not started |
| M2 | Canonical `analyzeSuture()` + prompt builder, unit-tested against a mocked SDK | Not started |
| M3 | Capture UI (photo path, mobile-first) | Not started |
| M4 | `/api/analyze` route (photo only) | Not started |
| M5 | Feedback UI (`FeedbackSummary`, `RecommendationList`) | Not started |
| M6 | Visualization overlay (`SutureOverlay`, SVG) | Not started |
| M7 | Video support (client-side frame extraction) | Not started |
| M8 | Full Playwright e2e + optional CI | Not started |
| M9 | Polish & compliance pass (disclaimer visibility, error-state audit, v2 backlog) | Not started |

## Next session — pick up here

1. Resolve the GitHub repo-creation blocker (see two options above), then push the existing local commit.
2. `npm install` + `npm run dev` sanity check in the actual repo location.
3. Set up Vitest (workspace config) + Playwright with one trivial passing test each — completes M0.
4. Start M1: `lib/env.ts`, `lib/anthropic/client.ts`, `lib/analysis/schema.ts`.
5. `.env.local.example` still needs to be created (documented in the architecture above, not yet written to disk).

## Full architecture reference

See the approved plan file from this session for the complete scaffold layout, folder structure, and per-milestone definition-of-done detail: `C:\Users\jacov\.claude\plans\firstly-i-want-to-zazzy-quill.md` (local to this machine, not part of the repo).
