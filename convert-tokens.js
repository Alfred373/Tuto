#!/usr/bin/env node
/**
 * ============================================================================
 * Design Token to CSS Variable Converter
 * ============================================================================
 * 
 * @file convert-tokens.js
 * @description Translates Design Tokens (DTCG format JSON) into clean, modern CSS
 *              custom properties (variables). Enforces strict design system
 *              architecture separating Primitive Foundations from UI Color Roles.
 * 
 * COLOR SYSTEM ARCHITECTURE & GOVERNANCE:
 * ----------------------------------------------------------------------------
 * 1. Primitive Colors (`color.palette`):
 *    - The raw foundational palette (tonal ranges 0-100 for primary, neutral, error, etc.).
 *    - Output as `--color-palette-*` variables on `:root`.
 *    - ⚠️ RULE: Primitives are foundational scales; DO NOT apply directly to UI elements.
 *      Using them directly breaks dark mode theming and violates design system governance.
 * 
 * 2. Semantic Color Roles (`color.light`):
 *    - Purpose-driven functional tokens (e.g., surface, on-surface, primary, on-primary).
 *    - Output as `--color-*` variables referencing `--color-palette-*` variables via `var()`.
 *    - ✅ RULE: ALWAYS use Color Roles in UI components. Built strictly in light mode
 *      using light theme tokens only. Never emit dark overrides or theme toggles.
 * 
 * USAGE:
 * ----------------------------------------------------------------------------
 *   # Convert default tokens (reads design-tokens.tokens.json -> outputs design-tokens.css)
 *   node convert-tokens.js
 * 
 *   # Custom input and output paths
 *   node convert-tokens.js --input ./tokens.json --output ./styles/tokens.css
 * 
 *   # Direct value resolution (inlines raw hex instead of var() references)
 *   node convert-tokens.js --resolve-raw
 * 
 *   # View command line options
 *   node convert-tokens.js --help
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

// --- Configuration & Default Paths ---
const DEFAULT_INPUT_PATH = path.join(__dirname, 'design-tokens.tokens.json');
const DEFAULT_OUTPUT_PATH = path.join(__dirname, 'styles', 'design-tokens.css');

/**
 * Converts camelCase, snake_case, or spaced strings to kebab-case.
 * Handles digits gracefully (e.g., `level1` -> `level-1`, `fontFamily` -> `font-family`).
 * 
 * @param {string} str - Raw key string to convert.
 * @returns {string} Clean kebab-case string.
 */
function toKebabCase(str) {
    if (!str) return '';
    return str
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/([a-zA-Z])([0-9]+)/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .replace(/--+/g, '-')
        .toLowerCase();
}

/**
 * Safely traverses an object given a dot-delimited path (e.g. "color.palette.primary.40").
 * 
 * @param {Object} obj - Root object to query.
 * @param {string} pathStr - Dot-separated path.
 * @returns {*} Retrieved value, or undefined if not found.
 */
function getNestedValue(obj, pathStr) {
    if (!obj || typeof obj !== 'object') return undefined;
    const keys = pathStr.split('.');
    let current = obj;
    for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
            current = current[key];
        } else {
            return undefined;
        }
    }
    return current && typeof current === 'object' && current.value !== undefined
        ? current.value
        : current;
}

/**
 * Resolves token reference strings (e.g., `{color.palette.primary.40.value}`)
 * into CSS `var(--color-palette-primary-40)` or inlined literal values.
 * 
 * @param {string|*} rawValue - Raw token value or string containing `{...}` reference.
 * @param {boolean} resolveToRaw - If true, inlines target literal hex/value instead of `var()`.
 * @param {Object} [tokensObj=null] - Full token object needed when resolveToRaw is true.
 * @returns {string} Evaluated CSS value string or `var()` reference.
 */
