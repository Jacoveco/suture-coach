# CLAUDE.md

@AGENTS.md

Guidance for Claude Code when working in this repository.

## Project Overview

A mobile-friendly web app that helps trainees improve their suturing technique. Users
upload or capture a photo/video of a suturing practice attempt (on training models/simulators,
not real patients), and the app:

1. Scans the photo/video and analyzes the suture technique
2. Provides feedback and concrete recommendations for improvement
3. Generates visualizations of the sutures (e.g. spacing, tension, symmetry overlays)

This is a training/education tool, not a diagnostic or clinical device. All practice
footage is assumed to be non-patient (simulators, models, cadaver labs, etc.) — see
Data Handling below.

## Tech Stack

- **Framework**: Next.js (App Router) + TypeScript
- **UI**: mobile-first responsive design — every screen must be usable on a phone,
  since users will often capture video chairside/tableside
- **Analysis engine**: Claude's multimodal (vision) API is used to analyze suture
  photos/video frames and generate feedback/recommendations. Do not introduce a
  separate custom-trained CV/ML pipeline unless explicitly requested — the vision
  API is the intended analysis path.
- **Testing**: Vitest + React Testing Library for unit/component tests, Playwright
  for end-to-end flows (upload → analysis → feedback → visualization)

## Data Handling

- Treat all uploaded media as practice/training footage (simulators, bench models),
  not real patient data.
- Never introduce features that assume or require real patient/PHI data without
  first flagging it to the user — this changes the compliance posture (HIPAA, BAAs
  with any third-party APIs, encryption/audit requirements) and is an explicit
  decision point, not a default.
- Keep sample/fixture data in tests clearly synthetic (no real names, no real
  identifiers).

## Documentation

- All project documentation lives in `docs/` — do not scatter design notes,
  architecture docs, or specs elsewhere in the repo.
- Maintain a living plan file at `docs/PLAN.md`. Update it whenever the plan
  changes or a milestone completes — it should always reflect current
  status, not a historical snapshot. Treat "update the plan" as part of
  finishing a task, not an optional follow-up.

## Testing Policy

- Every feature (upload handling, analysis pipeline, feedback generation,
  visualization rendering) must have corresponding tests — unit tests for
  logic, component tests for UI, and Playwright e2e coverage for the core
  scan → feedback → visualization flow.
- **Always run the full test suite before claiming something is fixed or
  complete.** Do not report a bug fixed or a feature working based on
  reading the code alone — run the tests and show they pass.
- When fixing a bug, add a regression test that would have caught it.

## Version Control

- This project is tracked on GitHub.
- Always commit changes as they're completed, and push to the remote — don't
  leave finished work sitting only in local commits.
- Write clear, descriptive commit messages that explain why a change was made.
- **Never commit or push sensitive information**: API keys, secrets, credentials,
  `.env` files, private keys/certs, real patient/PHI data, or internal
  infrastructure details. Use `.gitignore` (see repo root) and environment
  variables / secret managers for anything sensitive — never hardcode it in
  source.
- Before every commit, review the actual diff (`git status` / `git diff
  --cached`) for anything that looks like a credential or accidental secret —
  even in files that seem unrelated — and stop to flag it rather than
  committing it.
- If a secret is ever committed by mistake, treat it as compromised (rotate it)
  rather than just deleting it from the latest commit — git history still
  holds it.

## Working Conventions

- This is a new codebase — prefer establishing one clear pattern per concern
  (e.g. one way to call the analysis API, one way to structure a test) rather
  than letting inconsistent approaches accumulate as features are added.
- Since this is mobile-first, verify UI changes at mobile viewport widths,
  not just desktop.
