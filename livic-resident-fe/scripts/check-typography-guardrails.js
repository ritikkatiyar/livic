const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIRS_TO_CHECK = [
  path.join(ROOT, 'src'),
  path.join(ROOT, 'app')
];

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (['node_modules', '.git', '.expo', 'dist', 'build', '.vscode'].includes(file)) continue;
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath, fileList);
    } else if (/\.(tsx|ts|jsx|js)$/.test(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const violations = [];

DIRS_TO_CHECK.forEach(dir => {
  const files = walk(dir);
  files.forEach(file => {
    // Skip Theme.ts (where global fonts/weights are defined) and +html.tsx (where font-face fallback is defined)
    const relPath = path.relative(ROOT, file);
    if (relPath.includes('src/theme/Theme.ts') || relPath.includes('src\\theme\\Theme.ts')) return;
    if (relPath.endsWith('+html.tsx')) return;

    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, lineIdx) => {
      const lineNum = lineIdx + 1;

      // Rule 1: No hardcoded fontFamily string literals
      const fontMatch = line.match(/fontFamily:\s*['"]([^'"]+)['"]/);
      if (fontMatch) {
        violations.push({
          file: relPath,
          line: lineNum,
          rule: 'GLOBAL_FONT_FAMILY_ENFORCEMENT',
          message: `Forbidden hardcoded fontFamily '${fontMatch[1]}'. Every screen must follow the global font stack defined in Theme.ts via Theme.Typography.* tokens.`
        });
      }

      // Rule 2: No excessive boldness (800 or 900)
      const boldMatch = line.match(/fontWeight:\s*['"](?:800|900)['"]/);
      if (boldMatch) {
        violations.push({
          file: relPath,
          line: lineNum,
          rule: 'NO_EXCESSIVE_BOLDNESS',
          message: `Forbidden excessive font boldness (800/900). In Apple HIG design system, use '600' (semibold) for titles/headers/CTAs, '500' (medium) for badges/labels, and '400' for body.`
        });
      }

      // Rule 3: No serif fonts
      if (/(Playfair|Georgia|Times New Roman|serif)/i.test(line) && !line.includes('//') && !line.includes('SansFont')) {
        violations.push({
          file: relPath,
          line: lineNum,
          rule: 'NO_SERIF_FONTS',
          message: `Forbidden serif font reference. Livic strictly uses Apple Human Interface Guidelines system sans-serif (SF Pro).`
        });
      }
    });
  });
});

if (violations.length > 0) {
  console.error('\n❌ [TYPOGRAPHY GUARDRAIL VIOLATIONS FOUND]');
  console.error(`Total violations: ${violations.length}\n`);
  violations.forEach(v => {
    console.error(`  ${v.file}:${v.line} [${v.rule}] -> ${v.message}`);
  });
  console.error('\nGuardrail Failed! Every screen must adhere to global typography tokens in Theme.ts.\n');
  process.exit(1);
} else {
  console.log('✅ [TYPOGRAPHY GUARDRAIL PASSED] All screens and components adhere to global Apple typography standards.');
  process.exit(0);
}
