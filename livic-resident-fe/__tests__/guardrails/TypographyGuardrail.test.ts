import fs from 'fs';
import path from 'path';

describe('Global Apple Typography Guardrails', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const dirsToCheck = [
    path.join(rootDir, 'src'),
    path.join(rootDir, 'app'),
  ];

  function walk(dir: string, fileList: string[] = []): string[] {
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

  const allFiles = dirsToCheck.flatMap(dir => walk(dir));

  it('prohibits hardcoded fontFamily in all screens and components (must inherit from Theme)', () => {
    const violations: string[] = [];

    allFiles.forEach(file => {
      const relPath = path.relative(rootDir, file);
      if (relPath.includes('src/theme/Theme.ts') || relPath.includes('src\\theme\\Theme.ts')) return;
      if (relPath.endsWith('+html.tsx')) return;

      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        const match = line.match(/fontFamily:\s*['"]([^'"]+)['"]/);
        if (match) {
          violations.push(`${relPath}:${idx + 1} -> fontFamily: '${match[1]}'`);
        }
      });
    });

    expect(violations).toEqual([]);
  });

  it('prohibits heavy shouting font weights (800 and 900) across all screens', () => {
    const violations: string[] = [];

    allFiles.forEach(file => {
      const relPath = path.relative(rootDir, file);
      if (relPath.includes('src/theme/Theme.ts') || relPath.includes('src\\theme\\Theme.ts')) return;
      if (relPath.endsWith('+html.tsx')) return;

      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        const match = line.match(/fontWeight:\s*['"](?:800|900)['"]/);
        if (match) {
          violations.push(`${relPath}:${idx + 1} -> ${match[0]}`);
        }
      });
    });

    expect(violations).toEqual([]);
  });

  it('prohibits serif font declarations across all screens', () => {
    const violations: string[] = [];

    allFiles.forEach(file => {
      const relPath = path.relative(rootDir, file);
      if (relPath.includes('src/theme/Theme.ts') || relPath.includes('src\\theme\\Theme.ts')) return;
      if (relPath.endsWith('+html.tsx')) return;

      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        if (/(Playfair|Georgia|Times New Roman|serif)/i.test(line) && !line.includes('//') && !line.includes('SansFont')) {
          violations.push(`${relPath}:${idx + 1} -> ${line.trim()}`);
        }
      });
    });

    expect(violations).toEqual([]);
  });
});
