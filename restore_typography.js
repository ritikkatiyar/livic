const fs = require('fs');
const path = require('path');

const REPOS = ['livic-landlord-fe', 'livic-resident-fe'];

for (const repo of REPOS) {
  const themePath = path.join(__dirname, repo, 'src/theme/Theme.ts');
  if (fs.existsSync(themePath)) {
    let content = fs.readFileSync(themePath, 'utf8');
    
    if (!content.includes('displayMetrics: {')) {
      content = content.replace(
        /headlineXl: \{/g,
        "displayMetrics: {\n    fontFamily: 'Inter',\n    fontSize: 48,\n    fontWeight: '800' as const,\n    lineHeight: 56,\n  },\n  headlineXl: {"
      );
    }
    
    if (!content.includes('bodyLg: {')) {
      content = content.replace(
        /bodyMd: \{/g,
        "bodyLg: {\n    fontFamily: 'Inter',\n    fontSize: 18,\n    fontWeight: '400' as const,\n    lineHeight: 28,\n  },\n  bodyMd: {"
      );
    }

    fs.writeFileSync(themePath, content, 'utf8');
    console.log(`Restored missing typography in ${repo}`);
  }
}
