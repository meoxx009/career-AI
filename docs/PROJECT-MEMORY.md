# CareerAI — Project Memory

Last updated: 2026-10-02

## Goal

Build a free-first, coded CareerAI web MVP for a hackathon. It helps Indian CS/IT students explore three entry-level roles, understand assessed skill gaps, follow a time-bounded roadmap, safely improve a resume and practise interview answers.

## Confirmed visual direction

Reference images are stored outside this project under:

```text
C:\Users\ezyre\Downloads\Mobile Devices\Screenshot_20261002-135905 - Copy.png
C:\Users\ezyre\Downloads\Mobile Devices\Screenshot_20261002-135905.png
C:\Users\ezyre\Downloads\Mobile Devices\1000050104.png
C:\Users\ezyre\Downloads\Mobile Devices\1000050107.png
C:\Users\ezyre\Downloads\Mobile Devices\1000050106.png
```

Use warm editorial luxury style:

- void/black canvas,
- Sustainable Linen `#FAF3E1`,
- Recycled Cotton `#F5E7C6`,
- Electric Tangerine `#FF6D1F`,
- Black Hole `#222222`,
- orange glow, thin wave-line motif,
- tall condensed free display alternative (Bebas Neue/Oswald), Manrope body, Noto Sans Devanagari fallback.

Do not copy the reference creator's logo, photo, social layout, wordmark or artwork.

## Current decisions

- Start with P0: onboarding, diagnostic, explainable role comparison, roadmap, resume safety and text interview practice.
- First roles: Backend Developer, Frontend Developer, Data Analyst.
- Use heuristic language: “assessed alignment”, “coverage”, “estimated effort”; never “guaranteed placement”, “ATS pass” or uncalibrated success probability.
- Use `null` for unassessed; never make unknown a zero.
- AI is optional and must have deterministic fallback. No provider key in the browser.
- Real resumes, recordings and personal data are not used in a public demo; use synthetic Rahul.
- Live LinkedIn scraping, payments, video analysis, government exam claims and community are later scope.

## Stack assumption

React + TypeScript + Vite + Tailwind + Supabase Auth/Postgres/RLS/Storage; optional server-side AI function; static deployment. Exact free-plan details are in `docs/FREE_TOOLS.md` and must be rechecked before launch.

## Commands (verified & passing in project folder)

```text
install:  npm install                             # Verified: 70 packages audited, 0 vulnerabilities
run:      npm run dev                             # Verified: Vite v8.3.2 ready on http://localhost:5173/
check:    npm run lint && npm run typecheck && npm test  # Verified: 0 lint errors, 0 TS errors, 9/9 unit tests pass
build:    npm run build                           # Verified: tsc -b && vite build succeeds in ~400ms
```

All 4 commands have run directly and passed with exit code 0.

## Open decisions

- [ ] Team members and event deadline
- [ ] Deployment provider after checking current free limits
- [ ] AI provider, only after privacy/terms review
- [ ] Whether the final product needs English-only or a Hindi toggle
- [ ] P0 job/opportunity seed scope

## Next concrete step

Create the app skeleton and CSS tokens, then import the seed CSVs. Keep the first vertical slice deterministic: onboarding → assessment → role comparison → dashboard.

## Known gaps

This directory is a planning/design package plus a local UI preview; it is not yet an authenticated production app. Supabase project, migrations, RLS tests, provider terms, source-backed market data and deployment checks still need to be completed.
