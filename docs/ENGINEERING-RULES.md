# CareerAI — Engineering and Product Rules

## Non-negotiable product rules

1. Do not promise a job, salary, placement date, ATS pass, percentile or probability unless a reviewed dataset and methodology support it.
2. Treat user data as private by default. Never use a real resume in a public demo.
3. AI rewrites verified facts; it never invents metrics, employers, technologies, responsibilities or outcomes.
4. `null` means unknown. Never convert unknown evidence into zero skill.
5. Recommendations must explain the evidence used, the gaps and the uncertainty.
6. A diagnostic is an estimate, not a certification or clinical/psychometric assessment.
7. No MBTI or protected attribute is used to determine career fit.
8. Government and job information must show a canonical source and checked date; unsupported advice is excluded.
9. User consent is required before external AI processing of a resume or answer.
10. A refusal to upload a resume, speak, record video or share optional demographic data must not block the text-based core flow.

## Coding rules

- TypeScript strict mode; avoid `any` in application code.
- Validate all external input with Zod at the boundary.
- Keep scoring pure and deterministic in `src/lib/scoring`; unit-test every boundary.
- Keep AI adapters behind an interface. The app must run in `deterministic-fallback` mode.
- No secrets in browser bundles, source files, docs, screenshots, or prompts.
- Use server-side checks for authorization; UI hiding is not security.
- Every user-owned query must be covered by RLS and tested against another user.
- Use stable IDs/slugs, not display strings, for joins and scoring.
- Keep migrations forward-only and review SQL before applying it.
- Do not add a package when a small local function is clearer.
- Do not call third-party job pages from the browser without permission; store canonical links.
- Avoid `dangerouslySetInnerHTML`; sanitize if rich text becomes necessary.
- Preserve drafts on errors and expose retry; never silently discard form data.

## AI rules

- Prompts must state role, scope, data limits, output schema and abstention behaviour.
- AI output is untrusted input: parse, validate, length-limit and escape it.
- Store model/provider/prompt version with generated feedback; do not store full sensitive payload in logs.
- Use a fixed rubric for interview feedback. No facial, accent, emotion or personality inference.
- If the model cannot cite a fact from input, mark the suggestion `needsConfirmation` or omit it.
- AI-generated content must be labelled and editable.

## UI rules

- Follow `docs/UI-UX-RULES.md` and `docs/DESIGN.md`; do not introduce a second colour system.
- One primary action per view; secondary actions are visibly secondary.
- Every async action has idle, loading, success and failure states.
- Keyboard focus, visible labels, contrast and reduced motion are required.
- Do not use colour alone for status; pair it with text/icon.
- Preserve a human tone: explain the next action, do not shame a low score.
- Do not create fake activity, fake testimonials or fake job listings.

## Content rules

- Use Indian English where appropriate and simple Hinglish only when the user chooses it.
- Explain “why” before showing a score.
- Replace “weak” with “needs evidence” or “next skill to practise”.
- Every market claim in a pitch has a source or is clearly marked as an observation/target.
- Include the date when displaying a source-sensitive fact.

## Definition of done

A change is complete only when:
- its user-visible behaviour works from the real screen to persisted result,
- invalid, empty, loading and provider-failure states are handled,
- relevant unit/accessibility/RLS checks run,
- docs/data contracts are updated,
- no unverified claim was added,
- the exact check command and result are recorded.
