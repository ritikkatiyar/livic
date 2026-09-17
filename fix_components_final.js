const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, 'livic-landlord-fe/src/features/properties/components/CommandCenterEmptyState.tsx'),
  path.join(__dirname, 'livic-landlord-fe/src/features/properties/components/BroadcastComposerModal.tsx')
];

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace backgrounds
  content = content.replace(/backgroundColor: 'rgba\(255, 255, 255, 0\.\d+\)'/g, 'backgroundColor: theme.Colors.glassFill');
  content = content.replace(/backgroundColor: 'rgba\(0, 104, 117, 0\.\d+\)'/g, 'backgroundColor: theme.Colors.primaryContainer');

  // Replace borders
  content = content.replace(/borderColor: 'rgba\(255, 255, 255, 0\.\d+\)'/g, 'borderColor: theme.Surface.border');
  content = content.replace(/borderColor: 'rgba\(0, 104, 117, 0\.\d+\)'/g, 'borderColor: theme.Colors.primaryContainer');
  
  // Specific hex
  content = content.replace(/color: '#006875'/g, 'color: theme.Colors.primary');
  content = content.replace(/backgroundColor: '#006875'/g, 'backgroundColor: theme.Colors.primary');

  fs.writeFileSync(filePath, content, 'utf-8');
});

console.log('Cleaned up remaining static styles in components');
