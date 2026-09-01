# Suture-Coach v2: Guided Lesson Curriculum

## Context

V1 shipped a single free-form flow: upload a photo/video, get AI feedback, done. It has no
concept of a structured learning path, no memory of past attempts, and no way to teach a
trainee progressively. The user has a physical practice kit (a silicone pad with 14 pre-made
wound sites) and wants the app to turn that into an actual guided course: a sequence of
lessons from basic to advanced technique, each with reference material to learn from and a
photo-based check at the end to see what actually landed.

This plan is **additive only** — nothing in `lib/analysis/` or `app/api/analyze/route.ts` (the
entire v1 analysis pipeline) is modified, and `app/page.tsx`'s logic/behavior is untouched.
Everything new lives in parallel modules, routes, and pages that follow the exact conventions
v1 already established (one Zod schema per concern, one canonical function per API call, lazy
singletons never constructed at build/import time, co-located tests, synthetic-only fixtures).

One correction found while verifying reuse at the type level (see "v1 touchpoints" below):
`RecommendationList`'s prop type must narrow from `{ analysis: SutureAnalysis }` to
`{ recommendations: Recommendation[] }` for v2 to reuse it, which means its one v1 call site
in `app/page.tsx:153` gets a one-line, non-behavioral edit too. Everything else in
`app/page.tsx` is untouched.

Decisions already confirmed with the user:
- **No kit-specific site mapping exists** — propose the full 14-lesson curriculum from scratch.
- **Reference media**: embedded YouTube videos + generated instructional diagrams (no new
  image-gen API — diagrams are hand-authored SVG rendered to PNG via `sharp`, the same
  technique already used for the test fixture).
- **Progress storage**: a simple local server-side store (SQLite) so progress stays in sync
  between the user's PC and phone, both of which already reach this same server over LAN.
- **Evaluation**: lesson-specific grading criteria, not the existing generic
  spacing/tension/symmetry schema reused for everything.
- **Lesson navigation**: free — all 14 always browsable, shown in suggested order, no
  locking.
- **Duration**: informational only ("~15 min" shown on the lesson), no active timer/countdown.

## Decisions made without further questions (flagged, reversible, low-risk)

A few remaining design forks didn't need to block this plan — each is a small, easily-changed
choice, explained here rather than turned into more questions:

- **Progress status is three-state**, not binary: `not_started → attempted → passed`.
  "Attempted" means at least one photo was submitted; "passed" means at least one attempt's
  `overallPass` came back true. This sidesteps having to pick between "any submission counts
  as done" and "must pass to complete" — the UI can show both signals.
- **Attempt photos are not persisted**, only the evaluation result (JSON) is. The app has zero
  persisted media today; storing photos adds open-ended disk growth with no cleanup story yet.
  Flagged as a v2.1 backlog item if attempt photos should be kept for later review.
