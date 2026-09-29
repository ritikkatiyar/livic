const fs = require('fs');
const path = require('path');

/**
 * Fails when a color is hardcoded outside the theme. Hardcoded colors do not switch with
 * light/dark mode, which is how light-only pastels and white-on-teal text crept in before.
 *
 * Use theme.Colors.* tokens instead, and withAlpha(theme.Colors.x, a) from
 * src/theme/colorUtils for tints. Allowed exceptions:
 *   - shadowColor values (black shadows read correctly in both modes)
 *   - lines marked with an `allow-color` comment, for brand or artwork colors
 *   - the files listed in ALLOWED_FILES
 */
const ROOT = path.resolve(__dirname, '..');
const DIRS_TO_CHECK = [path.join(ROOT, 'src'), path.join(ROOT, 'app')];

const ALLOWED_FILES = [
  /src[\\/]theme[\\/]/,                              // the palette itself
  /QRScannerModal\.tsx$/,                            // camera overlay: fixed colors over the camera feed
  /AssistantMascot\.tsx$/,                           // mascot artwork
  /GoogleSignInButton\.tsx$/,                        // third-party brand button
  /\+html\.tsx$/,
];

const COLOR_LITERAL = /(['"`])(#[0-9a-fA-F]{3,8}|rgba?\(\s*\d[^)]*\)|white|black)\1|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}/;

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  for (const file of fs.readdirSync(dir)) {
    if (['node_modules', '.git', '.expo', 'dist', 'build', '.vscode'].includes(file)) continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) walk(filePath, fileList);
    else if (/\.(tsx|ts|jsx|js)$/.test(file)) fileList.push(filePath);
  }
  return fileList;
}

const violations = [];

DIRS_TO_CHECK.forEach((dir) => {
  walk(dir).forEach((file) => {
    const relPath = path.relative(ROOT, file);
    if (ALLOWED_FILES.some((re) => re.test(relPath))) return;

    fs.readFileSync(file, 'utf8').split('\n').forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
      if (line.includes('allow-color')) return;
      if (/shadowColor\s*:/.test(line)) return;

      const match = line.match(COLOR_LITERAL);
      if (match) {
        violations.push({ file: relPath, line: idx + 1, value: match[2] || match[0] });
      }
    });
  });
});

if (violations.length > 0) {
  console.error('\n❌ [COLOR GUARDRAIL VIOLATIONS FOUND]');
  console.error(`Total violations: ${violations.length}\n`);
  violations.forEach((v) => {
    console.error(`  ${v.file}:${v.line} -> hardcoded color ${v.value}`);
  });
  console.error(
    '\nUse theme.Colors.* tokens (and withAlpha from src/theme/colorUtils for tints) so colors follow light/dark mode.' +
      '\nFor a deliberate brand or artwork color, add an `// allow-color` comment on that line.\n'
  );
  process.exit(1);
} else {
  console.log('✅ [COLOR GUARDRAIL PASSED] No hardcoded colors outside the theme.');
  process.exit(0);
}
