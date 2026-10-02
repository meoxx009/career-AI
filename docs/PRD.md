# CareerAI — Product Requirements Document

Status: approved design brief for implementation, not a finished application. Owner: project author. Working product name: CareerAI (not trademark-checked).

## 1. Product promise

**From “What should I prepare?” to one clear, evidence-based next step.**

CareerAI helps Indian CS/IT students preparing for their first internship or software job understand role requirements, assess selected skills, choose a direction, and practise with a realistic plan. It is a preparation assistant, not a recruitment decision-maker, psychometric test, or placement guarantee.

### Inputs and decisions
- User supplied a broad career-platform concept and five local reference image paths. The two palette screenshots are visually identical.
- Confirmed visual direction: linen `#FAF3E1`, cotton `#F5E7C6`, tangerine `#FF6D1F`, charcoal `#222222`; tall display type; dark orange-glow background.
- Confirmed delivery: coded web app built with Antigravity and free tools; PRD, architecture, rules, design, tasks, memory and UI/UX rules files.
- Chosen starting scope: individual student, three entry-level roles, English UI with Hindi-capable fonts. These are implementation defaults, not additional user facts.
- College admin, government pathways and voice/video are later phases, not fake active features.

## 2. Problem and differentiator

Students juggle disconnected courses, resumes and job descriptions without knowing what to do next. Placement staff cannot always offer frequent individual feedback.

The differentiator is a **transparent preparation loop**:

Profile → short diagnostic → explainable role comparison → prerequisite-aware plan → evidence from practice → truthful resume → mock answer → revised next action.

Do not claim no competitors exist. Demonstrate the integrated loop and its safeguards instead. The percentages, salaries and placement predictions in the original brainstorm are unverified examples, not evidence to repeat in the pitch.

## 3. Persona and first flow

Rahul is a fictional third-year student with a small Python project, limited SQL experience and 6–8 available study hours per week. He wants to explore backend development without abandoning other options.

He opens a clearly labelled fictional demo or creates a private account; finishes a short profile and diagnostic; compares three roles; selects one; receives a weekly plan sized to his time; completes one milestone; practises explaining it; exports a resume containing only his facts.

A returning user sees their **next best action**, not a wall of statistics or an engagement leaderboard.

## 4. Scope and acceptance criteria

### P0 — one persistent working flow

| ID | Requirement | Acceptance condition |
|---|---|---|
| P01 | Guest demo + account boundary | Fictional demo opens without signup; cannot write to a real account; all seeded numbers labelled demo. |
| P02 | Account and privacy | Signup/sign-in/sign-out, reset-password flow, owner-only access, consent notice and account deletion; tested with two different accounts. |
| P03 | Onboarding | Name optional, branch/year, preferred roles, study hours/week, current skills and project facts; validation; saved values return on refresh. CGPA and salary optional; no ranking penalty for omission. |
| P04 | Diagnostic | Initially 18 reviewed questions across six skills; save/resume; accessible untimed mode; answers graded server-side; unanswered question is not automatically a wrong answer. Explain this is a short diagnostic, not certified proficiency. |
| P05 | Role comparison | Backend, Frontend, Data Analyst; shows versioned requirements, assessed alignment, evidence coverage, known gaps and unassessed skills. No placement-probability number. |
| P06 | Roadmap | User chooses path and available hours; prerequisite order and weekly hour budget respected; tasks have deliverables, estimates and learning-resource links. User can reschedule without losing work. |
| P07 | Progress | Task completion persists; completion is separate from skill proficiency; selected role and plan version are retained; replan requires confirmation. |
| P08 | Resume workspace | Paste/edit text and job description; contacts can remain local; heuristic keyword/structure feedback; user reviews each suggestion; unsupported facts blocked; export through print/PDF with selectable text. |
| P09 | Interview practice | One behavioural and one role-specific text question; answer persists only by explicit save; checklist/rubric feedback; AI optional and labelled; no facial/voice personality judgement. |
| P10 | Failure handling | Core path works without AI; network errors preserve draft and offer retry; quota state is explicit; loading, empty and invalid-input states exist. |

### P1 — only after P0 passes
- Curated opportunities with canonical URL, checked date and eligibility notes; save and manually update application status.
- Optional text PDF extraction with clear OCR-not-supported fallback; no public upload bucket.
- Resource catalogue, compare previous diagnostic attempts and small mentor-review export.
- Optional structured AI suggestions for synthetic/anonymized content after provider terms and consent gates pass.

