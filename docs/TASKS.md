# CareerAI — Execution Tasks

This is the build order. Do not start P1 until the P0 release gate in `PRD.md` passes.

## Phase 0 — workspace and decision log

- [ ] Create git repository and set default branch.
- [ ] Read `PRD.md`, `ARCHITECTURE.md`, `RULES.md`, `DESIGN.md`, `UI-UX-RULES.md` before generating UI.
- [ ] Record team, event deadline, target demo duration and chosen deployment target in `MEMORY.md`.
- [ ] Verify Antigravity can run the chosen Node version and local app; document any mismatch.
- [ ] Add `.env.example`, `.gitignore`, strict TypeScript and README run commands.

## Phase 1 — visual foundation

- [x] Install React/TypeScript/Vite/Tailwind and only necessary dependencies.
- [x] Add font loading with free licensed display/body/Hindi fallback; avoid copying Coolvetica.
- [x] Add colour, spacing, type and radius CSS variables from `DESIGN.md`.
- [x] Build `AppShell`, `PrimaryButton`, `BentoCard`, `SourceLabel`, `StatusBadge`, `ProgressPill`.
- [x] Build static landing, onboarding and dashboard responsive at 360/768/1280 widths.
- [x] Run keyboard and contrast pass before adding data.
- [x] **Prompt 02 Gate:** Natural color token (#9F886F) added; Frontend path card uses .natural-card; all hardcoded Rahul demo metrics removed from landing; professional multi-column footer rendered; storage banner hidden on /; Gate 2 verified (16 files, 154 tests pass).

## Phase 2 — deterministic data and auth

- [x] Create Supabase project without committing secrets.
- [x] Add SQL migration for core tables, indexes, timestamps and constraints.
- [x] Enable RLS on every user-owned table; add seed data policies.
- [x] Add `profiles`, sign-in, sign-out, reset-password and account-delete UX.
- [x] Test anonymous, user A and user B reads/writes (Gate 09 & Gate 10 passed).
- [x] Add synthetic Rahul demo mode with a visible `Fictional demo data` badge.

## Phase 3 — assessment and role comparison

- [x] Import `data/skills.csv`, `roles.csv`, `role-skill-requirements.csv`, `assessment-questions.csv`.
- [x] Build resumable 18-question assessment with save/resume and accessible untimed mode.
- [x] Implement pure scoring functions: skill observations, coverage, alignment, gaps and tie-break.
- [x] Add unit tests for empty, null, perfect, over-target, partial-coverage and boundary cases.
- [x] Build role comparison and role detail screens with evidence/source labels.
- [x] **Prompt 04 Gate:** Multi-stage intake (Class 10, Class 11-12 PCM/PCB/Commerce/Arts, BCA/MCA, Self-taught) with Path Explorer, stream opportunity groups, starter paths, no CGPA bias, and persistence; Gate 4 verified (17 files, 196 tests pass).
- [x] **Prompt 05 Gate:** Unified career catalogue (33 roles across Software & Engineering, Data & AI, Design & Product) and Path Builder with 21 academic context profiles, 5-phase staged curriculum, deterministic path matcher, and preserved starter roles; Gate 5 verified (18 files, 215 tests pass).
- [x] **Prompt 06 Gate:** Skill-based dynamic diagnostic assessment system with track selection across 18 specialized tracks (Frontend, Backend, Full Stack, CSE Foundations, ECE/Embedded, Data Analysis, Data Engineering, Data Science, AI Engineering, ML Engineering, GenAI, LLM Apps, RAG, DevOps, Cybersecurity, QA, UI/UX Design, Product Analysis), transparent content gap detection for experimental tracks, difficulty-based deterministic ordering (easy/prereq -> medium -> hard), concept rationale drawer, untimed mode, unanswered=null (unknown, never penalized as 0), and mandatory non-certificate copy; Gate 6 verified (19 files, 231 tests pass).

## Phase 4 — roadmap and progress

- [x] Import `data/roadmap-templates.csv` and validate role/skill/task IDs.
- [x] Build plan generation respecting hours/week and prerequisite order.
- [x] Build reschedule/complete/uncomplete actions with persistence.
- [x] Separate plan completion from proficiency in UI and database.
- [x] Add empty/no-evidence/expired-resource states.
- [x] **Curated Resources Resolution Gate:** Resolved all 165 milestones across 33 career roles to genuine external HTTPS documentation (Hugging Face, Scikit-learn, PyTorch, MDN, PostgreSQL, etc.); fixed AI Engineer milestone 1; healed legacy roadmaps with `careerai.local` across repositories and context; added URL sanitization and CSV validation.

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
- [x] **Prompt 07 Gate:** Unified career catalogue (33 roles) integrated into Practice Room and Resume Lab. Built reusable accessible `RoleSelector` with search and category tabs; authored `data/interview-questions.json` with 16 role-specific questions across canonical and expanded roles (AI Engineer, GenAI, LLM/RAG, Embedded Systems, UI/UX Designer) with safe fallback unreviewed question handling; expanded `ROLE_KEYWORD_ALIASES` in `src/lib/resumeAnalyzer.ts` to 32 catalogue roles; left Role 33 (Technical Writer) unreviewed to provide safe fallback notice without fake score ring; preserved all resume safety and interview text-only non-hiring invariants. Gate 7 verified (20 test files, 245 tests pass).

## Phase 7 — optional provider and deployment

- [x] Read `docs/FREE_TOOLS.md` and current provider terms before enabling AI.
- [x] Add a server-side function only; never put provider key in `VITE_*` variables.
- [x] Add consent, max payload, redaction, rate limiting and provider/model labels.
- [x] Run security, privacy and release gate audit (Prompt 15 / Gate 15).
- [x] **Prompt 08 Gate:** Settings enhancements: font-size preference (`data-font-size="default" | "comfortable" | "large" | "extra-large"`) via root `--app-font-size` without rewriting individual components or altering typography tokens; live preview card; reset to default; dedicated profile edit flow (`/profile/edit` & `/onboarding?mode=edit`) with prefilled fields, validation, roadmap replan confirmation modal, draft preservation on failure; professional "How We Use Your Data" section (`#privacy`) covering 10 explicit trust points; unified legal routes (`/terms`, `/privacy`, `/ai-safety`) with plain summaries, last updated date, and 9 numbered sections; professional footer connected with zero dead links. Gate 8 verified (21 test files, 259 tests pass).
- [x] **Resume Upload, Storage Notice Removal, Decoupled Profile & Catalogue Recommendations Gate:**
  1. Top storage/demo notice banner permanently removed from all pages (`AppShell`, `Onboarding`, `Dashboard`, `Assessment`, `RoleDetail`, `Paths`, `Settings`), retaining all underlying persistence and auth functionality.
  2. Local, client-side resume document and scan upload added to Resume Lab supporting TXT, DOCX (`mammoth`), PDF (`pdfjs-dist`), PNG, JPG, WEBP (`tesseract.js`) with 10 MB validation, drag-and-drop, replace-draft confirmation modal, progress bar, file info badge, clear file button, and OCR verification warnings. Textarea and manual edits preserved. Zero HTML DOM injection.
  3. Career catalogue recommendations evaluate stage, stream/degree, interests, current skills, target role, and weekly study hours across all 33 catalogue roles, rendering all 8 evaluation criteria with dynamic curriculum pacing, preserving 3 starter paths below.
  4. Profile editor completely removed from Settings and housed at `/profile/edit`, keeping all fields, validation, persistence, and replanning confirmation. AppShell navigation updated to route to `/profile/edit`.
  5. 22 test suites, 279 tests passing with zero failures. Production build verified.
- [x] **Prompt 2 — Paths Recommendations, Explore Buttons & Deterministic Multi-Path Matching Gate:**
  1. Replaced broken or dead explore links with verified catalogue paths across all 33 careers.
  2. Standardized recommendation data contract (`cataloguePathId`, `cataloguePathSlug`, `pathType`, `category`, `curriculumAvailable`, `requirementsAvailable`, `canExplore`, `exploreHref`, `whySuggested`, `contributingInputs`, `requirementsEvaluated`, `evidenceFound`, `stillUnknown`, `prerequisiteSkills`, `estimatedCurriculum`, `nextAction`, `disclaimer`).
  3. Updated CTA logic: Primary action is always "Explore this curriculum roadmap" navigating to `/paths/:roleSlug` or `/paths/builder`; secondary action "Take diagnostic assessment" never replaces primary explore.
  4. Extended RoleDetail `/paths/:roleSlug` to dynamically resolve all 33 catalogue slugs with "Why this career path fits", "First Hands-on Project Deliverable", 5-phase staged curriculum, and CTAs.
  5. Deterministic multi-path algorithm: top 3–6 unique paths scored on target role, academic bridge (`resolveAcademicContext`), stage compatibility, interest matches, verified skills, and prerequisite coverage with stable tie-break. No demographic or prestige bias.
  6. Added test suite `src/test/paths-recommendations-explore.test.tsx` (16 tests covering all 15 core verification scenarios). 23 test suites, 295 tests passing with zero failures. Production build verified.
- [x] **Prompt 3 — Professional Profile Page, Avatar, Email, Name & Username Gate:**
  1. Profile header renders 84px avatar (with image or initials fallback `getInitials`), full display name, normalized `@username`, verified/guest email badge, learner stage badge, target role badge, and discard changes action.
  2. Profile image upload supports PNG, JPG/JPEG, WEBP (max 2 MB) with drag-and-drop, file picker, real-time preview, inline validation, and remove photo button. Local browser storage only; image data never transmitted to third parties, AI, or telemetry.
  3. Form validation for display name (required, min 2 chars), username (optional, 3–30 chars, alphanumeric + `_` and `-`, case-normalized), and contact email (guest mode regex validation).
  4. Dual-mode email management: Authenticated accounts display read-only email with Supabase auth update flow (`supabase.auth.updateUser`) and verification notice; guest users have local contact email with privacy notice.
  5. Complete profile editing: target role (33 catalogue roles), weekly hours (1–40), reusable `LearnerContextIntake`, preferred work direction, location preference, and anchor project facts.
  6. Action controls: Cancel, Reset unsaved changes, Save Profile Changes with roadmap replanning confirmation modal on hours/role changes, and failure retry handling.
  7. Decoupled Settings: Settings page (`/settings`) renders a clean navigation card pointing to `/profile/edit`, keeping the profile editor entirely on `/profile/edit`.
  8. Created comprehensive test suite `src/test/profile-professional.test.tsx` (14 tests covering all 17 verification points). All 24 test suites (309 tests) passing with zero failures. Zero lint warnings, zero typecheck errors, production build verified.
- [x] **Prompt 4 — Degree, Specialization & Unified Skill Catalogue Gate:**
  1. Authored `data/education-catalogue.json` with 88 validated data-driven entries covering 8 degree families and specializations (School streams: PCM, PCB, PCMB, Commerce, Arts, Vocational, CS elective; Diploma / Vocational; CS & Software: BTech, BCA, BSc, MCA, MSc, MTech; Electronics & Hardware; Core Engineering; Commerce & Business; Arts / Design / Media; Generic options).
  2. Created canonical validated skill catalogue `data/skills-catalogue.json` with 50 canonical skills covering programming, DSA, Python, JS, TS, Java, C/C++, SQL, APIs, databases, frontend, React, a11y, testing, Git, Linux, Docker, cloud, DevOps, security, networking, embedded, microcontrollers, protocols, data cleaning, statistics, visualization, Excel, BI, ML, DL, NLP, CV, GenAI, LLM app dev, prompt testing, embeddings, vector search, RAG, evaluation, AI safety, UI/UX, Figma, user research, PM, BA, technical writing, communication, and project proof without duplicate spellings.
  3. Enriched all 33 paths in `data/career-catalogue.json` with explicit `prerequisiteSkillSlugs`, `coreSkillSlugs`, and `advancedSkillSlugs` pointing directly to canonical skills.
  4. Created typed data helpers in `src/data/educationCatalogue.ts` and `src/data/skillCatalogue.ts`.
  5. Built accessible, searchable combobox component `src/components/EducationSelector.tsx` with family filtering tabs, degree & specialization labels, custom unlisted degree addition, keyboard navigation, and native select compatibility fallback.
  6. Removed hardcoded degrees from `src/components/LearnerContextIntake.tsx`, integrated `EducationSelector`, and preserved self-taught learners without forcing formal degrees.
  7. Extended validators in `src/data/validator.ts` and `scripts/validateCsv.mjs` checking unique IDs/slugs, referential integrity against career catalogue and academic contexts, and zero orphaned skills.
  8. Added unit & integration test suite `src/test/education-and-skills-catalogue.test.tsx` (12 tests) and validator tests `src/data/validator.test.ts` (14 tests). All 25 test suites (329 tests) passing with zero failures. Zero lint warnings, zero typecheck errors, production build verified.
- [x] **Prompt 5 — Unified Path-to-Gap-to-Roadmap Flow Gate:**
  1. Authored `data/path-skill-requirements.json` with 343 validated requirements across all 33 career paths, containing `pathId`, canonical `skillId`, `targetLevel` (1–4), `importance` (1–3), `prerequisiteOrder`, `rationale`, and valid `evidenceSources` (diagnostic, self-report, resume, project fact, reviewed project, practice, assessment).
  2. Standardized curriculum contract across all 33 paths in `data/career-catalogue.json` with 5 required phases in strict order (`Foundations`, `Core skills`, `Guided project`, `Portfolio/proof`, `Practice and review`), explicit `skillIds`, `deliverable`, `estimatedHours`, `prerequisiteItemIds`, `resourceUrl`, and `status`.
  3. Implemented pure deterministic gap analysis engine `src/lib/gapAnalysis.ts` (`calculatePathGapAnalysis`, `resolveSkillObservation`): `null` is strictly unknown/unassessed (never penalized as 0, never converted to confirmed gap), computing evidenced, partially evidenced, confirmed assessed gaps, unassessed requirements, missing evidence, and top prerequisite gap.
  4. RoleDetail (`/paths/:roleSlug`) enriched with path requirements, prerequisite competencies, target levels, rationales, 5-phase staged curriculum, and exact fallback notice when no diagnostic has been taken: *"Assessment not completed. Evidence is not available for these requirements yet. Take the diagnostic or add a verified project/resume fact."*
  5. Roadmap (`/roadmap`) updated with visible Header Gap Summary banner (top prerequisite gap, assessed gaps count, unassessed requirements count, evidenced requirements count, link to full gap analysis), task cards displaying linked skill, target level, evidence state badge, evidence source, deliverable, prerequisite lock, completion status, and next action.
  6. Clear dual-progress separation: **Estimated Plan Completion** (milestones completed / total effort hours) distinctly separated from **Verified Skill Evidence** (demonstrated via assessment diagnostic & deliverables, never called mastery or guaranteed outcome).
  7. Continuous-pointer hour budgeter and roadmap generator (`src/lib/roadmapGenerator.ts`) supports all 33 paths, converts curriculum into templates, preserves prerequisite order, splits oversized tasks, blocks dependent tasks, maintains completion state across replanning, and returns error *"Curriculum content pending review"* if curriculum is missing.
  8. Extended data validator (`src/data/validator.ts` & `scripts/validateCsv.mjs`) validating all 343 path requirements and 5-phase curriculum sequences.
  9. Created comprehensive test suite `src/test/unified-path-roadmap.test.tsx` (13 tests verifying all Prompt 5 criteria). All 26 test suites (342 tests) passing with zero failures. Zero lint warnings, zero typecheck errors, production build verified.
- [x] **Universal Role Selection, Dynamic Preview Hero, Deterministic Related Paths, and Roadmap Alignment Gate:**
  1. Universal applicability across all 33 production career paths in `CAREER_CATALOGUE`.
  2. Removed default 3 starter paths in PathBuilder for fresh state; added calm role selection prompt and full 33-career selector.
  3. Animated `RolePreviewHero.tsx` with metrics, 5-phase strip, deliverables, pulse indicator, and CTAs.
  4. Deterministic related paths matching (`getRelatedCareerPaths`) returning up to 3 scored adjacent roles.
  5. Staged 5-phase curriculum placed directly below preview hero.
  6. Secondary collapsible catalogue with category tabs and search.
  7. Role-specific roadmap with effort summary, active milestone indicator, and calm empty state when unselected.
  8. Strict visual token preservation and accessibility compliance.
  9. 29 test suites, 378 tests passing (100% pass rate). Production build verified.
- [x] **Prompt 1 — Session-Aware Login Priority & Authentication Contract Gate:**
  1. Added `AuthStatus` lifecycle (`initializing`, `authenticated`, `unauthenticated`, `error`) to resolve sessions before auto-opening modal.
  2. Decoupled session authentication from profile/roadmap hydration with stale request protection (`activeUserIdRef`) and duplicate hydration avoidance (`lastHydratedUserIdRef`).
  3. Non-blocking auth event listeners in `CareerContext.tsx` avoiding provider lock contention.
  4. Promptly auto-opens dismissible sign-in modal on entry for confirmed signed-out visitors; remembers dismissal in `sessionStorage` (`career_ai_auth_prompt_dismissed`).
  5. Suppresses modal opening during OAuth redirect, recovery, and email confirmation flows.
  6. Restores valid sessions without modal or flicker, rendering `<NavbarProfile />`.
  7. Non-looping `signOut()` clears in-memory state and restores Sign In without an immediate repetitive popup.
  8. Enforces production authenticity: guest sessions and synthetic demo are not treated as authenticated cloud accounts; unconfigured Supabase rejects fake password sign-ins with clear guidance.
  9. Enhanced `AuthModal.tsx` accessibility: email input auto-focus, focus trapping (Tab wrap), Escape dismissal, focus restoration, backdrop click dismissal, and responsive scroll container for short screens.
  10. 31 test suites, 390 tests passing (100% green), 0 lint errors, 0 typecheck errors, production Vite build verified.
- [x] **Prompt 2 — Profile, Roadmap & Resume Persistence Round-Trip Gate:**
  1. Authored forward-only additive SQL migration `supabase/migrations/0002_profile_and_resume_expansion.sql` preserving `0001_initial.sql` and existing RLS policies intact.
  2. Full round-trip profile persistence: mapped all 25+ fields (`institution`, `branch`, `specialization`, `expected_graduation_year`, `portfolio_url`, `github_url`, `linkedin_url`, `target_role_slug`, `interests`, `current_skills`, `verified_projects`, `weekly_hours`) across `UserProfileSchema`, `UserProfile`, `SupabaseProfileRepository`, and `LocalProfileRepository`. No dropped fields, no hardcoded `targetRoleId: 1`. Formal college remains completely optional for self-taught learners.
  3. Scoped roadmap persistence by both `userId` and `roleId` (`career_ai_roadmap_${userId}_${roleId}`). Switching target roles preserves completed tasks across multiple active tracks without state collision.
  4. Durable task identity: preserved client template identifiers (`template_id`, `parent_task_id`, `segment_index`, `scheduled_hours`, `prerequisite_template_id`) ensuring task IDs (`rm-task-...`, `task__s0`) remain durable across saves and continuous-pointer rescheduling, preventing broken milestone fact links (`fact-rm-${taskId}`).
  5. Resume document persistence & grounded fact sync: wired `defaultResumeRepository` into signed-in user load/save in `CareerContext.tsx`. Implemented `syncProfileFactsToResume` (`src/lib/profileResumeSync.ts`) linking verified profile facts into grounded resume facts without hallucinations, keeping guest storage keys unpolluted.
  6. Added profile edit fields for institution, expected graduation year, portfolio URL, GitHub URL, and LinkedIn URL in `ProfileEdit.tsx` and `LearnerContextIntake.tsx`.
  7. Created integration test suite `src/test/persistence-roundtrip-identity.test.tsx` (8 tests). All 32 test suites (398 tests) passing with 100% success. Zero lint warnings, zero typecheck errors, production Vite build verified.
- [x] **Prompt 3 — Apply as a Real Commit Action, Draft Isolation & Relevance Calibration Gate:**
  1. State model separation: decoupled `draftProfile`, `appliedProfile`, `recResult` (deterministic recommendations derived solely from the applied snapshot), previewed direction, and active roadmap target.
  2. Isolated editing: field edits in `LearnerContextIntake` mutate local draft only without triggering continuous repository writes, global state mutations, or live direction recalculations while typing. Cancel restores previous values. External profile changes sync only when editor is closed.
  3. Atomic Apply commit: validates the full draft, captures an immutable snapshot, and persists once via `saveProfile(snapshot)`. On success, commits `appliedProfile`, recalculates directions from that snapshot, closes the customizer, and focuses the branching results container.
  4. Failure handling: on repository failure, retains draft, keeps editor open, displays clear error alert, and never shows "Applied successfully".
  5. Universal role anchoring & relevance calibration: explicit target roles (roles 1-33) are mandatory anchors; interest-only profiles produce a focused set of meaningfully matched directions without unrelated padding; token boundary, stemming, and canonical mapping eliminate false substring matches ('ai' in 'email', 'react' in 'reaction'); hours modulate pacing only; self-reported skills are labelled 'Self-reported' and never claimed as verified.
  6. Calm empty state: empty profile produces no default role result (no automatic Backend result, no 3 starter roles in branching directions); renders Level 1 Root Node and an invitation to configure signals.
  7. Created comprehensive integration test suite `src/test/apply-commit-action.test.tsx` (7 tests). All 33 test suites (405 tests) passing with 100% success. Zero lint warnings, zero typecheck errors, production Vite build verified.
- [x] **Prompt 4 — Top-to-Bottom Branching Animation & Clean Paths Page Gate:**
  1. Removed unconditional starter cards section (Backend Developer, Frontend Developer, Data Analyst) from `/paths` (`src/pages/Paths.tsx`) and obsolete imports/variables. Kept all 33 careers in `CAREER_CATALOGUE`.
  2. Clean default content: leaf nodes do not simultaneously expand all 8 criteria. Compact "Why this direction?" accordion toggle retains transparent reasoning on demand.
  3. Top-to-bottom visual branching tree (`BranchingPathTree.tsx`): Root node ("YOUR APPLIED DIRECTION • ROOT HORIZON"), vertical stems/connectors with `pointer-events: none`, and clean direction cards with canonical role name, 1-line description, top 3 skill badges, and accessible preview action.
  4. Direction overview below tree: clicking a node previews its 5-phase curriculum breakdown, estimated effort, and verified deliverables with direct syllabus link and explicit `Activate for Roadmap →` CTA.
  5. Default open logic: opens explicit target role path below tree by default; presents calm invitation when directions are recommendations only.
  6. Decoupled preview & activation: inspecting a direction node never mutates `selectedRoleId`; roadmap changes only upon explicit button click.
  7. Top-to-bottom CSS animation (`branchFadeDown`, `branchGrowLine`) triggers top-to-bottom for 400–800 ms only on genuine new Apply commits (`applyKey` change). Respects `prefers-reduced-motion: reduce`.
  8. Responsive multi-column layout on desktop/tablet, single-column on mobile (< 768px) with no horizontal overflow.
  9. Created comprehensive test suite `src/test/branching-animation-clean-paths.test.tsx` (6 tests). All 34 test suites (411 tests) passing (100% green). Zero lint warnings, zero typecheck errors, production Vite build verified.
- [x] **Prompt 5 — Automatic Sync of Actual Accomplishments from Roadmap to Resume Lab Gate:**
  1. Completion meaning & truthful grounding: distinguished planned milestones, learner-marked completion, actual work descriptions, and reviewed evidence. Checkboxes never imply mastery or guaranteed employment. Planned goals alone never generate "Built X" claims.
  2. Low-friction work capture: preserved instant "Mark Complete" action. Completed milestones offer a compact inline accomplishment evidence form capturing what learner did, contribution, technologies, outcome/limitation, and project/demo URL. Form is optional and skippable without blocking progress.
  3. Pure and idempotent roadmap-resume sync engine (`src/lib/roadmapResumeSync.ts`): derives concise accomplishment drafts from actual work, or truthful educational completion bullets when actual work is skipped. Groups split milestone segments by parent template; partial segments do not claim whole completion. Prevents duplicate bullets on repeated saves/refreshes.
  4. Review/edit/include/dismiss pattern in Resume Lab: learners can include, dismiss, or custom edit synchronized accomplishment bullets. Manual edits survive work description updates without being overwritten.
  5. Undo & reverting completion: unchecking a milestone excludes unreviewed generated entries from final output and marks source facts outdated without deleting manual edits.
  6. Role switching & cross-role retention: completed milestones across all career paths remain saved in the resume document's source pool, with target-role filtering in Resume Lab prioritizing the active career path.
  7. Additive migration & persistence: authored `supabase/migrations/0003_actual_work_sync.sql` adding `actual_work jsonb` to `roadmap_tasks`. Synthetic demo data (Rahul) is strictly guest-isolated and never written to real user tables.
  8. Created comprehensive test suite `src/test/roadmap-accomplishments-sync.test.tsx` (8 tests). All 35 test suites (419 tests) passing (100% green). Zero lint warnings, zero typecheck errors, production Vite build verified.
- [x] **Prompt 6 — Profile + Roadmap Work Structured Resume Composer Gate:**
  1. Structured ATS-friendly resume composer engine (`src/lib/resumeComposer.ts`): pure deterministic generator formatting standard 6 sections ((1) Name & contact links, (2) Role summary, (3) Education, (4) Skills, (5) Projects from roadmap accomplishments and profile, (6) Experience/certifications).
  2. Truthful action-led bullets: normalized action verbs (`Action -> actual work -> tech -> outcome`); strictly sanitizes and rejects fabricated metrics (`40% reduction`, `10,000 users`, `99.9% uptime`).
  3. Clean value filtering: `isCleanValue` filters out placeholders ('N/A', 'None', 'Unknown') and internal identifiers (`usr-`, `fact-rm-`, UUIDs).
  4. Self-taught & incomplete profile integrity: cleanly omits education for self-taught candidates without placeholder colleges; handles partial profiles gracefully without crashes.
  5. Resume Lab UI integration (`src/pages/ResumeLab.tsx`): added "Compose from Profile & Work" button, empty draft 1-click prompt, and confirmation dialog for existing text offering overwrite vs merging accomplishments (`regenerateResumePreservingManualEdits`).
  6. Dual-view & clean export: view switcher between Plaintext Editor and ATS Recruiter Preview. Print export container renders clean candidate document matching preview without application chrome or banners.
  7. Created comprehensive test suite `src/test/resume-composer-structured.test.tsx` (10 tests). All 36 test suites (429 tests) passing (100% green). Zero lint warnings, zero typecheck errors, production Vite build verified.
- [ ] Deploy static UI and function layer; configure only required redirect URLs.
- [ ] Run production smoke test with synthetic data and AI disabled.

## Phase 8 — hackathon proof

- [ ] Prepare 3-minute Rahul walkthrough in `docs/DEMO.md`.
- [x] Record source/date for every market or job fact shown.
- [x] Test cold load, refresh persistence, failed network, empty state and narrow mobile viewport.
- [x] Run all checks, capture exact outputs and list known gaps.
- [ ] Rehearse the one-sentence product promise, trust explanation and fallback demo.

## Stop conditions

Stop adding features if the next task would delay: account isolation, assessment scoring tests, truthful resume edits, mobile usability or the deterministic offline demo.
