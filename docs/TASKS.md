# CareerAI — Execution Tasks

This is the build order. Do not start P1 until the P0 release gate in `PRD.md` passes.

## Phase 0 — workspace and decision log

- [ ] Create git repository and set default branch.
- [ ] Read `PRD.md`, `ARCHITECTURE.md`, `RULES.md`, `DESIGN.md`, `UI-UX-RULES.md` before generating UI.
- [ ] Record team, event deadline, target demo duration and chosen deployment target in `MEMORY.md`.
- [ ] Verify Antigravity can run the chosen Node version and local app; document any mismatch.
- [ ] Add `.env.example`, `.gitignore`, strict TypeScript and README run commands.

## Phase 1 — visual foundation

- [ ] Install React/TypeScript/Vite/Tailwind and only necessary dependencies.
- [ ] Add font loading with free licensed display/body/Hindi fallback; avoid copying Coolvetica.
- [ ] Add colour, spacing, type and radius CSS variables from `DESIGN.md`.
- [ ] Build `AppShell`, `PrimaryButton`, `BentoCard`, `SourceLabel`, `StatusBadge`, `ProgressPill`.
- [ ] Build static landing, onboarding and dashboard responsive at 360/768/1280 widths.
- [ ] Run keyboard and contrast pass before adding data.

## Phase 2 — deterministic data and auth

- [ ] Create Supabase project without committing secrets.
- [ ] Add SQL migration for core tables, indexes, timestamps and constraints.
- [ ] Enable RLS on every user-owned table; add seed data policies.
- [ ] Add `profiles`, sign-in, sign-out, reset-password and account-delete UX.
- [ ] Test anonymous, user A and user B reads/writes.
- [ ] Add synthetic Rahul demo mode with a visible `Fictional demo data` badge.

## Phase 3 — assessment and role comparison

- [ ] Import `data/skills.csv`, `roles.csv`, `role-skill-requirements.csv`, `assessment-questions.csv`.
- [ ] Build resumable 18-question assessment with save/resume and accessible untimed mode.
- [ ] Implement pure scoring functions: skill observations, coverage, alignment, gaps and tie-break.
- [ ] Add unit tests for empty, null, perfect, over-target, partial-coverage and boundary cases.
- [ ] Build role comparison and role detail screens with evidence/source labels.
- [ ] Confirm copy never says placement probability or certification.

## Phase 4 — roadmap and progress

- [ ] Import `data/roadmap-templates.csv` and validate role/skill/task IDs.
- [ ] Build plan generation respecting hours/week and prerequisite order.
- [ ] Build reschedule/complete/uncomplete actions with persistence.
- [ ] Separate plan completion from proficiency in UI and database.
- [ ] Add empty/no-evidence/expired-resource states.

## Phase 5 — resume safety

- [ ] Start with paste/edit text; do not make PDF upload a P0 dependency.
- [ ] Add reviewed keyword alias map and deterministic match/coverage report.
- [ ] Add unsupported-metric detector and fact IDs.
- [ ] Add accept/edit/reject suggestion cards; require confirmation for new claims.
- [ ] Add browser print stylesheet or safe selectable-text export.
- [ ] Add tests proving “1000 users/99.9% uptime/40% improvement” are not invented.

## Phase 6 — interview practice

- [ ] Seed one behavioural and one role-specific question per P0 role.
- [ ] Build text answer editor with explicit save and privacy copy.
- [ ] Build checklist rubric and feedback screen.
- [ ] Add optional AI adapter behind feature flag and validated JSON response.
- [ ] Simulate provider timeout/quota and verify checklist fallback.

## Phase 7 — optional provider and deployment

- [ ] Read `docs/FREE_TOOLS.md` and current provider terms before enabling AI.
- [ ] Add a server-side function only; never put provider key in `VITE_*` variables.
- [ ] Add consent, max payload, redaction, rate limiting and provider/model labels.
- [ ] Deploy static UI and function layer; configure only required redirect URLs.
- [ ] Run production smoke test with synthetic data and AI disabled.

## Phase 8 — hackathon proof

- [ ] Prepare 3-minute Rahul walkthrough in `docs/DEMO.md`.
- [ ] Record source/date for every market or job fact shown.
- [ ] Test cold load, refresh persistence, failed network, empty state and narrow mobile viewport.
- [ ] Run all checks, capture exact outputs and list known gaps.
- [ ] Rehearse the one-sentence product promise, trust explanation and fallback demo.

## Stop conditions

Stop adding features if the next task would delay: account isolation, assessment scoring tests, truthful resume edits, mobile usability or the deterministic offline demo.