- **Video curation**: a web-search-assisted pass will draft a real YouTube video ID per lesson
  during Module 6, clearly as a first draft — the user should spot-check them (technique
  accuracy, and that the link hasn't rotted) before treating them as instructional. Swapping
  any `videoId` later is a one-line edit in `lib/curriculum/lessons.ts`.
- **Lesson order 1–14 maps to physical site 1–14** as a placeholder — if the pad numbers
  sites differently, `siteNumber` on each lesson is a trivial edit.
- **No new REST endpoints for listing lessons or reading progress** — `/lessons` and
  `/lessons/[id]` are Server Components that read `lib/curriculum/lessons.ts` and the DB
  directly (idiomatic App Router, avoids a redundant network hop). Only the one action that
  actually mutates state — submitting a lesson attempt — gets a route:
  `POST /api/lessons/[id]/evaluate`.
- **The lesson evaluation's confidence-escalation logic is a separate copy**, not extracted
  into a shared helper with `analyzeSuture.ts` — safer (zero risk to the working v1 file),
  with the DRY cleanup noted as an optional later pass, not bundled into this feature.
- **`better-sqlite3`** is the working assumption for persistence over Node 24's newer built-in
  `node:sqlite` — verify the latter's actual stability in this repo's pinned Node version
  during Module 1 before treating this as final; don't just assume.
- **An explicit "draft curriculum, not instructor-reviewed" caveat** goes on `/lessons`,
  alongside (not replacing) the existing generic non-clinical-tool disclaimer.

## Draft curriculum (14 lessons, bare-bones → complex)

| # | Lesson | Technique | Duration | Evaluation criteria (2–4, gradeable) |
|---|---|---|---|---|
| 1 | Simple Interrupted Suture | Foundational single-throw stitches, tied/cut independently | 15–20 min | Even ~5–7mm spacing; knots flat, off the wound line; edges meet without gapping/overlap; consistent bite depth both sides |
| 2 | Simple Continuous (Running) Suture | One continuous thread for faster closure | 15–20 min | Consistent angle/spacing throughout; even tension along the run; secure start/end knots; even eversion |
| 3 | Vertical Mattress Suture | Far-far-near-near bites for eversion on higher-tension wounds | 20–25 min | Correct far-far-near-near geometry; visible eversion without strangulation; even spacing; appropriate knot tension |
| 4 | Horizontal Mattress Suture | Lateral bites parallel to the wound, for fragile tissue | 20–25 min | Correct horizontal geometry; even tension, no pleating; consistent spacing; good approximation |
| 5 | Locking (Blanket) Continuous Suture | Running suture, each loop locked through the prior stitch | 20–25 min | Each loop correctly locked; uniform tension; even spacing; secure terminal knot |
| 6 | Figure-of-Eight Suture | Crossing pattern for added strength/hemostasis | 15–20 min | Correct crossing geometry; symmetric tension both loops; clean approximation; knot security |
| 7 | Corner (Tip) Stitch | Realigning a wound corner without strangulating it | 20–25 min | Horizontal (not vertical) dermal pass; no tip blanching; precise apex alignment; tension loose enough to preserve perfusion |
| 8 | Subcuticular (Buried Running) Suture | Cosmetic running stitch under the surface, no visible marks | 25–30 min | Stays within dermis, parallel to surface; even fine spacing; no external stitch marks; good cosmetic line |
| 9 | Buried (Deep) Dermal Suture | Buried knot relieving tension off the superficial layer | 20–25 min | Knot fully buried; placed to relieve tension above; symmetric, appropriately deep bites; no suture material through skin |
| 10 | Purse-String Suture | Circular pattern cinching a round defect closed | 15–20 min | Complete even circle around the defect; consistent spacing; closes to a small centered pucker; knot holds |
| 11 | Irregular/Angled Wound Edge Closure | Adapting placement to a jagged simulated wound | 25–30 min | Placement adapts to angle changes; clean alignment, no dog-ears; reasonably even spacing; clean apposition |
| 12 | Two-Layer Closure (Deep + Surface) | Buried dermal layer then a surface layer, same site | 30 min | Deep layer relieves tension first; minimal tension on surface layer; both layers well-executed; clean final line |
| 13 | Knot-Tying Technique Variations | Instrument tie vs. two-handed vs. one-handed, across simpler sites | 20–30 min | Knots square (not granny) and flat; consistent tension; holds under gentle tension; efficient technique visible |
| 14 | Final Mixed-Skill Assessment | Capstone: ≥3 learned stitch types combined on one closure | 30 min | Correct execution of each chosen type; consistent tension/spacing across the closure; clean transitions; overall result |

This is a first-pass instructional design, not sourced from an accredited surgical-education
program — treated the same way the app treats AI feedback generally: a training aid, not an
authoritative standard, ideally reviewed by an instructor.

**Note on Lesson 13**: knot-tying quality is a *process* judgment more than an *end-state
photo* can fully capture. Its evaluation criteria are outcome-only (does the finished knot
look square/secure) — a known weaker fit for photo-only grading than the other lessons.

## Modules (build these across separate sessions, in this order)

Each module is scoped to be independently completable, testable, and committable — matching
CLAUDE.md's testing/version-control policy (tests for every feature, commit+push as each
completes). Modules 1–2 have no dependencies and could be done in either order; 3 depends on
2; 4 depends on 1+3; 5 depends on 2+4; 6 depends on 2 only (can run any time after Module 2).

