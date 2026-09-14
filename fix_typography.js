const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  let modified = false;
  
  if (content.match(/Theme\.(Typography|Shadows)/)) {
    content = content.replace(/Theme\.(Typography|Shadows)/g, 'theme.$1');
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated Typography/Shadows in: ${filePath}`);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.expo') {
        walkDir(fullPath);
      }
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, 'livic-landlord-fe', 'src'));
walkDir(path.join(__dirname, 'livic-landlord-fe', 'app'));
walkDir(path.join(__dirname, 'livic-resident-fe', 'src'));
walkDir(path.join(__dirname, 'livic-resident-fe', 'app'));

console.log('Done Typography!');
