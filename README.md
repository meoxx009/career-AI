# CareerAI — Transparent Student Preparation Platform

> **From "What should I prepare?" to one clear, evidence-based next step.**

CareerAI helps Indian CS/IT students preparing for their first internship or software job understand role requirements, assess selected skills, choose a direction, and practise with a realistic, prerequisite-aware plan.

---

## 🎨 Visual Identity & Design Tokens

- **Palette**: `void` (`#0d0e12`), warm `linen` (`#FAF3E1`), `cotton` (`#F5E7C6`), and `electric tangerine` (`#FF6D1F`).
- **Canvas Rule**: Dark canvas for focus/action, warm light surfaces (`linen`/`cotton`) for reflection, evidence, and plans.
- **Display Typography**: Condensed display headers with generous whitespace and high-readability body copy.
- **Accessibility**: WCAG AA contrast targets, minimum 44px touch targets, `:focus-visible` ring on interactive elements.

---

## 🏗️ Architecture & Stack

- **UI & Runtime**: React 19 + TypeScript + Vite.
- **Styling**: Tailwind CSS v4 with design utility tokens.
- **Icons**: Lucide React.
- **Validation**: Zod schema boundary validation for external input & AI outputs.
- **State & Persistence**: Local context with reactive `localStorage` fallback persistence.
- **Deterministic Engine**: Pure scoring algorithms in `src/lib/scoring.ts` (100% test-covered).
- **AI Boundary**: `DeterministicFallbackAdapter` in `src/lib/ai-adapter.ts` for safe, offline, zero-hallucination processing.

---

## 🚀 Available Scripts

In the project directory, run:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run unit tests (Vitest)
npm test

# Build production bundle (TypeScript + Vite)
npm run build

# Preview production build locally
npm run preview
```

---

## 📑 Completed P0 Routes

1. **`/` (Landing)**: Hero with orange glow, fictional Rahul sample snapshot card, and 3 bento pillar cards.
2. **`/onboarding` (Onboarding)**: Progressive `01 / 03` wizard on linen background with branch/year and hour budgeting.
3. **`/assessment` (Diagnostic)**: 18 reviewed questions across 6 core skills with untimed accessible mode.
4. **`/dashboard` (Dashboard)**: Personal next-best-action card, assessed alignment panel, and milestone progress.
5. **`/paths` (Career Comparison)**: Deterministic evaluation of entry-level roles (Backend, Frontend, Data Analyst).
6. **`/paths/:id/gaps` (Skill Gaps)**: Vertical prerequisite-ordered gap breakdown.
7. **`/roadmap` (Roadmap Timeline)**: Weekly task allocations budgeted to user hours with deliverable verification.
8. **`/resume` (Resume Lab)**: Truthful rewrite proposals anchored to verified user facts without hallucinated metrics.
9. **`/practice` (Mock Interview Room)**: Text-first technical & behavioral practice scored against structured rubrics.

---

## 🔒 Safety & Trust Principles

1. **No Hallucinations**: AI rewrites strictly verified facts; never invents metrics, employers, or skills.
2. **Deterministic Fallback**: The app runs 100% offline with zero external API dependencies.
3. **Transparent Uncertainty**: Unknown skills are marked as `Not assessed`, never 0% ability.
4. **No Placement Odds**: Does not promise placements, salaries, or ATS pass guarantees.
