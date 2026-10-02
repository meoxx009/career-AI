# CareerAI — Senior Antigravity Build Playbook

**Purpose:** build the working CareerAI student web app from the existing repository, step by step, with Antigravity as the coding agent.

**Target folder:**

```text
C:\Users\ezyre\Downloads\CareerAI
```

**Visual source of truth:**

```text
C:\Users\ezyre\Downloads\CareerAI\preview\index.html
C:\Users\ezyre\Downloads\CareerAI\preview\styles.css
C:\Users\ezyre\Downloads\CareerAI\preview\app.js
```

The preview is the intended mood: editorial dark canvas, warm linen/cotton surfaces, electric tangerine actions, tall display type, orange glow, generous whitespace and thin wave texture. The production app must recreate this visual language with reusable components; it must not iframe the preview or use the preview as a fake product.

---

## How to use this playbook

1. Open **Antigravity**.
2. Open the folder `C:\Users\ezyre\Downloads\CareerAI`.
3. Open its terminal.
4. Read the “Before you paste anything” section below.
5. Paste **Prompt 00**, then only move to the next numbered prompt after its gate passes.
6. After every prompt, ask Antigravity for:
   - changed files;
   - commands run;
   - command results;
   - known gaps;
   - the exact next manual action, if any.
7. Do not paste every prompt in one message. Small verified vertical slices prevent a broken app from becoming difficult to repair.
8. If a prompt fails, use the repair prompt in that section. Do not continue with a failing build.

These prompts are intentionally prescriptive. If Antigravity proposes a different library or architecture, it must explain the reason and preserve the acceptance criteria below. Do not accept a framework change just because it is convenient for the agent.

---

# 0. Before you paste anything

## Human setup checklist

Install or verify:

```powershell
node --version
npm --version
git --version
```

Use Node 20+ if possible. The repository can be planned and previewed without Supabase or AI credentials.

Optional visual preview:

```powershell
python -m http.server 4173 --directory preview
```

Open `http://localhost:4173` and compare the production UI against it throughout the build.

## Product boundaries

The first working version is an individual-student preparation assistant for three entry-level roles:

- Backend Developer
- Frontend Developer
- Data Analyst

P0 must work without an AI key or network. P0 includes onboarding, diagnostic assessment, explainable role comparison, a roadmap, a safe text-based resume lab and text interview practice. Live job scraping, payment, mobile app, video analysis, uncalibrated placement probability, salary prediction and government-exam claims are not P0.

## Trust boundaries

- `null` means unknown, never zero.
- “Assessed alignment” is not job probability, salary or placement guarantee.
- AI may rewrite supplied facts but never invent metrics, employers, users, technologies, results or responsibilities.
- Real resumes and PII must not be sent to an unpaid hosted AI API. Use synthetic Rahul data in the demo.
- Any AI provider is optional. Deterministic fallback is the reliability baseline.
- Supabase service-role keys and AI keys are server-only secrets.

---

# Prompt 00 — Establish context and the implementation contract

## What this adds or changes

No code. Antigravity reads the repository and produces a precise build plan. This prevents it from rebuilding the app in an unrelated style or deleting the prepared product package.

## Paste this prompt

```text
Act as the senior product engineer, frontend architect, accessibility reviewer and security-minded AI engineer for CareerAI. Work inside the existing repository at C:\\Users\\ezyre\\Downloads\\CareerAI.

Do not edit, delete, rename or overwrite any file for this prompt. First inspect the repository and read these files completely:

1. AGENTS.md
2. README.md
3. docs/PRD.md
4. docs/ARCHITECTURE.md
5. docs/RULES.md
6. docs/DESIGN.md
7. docs/UI-UX-RULES.md
8. docs/DATA-MODEL.md
9. docs/TASKS.md
10. docs/MEMORY.md
11. docs/FREE_TOOLS.md
12. preview/index.html
13. preview/styles.css
14. preview/app.js
15. every CSV under data/
16. every prompt under prompts/
17. supabase/migrations/0001_initial.sql

Treat preview/index.html, preview/styles.css and preview/app.js as the visual reference. The production UI must recreate the same design language with real components and real state; it must not embed, iframe or present the static preview as the finished app.

The target product is a fast, responsive, working student web app. The first release must work without an AI key and must use synthetic demo data. The first roles are Backend Developer, Frontend Developer and Data Analyst. The first complete user flow is:
landing → onboarding → diagnostic assessment → explainable role comparison → selected role → skill gaps → roadmap → resume safety review → text interview practice.

Produce a senior-level implementation plan with:
- current repository inventory;
- proposed app architecture and data flow;
- exact dependency list and why each dependency is needed;
- exact route map;
- exact files to create/change in each phase;
- local deterministic fallback strategy;
- Supabase integration boundary and RLS strategy;
- optional AI integration boundary;
- testing, accessibility, performance and deployment gates;
- open risks and how the plan avoids them.

Do not propose purple/blue branding, a generic dashboard template, a mobile app, live LinkedIn scraping, fake salary/placement statistics, video emotion analysis, or a one-shot rewrite of the repository. Use the existing plan and design files as constraints.

End with the exact command sequence that should be used after the next prompt. Do not modify files yet.
```

