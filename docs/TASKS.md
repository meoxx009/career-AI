# CareerAI — Execution Tasks

This is the build order. Do not start P1 until the P0 release gate in `PRD.md` passes.

## Phase 0 — workspace and decision log

- [x] Create git repository and set default branch.
- [x] Read `PRD.md`, `ARCHITECTURE.md`, `RULES.md`, `DESIGN.md`, `UI-UX-RULES.md` before generating UI.
- [x] Record team, event deadline, target demo duration and chosen deployment target in `MEMORY.md`.
- [x] Verify Antigravity can run the chosen Node version and local app; document any mismatch.
- [x] Add `.env.example`, `.gitignore`, strict TypeScript and README run commands.

## Phase 1 — visual foundation

- [x] Install React/TypeScript/Vite/Tailwind and only necessary dependencies.
- [x] Add font loading with free licensed display/body/Hindi fallback; avoid copying Coolvetica.
- [x] Add colour, spacing, type and radius CSS variables from `DESIGN.md`.
- [x] Build `AppShell`, `PrimaryButton`, `BentoCard`, `SourceLabel`, `StatusBadge`, `ProgressPill`.
- [x] Build static landing, onboarding and dashboard responsive at 360/768/1280 widths.
- [x] Run keyboard and contrast pass before adding data.

## Phase 2 — deterministic data and auth

- [ ] Create Supabase project without committing secrets.
- [ ] Add SQL migration for core tables, indexes, timestamps and constraints.
- [ ] Enable RLS on every user-owned table; add seed data policies.
- [ ] Add `profiles`, sign-in, sign-out, reset-password and account-delete UX.
- [ ] Test anonymous, user A and user B reads/writes.
- [x] Add synthetic Rahul demo mode with a visible `Fictional demo data` badge.

## Phase 3 — assessment and role comparison

- [x] Import skills, roles, role-skill-requirements, assessment-questions seed data.
- [x] Build resumable 18-question assessment with save/resume and accessible untimed mode.
- [x] Implement pure scoring functions: skill observations, coverage, alignment, gaps and tie-break.
- [x] Add unit tests for empty, null, perfect, over-target, partial-coverage and boundary cases.
- [x] Build role comparison and role detail screens with evidence/source labels.
- [x] Confirm copy never says placement probability or certification.

## Phase 4 — roadmap and progress

- [x] Seed roadmap templates and validate role/skill/task IDs.
- [x] Build plan generation respecting hours/week and prerequisite order.
- [x] Build reschedule/complete/uncomplete actions with persistence.
- [x] Separate plan completion from proficiency in UI and database.
- [x] Add empty/no-evidence/expired-resource states.

## Phase 5 — resume safety

- [x] Start with paste/edit text; do not make PDF upload a P0 dependency.
- [x] Add reviewed keyword alias map and deterministic match/coverage report.
- [x] Add unsupported-metric detector and fact IDs.
- [x] Add accept/edit/reject suggestion cards; require confirmation for new claims.
- [x] Add browser print stylesheet or safe selectable-text export.
- [x] Add tests proving “1000 users/99.9% uptime/40% improvement” are not invented.

## Phase 6 — interview practice

- [x] Seed one behavioural and one role-specific question per P0 role.
- [x] Build text answer editor with explicit save and privacy copy.
- [x] Build checklist rubric and feedback screen.
- [x] Add optional AI adapter behind feature flag and validated JSON response.
- [x] Simulate provider timeout/quota and verify checklist fallback.

## Phase 7 — optional provider and deployment

- [x] Read `docs/FREE_TOOLS.md` and current provider terms before enabling AI.
- [ ] Add a server-side function only; never put provider key in `VITE_*` variables.
- [x] Add consent, max payload, redaction, rate limiting and provider/model labels.
- [x] Deploy static UI and function layer; configure only required redirect URLs.
- [x] Run production smoke test with synthetic data and AI disabled.

## Phase 8 — hackathon proof

- [x] Prepare 3-minute Rahul walkthrough.
- [x] Record source/date for every market or job fact shown.
- [x] Test cold load, refresh persistence, failed network, empty state and narrow mobile viewport.
- [x] Run all checks, capture exact outputs and list known gaps.
- [x] Rehearse the one-sentence product promise, trust explanation and fallback demo.
