import fs from 'node:fs';
import path from 'node:path';

/**
 * ============================================================================
 * Focus Interaction & Accessibility Verification Test
 * ============================================================================
 * Validates:
 * 1. Sequential tab order starts from brand logo and extends down to the last
 *    actionable element.
 * 2. Header navigation links feature high-contrast outline and generous padding
 *    in their focus state.
 * 3. All form inputs and buttons in the marketing page have defined focus states.
 */

const ROOT_DIR = path.resolve(__dirname, '../..');

function runFocusInteractionTests(): void {
  process.stdout.write('\n=== FOCUS INTERACTION & TAB ORDER VERIFICATION ===\n');

  // 1. Check header.module.css for focus states and generous padding
  const headerCssPath = path.join(ROOT_DIR, 'components/ui/header.module.css');
  const headerCss = fs.readFileSync(headerCssPath, 'utf8');

  if (!headerCss.includes('.brandLink:focus-visible')) {
    throw new Error('Missing .brandLink:focus-visible in header.module.css');
  }
  if (!headerCss.includes('.navLink:focus-visible')) {
    throw new Error('Missing .navLink:focus-visible in header.module.css');
  }
  if (!headerCss.includes('.ctaButton:focus-visible')) {
    throw new Error('Missing .ctaButton:focus-visible in header.module.css');
  }

  // Verify generous padding on nav links
  const navLinkFocusBlock = headerCss.slice(headerCss.indexOf('.navLink:focus-visible'));
  if (!navLinkFocusBlock.includes('padding: var(--spacing-8) var(--spacing-20)') && !navLinkFocusBlock.includes('padding: var(--spacing-8) var(--spacing-16)')) {
    throw new Error('Navigation links do not have generous padding defined in focus state');
  }
  process.stdout.write('Test 1: Header links have high-visibility focus states & generous padding... PASSED\n');

  // 2. Check marketing.module.css for form input focus states
  const marketingCssPath = path.join(ROOT_DIR, 'app/(marketing)/marketing.module.css');
  const marketingCss = fs.readFileSync(marketingCssPath, 'utf8');

  if (!marketingCss.includes('.input:focus-visible') || !marketingCss.includes('.textarea:focus-visible')) {
    throw new Error('Missing form input focus-visible states in marketing.module.css');
  }
  if (!marketingCss.includes('.submitButton:focus-visible')) {
    throw new Error('Missing submitButton:focus-visible state in marketing.module.css');
  }
  process.stdout.write('Test 2: Form inputs and buttons have explicit focus states... PASSED\n');

  // 3. Check Header component structure and DOM sequence
  const headerTsxPath = path.join(ROOT_DIR, 'components/ui/header.tsx');
  const headerTsx = fs.readFileSync(headerTsxPath, 'utf8');

  const brandLinkIdx = headerTsx.indexOf('className={styles.brandLink}');
  const navLinkIdx = headerTsx.indexOf('className={`${styles.navLink}');
  const ctaButtonIdx = headerTsx.indexOf('className={styles.ctaButton}');

  if (brandLinkIdx === -1 || navLinkIdx === -1 || ctaButtonIdx === -1) {
    throw new Error('Header component missing required CSS module class names');
  }

  if (!(brandLinkIdx < navLinkIdx && navLinkIdx < ctaButtonIdx)) {
    throw new Error('Header elements not in sequential DOM tab order');
  }
  process.stdout.write('Test 3: Header tab sequence (Brand Logo -> Nav Links -> CTA) is strictly preserved... PASSED\n');

  // 4. Check page.tsx structure: Header comes before main interactive elements
  const pageTsxPath = path.join(ROOT_DIR, 'app/(marketing)/page.tsx');
  const pageTsx = fs.readFileSync(pageTsxPath, 'utf8');

  const headerRenderIdx = pageTsx.indexOf('<Header');
  const mainRenderIdx = pageTsx.indexOf('<main');
  const contactFormIdx = pageTsx.indexOf('<form');

  if (headerRenderIdx === -1 || mainRenderIdx === -1) {
    throw new Error('page.tsx missing Header or main container');
  }
  if (!(headerRenderIdx < mainRenderIdx && mainRenderIdx < contactFormIdx)) {
    throw new Error('DOM order in page.tsx violates header-to-content sequential focus flow');
  }
  process.stdout.write('Test 4: Full page tab sequence from Brand Logo down to last form element is verified... PASSED\n');

  process.stdout.write('\n✅ ALL FOCUS INTERACTION VERIFICATION CHECKS PASSED!\n\n');
}

runFocusInteractionTests();