## Gate 00

Accept the plan only if it includes the existing preview, deterministic fallback, RLS, truth-preserving resume behaviour, responsive UI and real checks. If it proposes destructive changes, paste:

```text
Reject that plan. Preserve the existing docs, data, preview and Supabase migration. Re-plan as small verified vertical slices. P0 must work without AI or remote services, and the production UI must recreate preview/index.html and preview/styles.css instead of replacing them with a generic SaaS template. Show only the corrected plan.
```

---

# Prompt 01 — Scaffold a real React application without touching the design package

## What this adds or changes

Creates the actual Vite/React/TypeScript application structure while preserving all product documents and the visual preview.

## Paste this prompt

```text
Implement the approved Phase 1 plan now. Work in the existing repository. Preserve docs/, data/, prompts/, preview/ and supabase/ exactly unless a documentation update is explicitly needed.

Create a production-structured React + TypeScript + Vite app with strict TypeScript. Use normal CSS and CSS variables for the visual system so the preview style can be reproduced precisely. Do not add Tailwind, a UI template or a second styling system unless the repository already requires it.

Use only these dependencies initially:
- react
- react-dom
- react-router-dom
- zod
- react-hook-form
- lucide-react
- @supabase/supabase-js (client only; it may be unused until the Supabase phase)

Add the smallest real development/test toolchain needed:
- TypeScript strict checking;
- ESLint with a real configuration;
- Vitest and Testing Library for unit/component tests;
- jsdom test environment if required.

Create:
- package.json and one lockfile;
- index.html;
- src/main.tsx;
- src/App.tsx;
- src/types/;
- src/data/;
- src/lib/;
- src/components/;
- src/pages/;
- src/styles/;
- src/test/ or tests/;
- .env.example only if the existing one needs to be preserved/extended.

Add real npm scripts:
- dev
- build
- preview
- lint
- typecheck
- test

The app must start at / and show a temporary, accessible AppShell. Do not implement fake business features yet. Do not put secrets into source. Do not delete the static preview.

Run npm install, npm run lint, npm run typecheck, npm test -- --run and npm run build. If any command cannot run, state exactly why; do not create no-op scripts. Report all changed files and output summaries.
```

## Manual integration

None yet. Keep `.env.local` empty until Supabase is configured.

## Gate 01

Run:

```powershell
npm run lint
npm run typecheck
npm test -- --run
npm run build
```

The app must start with:

```powershell
npm run dev
```

If it fails, paste:

```text
Repair only the scaffold. Read the actual terminal error, fix the smallest root cause, preserve the existing docs/data/preview/supabase package, rerun the failing command and report the exact result. Do not add unrelated features or replace the styling architecture.
```

---

# Prompt 02 — Convert the reference preview into a production design system

## What this adds or changes

Creates the exact visual foundation used by every production screen: palette, typography, spacing, cards, buttons, glow, wave texture, focus states and responsive rules.

## Paste this prompt

```text
Implement the CareerAI production design system. Read docs/DESIGN.md and docs/UI-UX-RULES.md again, then inspect preview/index.html and preview/styles.css line by line.

Recreate the visual language with reusable tokens and components. Do not copy the reference creator's logo, profile image, wordmark or social-media layout. Do not render the preview as an image. Keep preview/ unchanged as the comparison fixture.

Create one canonical token stylesheet, for example src/styles/tokens.css, and one global stylesheet. Use these core colours exactly:
- --color-void: #080B0C
- --color-black-hole: #222222
- --color-black-soft: #101415
- --color-linen: #FAF3E1
- --color-cotton: #F5E7C6
- --color-tangerine: #FF6D1F
- --color-tangerine-deep: #C94E14
- --color-ink: #101111
- --color-muted-light: #C8C2B4
- --color-muted-dark: #68665E
- accessible success/warning/danger/focus tokens from docs/DESIGN.md

Typography:
- use Bebas Neue or Oswald as the free tall display alternative;
- use Manrope for body and controls;
- use Noto Sans Devanagari fallback;
- use Cormorant Garamond only for short editorial accents;
- use system monospace for technical values if needed.
Do not bundle Coolvetica unless its exact licence is verified. Use system fallbacks if fonts fail to load.

Create reusable components:
- AppShell
- BrandMark
- PrimaryButton
- SecondaryButton
- TextButton
- DisplayHeading
- Eyebrow
- BentoCard
- DarkCard
- LinenCard
- CottonCard
- StatusBadge
- ProgressPill
- SourceLabel
- ScoreRing or ScoreMeter
- EmptyState
- LoadingState
- ErrorState
- Toast

Rules:
- dark editorial canvas with a soft orange top glow;
- optional low-opacity wave/noise texture, CSS/SVG only;
- no purple or blue brand accents;
- no emoji as UI icons; use Lucide icons with labels;
- one primary action per screen;
- radius 18–28px, generous whitespace and clear hierarchy;
- all buttons/inputs keyboard reachable with visible focus;
- mobile at 360px, tablet at 768px, desktop at 1280px;
- reduced-motion support;
- no layout shift from fonts or async content.

Build a temporary DesignSystemShowcase route or development-only screen that demonstrates every component on dark, linen and cotton surfaces. Do not add business logic. Run checks and report changed files.
```

