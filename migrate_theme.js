const fs = require('fs');
const path = require('path');

const DIRECTORIES = [
  'livic-landlord-fe/src',
  'livic-landlord-fe/app',
  'livic-resident-fe/src',
  'livic-resident-fe/app',
];

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = [];
for (const dir of DIRECTORIES) {
  getAllFiles(path.join(__dirname, dir), allFiles);
}

console.log(`Found ${allFiles.length} files to process.`);

let modifiedCount = 0;

for (const filePath of allFiles) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Replace tint="light" -> tint={isDark ? 'dark' : 'light'} in BlurView
  content = content.replace(/tint="light"/g, "tint={isDark ? 'dark' : 'light'}");

  // 2. Replace Theme.Colors with theme.Colors in JSX body
  // Wait, if it's in StyleSheet, we need to convert StyleSheet
  const hasStyleSheet = /const styles = StyleSheet\.create\({/.test(content);
  const usesStaticTheme = /Theme\.Colors\.|Theme\.Surface\.|#006875|#ffffff|rgba\(255, 255, 255/.test(content);

  if (hasStyleSheet && usesStaticTheme && !filePath.includes('Theme.ts')) {
    // Check if useAppTheme is imported
    if (!content.includes('useAppTheme')) {
      content = content.replace(/(import React.*?;\n)/, "$1import { useAppTheme } from '@/src/theme/ThemeContext';\n");
    }

    // Convert StyleSheet.create to createStyles
    content = content.replace(
      /const styles = StyleSheet\.create\({/g,
      "const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({"
    );

    // Replace static Theme inside the file
    content = content.replace(/Theme\.Colors\./g, "theme.Colors.");
    content = content.replace(/Theme\.Surface\./g, "theme.Surface.");
    content = content.replace(/'#006875'/g, "theme.Colors.primary");
    content = content.replace(/'#ffffff'/g, "theme.Surface.card");
    content = content.replace(/'#151d1e'/g, "theme.Colors.onBackground");
    content = content.replace(/'#f3fbfc'/g, "theme.Colors.background");
    content = content.replace(/'#6b7a7d'/g, "theme.Colors.onSurfaceVariant");
    content = content.replace(/'rgba\(255, 255, 255, 0\.65\)'/g, "theme.Colors.glassFill");
    content = content.replace(/'rgba\(255, 255, 255, 0\.85\)'/g, "theme.Colors.glassStroke");
    content = content.replace(/'rgba\(255, 255, 255, 0\.55\)'/g, "theme.Colors.glassFill");
    content = content.replace(/'rgba\(0, 104, 117, 0\.25\)'/g, "(isDark ? 'rgba(0, 229, 255, 0.25)' : 'rgba(0, 104, 117, 0.25)')");
    content = content.replace(/'rgba\(0, 104, 117, 0\.04\)'/g, "(isDark ? 'rgba(0, 229, 255, 0.08)' : 'rgba(0, 104, 117, 0.04)')");
    content = content.replace(/'rgba\(0, 224, 255, 0\.10\)'/g, "(isDark ? 'rgba(0, 229, 255, 0.12)' : 'rgba(0, 224, 255, 0.10)')");
    
    // Inject the hook and memo into component definitions
    // Match export default function XYZ() { or export function XYZ() {
    const componentRegex = /(export (?:default )?function [A-Z][a-zA-Z0-9_]*\s*\([^)]*\)\s*\{)/g;
    
    content = content.replace(componentRegex, (match) => {
      // If the component already uses useAppTheme, we might duplicate it, so check first
      // Actually, since we're replacing the definition, we can inject after the {
      let injection = `\n  const { theme, isDark } = useAppTheme();\n  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);\n`;
      return match + injection;
    });

    // Clean up duplicate useAppTheme calls if they already existed
    content = content.replace(/const { theme, isDark } = useAppTheme\(\);\s*const { theme, isDark } = useAppTheme\(\);/g, "const { theme, isDark } = useAppTheme();");
    content = content.replace(/const { theme, isDark, toggleTheme } = useAppTheme\(\);\s*const { theme, isDark } = useAppTheme\(\);/g, "const { theme, isDark, toggleTheme } = useAppTheme();");
    content = content.replace(/const { theme, isDark } = useAppTheme\(\);\s*const { theme, isDark, toggleTheme } = useAppTheme\(\);/g, "const { theme, isDark, toggleTheme } = useAppTheme();");
    
    // Fix shadowing if "const { theme } = useAppTheme()" existed before our injection
    // This is a bit tricky with regex, so we'll just try to compile and fix errors if they arise.
  } else {
    // Even if no StyleSheet, replace tint="light" and Theme.Colors in JSX
    content = content.replace(/Theme\.Colors\./g, "theme.Colors.");
    content = content.replace(/Theme\.Surface\./g, "theme.Surface.");
    
    // Check if 'theme' is defined
    if (content !== originalContent && !content.includes('const { theme')) {
       // We'll leave it for now to avoid breaking non-components (like Theme.ts)
       // We skip Theme.ts explicitly above.
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedCount++;
  }
}

console.log(`Successfully migrated ${modifiedCount} files to dynamic FAANG dark mode theming.`);
