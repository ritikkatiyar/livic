const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'livic-landlord-fe/src/features/properties/screens/CommandCenterScreen.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Replace LUMINOUS_BACKGROUND usage in the gradient components
content = content.replace(/colors=\{LUMINOUS_BACKGROUND\}/g, 'colors={theme.Colors.backgroundGradient as [string, string, string]}');

// 2. We can just safely remove the LUMINOUS_BACKGROUND const to clean it up
content = content.replace(/const LUMINOUS_BACKGROUND = \['#d4f5f9', '#e8f8fb', '#e2e0fb'\] as const;\n/, '');

// 3. Fix hardcoded colors in createStyles. We'll do simple string replacements for the most obvious ones.
const replacements = [
  { search: /color: '#151d1e'/g, replace: 'color: theme.Colors.onBackground' },
  { search: /color: '#6b7a7d'/g, replace: 'color: theme.Colors.onSurfaceVariant' },
  { search: /color: '#00e5ff'/g, replace: 'color: theme.Colors.primary' },
  { search: /color: '#111c2c'/g, replace: 'color: theme.Colors.onBackground' },
  { search: /color: '#6f797c'/g, replace: 'color: theme.Colors.onSurfaceVariant' },
  
  { search: /backgroundColor: 'rgba\(255, 255, 255, 0\.55\)'/g, replace: "backgroundColor: theme.Colors.glassFill" },
  { search: /backgroundColor: 'rgba\(255, 255, 255, 0\.58\)'/g, replace: "backgroundColor: theme.Colors.glassFill" },
  { search: /backgroundColor: 'rgba\(255, 255, 255, 0\.3\)'/g, replace: "backgroundColor: theme.Colors.glassFill" },
  { search: /backgroundColor: 'rgba\(255, 255, 255, 0\.8\)'/g, replace: "backgroundColor: theme.Colors.glassFill" },
  
  { search: /borderColor: 'rgba\(255, 255, 255, 0\.8\)'/g, replace: "borderColor: theme.Surface.border" },
  { search: /borderColor: 'rgba\(255, 255, 255, 0\.5\)'/g, replace: "borderColor: theme.Surface.border" },
  { search: /borderColor: 'rgba\(255, 255, 255, 0\.75\)'/g, replace: "borderColor: theme.Surface.border" },
  { search: /borderColor: 'rgba\(255, 255, 255, 0\.7\)'/g, replace: "borderColor: theme.Surface.border" },
  { search: /borderTopColor: 'rgba\(255, 255, 255, 0\.7\)'/g, replace: "borderTopColor: theme.Surface.border" },
];

replacements.forEach(r => {
  content = content.replace(r.search, r.replace);
});

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed CommandCenterScreen.tsx styles');