### Module 1 — Persistence foundation
- Add `DB_PATH` to `lib/env.ts` (Zod-validated like the existing 4 vars, default e.g. `./data/progress.db`).
- `lib/db/client.ts`: lazy `better-sqlite3` singleton (same discipline as `lib/anthropic/client.ts` — never opened at module load/build time), runs `CREATE TABLE IF NOT EXISTS` for `lesson_progress` (`lesson_id`, `status` ∈ not_started/attempted/passed, `updated_at`) and `attempts` (`id`, `lesson_id`, `created_at`, `model_used`, `escalated`, `overall_pass`, `evaluation_json`).
- `lib/db/progress.ts`: typed data-access functions (`getAllProgress`, `getProgressForLesson`, `recordAttempt`, `getAttemptsForLesson`) — the only place raw SQL lives.
- Add `better-sqlite3` as a real dependency (verify it installs cleanly in CI — `ubuntu-latest` — without a source-compile surprise; verify node:sqlite's stability in Node 24 as an alternative before finalizing).
- `.gitignore`: ignore the DB file/directory.
- Unit tests: CRUD + status transitions against an in-memory (`:memory:`) DB per test, reusing the same migration function as production so schemas can't drift.
- **Definition of done**: `npm run test` green, CI still needs zero secrets, `git commit`+push.

### Module 2 — Curriculum content data model
- `lib/curriculum/lessons.ts`: `Lesson` and `EvaluationCriterion` types, `LESSONS` array (all 14 rows from the table above — criteria as `{id: "c1".."c4", label, description}`, `videoId`/`diagramAssetPath` as placeholders for now), `getLessonById`.
- Unit tests: data integrity (unique ids, `order` 1–14 contiguous, durations within 10–30 min, 2–4 criteria each, criterion ids follow the `c1..cN` convention).
- **Definition of done**: tests green, commit+push. (No UI yet — this is pure data.)

### Module 3 — Lesson-specific evaluation pipeline
- `lib/lessons/schema.ts`: `LessonEvaluationSchema` — reuses `RecommendationSchema` and `OverlayAnnotationSchema` from `lib/analysis/schema.ts` directly (not duplicated), replaces the generic `metrics{spacing,tension,symmetry}` with `criteria: [{id, met, note}]` + `overallPass: boolean`, keeps `confidence`/`confidenceReason`/`disclaimer`.
- `lib/lessons/prompt.ts`: one parameterized `buildLessonEvaluationPrompt(lesson: Lesson): string` (not 14 hardcoded prompts) — interpolates the lesson's technique description and criteria (with their ids) into the same non-clinical framing/annotation/confidence-honesty structure `buildSutureAnalysisPrompt` already establishes.
- `lib/lessons/evaluateLessonAttempt.ts`: `analyzeLessonAttempt({lessonId, images, notes?, model?})` — mirrors `analyzeSuture.ts`'s `runAnalysis` + confidence-escalation pattern (same `ESCALATION_MODEL = "claude-opus-5"` logic), plus: validate the model's returned criterion ids are exactly the lesson's expected set (same count, none missing/extra) — treat a mismatch as an error, the same strict-validation posture as the refusal/missing-`parsed_output` checks in `analyzeSuture.ts`.
- Unit tests mirroring `analyzeSuture.test.ts` exactly: mocked `client.messages.parse`, escalation on non-high confidence, no-escalation when already Opus, refusal/missing-output errors, plus new criterion-id-mismatch cases.
- **Definition of done**: tests green (mocked SDK, never a real call), commit+push.

### Module 4 — Lesson evaluation API route
- `app/api/lessons/[id]/evaluate/route.ts`: `POST`, mirrors `app/api/analyze/route.ts`'s structure — top-level try/catch → `server_error` fallback, parses multipart FormData (`media`, `notes?`, `model?`), validates files via the existing `validateMediaFile`, 404s via a typed error if `getLessonById` returns nothing, calls `analyzeLessonAttempt`, on success calls `lib/db/progress.ts` to record the attempt and update `lesson_progress` status, returns `{evaluation, modelUsed, escalated, attemptId}`. Confirm the Next 16 dynamic-route param convention against `node_modules/next/dist/docs/` (params are a `Promise`, per `AGENTS.md`'s warning that this Next.js version differs from training data).
- Route tests (`// @vitest-environment node`, same reason as the existing `route.test.ts`): the same error-state matrix as v1 (no file/bad type/oversized/analysis-failed/server-error) plus unknown-lesson-id 404 and confirmation that a successful call persists a row.
- **Definition of done**: tests green, commit+push.

### Module 5 — Lesson pages and components
- `components/feedback/RecommendationList.tsx`: narrow its prop from `{ analysis: SutureAnalysis }`
  to `{ recommendations: Recommendation[] }` (destructure `.recommendations` at each call site
  instead of internally) — needed because `LessonEvaluation` is not a `SutureAnalysis` (no
  `metrics`), so the component can't accept it as-is. Update the sole existing call site,
  `app/page.tsx:153`, to `<RecommendationList recommendations={state.analysis.recommendations} />`
  — output is identical, type-only change, no behavior difference. `FeedbackSummary` needs no
  such change since v2 doesn't reuse it (see `CriteriaChecklist` below).