## Gate 02

Open the showcase at 360px and desktop width. Confirm:

- the app looks like the reference preview;
- cream and cotton surfaces are warm, not white;
- tangerine is the action colour;
- display headings are tall but body text remains readable;
- keyboard focus is visible;
- no horizontal overflow exists.

---

# Prompt 03 — Build the route shell and page architecture

## What this adds or changes

Creates real client-side routes and the navigation structure without pretending that unimplemented actions are complete.

## Paste this prompt

```text
Build the real route shell using React Router and the design system. Read the route and UX requirements from docs/PRD.md, docs/DESIGN.md and docs/UI-UX-RULES.md.

Create these routes:
- / — Landing page
- /onboarding — profile and preferences
- /assessment — diagnostic assessment
- /paths — role comparison
- /paths/:roleSlug — role detail and gaps
- /dashboard — signed-in/demo dashboard
- /roadmap — selected-role roadmap
- /resume — resume safety lab
- /practice — text interview practice
- /settings — privacy, data and account boundary
- * — accessible not-found page

Build an AppShell that supports:
- desktop top navigation in the reference style;
- responsive mobile navigation with a real button and accessible dialog/menu;
- current-route indication;
- a visible fictional-demo badge when demo mode is active;
- loading and error boundaries;
- browser back/forward and direct refresh without losing the route.

For now use typed local placeholder state only. Do not invent job listings, salaries or placement statistics. A not-yet-built feature must use an honest empty state or be omitted, not a fake button.

Every page must include:
- page context;
- one primary action;
- an empty/loading/error state;
- accessible heading hierarchy;
- responsive layout;
- the palette and typography from the preview.

Keep the static preview untouched. Run a production build and list all routes tested.
```

## Gate 03

Manually open every route directly, refresh it, use browser back/forward and test the mobile menu with keyboard. Fix route failures before continuing.

---

# Prompt 04 — Import and validate the product data

## What this adds or changes

Converts the prepared CSV content into typed, validated local seed data. This becomes the deterministic source for assessment, role matching and roadmap generation.

## Paste this prompt

```text
Implement the typed local data layer. Read every file under data/ and preserve its values, stable IDs, versions and source labels.

Use:
- data/skills.csv
- data/roles.csv
- data/role-skill-requirements.csv
- data/assessment-questions.csv
- data/roadmap-templates.csv
- data/interview-questions.csv

Create domain types under src/types:
- Skill
- CareerRole
- RoleSkillRequirement
- AssessmentQuestion
- RoadmapTemplate
- InterviewQuestion
- SkillObservation
- UserProfile
- AssessmentAttempt
- RoleAssessment
- ResumeFact
- InterviewFeedback

Create local seed modules under src/data. Either parse the CSV through a small build-time script or convert the reviewed rows into typed constants; choose the simplest reliable option and document the choice. Do not silently drop invalid rows.

Add Zod schemas or an equivalent validator for all imported records. Validate:
- IDs are present and unique;
- role/skill/question foreign references exist;
- target levels are 1–4;
- importance is 1–3;
- assessment answer keys exist in the options;
- roadmap prerequisites refer to existing tasks;
- source labels/version values are present.

Create a clearly marked synthetic Rahul fixture for the demo. It must never contain real personal information and must not be written into a signed-in user's profile.

Run the validator, lint, typecheck, tests and build. Report invalid rows and changed files.
```

## Gate 04

Temporarily corrupt one CSV row, confirm the validator fails, restore it, and run the validator again. Never accept silent data loss.

---

# Prompt 05 — Implement the deterministic scoring engine first

## What this adds or changes

Builds the core recommendation logic without AI. This is the reliability baseline and makes the product useful even without API keys, network or hosted services.

