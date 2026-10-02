# CareerAI — Visual Design System

## 1. Reference reading

The supplied references establish an editorial luxury mood rather than a conventional blue/purple ed-tech dashboard:

- `Screenshot_20261002-135905.png` and its copy: palette cards for Sustainable Linen, Recycled Cotton, Electric Tangerine and Black Hole.
- `1000050104.png`: black social/editorial layout, tall condensed red display wordmark, wide tracking, cream secondary type, thin flowing-line texture.
- `1000050106.png`: dark canvas with a soft orange light bloom at the top and cream glow at the bottom; minimal centered composition.
- `1000050107.png`: requested project documentation structure under `docs/`.

The platform must borrow the mood, not copy the social app or another creator's logo/wordmark.

## 2. Tokens

### Core colours

```css
:root {
  --c-void: #080B0C;          /* application canvas */
  --c-black-hole: #222222;    /* dark surface from reference */
  --c-black-soft: #101415;    /* raised dark surface */
  --c-linen: #FAF3E1;         /* primary light surface */
  --c-cotton: #F5E7C6;        /* warm secondary surface */
  --c-tangerine: #FF6D1F;     /* primary accent/CTA */
  --c-tangerine-deep: #C94E14;/* hover/bloom */
  --c-ink: #101111;           /* text on linen */
  --c-muted-light: #C8C2B4;   /* text on dark */
  --c-muted-dark: #68665E;    /* secondary text on light */
  --c-success: #A9D69B;       /* accessible warm green */
  --c-warning: #FFC36B;       /* amber */
  --c-danger: #FF8B7D;        /* error, not red display accent */
  --c-focus: #FFB38A;         /* visible focus ring */
}
```

Use exact reference colours for brand surfaces. Status colours are deliberately softer so an error does not fight the tangerine brand.

### Gradients and texture

```css
--g-hero: radial-gradient(75% 70% at 50% -5%, rgba(255,109,31,.55) 0%, rgba(255,109,31,.12) 38%, transparent 72%), var(--c-void);
--g-bottom-glow: radial-gradient(75% 65% at 80% 115%, rgba(250,243,225,.42), transparent 65%);
--g-card: linear-gradient(145deg, rgba(255,255,255,.055), rgba(255,255,255,.015));
```

Use CSS gradients only. Add a very subtle grain/noise layer as an optional decorative texture with `pointer-events:none`, opacity <= 0.05 and a reduced-motion/static fallback. Do not ship a copyrighted texture without a license.

### Typography

Recommended free fonts loaded from Google Fonts or self-hosted after licence review:

- Display: **Bebas Neue** or **Oswald**. Tall, condensed and free alternatives to the reference's Coolvetica feel.
- UI/body: **Manrope** for a human geometric voice.
- Hindi fallback: **Noto Sans Devanagari**.
- Editorial serif accent: **Cormorant Garamond** only for small quotes/highlights, never dense UI.
- Numeric/code: system monospace or **DM Mono**.

Do not bundle Coolvetica unless the licence for the exact downloaded file is confirmed. Do not use the source image's wordmark as CareerAI branding.

Type scale:

| Token | Mobile | Desktop | Use |
|---|---:|---:|---|
| display-xl | 4.25rem / .86 | 7.5rem / .82 | Landing hero only, uppercase |
| display-lg | 3rem / .9 | 5rem / .86 | Page hero |
| h1 | 2.25rem / 1 | 3.5rem / .95 | Main title |
| h2 | 1.5rem / 1.1 | 2rem / 1.05 | Section title |
| body-lg | 1.125rem / 1.5 | 1.25rem / 1.5 | Intro copy |
| body | 1rem / 1.5 | 1rem / 1.55 | Default |
| label | .72rem / 1.2 | .72rem / 1.2 | Uppercase, tracking .16em |

Use display type sparingly. Long forms and Hindi content use Manrope/Noto Sans, never condensed display type.

## 3. Layout language