function resolveTokenReference(rawValue, resolveToRaw = false, tokensObj = null) {
    if (typeof rawValue !== 'string') return String(rawValue);

    return rawValue.replace(/\{([^}]+)\}/g, (match, tokenPath) => {
        // Strip trailing `.value` if specified in reference path
        const cleanPath = tokenPath.endsWith('.value')
            ? tokenPath.slice(0, -6)
            : tokenPath;

        // If direct raw value resolution is requested
        if (resolveToRaw && tokensObj) {
            const raw = getNestedValue(tokensObj, cleanPath);
            if (raw !== undefined) return String(raw);
        }

        // Parse path parts and format as CSS custom property
        const parts = cleanPath.split('.').map(toKebabCase);

        let varName;
        // Check if referencing color roles vs primitives / other tokens
        if (parts[0] === 'color') {
            if (parts[1] === 'palette' || parts[1] === 'primitive') {
                varName = `--color-palette-${parts.slice(2).join('-')}`;
            } else if (parts[1] === 'light' || parts[1] === 'dark') {
                varName = `--color-${parts.slice(2).join('-')}`;
            } else {
                varName = `--color-${parts.slice(1).join('-')}`;
            }
        } else {
            varName = `--${parts.join('-')}`;
        }

        return `var(${varName})`;
    });
}

/**
 * Extracts and formats Primitive Color Foundations (`color.palette`).
 * These represent the core color ramps (0 to 100) and must NOT be applied directly to UI elements.
 * 
 * @param {Object} paletteObj - The `color.palette` node of the design token JSON.
 * @returns {string[]} Formatted CSS declaration lines.
 */
function generatePrimitiveColorVars(paletteObj) {
    const lines = [];
    if (!paletteObj || typeof paletteObj !== 'object') return lines;

    for (const [paletteName, shades] of Object.entries(paletteObj)) {
        if (!shades || typeof shades !== 'object') continue;

        const displayName = paletteName.replace(/_/g, ' ').toUpperCase();
        lines.push(`  /* ${displayName} PALETTE (Primitive foundation scale) */`);

        for (const [shadeKey, token] of Object.entries(shades)) {
            const varName = `--color-palette-${toKebabCase(paletteName)}-${toKebabCase(shadeKey)}`;
            const rawVal = token && typeof token === 'object' && token.value !== undefined
                ? token.value
                : token;
            lines.push(`  ${varName}: ${rawVal};`);
        }
        lines.push('');
    }

    return lines;
}

/**
 * Extracts and formats Semantic UI Color Roles (`color.light` or `color.dark`).
 * These are the actual tokens intended for UI components (e.g. background, surface, primary).
 * 
 * @param {Object} rolesObj - The `color.light` or `color.dark` node of the design tokens.
 * @param {boolean} resolveToRaw - Whether to inline raw values instead of `var()` references.
 * @param {Object} tokensObj - Full token tree for value lookup.
 * @returns {string[]} Formatted CSS declaration lines.
 */
function generateColorRoleVars(rolesObj, resolveToRaw = false, tokensObj = null) {
    const lines = [];
    if (!rolesObj || typeof rolesObj !== 'object') return lines;

    for (const [roleName, token] of Object.entries(rolesObj)) {
        const varName = `--color-${toKebabCase(roleName)}`;
        const rawVal = token && typeof token === 'object' && token.value !== undefined
            ? token.value
            : token;
        const resolvedVal = resolveTokenReference(rawVal, resolveToRaw, tokensObj);
        lines.push(`  ${varName}: ${resolvedVal};`);
    }

    return lines;
}

/**
 * Formats typography tokens into CSS variables.
 * Handles font families, composite typography styles (display, headline, title, body, label),
 * and generates both individual properties and handy CSS font shorthand variables.
 * 
 * @param {Object} typographyObj - The `typography` node of the design tokens.
 * @param {boolean} resolveToRaw - Whether to inline raw values.
 * @param {Object} tokensObj - Full token tree for value lookup.
 * @returns {string[]} Formatted CSS declaration lines.
 */
