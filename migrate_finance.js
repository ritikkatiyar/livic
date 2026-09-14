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
console.log(`Found ${allFiles.length} files in Finance module.`);

let modifiedCount = 0;

for (const filePath of allFiles) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // If there's no StyleSheet, skip the complex transformation
  const hasStyleSheet = /const styles = StyleSheet\.create\({/.test(content);
  
  if (hasStyleSheet) {
    // 1. Add useAppTheme import if missing
    if (!content.includes('useAppTheme')) {
      content = content.replace(/(import React.*?;\n)/, "$1import { useAppTheme } from '@/src/theme/ThemeContext';\n");
    }

    // 2. Convert const styles = StyleSheet.create to createStyles
    content = content.replace(
      /const styles = StyleSheet\.create\({/g,
      "const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({"
    );

    // 3. Inject memo into the main default export function
    const mainComponentRegex = /(export default function [A-Z][a-zA-Z0-9_]*\s*\([^)]*\)\s*\{)/g;
    content = content.replace(mainComponentRegex, (match) => {
      // If it doesn't already have it, inject
      if (content.includes('createStyles(theme, isDark)')) return match;
      let injection = `\n  const { theme, isDark } = useAppTheme();\n  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);\n`;
      return match + injection;
    });
    
    // Also try non-default exports if no default export function found
    if (!content.match(mainComponentRegex)) {
        const namedComponentRegex = /(export function [A-Z][a-zA-Z0-9_]*\s*\([^)]*\)\s*\{)/g;
        content = content.replace(namedComponentRegex, (match) => {
            if (content.includes('createStyles(theme, isDark)')) return match;
            let injection = `\n  const { theme, isDark } = useAppTheme();\n  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);\n`;
            return match + injection;
        });
    }

    // Replace hardcoded static values in createStyles
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
    
    // Replace inline hardcoded colors outside styles but within JSX
    content = content.replace(/color="#006875"/g, "color={theme.Colors.primary}");
    content = content.replace(/color="#ffffff"/g, "color={theme.Colors.onPrimary}");
    
  } else {
    // If no stylesheet, just replace inline static tokens
    content = content.replace(/Theme\.Colors\./g, "theme.Colors.");
    content = content.replace(/Theme\.Surface\./g, "theme.Surface.");
    content = content.replace(/Theme\.Typography\./g, "theme.Typography.");
  }

  // General tint fix for BlurView
  content = content.replace(/tint="light"/g, "tint={isDark ? 'dark' : 'light'}");

  // Fix nested useAppTheme double-calls if any
  content = content.replace(/const { theme, isDark } = useAppTheme\(\);\s*const { theme, isDark } = useAppTheme\(\);/g, "const { theme, isDark } = useAppTheme();");

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedCount++;
  }
}

console.log(`Successfully migrated ${modifiedCount} files in Finance module.`);
