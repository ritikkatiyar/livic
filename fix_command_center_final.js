const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'livic-landlord-fe/src/features/properties/screens/CommandCenterScreen.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Replace backgrounds
content = content.replace(/backgroundColor: 'rgba\(255, 255, 255, 0\.\d+\)'/g, 'backgroundColor: theme.Colors.glassFill');
// Replace borders
content = content.replace(/borderColor: 'rgba\(255, 255, 255, 0\.\d+\)'/g, 'borderColor: theme.Surface.border');
content = content.replace(/borderBottomColor: 'rgba\(255, 255, 255, 0\.\d+\)'/g, 'borderBottomColor: theme.Surface.border');
content = content.replace(/borderTopColor: 'rgba\(255, 255, 255, 0\.\d+\)'/g, 'borderTopColor: theme.Surface.border');
content = content.replace(/borderRightColor: 'rgba\(255, 255, 255, 0\.\d+\)'/g, 'borderRightColor: theme.Surface.border');

// Replace specific hex colors
content = content.replace(/backgroundColor: '#edf5f7'/g, 'backgroundColor: theme.Colors.surfaceContainerLow');
content = content.replace(/backgroundColor: '#f0f4f5'/g, 'backgroundColor: theme.Colors.surfaceContainerLow');
content = content.replace(/color: '#00e5ff'/g, 'color: theme.Colors.primary');
content = content.replace(/color: '#006875'/g, 'color: theme.Colors.primary');
content = content.replace(/shadowColor: '#006875'/g, 'shadowColor: theme.Colors.primary');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Cleaned up remaining static styles in CommandCenterScreen.tsx');