function generateTypographyVars(typographyObj, resolveToRaw = false, tokensObj = null) {
    const lines = [];
    if (!typographyObj || typeof typographyObj !== 'object') return lines;

    // 1. Font Families
    if (typographyObj.family && typeof typographyObj.family === 'object') {
        lines.push('  /* Font Families */');
        for (const [familyName, token] of Object.entries(typographyObj.family)) {
            const varName = `--typography-family-${toKebabCase(familyName)}`;
            const fontVal = token && typeof token === 'object' && token.value !== undefined
                ? token.value
                : token;

            const fallback = familyName === 'display' || fontVal.toLowerCase().includes('garamond')
                ? 'Georgia, Cambria, "Times New Roman", Times, serif'
                : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

            // Quote font names containing spaces and append fallback
            const formatted = fontVal.includes(' ') && !fontVal.startsWith('"') && !fontVal.startsWith("'")
                ? `"${fontVal}", ${fallback}`
                : `${fontVal}, ${fallback}`;

            lines.push(`  ${varName}: ${formatted};`);
        }
        lines.push('');
    }

    // 2. Structured / Composite Typography Styles (Material 3 style)
    const typeCategories = ['display', 'headline', 'title', 'body', 'label'];
    for (const category of typeCategories) {
        if (!typographyObj[category] || typeof typographyObj[category] !== 'object') continue;

        lines.push(`  /* Typography: ${category.toUpperCase()} Scale */`);
        for (const [sizeName, specs] of Object.entries(typographyObj[category])) {
            if (!specs || typeof specs !== 'object') continue;

            const prefix = `--typography-${toKebabCase(category)}-${toKebabCase(sizeName)}`;
            const family = resolveTokenReference(specs.fontFamily, resolveToRaw, tokensObj);
            const weight = specs.fontWeight || '400';
            const size = specs.fontSize || '1rem';
            const lineHt = specs.lineHeight || '1.5';
            const letterSp = specs.letterSpacing || 'normal';

            lines.push(`  ${prefix}-font-family: ${family};`);
            lines.push(`  ${prefix}-font-weight: ${weight};`);
            lines.push(`  ${prefix}-font-size: ${size};`);
            lines.push(`  ${prefix}-line-height: ${lineHt};`);
            lines.push(`  ${prefix}-letter-spacing: ${letterSp};`);

            // CSS Font shorthand helper
            lines.push(`  ${prefix}: ${weight} ${size}/${lineHt} ${family};`);
            lines.push('');
        }
    }

    // 3. Fallback for flat typography maps (e.g. font-size-*, font-weight-*)
    for (const [key, token] of Object.entries(typographyObj)) {
        if (typeCategories.includes(key) || key === 'family') continue;
        if (token && typeof token === 'object' && token.value === undefined) {
            lines.push(...generateGenericTokenVars(token, `typography-${toKebabCase(key)}`, resolveToRaw, tokensObj));
        } else {
            const rawVal = token && typeof token === 'object' && token.value !== undefined ? token.value : token;
            const resolved = resolveTokenReference(rawVal, resolveToRaw, tokensObj);
            lines.push(`  --typography-${toKebabCase(key)}: ${resolved};`);
        }
    }

    return lines;
}

/**
 * Recursively flattens generic nested token objects (e.g., shape, spacing, elevation, motion, state)
 * into clean kebab-case CSS custom properties.
 * 
 * @param {Object} tokenSubtree - Nested token object to flatten.
 * @param {string} prefix - Base prefix for the CSS variable name.
 * @param {boolean} resolveToRaw - Whether to inline raw values.
 * @param {Object} tokensObj - Full token tree for value lookup.
 * @returns {string[]} Array of formatted CSS declarations.
 */
