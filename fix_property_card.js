const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'livic-landlord-fe/src/features/properties/components/PropertyCard.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const replacements = [
  { search: /color: '#151d1e'/g, replace: 'color: theme.Colors.onBackground' },
  { search: /color: '#6b7a7d'/g, replace: 'color: theme.Colors.onSurfaceVariant' },
  { search: /color: '#006875'/g, replace: 'color: theme.Colors.primary' },
  
  { search: /backgroundColor: 'rgba\(255, 255, 255, 0\.85\)'/g, replace: "backgroundColor: theme.Surface.card" },
  { search: /backgroundColor: 'rgba\(255, 255, 255, 0\.4\)'/g, replace: "backgroundColor: theme.Colors.glassFill" },
  { search: /backgroundColor: 'rgba\(255, 255, 255, 0\.45\)'/g, replace: "backgroundColor: theme.Colors.glassFill" },
  
  { search: /borderColor: 'rgba\(255, 255, 255, 0\.5\)'/g, replace: "borderColor: theme.Surface.border" },
  { search: /borderColor: 'rgba\(255, 255, 255, 0\.65\)'/g, replace: "borderColor: theme.Surface.border" },
  { search: /borderColor: 'rgba\(255, 255, 255, 0\.75\)'/g, replace: "borderColor: theme.Surface.border" }
];

replacements.forEach(r => {
  content = content.replace(r.search, r.replace);
});

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed PropertyCard.tsx styles');
