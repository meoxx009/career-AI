# CareerAI: current zero-spend tool options

**Research date: 2026-10-02 (UTC; system date).** This is a research and planning note only. No accounts were created, software was installed, deployments were made, or secrets were handled.

## Bottom line

For the existing **React + TypeScript + Vite + Supabase + Cloudflare Pages** design, the strongest $0 hackathon path is:

- **Frontend:** React, TypeScript, and Vite, developed locally and built as static assets.
- **Backend:** one Supabase Free project for Auth, Postgres, RLS, and (only when needed) Edge Functions.
- **Hosting:** Cloudflare Pages Free for the Vite static output.
- **AI:** a local deterministic mock/fallback is the default. Gemini is optional and should receive only synthetic demo data unless the project later adopts terms and privacy controls appropriate for real resumes. An optional local Ollama model is another fallback, subject to hardware.
- **Coding environment:** VS Code or Google Antigravity. Antigravity is an AI coding/agentic development environment, not a drag-and-drop database or mobile-app builder.

A free tier is not a promise of unlimited use, availability, privacy suitable for sensitive data, or a production SLA. Re-check plan pages immediately before a demo or submission because limits, model access, and terms can change.

## Option comparison

| Area | Primary path | Fallback / when to use it | Verified caveat |
|---|---|---|---|
| UI and build | React + TypeScript + Vite | Plain static mock data in the same Vite app | React is MIT; Vite is MIT; TypeScript is Apache-2.0. These are software licenses, not hosted-service SLAs. |
| Auth, database, RLS | Supabase Free Auth + Postgres + RLS | Omit remote persistence and use local deterministic demo state | Free plan: 2 active projects, 500 MB database per project, 50,000 MAU, 1 GB storage, 5 GB egress plus 5 GB cached egress, and 500,000 Edge Function invocations. Free projects pause after one week of inactivity. |
| Server-side AI boundary | Supabase Edge Function, with the provider key kept server-side | No provider call: deterministic local adapter | Do not put a Gemini key in browser code or a `VITE_*` variable; Vite documents that `VITE_*` values are bundled into client code. |
| Static hosting | Cloudflare Pages Free | Run the app locally, or use a Pages direct-upload workflow later | Static asset requests are free and unlimited. Free Pages documents 500 builds/month, one concurrent build, 20-minute build timeout, 20,000 files/site, and 25 MiB per asset. |
| Hosted AI | Gemini API free tier, synthetic data only | Local deterministic output; optionally Ollama | Gemini free-tier input/output is free for eligible models, but model access and rate limits vary by model/project and are not guaranteed. Unpaid submissions may be used to improve Google products and may be reviewed by humans. |
| Offline AI | Ollama running locally | Deterministic mock if hardware is inadequate | Local Ollama does not send local prompts/answers to Ollama according to its FAQ. Model downloads use disk; inference needs sufficient system RAM and/or GPU VRAM, and CPU-only operation can be slow. Exact hardware minimums were not verified here. |
| Coding assistant | Antigravity Individual ($0/month) or VS Code without AI | Plain VS Code plus local tools | Antigravity pricing lists basic weekly rate limits; VS Code core editor use does not require sign-in. Neither is the application runtime, database, auth provider, or hosting service. |

## Supabase Free: suitable, but demo-sized

The official pricing page currently lists the Free plan at $0/month with:

- unlimited API requests;
- 50,000 monthly active users;
- 500 MB database size per project;
- 5 GB egress and 5 GB cached egress;
- 1 GB file storage;
- 500,000 Edge Function invocations;
- 2 million Realtime messages/month and 200 peak concurrent connections;
- a limit of 2 active projects; and
- pausing after one week of inactivity.

These are organization/service quotas, not an entitlement to production capacity. A small hackathon can fit comfortably if it stores structured profile/demo data rather than many resume files. Avoid uploading resume files to Storage unless the demo truly needs it; use synthetic text and keep the schema small.

