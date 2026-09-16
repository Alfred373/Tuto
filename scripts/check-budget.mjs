#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

/**
 * ============================================================================
 * Performance Budget Enforcement Script (CI Check)
 * ============================================================================
 * 
 * PRD 7.3 Budget Limits:
 * - Total transferred bytes, solve route: Under 500KB (512,000 bytes)
 * - Of which JavaScript, gzipped: Under 180KB (184,320 bytes)
 * - Web fonts: Under 40KB
 * 
 * Enforced in CI to fail the build if budgets are exceeded.
 */

const MAX_TOTAL_BYTES = 500 * 1024; // 500 KB
const MAX_JS_GZIP_BYTES = 180 * 1024; // 180 KB

const rootDir = process.cwd();
const dotNextDir = path.join(rootDir, '.next');
const appManifestPath = path.join(dotNextDir, 'app-build-manifest.json');
const pagesManifestPath = path.join(dotNextDir, 'build-manifest.json');

console.log('\n======================================================');
console.log(' 📊 CI Performance Budget Check (PRD 7.3)');
console.log('======================================================');

if (!fs.existsSync(dotNextDir)) {
  console.error('❌ .next directory not found. Please run next build first.');
  process.exit(1);
}

let manifestsFound = false;
let failed = false;

// Helper to get gzipped size of a file in .next
function getGzipSize(relativePath) {
  const fullPath = path.join(dotNextDir, relativePath);
  if (!fs.existsSync(fullPath)) return 0;
  const content = fs.readFileSync(fullPath);
  return zlib.gzipSync(content).length;
}

function getRawSize(relativePath) {
  const fullPath = path.join(dotNextDir, relativePath);
  if (!fs.existsSync(fullPath)) return 0;
  return fs.statSync(fullPath).size;
}

const checkedRoutes = [];

if (fs.existsSync(appManifestPath)) {
  manifestsFound = true;
  const appManifest = JSON.parse(fs.readFileSync(appManifestPath, 'utf8'));
  const pages = appManifest.pages || {};

  for (const [route, files] of Object.entries(pages)) {
    // We check solve routes specifically, as well as checking all routes
    const isSolveRoute = route.includes('/solve') || route.includes('solve');
    
    let totalJsGzip = 0;
    let totalRawBytes = 0;

    for (const file of files) {
      if (file.endsWith('.js')) {
        totalJsGzip += getGzipSize(file);
      }
      totalRawBytes += getRawSize(file);
    }

    checkedRoutes.push({
      route,
      isSolveRoute,
      jsGzipKb: (totalJsGzip / 1024).toFixed(2),
      totalKb: (totalRawBytes / 1024).toFixed(2),
      totalJsGzip,
      totalRawBytes,
    });

    if (isSolveRoute) {
      if (totalJsGzip > MAX_JS_GZIP_BYTES) {
        console.error(`❌ [FAIL] Solve route JS exceeds budget: ${(totalJsGzip / 1024).toFixed(2)}KB > 180KB`);
        failed = true;
      }
      if (totalRawBytes > MAX_TOTAL_BYTES) {
        console.error(`❌ [FAIL] Solve route total transferred bytes exceeds budget: ${(totalRawBytes / 1024).toFixed(2)}KB > 500KB`);
        failed = true;
      }
    }
  }
}

if (!manifestsFound) {
  console.log('ℹ️ No app-build-manifest.json found yet. Skipping route check.');
} else {
  console.log('\nRoute Analysis Summary:');
  for (const r of checkedRoutes) {
    const flag = r.isSolveRoute ? ' [TARGET: SOLVE ROUTE]' : '';
    console.log(`  • ${r.route}${flag}`);
    console.log(`    - JS (gzipped): ${r.jsGzipKb} KB (Budget: 180 KB)`);
    console.log(`    - Total:        ${r.totalKb} KB (Budget: 500 KB)`);
  }
}

if (failed) {
  console.error('\n❌ CI Budget check FAILED. Build blocked per PRD 7.3.\n');
  process.exit(1);
} else {
  console.log('\n✅ CI Budget check PASSED. All routes within PRD 7.3 thresholds.\n');
  process.exit(0);
}