### Later / explicitly out of MVP
- Live LinkedIn scraping/API assumptions, mass auto-apply, payments, native mobile app, community feeds.
- Placement/salary predictions, universal “ATS pass” score, MBTI-based career assignment.
- Camera emotion/eye-contact/confidence scoring, code execution on the app server, unlimited AI.
- Government-exam eligibility engine. Any future content must use official notifications: UPSC ISS means Indian Statistical Service, not “Information Systems”; GATE alone does not guarantee a PSU job; SSC CGL is not generically an IT Officer exam. Do not publish the brainstorm's mappings as verified guidance.

## 5. Scoring and evidence contract

All weights/thresholds below are **versioned product heuristics**, not calibrated industry facts. Validate against reviewer feedback before stronger claims.

### Skill observations
Each observation records skill ID, value in 0–4 or null, source, observation date, rubric version and assessment attempt. The short diagnostic can map percentage correct to a coarse 0–4 estimate, but UI calls it “diagnostic estimate”. Three questions per skill have low measurement precision. No percentile, certificate or population benchmark.

Source labels: `diagnostic`, `self_report`, `self_attested_project`, `reviewed_project`. A pasted GitHub link is not independently verified. Self-report never silently overwrites an assessed observation. Store evidence separately; do not count the same project twice.

### Role requirement
For each role-skill pair, define target level 1–4, importance weight 1–3, rationale and source/version. Requirements in supplied seed data are illustrative, editor-curated targets, not a current job-market survey.

For skills with diagnostic or genuinely reviewed observations:

```
coverage = sum(known requirement weights) / sum(all requirement weights)
alignment = 100 * sum(weight * min(observed / target, 1)) / sum(known weights)
known_gap = max(target - observed, 0)
```

- A real measured zero is known; `null` means unknown, never zero.
- No known skills: alignment is null; show “Take the diagnostic”, not 0%.
- Below 60% weighted coverage: show “More evidence needed”, not a precise role rank.
- At/above 60%: display rounded **assessed skill alignment** with coverage adjacent. It is not an overall readiness or success probability.
- Missing assessment: list “Not assessed”; do not call it a weakness.
- Interests are qualitative preferences and user choices, not a personality score or a hidden bonus.
- Sort adequately covered roles by alignment; tie-break deterministically by role ID. Incompletely covered roles remain explorable.
- Never use name, gender, caste, college prestige or optional CGPA as ability signals.

### Gap priority and roadmap
Group by prerequisite order first, then `importance × known_gap`. Unknown important prerequisites trigger a short assessment/review task before remedial study. Large cloud gaps never outrank basic programming/API prerequisites solely because the numeric gap is larger.

Use curated tasks with estimated hours, prerequisite IDs and measurable deliverables. Weeks are filled to the student's hour budget. Dates and hours are estimates. Progress = completed planned effort / total planned effort; label as plan completion, not learning mastery. Retest or reviewed evidence is needed to change measured proficiency.

## 6. Resume and interview trust

- Source facts have IDs; every rewrite cites the facts it used.
- No new employer, technology, metric, responsibility, uptime or user count without a source fact and user confirmation.
- If a metric is absent: ask for one or write a useful non-numeric bullet. Never invent “40% improvement”.
- Missing job keywords are learning/evidence gaps, not instructions to insert unearned skills.
- Similar keyword terms use a reviewed alias map; report matched and missing terms, not a guaranteed ATS outcome.
- Heuristic feedback is labelled “Checklist feedback”; LLM feedback is labelled “AI-generated; review needed”.
- Technical answer grading uses reviewed expected points and can abstain. A word count alone cannot grade correctness. Do not offer definitive local technical scores from text matching.
- Corrections, disagreement and manual edits must be possible. No deduction for accent, disability, video refusal or writing in the supported language.

## 7. Success measures

Hackathon targets, **not claimed results**:
- Five volunteer users can finish the main flow; observe task success and confusing steps.
- First useful result within ten minutes on sample flow, measured from actual sessions.
- All seeded unsupported resume-metric cases blocked in tests.
- No cross-account reads/writes in RLS tests.
- Core demo completes with AI disabled and in a provider-timeout scenario.
- Zero critical keyboard traps/contrast failures on primary screens.

Record sample size and observation date. Do not claim higher salaries, faster placements or ROI without a longitudinal study.

## 8. Product copy

Hero: **Your next chapter starts with a clear next step.**
Subheading: “Find a direction, practise the skills that matter, and tell your story with confidence.”
CTA: “Find my direction” · Secondary: “Explore the demo”
Progress: “A little progress still counts.”
Unassessed: “We haven't checked this yet. Want to try a short exercise?”
AI outage: “AI suggestions are taking a break. Your plan and checklist are still available.”

## 9. Release gate

P0 is not complete until identity isolation, refresh persistence, score boundaries, truthful rewrites, plan budgeting, accessible navigation and API-failure fallback pass. The supplied preview demonstrates style and limited local interactions only; it does not satisfy the account/database/AI requirements.
