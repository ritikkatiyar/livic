const fs = require('fs');
const path = require('path');

const DIRECTORIES = [
  'livic-landlord-fe/src/features/leases',
  'livic-landlord-fe/src/features/inventory',
  'livic-landlord-fe/src/features/reports',
  'livic-landlord-fe/src/features/announcements',
  'livic-landlord-fe/src/features/auth'
];

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

let allFiles = [];
for (const relDir of DIRECTORIES) {
  const fullPath = path.join(__dirname, relDir);
  getAllFiles(fullPath, allFiles);
}

console.log(`Found ${allFiles.length} files in remaining modules.`);

let modifiedCount = 0;

for (const filePath of allFiles) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  const hasStyleSheet = /const styles = StyleSheet\.create\({/.test(content);
  
  if (hasStyleSheet) {
    if (!content.includes('useAppTheme')) {
      const importStatement = "import { useAppTheme } from '@/src/theme/ThemeContext';\n";
      content = importStatement + content;
    }

    content = content.replace(
      /const styles = StyleSheet\.create\({/g,
      "const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({"
    );

    const mainComponentRegex = /(export default function [A-Z][a-zA-Z0-9_]*\s*\([^)]*\)\s*\{)/g;
    content = content.replace(mainComponentRegex, (match) => {
      if (content.includes('createStyles(theme, isDark)')) return match;
      let injection = `\n  const { theme, isDark } = useAppTheme();\n  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);\n`;
      return match + injection;
    });
    
    if (!content.match(mainComponentRegex)) {
        const namedComponentRegex = /(export function [A-Z][a-zA-Z0-9_]*\s*\([^)]*\)\s*\{)/g;
        content = content.replace(namedComponentRegex, (match) => {
            if (content.includes('createStyles(theme, isDark)')) return match;
            let injection = `\n  const { theme, isDark } = useAppTheme();\n  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);\n`;
            return match + injection;
        });
    }

    content = content.replace(/Theme\.Colors\./g, "theme.Colors.");
    content = content.replace(/Theme\.Surface\./g, "theme.Surface.");
    content = content.replace(/Theme\.Typography\./g, "theme.Typography.");
    
    content = content.replace(/'#006875'/g, "theme.Colors.primary");
    content = content.replace(/'#00A8C6'/g, "theme.Colors.primary");
    content = content.replace(/'#ffffff'/g, "theme.Surface.card");
    content = content.replace(/'#151d1e'/g, "theme.Colors.onBackground");
    content = content.replace(/'#f3fbfc'/g, "theme.Colors.background");
    content = content.replace(/'#6b7a7d'/g, "theme.Colors.onSurfaceVariant");
    content = content.replace(/'rgba\(255, 255, 255, 0\.65\)'/g, "theme.Colors.glassFill");
    content = content.replace(/'rgba\(255, 255, 255, 0\.85\)'/g, "theme.Colors.glassStroke");
    content = content.replace(/'rgba\(255, 255, 255, 0\.7\)'/g, "theme.Colors.glassStroke");
    content = content.replace(/'rgba\(255, 255, 255, 0\.45\)'/g, "theme.Colors.glassFill");
    content = content.replace(/'rgba\(0, 104, 117, 0\.25\)'/g, "(isDark ? 'rgba(0, 229, 255, 0.25)' : 'rgba(0, 104, 117, 0.25)')");
    content = content.replace(/'rgba\(0, 104, 117, 0\.04\)'/g, "(isDark ? 'rgba(0, 229, 255, 0.08)' : 'rgba(0, 104, 117, 0.04)')");
    
    content = content.replace(/color="#006875"/g, "color={theme.Colors.primary}");
    content = content.replace(/color="#ffffff"/g, "color={theme.Colors.onPrimary}");
    
  } else {
    content = content.replace(/Theme\.Colors\./g, "theme.Colors.");
    content = content.replace(/Theme\.Surface\./g, "theme.Surface.");
    content = content.replace(/Theme\.Typography\./g, "theme.Typography.");
  }

  content = content.replace(/tint="light"/g, "tint={isDark ? 'dark' : 'light'}");
  content = content.replace(/const { theme, isDark } = useAppTheme\(\);\s*const { theme, isDark } = useAppTheme\(\);/g, "const { theme, isDark } = useAppTheme();");

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedCount++;
  }
}

console.log(`Successfully migrated ${modifiedCount} files in remaining modules.`);
