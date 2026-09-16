import fs from 'node:fs';
import path from 'node:path';

/**
 * ============================================================================
 * Design System Compliance Test (Pass 3 Verification)
 * ============================================================================
 * Enforces design-system-rule.md:
 * 1. Zero literal colours (hex, rgb, hsl, oklch) in app/, features/, components/.
 * 2. Zero disallowed font-family properties.
 * 3. Zero primitive --color-palette-* variables in styling.
 * 4. Zero broken surface roles (--color-surface-dim, --color-surface-container-*).
 * 5. Zero occurrences of "technuel" across the repository.
 * 6. Only two self-hosted font families in public/fonts (Cormorant Garamond & Inter).
 */

const ROOT_DIR = path.resolve(__dirname, '../..');
const TARGET_DIRS = ['app', 'features', 'components'].map((d) => path.join(ROOT_DIR, d));

function getAllFiles(dir: string, ext: string[]): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== '.git') {
        files.push(...getAllFiles(fullPath, ext));
      }
    } else if (entry.isFile() && ext.some((e) => entry.name.endsWith(e))) {
      files.push(fullPath);
    }
  }
  return files;
}

function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

async function runDesignSystemComplianceTests(): Promise<void> {
  process.stdout.write('\n=== DESIGN SYSTEM COMPLIANCE VERIFICATION (Pass 3) ===\n');

  const sourceFiles = TARGET_DIRS.flatMap((dir) => getAllFiles(dir, ['.ts', '.tsx', '.css']));

  // 1. Literal Colour Regex (Hex, RGB, HSL, OKLCH)
  const hexRegex = /#([0-9a-fA-F]{3,8})\b/g;
  const rgbHslRegex = /\b(rgba?|hsla?|oklch)\(/g;

  let literalColorViolations = 0;
  for (const file of sourceFiles) {
    const raw = fs.readFileSync(file, 'utf8');
    const content = stripComments(raw);
    const relPath = path.relative(ROOT_DIR, file);

    const hexMatches = content.match(hexRegex);
    if (hexMatches) {
      process.stderr.write(`Violation in ${relPath}: Found hex colour ${hexMatches.join(', ')}\n`);
      literalColorViolations += hexMatches.length;
    }

    const funcMatches = content.match(rgbHslRegex);
    if (funcMatches) {
      process.stderr.write(`Violation in ${relPath}: Found colour function ${funcMatches.join(', ')}\n`);
      literalColorViolations += funcMatches.length;
    }
  }

  if (literalColorViolations > 0) {
    throw new Error(`Found ${literalColorViolations} literal colour violations in UI code`);
  }
  process.stdout.write('Test 1: Zero literal colours in app/, features/, components/... PASSED\n');

  // 2. Disallowed Font Families
  const fontFamilyRegex = /fontFamily\s*:\s*['"]([^'"]+)['"]/g;
  let fontViolations = 0;
  for (const file of sourceFiles) {
    const raw = fs.readFileSync(file, 'utf8');
    const content = stripComments(raw);
    const relPath = path.relative(ROOT_DIR, file);

    let match: RegExpExecArray | null;
    while ((match = fontFamilyRegex.exec(content)) !== null) {
      const family = match[1];
      if (
        family &&
        !family.includes('var(--typography-family-display)') &&
        !family.includes('var(--typography-family-body)') &&
        family !== 'inherit'
      ) {
        process.stderr.write(`Violation in ${relPath}: Disallowed font family "${family}"\n`);
        fontViolations++;
      }
    }
  }

  if (fontViolations > 0) {
    throw new Error(`Found ${fontViolations} disallowed font-family violations`);
  }
  process.stdout.write('Test 2: Only token font families used in UI code... PASSED\n');

  // 3. Primitive --color-palette-* in UI components
  const primitiveRegex = /--color-palette-[a-zA-Z0-9_-]+/g;
  let primitiveViolations = 0;
  for (const file of sourceFiles) {
    const raw = fs.readFileSync(file, 'utf8');
    const content = stripComments(raw);
    const relPath = path.relative(ROOT_DIR, file);

    const matches = content.match(primitiveRegex);
    if (matches) {
      process.stderr.write(`Violation in ${relPath}: Found primitive token "${matches.join(', ')}"\n`);
      primitiveViolations += matches.length;
    }
  }

  if (primitiveViolations > 0) {
    throw new Error(`Found ${primitiveViolations} primitive --color-palette-* usages in UI code`);
  }
  process.stdout.write('Test 3: Zero primitive palette tokens in component styling... PASSED\n');

  // 4. Broken Surface Roles (--color-surface-dim, --color-surface-container-*)
  const brokenRoleRegex = /--color-surface-(dim|container(-lowest|-low|-high|-highest)?)\b/g;
  let brokenRoleViolations = 0;
  for (const file of sourceFiles) {
    const raw = fs.readFileSync(file, 'utf8');
    const content = stripComments(raw);
    const relPath = path.relative(ROOT_DIR, file);

    const matches = content.match(brokenRoleRegex);
    if (matches) {
      process.stderr.write(`Violation in ${relPath}: Found broken surface role "${matches.join(', ')}"\n`);
      brokenRoleViolations += matches.length;
    }
  }

  if (brokenRoleViolations > 0) {
    throw new Error(`Found ${brokenRoleViolations} broken surface role usages in UI code`);
  }
  process.stdout.write('Test 4: Zero broken surface container / dim roles in UI code... PASSED\n');

  // 5. Repository-wide search for "technuel"
  const allRepoFiles = getAllFiles(ROOT_DIR, ['.ts', '.tsx', '.json', '.md', '.css', '.js', '.mjs', '.html']);
  let technuelMatches = 0;
  for (const file of allRepoFiles) {
    if (path.resolve(file) === path.resolve(__filename)) {
      continue;
    }

    const content = fs.readFileSync(file, 'utf8');
    const relPath = path.relative(ROOT_DIR, file);

    if (/technuel/i.test(content)) {
      process.stderr.write(`Violation in ${relPath}: Found "technuel" reference\n`);
      technuelMatches++;
    }
  }

  if (technuelMatches > 0) {
    throw new Error(`Found ${technuelMatches} "technuel" occurrences across repository`);
  }
  process.stdout.write('Test 5: Repository-wide search for "technuel" returned ZERO results... PASSED\n');

  // 6. Font files in public/fonts
  const fontsDir = path.join(ROOT_DIR, 'public', 'fonts');
  const fontFiles = fs.readdirSync(fontsDir);
  const expectedFonts = ['cormorant-garamond.woff2', 'inter.woff2'];
  const hasExtraFonts = fontFiles.some((f) => !expectedFonts.includes(f));
  if (hasExtraFonts || fontFiles.length !== 2) {
    throw new Error(`Unexpected font files in public/fonts: ${fontFiles.join(', ')}`);
  }
  process.stdout.write('Test 6: Exactly two self-hosted font families in public/fonts... PASSED\n');

  process.stdout.write('\n✅ ALL 6 DESIGN SYSTEM COMPLIANCE TESTS PASSED CLEANLY!\n\n');
}

runDesignSystemComplianceTests().catch((err: unknown) => {
  process.stderr.write(`\n❌ COMPLIANCE TEST FAILURE: ${String(err)}\n`);
  process.exit(1);
});
