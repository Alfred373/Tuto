---
trigger: glob
---

# Design System Rules

Tuto uses a compiled Material Design 3 token set at `styles/design-tokens.css`. It is generated output, not source.

**Rules** are binding: breaking one fails the task even if the UI renders correctly. **Guidelines** are not binding and are never grounds for rejecting work.

Target device for every decision: a two-to-three-year-old mid-range Android, on a throttled 3G connection, often in poor light, frequently shared.

---

## Rules

### The token file itself

1. Never edit `design-tokens.css`. It is generated. Any fix you make there is wiped on the next regeneration, silently, and the bug returns.
2. Never add a token, palette step, font family, spacing value or elevation level. If something you need does not exist, stop and ask.
3. Never delete or rename a token. Something you cannot see is using it.
4. Import the token file once, in the root layout, before any other stylesheet.

### Colour

5. Never use a primitive palette variable (`--color-palette-*`) in component styling. Primitives do not switch between light and dark themes. Use semantic roles (`--color-primary`, `--color-surface`, `--color-on-surface`) only.
6. Never hardcode a colour. No hex, no `rgb()`, no `hsl()`, no named colours, no `#fff`, no `black`. Every colour in the app comes from a `--color-*` role. This includes SVG fills, canvas drawing, inline styles and chart colours.
7. Always pair a surface role with its matching `on-` role. Text on `--color-primary` is `--color-on-primary`. Text on `--color-surface-container` is `--color-on-surface`. Never mix pairs — that is how contrast failures ship.
8. Build every screen in light mode using the light theme tokens only. Never emit a dark override. Never add a theme toggle. Never honour `prefers-color-scheme: dark`. This applies to every page and component you build.
9. Never use `--color-primary` for a destructive, error or "you got it wrong" state. Never use `--color-error` for a primary action. Primary (`#CC0000`) and error (`#BA1A1A`) are near-identical reds in this palette and the distinction must come from role, position and label, never from the shade.
10. Never convey meaning with colour alone. Confidence states (PRD F4.5), correct and incorrect quiz answers, and validation states must each carry a text label or an icon as well as a colour. A colourblind student must be able to tell a verified answer from an unverified one.
11. Never place text over an image, a scrim or a gradient without checking contrast. Minimum 4.5:1 for body text, 3:1 for text at 24px and above.

### Typography

12. Never set a raw `font-size`, `font-weight`, `line-height` or `letter-spacing`. Use a typography token. Prefer the shorthand (`font: var(--typography-body-medium)`) or the individual tokens, never a literal.
13. Never introduce a font family. The system has exactly two: `--typography-family-display` (Cormorant Garamond) and `--typography-family-body` (Inter). KaTeX brings its own and is the third and final one.
14. Never ship an unsubsetted font. PRD 7.3 caps total web fonts at 40KB. Subset every family to the characters actually used, and subset KaTeX to the syllabus character range.
15. Never load a font from a third-party CDN at runtime. Self-host via `next/font` so the file is in the bundle budget and under CSP control.
16. Never set body text below `--typography-body-small` (12px). Never set the primary reading surface — solution steps and explanations — below `--typography-body-medium` (14px).

### Spacing, shape and layout

17. Never use a raw pixel value for padding, margin, gap or border radius. Use `--spacing-*` and `--shape-corner-*`.
18. Never use a fixed pixel width on a container. Use relative units, flex or grid. The target viewport is narrow and varied.
19. Every image carries `max-width: 100%` and explicit dimensions or an aspect ratio. A layout shift on a slow connection is a real cost to this user.
20. Wide content — tables, code, long maths expressions — scrolls inside its own `overflow-x: auto` container. The page body never scrolls sideways.
21. Every interactive target is at least 48×48px, including its padding. This applies especially to the flag control (F3.7), which is the only input into the accuracy loop, and to the F3.2 tap that gates the solution.

### Motion

22. Never use a raw duration or easing curve. Use `--motion-duration-*` and `--motion-easing-*`.
23. Always honour `prefers-reduced-motion: reduce`. Disable or reduce every non-essential transition under it.
24. Never animate anything that blocks first paint or delays a solution step from rendering. Latency budget beats polish.

### Theming

25. Strictly light mode. The application uses light theme tokens exclusively. Never emit a dark override, never add a theme toggle, and never honour `prefers-color-scheme: dark`.
26. Never read a CSS variable in JavaScript to compute a colour. If a value is needed in JS, ask — do not invent a parallel source of truth.
27. Set an explicit background on `body` from `--color-background`. Never rely on the browser default.

### If Tailwind is used

28. Map Tailwind's theme to the tokens. Never use an arbitrary value (`bg-[#CC0000]`, `p-[13px]`, `text-[15px]`). If a utility you need does not exist in the mapped theme, the token does not exist, and rule 2 applies.

---

## Known defects in `design-tokens.css`

Do not fix these yourself. Report them and wait — the file is generated and a local fix will be overwritten (rule 1).

1. **Broken surface roles.** The light theme references `--color-palette-neutral-87`, `-96`, `-94` and `-92`. None of these exist in the neutral palette, which defines only 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 98, 99 and 100. As a result `--color-surface-dim` and all five `--color-surface-container-*` roles resolve to nothing. Every card and raised surface is affected.
2. **Invalid hex value.** `--color-palette-tertiary-90: #CEDCEEE` has seven digits. The declaration is invalid and will be dropped.
3. **Primary and error are near-identical reds.** Primary 40 is `#CC0000`, error 40 is `#BA1A1A`. Rule 9 exists because of this. Raise it with design.

Until defect 1 is fixed, do not build any component that depends on a `--color-surface-container-*` role. Stop and report instead.

---

## Open conflict with the PRD

PRD 7.3 sets a hard budget of 40KB for all web fonts on the solve route. This token set specifies two custom families, Cormorant Garamond and Inter, and KaTeX requires a third. Three families cannot fit 40KB without aggressive subsetting, and possibly not then.

This needs a human decision: raise the budget, drop one family, or subset to a fixed character set. **Never resolve it yourself by silently exceeding the budget or by dropping a family.** Report it and wait.

---

## Guidelines (not binding)

- Elevation: level 1 for resting cards, level 2 for raised or hovered, level 3 for dialogs and sheets. Flat surfaces are usually better than shadows on a low-end screen.
- Corner radius: `--shape-corner-medium` for cards, `--shape-corner-small` for inputs and buttons, `--shape-corner-full` for pills and avatars.
- Spacing rhythm: `--spacing-16` between related elements, `--spacing-24` between sections, `--spacing-32` and above for page-level separation.
- Use the state opacity tokens (`--state-hover-opacity` and so on) for interaction overlays rather than inventing hover colours.
- Prefer `--color-surface-container-low` for resting cards over a shadow, once defect 1 is fixed.