const fs = require('fs');

const path = 'livic-landlord-fe/src/features/auth/screens/SuperAdminSignupScreen.tsx';
let lines = fs.readFileSync(path, 'utf8').split('\n');

// Find the line index of `const ValidationIndicator`
const startIndex = lines.findIndex(l => l.includes('const ValidationIndicator'));
const endIndex = lines.findIndex((l, i) => i > startIndex && l.includes(');'));

if (startIndex !== -1 && endIndex !== -1) {
  lines.splice(startIndex, endIndex - startIndex + 1);
  fs.writeFileSync(path, lines.join('\n'), 'utf8');
  console.log('Successfully removed outer ValidationIndicator');
} else {
  console.log('Could not find ValidationIndicator');
}
