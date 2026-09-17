const fs = require('fs');
const path = require('path');

const REPOS = ['livic-landlord-fe', 'livic-resident-fe'];

for (const repo of REPOS) {
  // PageShell
  const psPath = path.join(__dirname, repo, 'src/components/common/layout/PageShell.tsx');
  if (fs.existsSync(psPath)) {
    let content = fs.readFileSync(psPath, 'utf8');
    content = content.replace(/tint="light"/g, "tint={isDark ? 'dark' : 'light'}");
    fs.writeFileSync(psPath, content, 'utf8');
    console.log(`Fixed PageShell.tsx in ${repo}`);
  }

  // ResponsiveHeader
  const rhPath = path.join(__dirname, repo, 'src/components/common/layout/ResponsiveHeader.tsx');
  if (fs.existsSync(rhPath)) {
    let content = fs.readFileSync(rhPath, 'utf8');
    content = content.replace(/tint="light"/g, "tint={isDark ? 'dark' : 'light'}");
    content = content.replace(/color: '#151d1e'/g, "color: theme.Colors.onBackground");
    content = content.replace(/color: '#6b7a7d'/g, "color: theme.Colors.onSurfaceVariant");
    content = content.replace(/backgroundColor: 'rgba\(255, 255, 255, 0\.65\)'/g, "backgroundColor: theme.Colors.glassFill");
    content = content.replace(/borderColor: 'rgba\(255, 255, 255, 0\.8\)'/g, "borderColor: theme.Surface.border");
    fs.writeFileSync(rhPath, content, 'utf8');
    console.log(`Fixed ResponsiveHeader.tsx in ${repo}`);
  }
}
