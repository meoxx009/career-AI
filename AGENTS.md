# Instructions for AI coding agents

Read these files before changing product code:

1. `docs/ANTIGRAVITY-BUILD-PROMPTS.md` when following the numbered build sequence.
2. `docs/PRD.md` — scope, acceptance criteria, scoring and trust contract.
3. `docs/ARCHITECTURE.md` — boundaries, tables, RLS and AI interface.
4. `docs/RULES.md` — non-negotiable product/security rules.
5. `docs/DESIGN.md` — visual tokens and page language.
6. `docs/UI-UX-RULES.md` — interaction/accessibility rules.
7. `docs/MEMORY.md` — current decisions and known gaps.
8. `docs/TASKS.md` — build order.

## Working agreement

- Work on one vertical slice at a time; do not implement the full roadmap in one change.
- Preserve the reference palette: `#FAF3E1`, `#F5E7C6`, `#FF6D1F`, `#222222`, with a near-black canvas.
- Keep the deterministic path working when no AI key is configured.
- Do not invent resume claims, job data, salaries or placement predictions.
- Keep user-owned data behind auth and RLS.
- Add tests for scoring, privacy boundaries and AI safety whenever they change.
- Run the actual project checks and report command/output honestly.
- Update `docs/MEMORY.md` for meaningful decisions and `docs/TASKS.md` as work completes.
- Do not add a dependency or external service without explaining its free-plan/privacy impact.

## First implementation slice

Build: landing → demo/onboarding → assessment → deterministic role comparison → dashboard. Use synthetic data only. Do not add live job scraping, video analysis or payments.