function generateGenericTokenVars(tokenSubtree, prefix, resolveToRaw = false, tokensObj = null) {
    const lines = [];

    function traverse(node, currentPath) {
        if (!node || typeof node !== 'object') return;

        for (const [key, val] of Object.entries(node)) {
            const newPath = [...currentPath, toKebabCase(key)];

            // Check if this node is a leaf token or contains nested children
            const isLeaf = val === null ||
                typeof val !== 'object' ||
                val.value !== undefined ||
                (!Object.values(val).some(child => typeof child === 'object'));

            if (isLeaf) {
                const rawVal = val && typeof val === 'object' && val.value !== undefined ? val.value : val;
                const resolvedVal = resolveTokenReference(rawVal, resolveToRaw, tokensObj);
                const varName = `--${prefix}-${newPath.join('-')}`;
                lines.push(`  ${varName}: ${resolvedVal};`);
            } else {
                traverse(val, newPath);
            }
        }
    }

    traverse(tokenSubtree, []);
    return lines;
}

/**
 * Main token conversion compiler. Reads design token JSON, processes all token
 * layers, separates Primitives from Semantic Roles, and generates standard CSS.
 * 
 * @param {Object} options - Compilation configuration.
 * @param {string} options.inputPath - Path to input JSON tokens file.
 * @param {string} options.outputPath - Path for compiled output CSS file.
 * @param {boolean} options.resolveRaw - If true, resolve token references to raw values.
 * @returns {string} The compiled CSS content.
 */
