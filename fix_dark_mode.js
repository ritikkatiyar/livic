const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Skip if it doesn't use Theme statically
  if (!content.includes('Theme.Colors') && !content.includes('Theme.Surface') && !content.includes('Theme.Rounded')) {
    return;
  }

  // Check if it's already converted (has createStyles)
  if (content.includes('createStyles = (theme: any, isDark: boolean)')) {
    // If it has createStyles but still uses Theme.Colors inside, just replace Theme. with theme.
    if (content.includes('Theme.Colors') || content.includes('Theme.Surface')) {
       content = content.replace(/Theme\.(Colors|Surface|Rounded)/g, 'theme.$1');
       fs.writeFileSync(filePath, content, 'utf-8');
       console.log(`Updated Theme. to theme. in already converted file: ${filePath}`);
    }
    return;
  }

  // Does it import useAppTheme?
  const hasUseAppTheme = content.includes('useAppTheme');
  
  // Replace import { Theme } from ... with useAppTheme if not present
  if (!hasUseAppTheme) {
    if (content.includes("import { Theme } from '@/src/theme/Theme';")) {
      content = content.replace(
        "import { Theme } from '@/src/theme/Theme';",
        "import { useAppTheme } from '@/src/theme/ThemeContext';"
      );
    } else {
      // Just inject it after the last import
      const lastImportIndex = content.lastIndexOf('import ');
      if (lastImportIndex !== -1) {
        const endOfImport = content.indexOf('\n', lastImportIndex);
        content = content.slice(0, endOfImport + 1) + "import { useAppTheme } from '@/src/theme/ThemeContext';\n" + content.slice(endOfImport + 1);
      }
    }
  } else {
     // If it has useAppTheme but also imports Theme, remove Theme import
     content = content.replace(/import\s+\{\s*Theme\s*\}\s+from\s+['"]@\/src\/theme\/Theme['"];?\n?/g, '');
  }

  // Replace Theme. with theme. everywhere
  content = content.replace(/Theme\.(Colors|Surface|Rounded|Spacing)/g, 'theme.$1');

  // Find the component definition
  // Matches: export default function Foo(props) {
  // Matches: export function Foo(props) {
  // Matches: const Foo = (props) => {
  const componentRegex = /(?:export\s+(?:default\s+)?function\s+[A-Z][a-zA-Z0-9_]*\s*\([^)]*\)\s*\{)|(?:const\s+[A-Z][a-zA-Z0-9_]*\s*=\s*(?:function)?\s*\([^)]*\)\s*(?::\s*[A-Z][a-zA-Z0-9_<>]*)?\s*=>\s*\{)/;
  
  const match = content.match(componentRegex);
  if (match) {
    const componentStart = match[0];
    
    // Inject hooks
    let hooks = '';
    if (!content.includes('const { theme, isDark } = useAppTheme()')) {
      hooks += `\n  const { theme, isDark } = useAppTheme();`;
    }
    if (!content.includes('const styles = React.useMemo(() => createStyles')) {
      hooks += `\n  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);`;
    }

    if (hooks) {
      content = content.replace(componentStart, componentStart + hooks + '\n');
    }
  } else {
    console.warn(`Could not find component in ${filePath}`);
  }

  // Replace const styles = StyleSheet.create({ with const createStyles...
  content = content.replace(
    /const\s+styles\s*=\s*StyleSheet\.create\(\{/,
    'const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({'
  );

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Converted: ${filePath}`);
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

console.log('Done!');