## Paste this prompt

```text
Implement the deterministic CareerAI scoring engine from docs/PRD.md section 5. Keep all functions pure and testable. Do not call an AI provider.

Create src/lib/scoring.ts and supporting types/functions:
1. scoreAssessmentAnswers
2. buildSkillObservations
3. calculateRoleCoverage
4. calculateAssessedAlignment
5. calculateKnownGaps
6. prioritiseGaps
7. sortRoleAssessments
8. buildRoleExplanation
9. calculatePlanCompletion

Rules:
- skill observation scale is 0–4;
- null means unknown and must never be coerced to zero;
- a real measured zero remains zero;
- assessed alignment uses only known requirement observations;
- observed values above target are capped at target;
- coverage = known weighted requirements / all weighted requirements;
- if coverage is below 60%, return a needs-more-evidence state instead of a confident rank;
- missing assessment is not a weakness;
- gap priority respects prerequisite order and role importance;
- ties sort deterministically by stable role slug;
- plan completion is not skill mastery;
- never use name, gender, caste, college prestige or optional CGPA as a skill signal;
- never calculate placement probability, salary prediction, percentile or ATS pass.

Return rich objects, not only numbers. Each result must include:
- value/state;
- scale;
- coverage;
- source/version;
- evidence used;
- unknowns;
- known gaps;
- caveat.

Add tests for:
- no observations;
- one known skill;
- perfect observations;
- over-target observations;
- null versus zero;
- partial coverage;
- low-coverage confidence state;
- deterministic ties;
- prerequisite gap ordering;
- invalid boundary values.

Run npm test -- --run, npm run lint, npm run typecheck and npm run build. Report exact results.
```

## Gate 05

Read the tests and confirm at least one proves `null !== 0`, one proves low coverage is not a confident ranking, and one proves scores cannot exceed their scale.

If scoring fails, paste:

```text
Repair only scoring and its tests. Re-read docs/PRD.md section 5. Do not change the documented formula or weaken a failing test. Preserve the difference between unknown, zero, measured evidence and self-report. Rerun the failing command and report the result.
```

---

# Prompt 06 — Build onboarding and the assessment as a real user flow

## What this adds or changes

Makes a new student able to enter information, complete the diagnostic, pause/resume and receive a real deterministic result.

## Paste this prompt

```text
Connect /onboarding and /assessment to the validated local data and scoring engine.

Onboarding requirements:
- optional display name;
- branch;
- current year;
- optional CGPA without using it as an ability signal;
- preferred roles;
- weekly study hours with validation;
- location/work preference optional;
- current skills and project facts;
- visible labels, helper text, optional markers and inline errors;
- one focused card/step at a time on mobile;
- progress indicator such as 01/03;
- back/continue controls;
- save draft without losing entered values.

Assessment requirements:
- 18 seed questions;
- category and progress display;
- keyboard-accessible answer cards;
- save/resume;
- unanswered is distinct from incorrect;
- accessible untimed mode;
- no pressure language;
- completion result with diagnostic estimate, coverage, evidence, known gaps, unknowns and next action;
- copy: “This is a short diagnostic estimate, not a certificate.”

Persistence for this phase:
- guest mode uses localStorage with a versioned key;
- show “Demo progress stored on this browser”;
- do not pretend localStorage is a database;
- Rahul demo is loaded only when the user chooses Explore demo;
- a fresh onboarding flow starts empty.

Add tests for validation, empty start, save/resume, unanswered answers and completed assessment. Run all checks.
```

## Gate 06

Clear localStorage, start fresh, answer half, refresh, resume, complete, then open paths. Verify the result is different for different answers and a new user never inherits Rahul.

---

# Prompt 07 — Build the role comparison and production dashboard

## What this adds or changes

Turns assessment results into an explainable, responsive dashboard matching the preview’s cards and editorial hierarchy.

## Paste this prompt

```text
Build the working role comparison and dashboard using deterministic results.

Update /paths, /paths/:roleSlug and /dashboard.

Role comparison:
- three cards: Backend Developer, Data Analyst and Frontend Developer;
- display assessed alignment only when coverage allows it;
- always show coverage beside the value;
- show supporting evidence, known gaps, unknowns, confidence and source/version;
- show “More evidence needed” for low coverage;
- never show placement probability, salary, percentile or fake market numbers;
- use one clear Explore plan action per card.

Role detail:
- role description;
- requirement list with current/required only when current is known;
- prerequisite-aware gap order;
- why the gap matters;
- first next action;
- source label and checked date;
- honest empty/no-evidence state.

Dashboard visual structure must follow preview/index.html:
- dark editorial shell;
- warm linen assessed-alignment card;
- dark next-best-action card;
- tangerine highlight;
- large readable score treatment;
- fictional demo badge for Rahul;
- no overloaded charts.

Dashboard must show:
- current selected role;
- assessed alignment and coverage;
- first priority gap;
- current roadmap task;
- plan completion separately from skill proficiency;
- link to resume lab and practice.

Create component tests for role card, low coverage, empty state and Rahul/new-user separation. Run all checks.
```