**RLS is mandatory.** Supabase's RLS documentation says to enable RLS on every table in an exposed schema, set grants as well as policies, write separate policies for each operation, and test allow/deny cases. The browser client may use only the public/publishable key; any secret/service-role key bypassing RLS must remain server-side. CareerAI should scope every user-owned row to the authenticated user ID and test that another user cannot read or modify it.

**Auth mail is a major free-tier caveat.** Supabase's built-in SMTP is non-production: it sends only to pre-authorized project-team addresses, is currently limited to 2 messages/hour (the limit can change), and has no delivery or uptime SLA. A public email/password demo therefore must not imply reliable public mail delivery. Social OAuth or a clearly labeled team-only demo avoids depending on that mail path; a real public launch would need custom SMTP and its own provider terms/limits. No custom SMTP provider, card requirement, or current provider quota was verified in this research.

## Cloudflare Pages Free: good for the static Vite shell

Cloudflare's official Pages documentation supports Vite projects with a build output directory of `dist`. Pages can also accept prebuilt assets by direct upload. Direct upload and dashboard drag-and-drop are hosting/deployment methods only; they do **not** create a database, Auth system, mobile app, or no-code application.

Verified Free-plan limits relevant to CareerAI:

- static asset requests: free and unlimited;
- 500 Pages builds/month;
- one build at a time and a 20-minute build timeout;
- up to 20,000 files per site;
- 25 MiB maximum size for one site asset;
- up to 100 Pages projects per account; and
- Pages Functions count against the Workers Free request quota, documented as 100,000 requests/day. This is not needed if the app uses Supabase Edge Functions for its backend.

Use Pages for the compiled React/Vite frontend, and call Supabase from the client with the public client configuration. Keep privileged database operations and Gemini calls in Supabase Edge Functions, not in static browser code.

Cloudflare free-plan commercial-use and payment-card requirements were not verified from the official pages reviewed; do not infer either one. The free Pages figures also do not establish an uptime SLA.

## Gemini: optional, privacy-sensitive, and not unlimited

The current official Gemini pricing page shows a Free tier with free input/output tokens for eligible models, Google AI Studio access, limited model access, and a note that content is used to improve Google products. It does **not** provide one universal quota for all models: rate limits are per project, vary by model and account state, and are viewable in AI Studio. Google's rate-limit documentation explicitly says specified limits are not guaranteed and actual capacity may vary.

The official Gemini Additional Terms are the decisive privacy warning for CareerAI:

- Unpaid Services include direct Google AI Studio use and unpaid Gemini API quota.
- For Unpaid Services, Google says it uses submitted content and generated responses to provide, improve, and develop products and machine-learning technologies.
- Human reviewers may read, annotate, and process API inputs and outputs.
- Google says: **do not submit sensitive, confidential, or personal information to Unpaid Services.**
- The terms also say Gemini API/AI Studio are for developers building for professional or business purposes, not consumer use, and impose age/region restrictions. In particular, an API Client directed to or likely to be accessed by people under 18 is not permitted under the quoted terms; EEA, Switzerland, and UK API Clients require Paid Services.
- Paid-service treatment changes prompt/response product-improvement use, but it requires billing and is outside a zero-spend plan. Google's billing guide currently describes a minimum $5 prepayment when moving to the paid tier; do not enable billing for this zero-spend scope.

**CareerAI rule:** never send a real resume, name, email, phone number, address, employer identifier, or other PII to the Gemini free tier. Use synthetic resumes and synthetic job descriptions in demos. Make the provider call opt-in and clearly label it. The app must have a local deterministic result that works when the key is absent, the network is unavailable, the free quota is exhausted, or the service refuses a request. Do not promise free unlimited usage, stable quotas, model availability, or a production SLA.

Do not expose a Gemini API key in React/Vite. Vite's official environment-variable guide warns that client-exposed `VITE_*` values are visible in the built bundle. If Gemini is demonstrated at all, the intended architecture is:

`browser -> Supabase Edge Function -> Gemini API`

with synthetic input, bounded request size, no logging of resume content, and a graceful deterministic fallback. The Edge Function boundary protects the key; it does not make sending personal resume data to an unpaid model service acceptable.

## Local deterministic fallback and optional Ollama