- Desktop max width: 1200px; page gutters 24px mobile / 56px desktop.
- Four-column bento grid on landing; one-column reading flow on mobile.
- Card radius 24px desktop / 18px mobile. Buttons radius 999px for primary CTA and 14px for utility buttons.
- 1px borders: rgba(250,243,225,.14) on dark, rgba(16,17,17,.12) on light.
- Use generous empty space; visual hierarchy comes from scale, not shadows.
- Dark screen shell, then alternate linen/cotton insight cards for human warmth.
- Prefer CSS/SVG line motifs: a thin undulating wave behind the hero, inspired by the reference without copying it.
- Buttons have a short 150–200ms background/transform transition. No perpetual motion except a very slow ambient glow; honour `prefers-reduced-motion`.

## 4. Page-by-page UI

### Landing `/`

Dark hero with orange glow. Header: wordmark `career/ai`, one “Explore demo” text link, one linen/tangerine CTA. Hero copy uses cream display type, with a tangerine highlighted phrase. Right/lower area: a warm linen “Readiness snapshot” card showing a fictional, clearly labelled sample. Below: three bento cards — Choose a direction, Build a plan, Practise with proof.

### Onboarding `/onboarding`

Quiet linen background, dark ink text, progress `01 / 03` in a charcoal pill. One question per card, optional fields clearly marked, back/continue controls fixed on mobile. Do not ask everything on one crowded form.

### Diagnostic `/assessment`

Black-hole card on void background. Top progress bar, question category badge, answer cards with keyboard focus. Explain: “This is a short diagnostic estimate, not a certificate.” A calm “Save and return” action appears beside the primary button.

### Dashboard `/dashboard`

Dark canvas. Header greeting and “Next best action” tangerine card. Three primary panels: assessed alignment, top gap, current milestone. Use a linen plan card and cotton evidence card so the dashboard does not feel cold. Never put a leaderboard above the personal next action.

### Career comparison `/paths`

Three large role cards. Each card includes role name, assessed alignment/coverage, why it fits, two known gaps, evidence badge and “Explore plan”. A low-coverage role says “More evidence needed”.

### Skill gap `/paths/:id/gaps`

Vertical gap list with prerequisite ordering; tangerine emphasis on the first action, not every gap. Each row: skill, required/current, evidence source, why it matters, practise CTA.

### Roadmap `/roadmap`

Editorial timeline. Week cards alternate dark and warm light surfaces. Each task has estimate, deliverable, resource and completion control. Progress labels say “Plan completion” and “Last checked”.

### Resume lab `/resume`

Split on desktop, stacked on mobile: original facts on the left/top, feedback on the right/bottom. Every AI suggestion has “source facts used”, “Needs confirmation” where applicable, accept/edit/reject buttons. Never show a fabricated shiny resume as an unquestioned final.

### Interview `/practice`

A focused practice room: question, optional timer, answer editor, rubric chips and feedback. No camera permission request in MVP. Empty state offers a text-only practice mode.

## 5. Component inventory

`AppShell`, `DisplayHeading`, `PrimaryButton`, `TextButton`, `ProgressPill`, `StatusBadge`, `BentoCard`, `RoleCard`, `SkillGapRow`, `EvidenceChip`, `RoadmapWeek`, `TaskRow`, `QuestionCard`, `ScoreRing`, `SafeSuggestionCard`, `Toast`, `EmptyState`, `ErrorState`, `ConsentDialog`, `SourceLabel`.

Every component needs keyboard focus, disabled/loading treatment and a text label. Icons are Lucide outline icons at 18–22px; no emoji as information architecture.

## 6. Accessibility

- Target WCAG AA contrast; check tangerine text on cream and cream on tangerine before use.
- All inputs have visible labels and error text; placeholders never replace labels.
- Visible `:focus-visible` ring using `--c-focus`.
- Keyboard order follows reading order; dialog focus is trapped and restored.
- Touch targets minimum 44×44 CSS px.
- `aria-live` only for meaningful status changes, not every animation.
- Respect reduced motion and high contrast preferences.
- Hindi fallback renders without clipping; test long translated strings.

## 7. Content voice

Human, direct, calm and non-judgemental. Use “next skill to practise”, not “you are weak”. Prefer:

- “Here’s what we know” over “AI prediction”
- “Not assessed yet” over “0%”
- “Review this suggestion” over “Apply AI changes”
- “Estimated effort” over “guaranteed timeline”

## 8. Image and asset guidance

No stock photos are needed for the P0 flow. Use line illustrations, subtle wave SVGs and user-created/placeholder avatars only. Do not use the reference creator's profile photo, logo, social UI, text or exact artwork in the product.