## Gate 07

Check three cases:

1. Rahul synthetic demo.
2. Fresh user with no answers.
3. Partial user with low coverage.

The UI must explain uncertainty and never display a misleading zero.

---

# Prompt 08 — Build the roadmap and progress loop

## What this adds or changes

Lets the student choose a role, receive a time-budgeted plan and complete tasks with persistent local state.

## Paste this prompt

```text
Implement /roadmap using data/roadmap-templates.csv and the selected role.

Build a plan generator that:
- selects the role's tasks;
- respects the user's weekly study-hours budget as an estimate;
- orders prerequisites before dependent tasks;
- groups tasks by week;
- includes estimated hours, why it matters, deliverable and resource URL;
- handles missing/invalid resource URLs safely;
- labels dates and hours as estimates;
- does not promise mastery or employment.

Build the UI in the preview style:
- editorial “Small steps. Real proof.” heading;
- dark canvas with alternating warm cards;
- tangerine current-week marker;
- clear task status;
- mobile layout that does not compress a table;
- accessible complete/uncomplete controls;
- explicit reschedule/replan confirmation.

Implement:
- local guest persistence;
- repository interface so Supabase persistence can be added later;
- task completion and plan completion calculations;
- blocked prerequisite state;
- empty role/no-plan state;
- invalid hours boundary.

Add tests for hour budgeting, prerequisite order, completion calculation and reschedule. Run all checks.
```

## Gate 08

Set 6 hours/week, complete one task, refresh, and verify progress. Try 0, a negative value and a value above 168; each must be handled clearly.

---

# Prompt 09 — Create the Supabase data layer and enforce RLS

## What this adds or changes

Connects the app to real Auth/Postgres persistence while keeping guest demo mode working if credentials are absent.

## Manual Supabase action before this prompt

1. Create a Supabase project.
2. Review `supabase/migrations/0001_initial.sql`.
3. Run the migration in the Supabase SQL Editor.
4. Seed the global skills, roles, requirements, questions and roadmap records from `data/` using a reviewed process.
5. Copy only the project URL and publishable/anon key to `.env.local`:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

6. Do not put a service-role key in the browser or repository.
7. Configure a local Auth redirect URL if using email/OAuth.
8. Keep demo mode independent from email delivery.

## Paste this prompt

```text
Integrate Supabase as the authenticated persistence boundary without breaking guest mode.

First review:
- docs/ARCHITECTURE.md;
- docs/RULES.md;
- docs/DATA-MODEL.md;
- supabase/migrations/0001_initial.sql;
- .env.example.

Create a typed Supabase client using only:
- VITE_SUPABASE_URL;
- VITE_SUPABASE_PUBLISHABLE_KEY.

If either value is absent, use local deterministic mode and show a non-alarming configuration status. Do not crash and do not make the user configure Supabase to explore the demo.

Create a repository layer under src/lib/repositories for:
- profile read/upsert;
- assessment attempt/answers;
- skill observations;
- roadmap/task reads and writes;
- resume and interview records.

Implement Auth UI:
- signed-out state;
- sign-up/sign-in;
- sign-out;
- reset-password where the configured provider supports it;
- loading/error/success states;
- protected account pages;
- guest Explore demo path.

Do not create permissive “allow all” policies. Keep user ownership scoped by auth.uid(); global seed rows are read-only for normal users. Never use a service-role key in the client. Add a docs note for redirect URLs and env variables.

Do not claim remote auth or persistence passed unless it was actually tested. Run local checks and report whether each used local mode or Supabase mode.
```

## Gate 09 — Required RLS test

With anonymous, User A and User B, verify:

- anonymous cannot read user-owned rows;
- User A cannot read/update User B rows;
- normal users cannot modify seed roles/skills/questions;
- User A can read/write only their own profile, assessment, roadmap, resume and interview data.

If remote testing cannot happen, mark it unverified and do not move to deployment.

---

# Prompt 10 — Persist the end-to-end authenticated flow

## What this adds or changes

Makes onboarding, assessment, role selection and roadmap survive refresh and login while preserving guest localStorage mode.

## Paste this prompt