The fallback should be more than an error message. Keep a small typed adapter such as `analyzeCareerDocument(input, provider)` with a deterministic provider that uses fixed rules and synthetic fixtures. It should return stable scores, skill matches, and explanations, so judging works with no API key, no network, and no AI account.

Ollama is an optional offline enhancement, not a required dependency. Its official FAQ says local Ollama runs on the user's machine and that Ollama does not see local prompts or data. The practical caveats are:

- the model itself must be downloaded and consumes substantial disk space;
- RAM/VRAM requirements depend on the chosen model and quantization;
- GPU acceleration is hardware/driver dependent;
- CPU-only inference may be too slow for a live demo; and
- a local model can produce weaker or different results than Gemini, so keep the deterministic path as the reliability baseline.

The exact Ollama hardware minimum for a selected model was not verified here. Do not claim that any particular laptop will run a particular model without measuring it.

## Google Antigravity clarification

Google's official product page calls Antigravity an **agentic development platform**. Google's launch post describes an AI-powered editor plus a Manager Surface where agents can plan, execute, and verify tasks across the editor, terminal, and browser, and says it was available at no cost for individuals in public preview. The current official pricing page lists an Individual plan at $0/month with model access, unlimited tab completions, unlimited command requests, and basic weekly rate limits.

Therefore, treat Antigravity as an optional coding environment/agent for editing and testing the existing React/TypeScript codebase. It is not evidence of a drag-and-drop no-code database builder, mobile-app builder, hosted Postgres service, Auth provider, or deployment target. The official sources reviewed do not describe it as those things. It cannot replace Supabase, Cloudflare Pages, or the app's local fallback. Its free access is rate-limited and should not be treated as unlimited.

VS Code is the simpler no-cost alternative: Microsoft's official FAQ says the core editor can be used without signing in, and that VS Code is free for private or commercial use. AI features and third-party extensions have their own services and terms; no AI subscription is required for the deterministic workflow.

## Exact zero-spend onboarding sequence

This is an order of work, not account-creation, installation, deployment, or secret-handling instructions:

1. **Freeze the privacy boundary first.** Add synthetic-only fixtures and a visible demo notice. Decide that real resumes/PII never enter an unpaid Gemini request.
2. **Build the UI and typed provider interface locally.** Finish the React + TypeScript + Vite flow against deterministic output before choosing any hosted AI.
3. **Model only the minimum persistence.** Use Supabase for Auth, a small Postgres schema, and RLS policies that scope rows to the signed-in user. Include positive and negative RLS tests.
4. **Add the server boundary.** Put privileged work in a Supabase Edge Function. Keep provider credentials out of the browser and repository. The function should reject oversized input, avoid sensitive logs, and return a typed error that selects the deterministic fallback.
5. **Connect static hosting last.** Build the Vite app to `dist` and use Cloudflare Pages for the static site when a hosted preview is actually needed. Do not add Pages Functions unless there is a demonstrated need.
6. **Evaluate Gemini only as an opt-in enhancement.** Use synthetic data, inspect the active model/project quota in AI Studio, and stop when the free limit or privacy requirement is reached. Do not enable billing or make a free-tier availability claim.
7. **Optionally benchmark Ollama on the actual demo machine.** If latency and memory are acceptable, offer it as an offline provider; otherwise omit it. Keep deterministic output as the judging-safe path.
8. **Before submission, rehearse failure modes.** Disable the API key/network, use an inactive Supabase project, exceed a small local input limit, and verify that the UI remains useful and does not reveal secrets or real personal data.

## Font alternatives

For a bundled, free-licensed visual system, use **Bebas Neue** for display text, **Manrope** for body text, and **Noto Sans Devanagari** as a Devanagari fallback. The Google Fonts repositories reviewed identify these font files as SIL Open Font License 1.1. If font files are redistributed with the app, retain the applicable license/copyright notices. A system-font fallback is also fine and avoids extra assets.

## Sources (official pages actually reviewed)

All sources below were accessed on 2026-10-02 UTC.

