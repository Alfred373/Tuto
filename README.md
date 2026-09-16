# Design System Token to CSS Variable Converter

A robust, dependency-free Node.js script that compiles design tokens stored in JSON format (such as [design-tokens.tokens.json](file:///Users/mac/Documents/Tuto/design-tokens.tokens.json)) into production-ready CSS Custom Properties ([design-tokens.css](file:///Users/mac/Documents/Tuto/design-tokens.css)).

---

## 🎨 Color System Architecture: Primitives vs. UI Color Roles

The core tenet of modern design system engineering (such as Google Material Design 3) is the strict architectural separation between **Primitive Foundations** and **Semantic UI Color Roles**.

```
┌────────────────────────────────────────────────────────┐
│               1. PRIMITIVE PALETTE                     │
│  (Foundational tonal scales: 0, 10, 20, ..., 100)      │
│  e.g., --color-palette-primary-40 (#CC0000)            │
│  ⚠️ FOUNDATION ONLY: Never apply directly to UI!       │
└──────────────────────────┬─────────────────────────────┘
                           │ Referenced by
                           ▼
┌────────────────────────────────────────────────────────┐
│               2. SEMANTIC COLOR ROLES                  │
│  (Purpose-driven tokens assigned to UI roles)          │
│  e.g., --color-primary, --color-surface, --color-error │
│  ✅ UI LAYER: Always use these in component styling!   │
└──────────────────────────┬─────────────────────────────┘
                           │ Dynamically switches
                           ▼
              ┌────────────────────────┐
              │ Light Theme (:root)    │
              │ Dark Theme ([data-...])│
              └────────────────────────┘
```

### 1. Primitive Colors (`--color-palette-*`)
* **What they are:** Raw tonal palettes generated from seed colors across numerical shade stops (`0`, `10`, `20`, ..., `90`, `95`, `98`, `99`, `100`).
* **Role in System:** They serve as the single source of truth for the system's raw color spectrum.
* **⚠️ Strict Rule:** **DO NOT apply primitive colors directly to UI components.**
  * *Why?* If a button uses `--color-palette-primary-40`, it will stay that exact red shade (`#CC0000`) even when the user switches to Dark Mode. In Dark Mode, an unadapted `#CC0000` button will have poor contrast against dark surfaces and fail to harmonize.

### 2. UI Color Roles (`--color-*`)
* **What they are:** Contextual, semantic color assignments created specifically for UI components (e.g., `--color-primary`, `--color-on-primary`, `--color-surface`, `--color-on-surface`, `--color-outline`).
* **Role in System:** Each role references an underlying primitive via CSS `var()`.
  * In **Light Mode**: `--color-primary` maps to `var(--color-palette-primary-40)` (bold red `#CC0000` on light surface).
  * In **Dark Mode**: `--color-primary` automatically maps to `var(--color-palette-primary-80)` (soft pastel red `#FFB4AB` on dark surface).
* **✅ Strict Rule:** **ALWAYS use UI Color Roles in your component CSS.** Components become completely theme-agnostic.

### Quick Comparison: Do's and Don'ts

| Scenario | 🛑 DO NOT DO THIS (Primitive) | ✅ DO THIS INSTEAD (Color Role) | Why |
| :--- | :--- | :--- | :--- |
| **Card Background** | `background: var(--color-palette-neutral-98);` | `background: var(--color-surface);` | Automatically turns dark in dark mode. |
| **Text on Card** | `color: var(--color-palette-neutral-10);` | `color: var(--color-on-surface);` | Preserves accessibility contrast automatically. |
| **Primary Button** | `background: var(--color-palette-primary-40);` | `background: var(--color-primary);` | Shifts tone between light & dark themes seamlessly. |
| **Button Text** | `color: #ffffff;` | `color: var(--color-on-primary);` | Guaranteed readability against primary background. |
| **Border / Divider** | `border: 1px solid var(--color-palette-neutral-variant-50);` | `border: 1px solid var(--color-outline-variant);` | Communicates intent rather than arbitrary shade. |

---

## 🚀 Quick Start

### 1. Requirements
* [Node.js](https://nodejs.org/) (v14 or higher recommended; built with zero external dependencies).

### 2. Running the Converter

#### Default Run
Reads [design-tokens.tokens.json](file:///Users/mac/Documents/Tuto/design-tokens.tokens.json) and outputs [design-tokens.css](file:///Users/mac/Documents/Tuto/design-tokens.css):
```bash
node convert-tokens.js
```
*Or using npm:*
```bash
npm run build:tokens
```

#### Custom Input / Output Paths
```bash
node convert-tokens.js --input ./my-tokens.json --output ./styles/tokens.css
```
*(Shorthand flags `-i` and `-o` are also supported)*

#### Inlining Raw Values (Optional)
If your build pipeline prefers raw hex/px values instead of `var()` references between roles and primitives:
```bash
node convert-tokens.js --resolve-raw
# or
npm run build:tokens:raw
```

#### CLI Help
```bash
node convert-tokens.js --help
```

---

## 📁 File Structure

```
.
├── convert-tokens.js           # The converter script (Node.js)
├── design-tokens.tokens.json   # Material 3 Design Tokens (DTCG format)
├── design-tokens.css           # Compiled CSS variables
├── preview.html                # Interactive test & preview page
├── package.json                # Project configuration & scripts
└── README.md                   # This documentation
```

---

## 🛠️ How `convert-tokens.js` Works

The script executes the following pipeline:

1. **Path Resolution & Validation**: Reads the input JSON file and validates its JSON schema.
2. **Primitive Extraction (`generatePrimitiveColorVars`)**:
   - Loops through `color.palette` (or `color.primitive`).
   - Converts each palette and shade into `--color-palette-<palette>-<shade>` (e.g., `--color-palette-primary-40`).
   - Places them under `:root` with a clear warning header.
3. **Global System Tokens (`generateGenericTokenVars` & `generateTypographyVars`)**:
   - **Typography**: Generates font families, weights, font-sizes, line-heights, letter-spacings, and composite font shorthands (e.g., `--typography-body-large: 400 16px/24px var(--typography-family-body);`).
   - **Shape**: Converts corner radiuses to `--shape-corner-*`.
   - **Spacing**: Converts numerical spacing tokens to `--spacing-*`.
   - **Elevation**: Converts shadow elevations to `--elevation-level-*`.
   - **State**: Converts hover/focus/pressed opacities to `--state-*-opacity`.
   - **Motion**: Converts duration and cubic-bezier easing to `--motion-*`.
4. **Semantic UI Color Roles (`generateColorRoleVars`)**:
   - **Light Theme**:
     - Parsed from `color.light`.
     - Output on `:root, [data-theme="light"]`.
     - Reference paths like `{color.palette.primary.40.value}` are translated into `var(--color-palette-primary-40)`.
     - **Strictly Light Mode**: Dark theme overrides and `@media (prefers-color-scheme: dark)` are disabled per system policy.
5. **Disk Write**: Creates parent directories if needed and writes the formatted CSS file.

---

## 💻 Usage in Your Web Project

### 1. Import the Stylesheet

In your HTML:
```html
<link rel="stylesheet" href="./design-tokens.css">
```

Or in your CSS / Next.js / Vite entry file:
```css
@import './design-tokens.css';
```

---

### 2. Styling UI Components (Real Examples)

#### A. Card Component
```css
.card {
  /* Use Semantic Surface Roles */
  background-color: var(--color-surface);
  color: var(--color-on-surface);
  
  /* Use Semantic Borders */
  border: 1px solid var(--color-outline-variant);
  
  /* Use Shape & Spacing Tokens */
  border-radius: var(--shape-corner-medium);
  padding: var(--spacing-24);
  
  /* Use Elevation Tokens */
  box-shadow: var(--elevation-level-1);
  
  /* Use Motion Tokens */
  transition: box-shadow var(--motion-duration-short-2) var(--motion-easing-standard);
}

.card:hover {
  box-shadow: var(--elevation-level-2);
}
```

#### B. Primary Action Button
```css
.btn-primary {
  /* Use Semantic Primary Roles */
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  border: none;
  
  /* Typography Shorthand */
  font: var(--typography-label-large);
  
  border-radius: var(--shape-corner-full);
  padding: var(--spacing-12) var(--spacing-24);
  cursor: pointer;
  
  transition: filter var(--motion-duration-short-1) var(--motion-easing-standard);
}

.btn-primary:hover {
  /* Use State Opacity Token */
  filter: brightness(0.92);
}
```

#### C. Input Field
```css
.input-field {
  background-color: var(--color-surface-container-highest);
  color: var(--color-on-surface);
  border: 1px solid var(--color-outline);
  border-radius: var(--shape-corner-extra-small);
  padding: var(--spacing-12) var(--spacing-16);
  font: var(--typography-body-large);
  outline: none;
}

.input-field:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-container);
}
```

---

### 3. Strictly Light Mode Policy

Tuto is built in light mode using light theme tokens exclusively.
- Zero dark theme overrides (`[data-theme="dark"]` or `.dark`)
- Zero theme toggles
- Never honours `prefers-color-scheme: dark`

---

## 📖 Complete Token Cheat Sheet

### Core UI Color Roles
| Token Variable | Description | Typical Usage |
| :--- | :--- | :--- |
| `--color-primary` | Main brand color | Primary buttons, active tabs, prominent UI |
| `--color-on-primary` | Content color on primary | Text and icons placed on top of `--color-primary` |
| `--color-primary-container` | Lower-emphasis primary tone | Selected chips, badge backgrounds, alert banners |
| `--color-on-primary-container`| Content color on primary container | Text inside container components |
| `--color-secondary` | Secondary brand accent | Secondary buttons, filters, floating chips |
| `--color-on-secondary` | Content color on secondary | Text and icons on `--color-secondary` |
| `--color-surface` | Default surface background | Page backgrounds, card bodies, sheets |
| `--color-on-surface` | Primary text and icons on surface | Headings, body copy, default icons |
| `--color-surface-dim` | Dimmer surface variant | Modals, drawers, contrast sections |
| `--color-surface-bright` | Brighter surface variant | Highlighted cards, elevated panels |
| `--color-surface-container` | Standard container surface | Content cards, lists |
| `--color-outline` | High contrast boundary | Text field borders, focused borders |
| `--color-outline-variant` | Low contrast decorative boundary | Dividers, card borders, subtle separators |
| `--color-error` | Critical state color | Form validation errors, destructive actions |
| `--color-on-error` | Content on error | Text inside error banners |
| `--color-success` | Positive state color | Success alerts, completed badges |

### Typography Scale
| Token Variable | Shorthand Syntax | Target Use Case |
| :--- | :--- | :--- |
| `--typography-display-large` | `400 57px/64px var(...)` | Hero banners, splash screens |
| `--typography-headline-large`| `400 32px/40px var(...)` | Section headers |
| `--typography-title-large`   | `400 22px/28px var(...)` | Card titles, modal headers |
| `--typography-body-large`    | `400 16px/24px var(...)` | Primary body text |
| `--typography-body-medium`   | `400 14px/20px var(...)` | Secondary body text |
| `--typography-label-large`   | `500 14px/20px var(...)` | Buttons, form labels |

### Elevation Levels
* `--elevation-level-0`: Flat (no shadow)
* `--elevation-level-1`: Subtle lift (cards on surface)
* `--elevation-level-2`: Hovered card, floating action button
* `--elevation-level-3`: Dialogs, dropdown menus
* `--elevation-level-4`: Navigation drawer
* `--elevation-level-5`: Modal picker

---

## 🔄 Programmatic API Usage

You can also import `convert-tokens.js` into your own Node.js build pipeline:

```javascript
const { convertTokensToCSS } = require('./convert-tokens');

convertTokensToCSS({
  inputPath: './design-tokens.tokens.json',
  outputPath: './dist/tokens.css',
  resolveRaw: false // true if you want raw hex values
});
```

---

## ⚖️ License
MIT. Free to use and integrate across any design systems and applications.
