# CareerAI — UI/UX Rules

## Visual rules

1. The visual identity is `void + warm linen + cotton + electric tangerine`; do not add purple/blue as a second brand identity.
2. Use a dark canvas for focus and a warm light surface for reflection/evidence. Alternate them with intent.
3. Display typography is tall/condensed only for short labels, page titles and hero words. Body copy stays highly readable.
4. One hero glow and one focal CTA per viewport. Avoid gradient soup and decorative animation behind forms.
5. Use the tangerine as a signal, not as a full-page background. Keep primary CTAs obvious.
6. A card must either explain, compare or enable an action. Remove decorative cards with no decision value.
7. Curved corners are friendly, but do not turn every nested element into a pill.
8. Use the reference's generous whitespace. Density comes from grouping, not tiny type.

## Interaction rules

1. Every page answers: “Where am I?”, “What do I know?”, “What can I do next?”
2. The primary action is a verb: `Find my direction`, `Continue assessment`, `Start this task`, `Review suggestion`.
3. Never make a low score the first visual. Lead with evidence and next action.
4. Show one question per assessment screen on mobile. Preserve progress and draft answers.
5. A score is always paired with its scale, coverage, source and date/version.
6. `Unknown` is a designed state with an action, not an empty hole.
7. AI content always has an “AI suggestion — review before using” label.
8. Destructive actions require confirmation and explain impact.
9. Toasts do not replace inline form errors. Errors explain recovery.
10. On slow networks, show skeleton/content placeholders; do not freeze the page.

## Responsive rules

- Mobile first at 360px; test 390px and 430px.
- Tablet layout at 768px; desktop at 1024px; wide content maxes at 1200px.
- At mobile: stack cards, turn side-by-side editor into tabs, keep CTA sticky but not over content.
- Never hide the next action inside a horizontal scroll.
- Tables become labelled cards on mobile; no unreadable compressed tables.
- Large display headings may wrap; never use horizontal overflow as a design fix.

## Accessibility rules

- WCAG AA contrast target; use an automated check and a manual keyboard pass.
- All interactive controls keyboard reachable and visible on focus.
- Touch targets >=44px. Do not rely on hover.
- Use `button` for actions and links for navigation. Do not make a `div` clickable.
- Icons need accessible labels when not paired with text.
- Announce save/error/assessment progress changes carefully with `aria-live`.
- Respect reduced motion; ambient effects become static.
- Input help text is adjacent to the label. Error text identifies the field and fix.
- Avoid timed questions by default; if a challenge has a timer, offer an accessible untimed mode.

## Trust UX rules

- Source label format: `Source: Diagnostic · Attempt 1 · 02 Oct 2026`.
- Job facts format: `Checked: 02 Oct 2026 · Open source link`.
- Confidence is `High`, `Medium` or `Needs more evidence`, with a reason.
- Never display a false decimal score. Round to whole numbers and expose coverage.
- Resume edits use accept/edit/reject; no one-click “apply all” for claims.
- Audio/video is opt-in and absent from P0. Text practice is equal, not a degraded fallback.
- If AI fails, use “Checklist mode” instead of an error-only dead end.

## Copy checklist

Before shipping text, check:

- Is it factual or clearly labelled as an estimate/goal?
- Does it tell the user what to do next?
- Does it avoid shame and guarantee language?
- Can a user understand it without knowing AI terms?
- Is there a source/checked date if the statement can change?
- Is the action reversible?