```text
Replace guest-only state with a dual-mode persistence flow.

For signed-in users persist and read back:
- profile/onboarding;
- assessment attempt and answers;
- skill observations;
- selected role;
- roadmap and task completion.

For guests keep versioned localStorage fallback.

Requirements:
- use repository functions, not direct database calls in every component;
- await writes and read the saved record back before success UI;
- preserve draft on network failure;
- show idle, saving, saved and failed states;
- prevent double submits;
- never write synthetic Rahul into a real profile;
- handle sign-out by clearing only in-memory private state and preserving no private data in shared demo state;
- invalidate/refetch the right data after mutation;
- do not leak raw resume or answer text into analytics events.

Add mocked tests for persistence success, persistence failure, retry and user isolation. Run lint, typecheck, tests and build.
```

## Gate 10

1. Sign in as User A.
2. Complete onboarding and half the assessment.
3. Refresh and confirm data returns.
4. Sign out.
5. Sign in as User B and confirm data is different/empty.
6. Remove Supabase variables and confirm guest demo still works.

---

# Prompt 11 — Build the truthful resume lab

## What this adds or changes

Creates a useful resume/JD comparison feature without unsafe AI or fabricated achievements.

## Paste this prompt

```text
Implement /resume as a complete deterministic resume safety lab before adding external AI.

P0 input method:
- paste/edit resume text;
- paste target job description;
- no PDF upload dependency yet;
- strict length limits and character-count guidance.

Build a reviewed keyword alias map for the three seed roles. Generate:
- matched terms;
- missing terms;
- keyword alignment heuristic with an explicit caveat;
- evidence coverage;
- unsupported claim warnings;
- suggestions based only on facts in the supplied resume.

Every suggestion must have:
- original text;
- safe rewrite;
- source fact IDs or source text references;
- needsConfirmation boolean;
- explanation;
- accept/edit/reject controls.

Hard safety rules:
- never invent metrics, users, uptime, employer, dates, technology, responsibility or outcome;
- never insert a keyword just because it appears in a job description;
- never convert course completion into work experience;
- if evidence is missing, ask a confirmation question or use a non-numeric rewrite;
- never say ATS pass or ATS guarantee;
- call the result “Keyword alignment heuristic”.

Use the preview language:
- dark shell;
- linen original-facts panel;
- cotton or tangerine suggestion state;
- dark review card;
- readable side-by-side desktop and stacked mobile layout.

Implement a real browser print/export path with selectable text. Do not create a fake download button. Keep raw resume text out of analytics.

Add tests proving fabricated examples such as “1000 concurrent users”, “99.9% uptime” and “40% reduction” are blocked when absent from input. Run all checks.
```

## Gate 11

Paste a synthetic resume containing only:

```text
Built a chat application using Python.
```

The accepted output must not claim users, uptime, latency, AWS or percentage improvements. Rejecting a suggestion must preserve the original.

---

# Prompt 12 — Build text interview practice

## What this adds or changes

Adds a working practice room with a fixed rubric, save state and useful next action. It deliberately excludes unreliable face, accent and emotion scoring.

## Paste this prompt

```text
Implement /practice as a complete text-only interview practice room.

Use data/interview-questions.csv. Support:
- role selection;
- behavioural and technical question selection;
- question context;
- rubric criteria;
- answer editor;
- explicit save;
- deterministic checklist feedback;
- strengths;
- missing rubric points;
- one next action;
- limitation/caveat;
- local guest history and signed-in user history with the correct repository;
- loading, empty, unsaved, saved and error states.

Use the visual reference:
- linen practice section with a dark question card;
- tangerine CTA;
- calm readable editorial typography;
- no camera/microphone permission in P0;
- text mode is first-class, not a degraded fallback.

Do not infer facial expression, eye contact, confidence, accent, emotion, gender, personality or hiring outcome. Do not produce a hire/no-hire decision. Do not grade technical correctness from keyword presence alone.

Add tests for complete, partial, empty and failed-save answers. Run all checks.
```

## Gate 12

Answer one question, refresh, verify saved state, then submit an empty answer and a partial answer. The feedback must be specific but must not claim a hiring decision.

---

# Prompt 13 — Add optional AI only behind a safe server boundary

## What this adds or changes

Adds AI-generated explanations or feedback as an optional enhancement while leaving the core app functional without it.

## Important decision before this prompt

For the hackathon, deterministic mode is the safest default. If using a hosted free-tier AI API, use only synthetic/anonymized demo content. Do not send real resumes, names, phone numbers, addresses or employer identifiers to an unpaid service. If you need private real-data experimentation, use a local Ollama setup only after measuring machine performance.

## Paste this prompt

