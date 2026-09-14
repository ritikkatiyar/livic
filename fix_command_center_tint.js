const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'livic-landlord-fe/src/features/properties/screens/CommandCenterScreen.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Replace all tint="light" with tint={isDark ? "dark" : "light"}
content = content.replace(/tint="light"/g, 'tint={isDark ? "dark" : "light"}');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed CommandCenterScreen.tsx blur tints');
