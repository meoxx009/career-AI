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

## Exact zero-spend onboarding sequence

1. **Freeze the privacy boundary first.** Add synthetic-only fixtures and a visible demo notice. Decide that real resumes/PII never enter an unpaid Gemini request.
2. **Build the UI and typed provider interface locally.** Finish the React + TypeScript + Vite flow against deterministic output before choosing any hosted AI.
3. **Model only the minimum persistence.** Use Supabase for Auth, a small Postgres schema, and RLS policies that scope rows to the signed-in user. Include positive and negative RLS tests.
4. **Add the server boundary.** Put privileged work in a Supabase Edge Function. Keep provider credentials out of the browser and repository. The function should reject oversized input, avoid sensitive logs, and return a typed error that selects the deterministic fallback.
5. **Connect static hosting last.** Build the Vite app to `dist` and use Cloudflare Pages for the static site when a hosted preview is actually needed. Do not add Pages Functions unless there is a demonstrated need.
6. **Evaluate Gemini only as an opt-in enhancement.** Use synthetic data, inspect the active model/project quota in AI Studio, and stop when the free limit or privacy requirement is reached. Do not enable billing or make a free-tier availability claim.
7. **Optionally benchmark Ollama on the actual demo machine.** If latency and memory are acceptable, offer it as an offline provider; otherwise omit it. Keep deterministic output as the judging-safe path.
8. **Before submission, rehearse failure modes.** Disable the API key/network, use an inactive Supabase project, exceed a small local input limit, and verify that the UI remains useful and does not reveal secrets or real personal data.