```text
Add an optional AI adapter without changing deterministic scoring, role ranking, permissions or resume safety rules.

Read:
- docs/ARCHITECTURE.md;
- docs/RULES.md;
- docs/FREE_TOOLS.md;
- prompts/career-recommendation.md;
- prompts/resume-analysis.md;
- prompts/interview-feedback.md.

Create a provider interface with:
- deterministic-fallback as default;
- optional server-side provider;
- explicit provider/model/prompt version;
- typed error categories;
- timeout and retry limits;
- maximum input/output length;
- abstain state.

If using Gemini, call it only from a Supabase Edge Function or equivalent server-side function. Never put the provider key in VITE_* or browser source. Never log raw resume text, personal data, answers or full provider payloads. The browser sends only minimal, consented and synthetic-safe content.

Validate every response with Zod before rendering or saving. The AI can:
- explain an already-computed role result;
- suggest a rewrite from supplied facts;
- give rubric-based practice feedback.

The AI cannot:
- calculate or override deterministic role scores;
- add unsupported resume facts;
- make hiring/placement/salary decisions;
- infer personality, emotion, face, voice, accent or protected traits;
- turn unknown into zero.

UI requirements:
- label generated content “AI suggestion — review before using”;
- show source facts used;
- show confidence or abstention;
- provide retry;
- preserve the draft on failure;
- switch to deterministic checklist mode when AI is disabled, unavailable, over quota or returns invalid JSON.

Use a fake provider in tests. npm test and npm run build must not require a live key. Report whether a live provider was actually tested.
```

## Gate 13

Run with:

```text
AI_PROVIDER=disabled
```

Then simulate timeout, invalid JSON and quota failure. The app must remain useful and preserve the user draft.

---

# Prompt 14 — Performance, responsive UX and accessibility pass

## What this adds or changes

Makes the app fast and usable on mobile/slow networks rather than only visually attractive on a desktop.

## Paste this prompt

```text
Perform a focused performance, responsive UX and accessibility pass. Do not add new product modules.

Performance:
- lazy-load non-critical routes where it improves initial load;
- keep initial landing route small;
- avoid unnecessary rerenders in assessment and forms;
- memoize only measured hot paths;
- avoid large image assets and unlicensed textures;
- reserve space for async content to reduce layout shift;
- keep the visual wave/noise CSS lightweight;
- do not load multiple font weights that are unused;
- provide readable loading states, not blocking spinners only.

Responsive:
- test 360px, 390px, 768px, 1024px and 1280px;
- no horizontal overflow;
- stack preview bento/cards intelligently;
- convert desktop split resume view to a readable mobile sequence;
- keep primary actions reachable and at least 44px tall;
- do not use hover as the only interaction.

Accessibility:
- visible labels and inline errors;
- semantic buttons/links/headings;
- keyboard navigation through forms, menus and dialogs;
- visible focus ring;
- colour is not the only status signal;
- WCAG AA contrast target for text;
- reduced-motion support;
- accessible live status for save/error/progress;
- Hindi fallback must not clip or overflow.

Run lint, typecheck, tests, build and an accessible keyboard smoke test. Report measurable observations where possible; do not claim a performance score without running a tool.
```

## Gate 14

Use browser DevTools at 360px and throttled network. Complete onboarding and assessment. Run a keyboard-only pass. Fix every blocker before deploying.

---

# Prompt 15 — Security, privacy, data deletion and test release gate

## What this adds or changes

Checks that the app is trustworthy before exposing it to judges or public users.

## Paste this prompt

```text
Perform a security/privacy release audit against docs/RULES.md, docs/ARCHITECTURE.md and docs/PRD.md. Do not add scope.

Verify and fix:
- no secret/service-role/AI key in source, git history of this change or dist;
- no VITE_* AI/private secret;
- all user-owned Supabase tables have RLS and user ownership policies;
- anonymous access is denied for user-owned data;
- seed data is read-only for normal users;
- raw resume text, interview answers and AI payloads are absent from analytics events and console logs;
- strict input length limits exist;
- unsafe HTML is not rendered;
- external links use safe attributes where needed;
- sign-out clears in-memory private state;
- account deletion/export boundary is visible in settings or honestly marked P1;
- consent is required before an external AI call;
- the UI explains that recommendations are guidance, not job guarantees;
- errors do not reveal stack traces or secrets.

Add/update tests for:
- cross-user repository isolation;
- resume hallucination prevention;
- AI disabled fallback;
- invalid external response;
- network failure preserving drafts;
- score and coverage boundaries.

Run exact commands:
- npm run lint
- npm run typecheck
- npm test -- --run
- npm run build

Report each as PASS, FAIL or NOT RUN with the command and reason. Never call a NOT RUN check passed.
```

## Gate 15

Do not deploy until no critical security finding remains. If account deletion is not yet implemented, label it visibly as a known gap and do not claim production readiness.

---

# Prompt 16 — Prepare free deployment