- `components/lessons/LessonCard.tsx`, `YouTubeEmbed.tsx` (`youtube-nocookie.com` iframe, lazy-loaded, accessible title), `LessonReference.tsx` (video + diagram, mobile-first stacked), `CriteriaChecklist.tsx` (met/not-met list, parallel to `FeedbackSummary`'s metric grid), `LessonAttemptFlow.tsx` (`"use client"`; reuses `MediaCapture`, `SutureOverlay`, `ModelSelector` unmodified and the newly-narrowed `RecommendationList`; mirrors `app/page.tsx`'s `FlowState` machine, posts to the Module 4 route, renders `CriteriaChecklist` instead of `FeedbackSummary`).
- `app/lessons/page.tsx` (Server Component: list all 14 ordered, progress badge per lesson from `lib/db/progress.ts`), `app/lessons/[id]/page.tsx` (Server Component: `notFound()` on unknown id, renders reference material + criteria + the client `LessonAttemptFlow` island).
- `app/layout.tsx`: add a minimal persistent nav linking `/` (free-form analysis) and `/lessons` — today there's no navigation at all between the two.
- Component tests for each new component, following existing patterns (Testing Library, mocked fetch where relevant).
- **Verify at mobile viewport, not just desktop** (CLAUDE.md's explicit rule) — check in an actual browser, not just the automated tests.
- **Definition of done**: tests green, manually verified in a real browser at mobile width, commit+push.

### Module 6 — Reference media production
- `scripts/diagram-sources/<id>.svg` (14 hand-authored instructional line-art diagrams — schematic, not simulated-wound-realistic, per CLAUDE.md's non-clinical framing) + `scripts/generate-lesson-diagrams.mjs` (rasterizes each via `sharp` to `public/lessons/diagrams/<id>.png`; add an `npm run generate:diagrams` script). Add `sharp` as an explicit devDependency (currently only present transitively via Next.js — pin it directly so a future Next upgrade can't silently drop it).
- Web-search-assisted pass to draft a real `videoId` per lesson in `lib/curriculum/lessons.ts` — flagged clearly (in this doc and to the user) as a first draft needing a spot-check before treating it as instructional.
- **Definition of done**: all 14 diagrams generated and rendering correctly in Module 5's pages, all 14 video embeds loading; commit+push (diagrams as checked-in assets, not regenerated in CI).

### Module 7 — E2E coverage, full regression, docs
- `e2e/lessons-flow.spec.ts`: navigate `/lessons` → open a lesson → confirm diagram+video render → upload the existing synthetic fixture image (`tests/fixtures/images/synthetic-suture-sample.jpg`, no new media needed) → confirm criteria checklist + recommendations + overlay render → navigate back to `/lessons` and confirm the progress badge updated. Uses the same `USE_FAKE_ANALYSIS=true` pattern as the existing e2e suite (no real API calls).
- Point `DB_PATH` at a temp/gitignored location for e2e (via `playwright.config.ts`'s `webServer.env`, same mechanism as `USE_FAKE_ANALYSIS`), reset it per run for determinism.
- Run the **full existing v1 suite** (`vitest`, `eslint`, `next build`, Playwright) to confirm nothing broke — this must stay green throughout, per CLAUDE.md's testing policy.
- Update `docs/PLAN.md`: new architecture decisions, the curriculum-review caveat, v2 backlog trimmed/updated (photo-persistence, shared-escalation-refactor, DRY cleanup as explicit backlog items).
- **Definition of done**: full test suite (unit + component + e2e) green, CI green on GitHub, docs updated, commit+push.

## Verification (applies across all modules)

- `npm run test` (Vitest) and `npx eslint .` after every module.
- `npm run build` stays clean — confirm no new code accidentally executes at build/import time (the lazy-singleton discipline that currently lets CI run with zero secrets must be preserved for the DB client too).
- `npx playwright test` for the new e2e spec in Module 7, plus the full existing suite.
- Manually verify Module 5's pages in a real browser at mobile viewport width (not just automated tests) before calling it done, per CLAUDE.md.
- CI (`.github/workflows/ci.yml`) must stay green on every push — watch for `better-sqlite3`'s native binary needing a source compile on `ubuntu-latest`.