function convertTokensToCSS({
    inputPath = DEFAULT_INPUT_PATH,
    outputPath = DEFAULT_OUTPUT_PATH,
    resolveRaw = false
} = {}) {
    console.log('\x1b[36m%s\x1b[0m', '════════════════════════════════════════════════════════════════════');
    console.log('\x1b[1m\x1b[35m%s\x1b[0m', ' ✨ Design System Token Compiler (Tokens -> CSS Variables)');
    console.log('\x1b[36m%s\x1b[0m', '════════════════════════════════════════════════════════════════════\n');
    console.log(`[INFO] Reading input tokens from : \x1b[33m${inputPath}\x1b[0m`);

    if (!fs.existsSync(inputPath)) {
        console.error(`\x1b[31m[ERROR] Token file not found: ${inputPath}\x1b[0m`);
        process.exit(1);
    }

    const rawData = fs.readFileSync(inputPath, 'utf8');
    let tokens;
    try {
        tokens = JSON.parse(rawData);
    } catch (err) {
        console.error(`\x1b[31m[ERROR] Failed to parse token JSON: ${err.message}\x1b[0m`);
        process.exit(1);
    }

    const cssSections = [];

    // Header banner with architecture instructions
    const systemName = tokens.system || tokens.name || 'Design System';
    const version = tokens.version || '1.0.0';
    const timestamp = new Date().toISOString();

    cssSections.push(`/**
 * ============================================================================
 * ${systemName} - Compiled CSS Custom Properties
 * Version: ${version}
 * Generated: ${timestamp}
 * ============================================================================
 * 
 * ARCHITECTURE RULES & USAGE GUIDELINES:
 * 
 * 1. PRIMITIVE COLORS (--color-palette-*):
 *    - Foundational base color scales (tonal values 0-100).
 *    - 🛑 DO NOT use primitive color variables directly in UI component styles.
 *    - Reason: Primitives do not switch between light and dark themes and violate
 *      design system governance.
 * 
 * 2. SEMANTIC COLOR ROLES (--color-*):
 *    - Purpose-driven functional tokens (primary, surface, on-surface, error, etc.).
 *    - ✅ ALWAYS use color role variables when styling UI elements.
 *    - Reason: Color roles map to primitives.
 * 
 * 3. THEME APPLICATION:
 *    - Strictly light mode: light theme roles are active on \`:root\` and \`[data-theme="light"]\`.
 *    - Never emit a dark override. Never add a theme toggle. Never honour prefers-color-scheme: dark.
 * ============================================================================
 */`);

    // --- Section 1: Primitive Colors (Foundations) ---
    const paletteNode = tokens.color && (tokens.color.palette || tokens.color.primitive || tokens.palette);
    if (paletteNode) {
        const primitiveLines = generatePrimitiveColorVars(paletteNode);
        if (primitiveLines.length > 0) {
            cssSections.push(`/* ==========================================================================
   1. PRIMITIVE COLOR PALETTES (FOUNDATIONS)
   ⚠️  DO NOT USE DIRECTLY IN UI COMPONENT STYLING
   ========================================================================== */
:root {
${primitiveLines.join('\n')}
}`);
        }
    }

    // --- Section 2: Global System Tokens (Typography, Shape, Spacing, Elevation, State, Motion) ---
    const globalLines = [];

    if (tokens.typography) {
        globalLines.push('  /* ------------------------------------------------------------------ */');
        globalLines.push('  /* TYPOGRAPHY TOKENS                                                  */');
        globalLines.push('  /* ------------------------------------------------------------------ */');
        globalLines.push(...generateTypographyVars(tokens.typography, resolveRaw, tokens));
    }

    if (tokens.shape) {
        globalLines.push('  /* ------------------------------------------------------------------ */');
        globalLines.push('  /* SHAPE / CORNER RADIUS TOKENS                                       */');
        globalLines.push('  /* ------------------------------------------------------------------ */');
        const shapeNode = tokens.shape.corner || tokens.shape;
        globalLines.push(...generateGenericTokenVars(shapeNode, 'shape-corner', resolveRaw, tokens));
        globalLines.push('');
    } else if (tokens.borderRadius) {
        globalLines.push('  /* ------------------------------------------------------------------ */');
        globalLines.push('  /* BORDER RADIUS TOKENS                                               */');
        globalLines.push('  /* ------------------------------------------------------------------ */');
        globalLines.push(...generateGenericTokenVars(tokens.borderRadius, 'radius', resolveRaw, tokens));
        globalLines.push('');
    }

    if (tokens.spacing) {
        globalLines.push('  /* ------------------------------------------------------------------ */');
        globalLines.push('  /* SPACING TOKENS                                                     */');
        globalLines.push('  /* ------------------------------------------------------------------ */');
        globalLines.push(...generateGenericTokenVars(tokens.spacing, 'spacing', resolveRaw, tokens));
        globalLines.push('');
    }

    if (tokens.elevation) {
        globalLines.push('  /* ------------------------------------------------------------------ */');
        globalLines.push('  /* ELEVATION / SHADOW TOKENS                                          */');
        globalLines.push('  /* ------------------------------------------------------------------ */');
        globalLines.push(...generateGenericTokenVars(tokens.elevation, 'elevation', resolveRaw, tokens));
        globalLines.push('');
    } else if (tokens.shadows) {
        globalLines.push('  /* ------------------------------------------------------------------ */');
        globalLines.push('  /* SHADOW TOKENS                                                      */');
        globalLines.push('  /* ------------------------------------------------------------------ */');
        globalLines.push(...generateGenericTokenVars(tokens.shadows, 'shadow', resolveRaw, tokens));
        globalLines.push('');
    }

    if (tokens.state) {
        globalLines.push('  /* ------------------------------------------------------------------ */');
        globalLines.push('  /* COMPONENT STATE OPACITIES                                          */');
        globalLines.push('  /* ------------------------------------------------------------------ */');
        globalLines.push(...generateGenericTokenVars(tokens.state, 'state', resolveRaw, tokens));
        globalLines.push('');
    }

    if (tokens.motion) {
        globalLines.push('  /* ------------------------------------------------------------------ */');
        globalLines.push('  /* MOTION (DURATION & EASING)                                         */');
        globalLines.push('  /* ------------------------------------------------------------------ */');
        globalLines.push(...generateGenericTokenVars(tokens.motion, 'motion', resolveRaw, tokens));
        globalLines.push('');
    }

    // Handle any extra custom sections in tokens
    const handledKeys = new Set([
        'name', 'version', 'author', 'system', 'color', 'palette',
        'typography', 'shape', 'borderRadius', 'spacing', 'elevation',
        'shadows', 'state', 'motion'
    ]);
    for (const [key, section] of Object.entries(tokens)) {
        if (!handledKeys.has(key) && typeof section === 'object' && section !== null) {
            globalLines.push(`  /* ------------------------------------------------------------------ */`);
            globalLines.push(`  /* ${key.toUpperCase()} TOKENS                                          */`);
            globalLines.push(`  /* ------------------------------------------------------------------ */`);
            globalLines.push(...generateGenericTokenVars(section, toKebabCase(key), resolveRaw, tokens));
            globalLines.push('');
        }
    }

    if (globalLines.length > 0) {
        cssSections.push(`/* ==========================================================================
   2. GLOBAL SYSTEM TOKENS (Typography, Shape, Spacing, Elevation, State, Motion)
   ========================================================================== */
:root {
${globalLines.join('\n')}
}`);
    }

    // --- Section 3: Color Roles - Light Theme (Default) ---
    const lightRoles = tokens.color && (tokens.color.light || tokens.color.light_theme);
    if (lightRoles) {
        const lightRoleLines = generateColorRoleVars(lightRoles, resolveRaw, tokens);
        cssSections.push(`/* ==========================================================================
   3. COLOR ROLES - LIGHT THEME (DEFAULT UI ROLES)
   ✅ USE THESE VARIABLES DIRECTLY IN UI COMPONENT STYLES
   ========================================================================== */
:root,
[data-theme="light"] {
${lightRoleLines.join('\n')}
}`);
    }

    // Note: Dark theme section intentionally omitted per project rule:
    // Build every screen in light mode using the light theme tokens only.
    // Never emit a dark override. Never add a theme toggle. Never honour prefers-color-scheme: dark.

    // Combine all sections
    const finalCSS = cssSections.join('\n\n') + '\n';

    // Ensure output directory exists
    const outDir = path.dirname(outputPath);
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, finalCSS, 'utf8');

    console.log(`[SUCCESS] Compiled CSS variables written to: \x1b[32m${outputPath}\x1b[0m`);
    console.log(`[SUMMARY] Finished generating tokens:`);
    console.log(`          • Primitive Color Palettes (Foundational scales)`);
    console.log(`          • UI Color Roles (Light theme tokens only)`);
    console.log(`          • Typography (Families, sizes, weights, shorthand)`);
    console.log(`          • Shape, Spacing, Elevation, State & Motion\n`);

    return finalCSS;
}