## What this adds or changes

Prepares a static Vite deployment with the correct environment boundary. It does not create accounts or deploy without permission.

## Paste this prompt

```text
Prepare CareerAI for a free static deployment. Do not create a hosting account or deploy without explicit human permission.

First verify:
- npm run build creates dist;
- all client routes have a host fallback/rewrite strategy;
- direct refresh on /dashboard, /resume and /practice is handled;
- guest deterministic mode works with no environment variables;
- only public Supabase URL and publishable key are client variables;
- no service-role or AI key appears in source or dist;
- production errors do not reveal internals.

Prefer Cloudflare Pages for this Vite app unless an existing constraint requires another host. Create/update docs/DEPLOYMENT.md with:
- install command: npm install;
- build command: npm run build;
- output directory: dist;
- public VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY variables;
- server-only function secret instructions separated from browser variables;
- Supabase Auth redirect URLs;
- guest demo test;
- Supabase-authenticated test;
- AI-disabled test.

If a server function is deployed separately, document its URL and CORS/authorization boundary. Do not pretend static hosting provides a database, Auth or server secrets.

Run npm run build and report the exact output size if available. Do not say deployed unless deployment actually happened.
```

## Manual deployment steps

1. Create the static host project.
2. Connect repository or upload `dist`.
3. Set only public Supabase variables in the frontend environment.
4. Add the final hosted URL to Supabase Auth redirect URLs.
5. Open the site in a private window.
6. Test guest flow, sign-in, refresh, sign-out and no-AI fallback.
7. Configure server-side AI secret only if the optional AI phase passed its privacy gate.

---

# Prompt 17 — Final visual polish and hackathon demo readiness

## What this adds or changes

Polishes the complete working flow while keeping the exact design direction and trust behaviour.

## Paste this prompt

```text
Perform the final hackathon polish pass using docs/DEMO.md, docs/DESIGN.md and preview/index.html as references. Do not add unrelated features.

Review the whole working journey:
landing → Explore demo → onboarding → assessment → role comparison → role detail → roadmap → resume safety lab → interview practice.

Visual requirements:
- preserve near-black editorial canvas;
- preserve #FAF3E1, #F5E7C6, #FF6D1F and #222222;
- preserve tall display typography, Manrope body type, warm cards, orange glow and subtle wave texture;
- preserve generous whitespace and bento/card composition;
- make desktop and mobile states intentional;
- make loading, empty and error states part of the design.

Product requirements:
- fictional Rahul badge is visible for seeded demo data;
- every score has scale, coverage, source/version and caveat;
- unknown is never shown as zero;
- next best action is visible;
- resume suggestions are reviewable and cannot invent facts;
- interview feedback is rubric-based and text-first;
- no fake jobs, testimonials, salaries, placement probabilities or ATS guarantees;
- deterministic mode works without AI/network;
- privacy/settings boundary is understandable.

Run:
- npm run lint
- npm run typecheck
- npm test -- --run
- npm run build

Update docs/MEMORY.md with only verified commands, actual deployment status and known gaps. Update docs/TASKS.md only for work that actually completed. Report changed files, checks, and a three-minute demo sequence.
```

---

# Final acceptance checklist

The app is ready for the hackathon demo only when all applicable items are true:

## Core product

- [ ] Guest can complete the whole deterministic flow.
- [ ] New users start empty.
- [ ] Rahul is synthetic and visibly labelled.
- [ ] Assessment saves/resumes.
- [ ] Role recommendations show reasons, gaps, unknowns and coverage.
- [ ] Roadmap respects time budget and persists task completion.
- [ ] Resume lab does not invent achievements.
- [ ] Interview practice gives fixed-rubric feedback.

## UI/UX

- [ ] Production app visually follows `preview/index.html` and `preview/styles.css`.
- [ ] Colours are warm linen/cotton/tangerine/charcoal.
- [ ] Tall display font and readable body font are working.
- [ ] Mobile 360px has no horizontal overflow.
- [ ] Keyboard navigation works.
- [ ] Focus/contrast/reduced motion are handled.
- [ ] Loading/empty/error states are designed.

## Engineering

- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm test -- --run` passes.
- [ ] `npm run build` passes.
- [ ] No secrets are in source or bundle.
- [ ] Supabase RLS was tested with anonymous/User A/User B.
- [ ] AI disabled mode works.
- [ ] Deployment refreshes direct routes correctly.

## Demo narrative

Use this final story:

> Rahul does not need another generic course list. He needs to know what is already supported by evidence, what is still unknown, and what to do next. CareerAI takes him from a short diagnostic to an explainable role direction, a time-budgeted roadmap, a truthful resume review and a focused practice question—without pretending that AI can guarantee a job.
