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

Antigravity is treated as an AI coding assistant/workbench. It is not a hidden production database, auth provider or source of truth. Generate code through it, then review and run it locally.

## 2. Runtime boundaries

```text
Browser (React)
  ├─ public pages and accessible forms
  ├─ local draft state / optional local resume parsing
  ├─ Supabase publishable client with RLS
  └─ calls /functions/ai-* with user session

Supabase
  ├─ Auth
  ├─ Postgres tables + RLS
  ├─ private Storage bucket for explicit uploads (P1)
  └─ Edge Function: validates auth, rate limits, redacts/minimizes, calls provider

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
- `events(id, user_id nullable, event_name, payload_json, created_at)` — never store raw resume/audio in analytics.

P1: `opportunities`, `saved_opportunities`, `applications` with canonical URLs and checked dates.

Do not store contact details, raw resume text or AI payloads in `events`. Keep uploads private. Add retention/deletion commands before production use.

## 4. Row-level security

Enable RLS on every user-owned table. Use:

```sql
using (auth.uid() = user_id)
with check (auth.uid() = user_id)
```

For child tables, authorize through the parent user's ID. Seed role/skill/question data is read-only to normal users. Admin editing is a future role with a separate policy; never ship a broad service-role key to the client. Test with two accounts and an anonymous client.

## 5. Request contracts

### `POST /functions/ai-resume-review`

```ts
{
  resumeText: string,
  jobDescription: string,
  targetRoleId: string,
  factIds?: string[],
  consent: true
}
```

Response (validated before save):

```ts
{
  mode: "ai" | "deterministic-fallback",
  matchedTerms: string[],
  missingTerms: string[],
  unsupportedClaims: Array<{text: string; reason: string}>,
  suggestions: Array<{original: string; rewrite: string; sourceFactIds: string[]; needsConfirmation: boolean}>,
  caveat: string
}
```

### `POST /functions/ai-interview-feedback`

Use a question ID, answer text and rubric version. The response must include `abstained: boolean`, strengths, gaps, one next action and cited rubric criteria. Never return a personality, hiring or “hire/no-hire” decision.

## 6. AI boundary

AI is optional copy/feedback assistance. The deterministic layer owns grading, role fit, gap priority and permissions. Validate JSON with Zod, enforce output length, rate limit by user, log provider/model labels, and show a retry state. Model prompts live in `/prompts`; version prompt changes.

If provider unavailable, use:
- deterministic role comparison,
- reviewed keyword alias map,
- checklist interview rubric,
- local demo data.

## 7. Security and privacy checklist

- `.env` is ignored; commit only `.env.example` with placeholders.
- Supabase URL and publishable/anon key may be browser-visible; service-role and AI keys never may be.
- Minimize prompt payload; send a redacted/synthetic demo unless user opts in.
- Avoid public storage URLs; signed URLs expire.
- Add rate limits and max text lengths to all AI functions.
- Never render AI HTML unsanitized; render plain text/markdown safely.
- Do not scrape LinkedIn or auto-apply. Use canonical, permitted sources.
- Add export/delete controls before asking for sensitive documents.

## 8. Deployment sequence

1. Run local deterministic app with no secrets.
2. Create Supabase project and apply schema/policies.
3. Add only publishable Supabase variables locally.
4. Run RLS tests with anonymous, user A and user B.
5. Deploy static UI and function layer.
6. Add optional AI provider key in server-side secret settings.
7. Run demo using synthetic Rahul data; show the AI-off path once.

## 9. Observability

Track only product events: onboarding completed, assessment completed, role selected, task completed, resume review accepted, interview completed, error category. Do not log resume bodies, answers or tokens. Keep a manual provider/quota status note for the demo.
