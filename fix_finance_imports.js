const fs = require('fs');
const path = require('path');

const FINANCE_DIR = path.join(__dirname, 'livic-landlord-fe/src/features/finance');

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (filePath.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = getAllFiles(FINANCE_DIR);

for (const filePath of allFiles) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('useAppTheme') && !content.includes("from '@/src/theme/ThemeContext'")) {
    // Inject import at the top
    const importStatement = "import { useAppTheme } from '@/src/theme/ThemeContext';\n";
    content = importStatement + content;
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

console.log('Fixed imports in Finance module.');