// --- CLI Runner & Argument Parser ---
if (require.main === module) {
    const args = process.argv.slice(2);
    let input = DEFAULT_INPUT_PATH;
    let output = DEFAULT_OUTPUT_PATH;
    let resolveRaw = false;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--input' || arg === '-i') {
            input = path.resolve(args[++i]);
        } else if (arg === '--output' || arg === '-o') {
            output = path.resolve(args[++i]);
        } else if (arg === '--resolve-raw' || arg === '-r') {
            resolveRaw = true;
        } else if (arg === '--help' || arg === '-h') {
            console.log(`
Design Token to CSS Variable Converter

USAGE:
  node convert-tokens.js [options]

OPTIONS:
  -i, --input <file>        Path to input token JSON (default: ./design-tokens.tokens.json)
  -o, --output <file>       Path for output CSS file (default: ./design-tokens.css)
  -r, --resolve-raw         Inline raw values (hex/px) instead of CSS var() references
  -h, --help                Display this help message

COLOR ARCHITECTURE CONVENTIONS:
  1. Primitives:   Foundational scales (--color-palette-*). NOT for direct UI use.
  2. Color Roles:  Semantic tokens (--color-*). Intended for UI components.
                   Supports automatic light/dark theme switching.

EXAMPLES:
  node convert-tokens.js
  node convert-tokens.js -i ./custom-tokens.json -o ./dist/theme.css
  node convert-tokens.js --resolve-raw
`);
            process.exit(0);
        }
    }

    convertTokensToCSS({ inputPath: input, outputPath: output, resolveRaw });
}

module.exports = {
    convertTokensToCSS,
    resolveTokenReference,
    generatePrimitiveColorVars,
    generateColorRoleVars,
    generateTypographyVars,
    generateGenericTokenVars,
    toKebabCase,
    getNestedValue
};
