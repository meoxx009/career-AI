# CareerAI — Architecture

## 1. Recommended free-first stack

| Layer | Choice | Why |
|---|---|---|
| UI | React + TypeScript + Vite | Fast static deployment, straightforward for Antigravity-generated code. |
| Styling | Tailwind CSS + CSS variables | Tokens keep the visual system in one place; no runtime CSS framework server. |
| Components | Small local components + Radix primitives only where needed | Accessible controls without locking the design to a template. |
| Data/auth | Supabase Auth + Postgres + Storage | One free-first service with RLS; use the project's current free-plan limits, not a promise of forever-free. |
| API | Supabase Edge Functions or a tiny Vite-compatible serverless function | Keeps AI provider keys off the browser. If deployment platform cannot run a function, disable external AI and use deterministic feedback. |
| Validation | Zod | Validate browser input, function input and structured AI output. |
| Forms | React Hook Form | Progressive forms and resumable assessment. |
| Charts | CSS/SVG first; Recharts only if a chart adds meaning | Avoid visual noise and dependency weight. |
| Icons | Lucide React | Consistent, open-source icon set; never emoji in core navigation. |
| Motion | CSS transitions; Framer Motion only for intentional page transitions | Preserve reduced-motion support. |
| Local parsing | Browser text input first. Optional `pdfjs-dist` later | Do not upload a resume to a third party just to parse it in P0. |
| Test | Vitest + Testing Library; Playwright later | Scoring and safety are deterministic and testable. |
| Deploy | Static hosting + serverless functions; choose based on researched free limits | Do not expose Supabase service-role or AI keys. |

## 2. Runtime boundaries

```text
Browser (React)
  ├─ public pages and accessible forms
  ├─ local draft state / optional local resume parsing
  ├─ Supabase publishable client with RLS
  └─ calls /functions/ai-* with user session

Supabase / Fallback Store
  ├─ Auth & Local Mock Session
  ├─ Postgres tables + RLS or Deterministic Store
  ├─ private Storage bucket for explicit uploads (P1)
  └─ Edge Function / Adapter: validates auth, rate limits, redacts/minimizes, calls provider

AI provider (optional)
  └─ receives only consented, minimal, preferably synthetic/anonymized content
```

## 3. Database model

Required core tables:

- `profiles(id references auth.users, display_name, branch, study_year, hours_per_week, preferred_roles, created_at, updated_at)`
- `skills(id, slug, name, category, description, active)`
- `roles(id, slug, name, level, description, source_label, source_url, source_checked_at, version, active)`
- `role_skills(role_id, skill_id, target_level, importance, prerequisite_order, rationale, version)`
- `assessment_questions(id, skill_id, prompt, options_json, answer_key, explanation, difficulty, version, active)`
- `assessment_attempts(id, user_id, version, started_at, completed_at)`
- `assessment_answers(attempt_id, question_id, selected_key, is_correct, answered_at)`
- `skill_observations(id, user_id, skill_id, value, scale_max, source, evidence_note, confidence, rubric_version, observed_at)`
- `roadmaps(id, user_id, role_id, role_version, hours_per_week, status, created_at, updated_at)`
- `roadmap_tasks(id, roadmap_id, week_number, title, description, deliverable, estimated_hours, prerequisite_task_id, resource_url, status, completed_at)`
- `resume_documents(id, user_id, label, raw_text, created_at, updated_at)`
- `resume_analyses(id, resume_id, role_id, job_text, keyword_score, coverage, result_json, model_label, created_at)`
- `interview_sessions(id, user_id, role_id, mode, question_id, answer_text, rubric_result_json, model_label, created_at)`
- `events(id, user_id nullable, event_name, payload_json, created_at)`
