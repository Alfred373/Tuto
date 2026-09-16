---
name: ui-component-builder
description: Use when building or editing anything a student or parent sees — a component, a screen, styling, a solution step, a confidence badge, the flag control, or anything touching the design system. Teaches token discipline and the verification pass.
---

# UI Component Builder

Builds a component in light mode using light theme tokens only, on a cheap phone, in bad light.

Laws live in `.agents/rules/design-system-rule.md`. Performance budget is PRD 7.3. Target device is a two-to-three-year-old mid-range Android on throttled 3G. This file is the sequence.

## Procedure

1. **Measure the bundle before you start.** You will need the baseline to attribute the delta (PRD 7.3).

2. **Default to a Server Component.** Add `'use client'` only for state, an event handler or a browser API. Every client component costs bytes against a hard budget (AGENTS.md section 5).

3. **Pick the surface role, then its `on-` role.** Never mix pairs. Text on `--color-primary` is `--color-on-primary`. Text on `--color-surface` is `--color-on-surface`.

4. **Use tokens for everything.** Colour, font, spacing, radius, elevation, motion. No hex, no raw px, no raw duration.

5. **Follow the gap-filling procedure if a token is missing.** See below. Do not improvise a value.

6. **Size every interactive target at 48×48px minimum**, including padding. This matters most for the flag control (F3.7) and the F3.2 tap that gates the solution.

7. **Never carry meaning in colour alone.** Confidence states (F4.5), correct and incorrect quiz answers and validation states each need a text label or an icon as well (`design-system-rule.md` 10).

8. **Run the five-check verification pass.** See below.

## Gap-filling procedure for a missing token

`design-system-rule.md` rule 2 forbids adding tokens and rule 1 forbids editing `design-tokens.css`. So when the token you need does not exist:

1. Check whether an existing token is close enough. Usually one is.
2. Check the known defects list in `design-system-rule.md`. Three roles are currently broken: `--color-surface-dim` and all five `--color-surface-container-*` resolve to nothing, because the light theme points at `neutral-87/96/94/92` and the dark theme at `neutral-6/4/12/16`, none of which exist.
3. **If your component needs a broken role, stop and report. Do not build it.** That is the instruction at the end of the defects list.
4. If the token genuinely does not exist and no defect explains it, stop and ask. Never add it yourself, never hardcode a value, never write a local CSS variable as a substitute.

## The five-check verification pass

Run all five before you call the component done.

1. **Light mode verification.** Render it. Nothing invisible, nothing unreadable. Ensure light theme tokens only, zero dark overrides, zero theme toggles, and zero prefers-color-scheme: dark media queries.
3. **Contrast.** 4.5:1 for body text, 3:1 for text at 24px and above.
4. **Touch targets.** Every interactive element at least 48×48px.
5. **Bundle delta.** Measure again and attribute the change. Route still under 500KB total and 180KB JS.

Test at 360px wide, the narrow end of the target device, and confirm nothing forces the page body to scroll sideways.

## Skeleton

```tsx
// components/ui/confidence-badge.tsx
// Label and icon carry the meaning. Colour only reinforces it.
// design-system-rule.md 10, PRD F4.5

const COPY = {
  HIGH:   { label: 'Checked',       icon: CheckIcon },
  MEDIUM: { label: 'Double-check',  icon: AlertIcon },
  LOW:    { label: 'Not verified',  icon: WarnIcon },
} as const;

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const { label, icon: Icon } = COPY[level];
  return (
    <span className="confidence-badge" data-level={level}>
      <Icon aria-hidden />
      {label}
    </span>
  );
}
```

```css
.confidence-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-4) var(--spacing-8);
  border-radius: var(--shape-corner-full);
  font: var(--typography-label-medium);
}

/* Never --color-primary for a warning state. Primary #CC0000 and
   error #BA1A1A are near-identical reds. design-system-rule.md 9 */
.confidence-badge[data-level='HIGH'] {
  background: var(--color-success-container);
  color: var(--color-on-success-container);
}
.confidence-badge[data-level='MEDIUM'],
.confidence-badge[data-level='LOW'] {
  background: var(--color-error-container);
  color: var(--color-on-error-container);
}
```

Flag control, which must be easy to hit:

```css
/* F3.7 — the only input into the accuracy loop in PRD R1 */
.flag-control {
  min-width: 48px;
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-on-surface-variant);
  background: transparent;
  border-radius: var(--shape-corner-full);
}
```

## Traps

- Reaching for `--color-surface-container` because it is the obvious role for a card. It resolves to nothing today. Stop and report.
- Using a primitive like `--color-palette-neutral-90` because the semantic role is broken. Primitives do not switch theme.
- Using `--color-primary` for an error or destructive state. The two reds are almost the same shade.
- Showing a wrong quiz answer in red with no label. A colourblind student sees nothing.
- A 32px flag control. Students miss it and the flag never reaches the accuracy loop.
- Adding a dark override or theme toggle. Tuto is strictly light mode using light theme tokens only.
- Adding an icon library for two icons. Every package is bytes on 3G.
- Setting a raw `font-size` because the token is one step too large.
- Animating something that delays a solution step rendering.

## Verify before done

- [ ] No hex, `rgb()`, `hsl()` or named colour anywhere, including SVG fills
- [ ] No primitive `--color-palette-*` used in styling
- [ ] Every surface paired with its matching `on-` role
- [ ] No raw px for spacing or radius; no raw font-size, weight or line-height
- [ ] Light mode checked (light theme tokens only; zero dark overrides, zero theme toggles)
- [ ] Contrast 4.5:1 body, 3:1 large
- [ ] Every interactive target at least 48×48px
- [ ] No meaning carried by colour alone
- [ ] Tested at 360px with no sideways page scroll
- [ ] `prefers-reduced-motion` honoured
- [ ] Bundle delta measured; route under 500KB and 180KB JS
- [ ] No new dependency added without asking

Tests to write: a render test asserting no literal colour value appears in the component's styles; a snapshot in each theme; an accessibility test asserting every interactive element meets 48px; a test asserting each confidence level renders its text label, not just its colour.