- Supabase pricing: https://supabase.com/pricing — Free plan quotas, pausing, and included Auth/Storage/Realtime/Edge Function features.
- Supabase billing overview: https://supabase.com/docs/guides/platform/billing-on-supabase — two free projects and organization quota accounting.
- Supabase Auth SMTP: https://supabase.com/docs/guides/auth/auth-smtp — pre-authorized-address restriction, current 2 messages/hour default SMTP limit, and no SLA.
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security — grants, policies, testing, and secret-key/RLS warnings.
- Supabase GitHub OAuth guide: https://supabase.com/docs/guides/auth/social-login/auth-github — example of the OAuth/provider path; provider credentials and setup were not performed.
- Cloudflare Pages limits: https://developers.cloudflare.com/pages/platform/limits/ — Free builds, files, asset size, projects, and related limits.
- Cloudflare Pages pricing: https://developers.cloudflare.com/pages/functions/pricing/ — free/static request treatment and Pages Functions relationship to Workers Free requests.
- Cloudflare Pages Vite guide: https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/ — Vite build command/output convention (`dist`).
- Cloudflare direct upload: https://developers.cloudflare.com/pages/get-started/direct-upload/ — prebuilt asset upload and its file/size limits; this is hosting, not a no-code builder.
- Gemini API pricing: https://ai.google.dev/gemini-api/docs/pricing — current free/paid distinction, free-token labeling, model-by-model pricing/access, and product-improvement data note.
- Gemini API rate limits: https://ai.google.dev/gemini-api/docs/rate-limits — per-project dimensions, variable model limits, and no-guarantee warning.
- Gemini API billing: https://ai.google.dev/gemini-api/docs/billing — free vs paid tiers, billing/prepayment caveats, and monitoring guidance.
- Gemini API Additional Terms: https://ai.google.dev/gemini-api/terms — unpaid-service data use, human review, sensitive-data warning, age/region/business-use restrictions.
- Vite environment variables: https://vite.dev/guide/env-and-mode — `VITE_*` exposure and secret-protection warning.
- Google Antigravity launch post: https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/ — editor, Manager Surface, terminal/browser agents, and individual public-preview positioning.
- Google Antigravity pricing: https://antigravity.google/pricing — current Individual $0 plan and listed rate-limit/features caveat.
- Google Antigravity home: https://antigravity.google/ — product description as an agentic development platform.
- VS Code FAQ: https://code.visualstudio.com/docs/supporting/faq — no-sign-in core use and free-use statement.
- Ollama FAQ: https://docs.ollama.com/faq — local data behavior, CPU/GPU loading, and local/cloud distinction.
- React license: https://raw.githubusercontent.com/facebook/react/main/LICENSE — MIT license.
- TypeScript license: https://raw.githubusercontent.com/microsoft/TypeScript/main/LICENSE.txt — Apache License 2.0.
- Vite license: https://raw.githubusercontent.com/vitejs/vite/main/LICENSE — MIT license.
- Ollama license: https://raw.githubusercontent.com/ollama/ollama/main/LICENSE — MIT license.
- Bebas Neue license: https://raw.githubusercontent.com/google/fonts/main/ofl/bebasneue/OFL.txt — SIL Open Font License 1.1.
- Manrope license: https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/OFL.txt — SIL Open Font License 1.1.
- Noto Sans Devanagari license: https://raw.githubusercontent.com/google/fonts/main/ofl/notosansdevanagari/OFL.txt — SIL Open Font License 1.1.

## Not verified

- Whether Supabase, Cloudflare Pages, Antigravity, or Gemini will request a payment card for a particular country/account flow.
- Any provider's current commercial-use interpretation beyond the terms/pages linked above.
- A universal Gemini RPM/TPM/RPD number; Google says active limits vary and must be checked in AI Studio.
- Any production uptime, support, or delivery SLA for the Free tiers.
- Exact Ollama hardware requirements for a particular model, quantization, operating system, or laptop.
- A custom SMTP provider's current free allowance, deliverability, card requirement, or commercial terms.
- Legal/privacy compliance for storing real resumes. This document is not legal advice; synthetic data is the safe hackathon default.
