const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Convert to useAppTheme
  if (!content.includes('useAppTheme')) {
    content = content.replace(
      "import { Theme } from '@/src/theme/Theme';",
      "import { Theme } from '@/src/theme/Theme';\nimport { useAppTheme } from '@/src/theme/ThemeContext';"
    );
  }

  // Find component
  const componentRegex = /(?:export\s+(?:default\s+)?function\s+[A-Z][a-zA-Z0-9_]*\s*\([^)]*\)\s*\{)|(?:const\s+[A-Z][a-zA-Z0-9_]*\s*=\s*(?:function)?\s*\([^)]*\)\s*(?::\s*[A-Z][a-zA-Z0-9_<>]*)?\s*=>\s*\{)/;
  const match = content.match(componentRegex);
  if (match) {
    const componentStart = match[0];
    if (!content.includes('const { theme, isDark } = useAppTheme()')) {
      content = content.replace(componentStart, componentStart + '\n  const { theme, isDark } = useAppTheme();\n  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);\n');
    }
  }

  content = content.replace(
    /const\s+styles\s*=\s*StyleSheet\.create\(\{/,
    'const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({'
  );

  // Replace Theme with theme, BUT for ValidationIndicator and getCategoryColor, let's fix them:
  if (filePath.includes('SuperAdminSignupScreen')) {
    content = content.replace(
      'const ValidationIndicator = ({ label, isValid }: { label: string; isValid: boolean }) => (',
      'const ValidationIndicator = ({ label, isValid, theme, styles }: { label: string; isValid: boolean; theme: any; styles: any }) => ('
    );
    content = content.replace(
      '<ValidationIndicator label="At least 8 characters" isValid={password.length >= 8} />',
      '<ValidationIndicator label="At least 8 characters" isValid={password.length >= 8} theme={theme} styles={styles} />'
    );
    content = content.replace(
      '<ValidationIndicator label="Uppercase & Lowercase letters" isValid={/[a-z]/.test(password) && /[A-Z]/.test(password)} />',
      '<ValidationIndicator label="Uppercase & Lowercase letters" isValid={/[a-z]/.test(password) && /[A-Z]/.test(password)} theme={theme} styles={styles} />'
    );
    content = content.replace(
      '<ValidationIndicator label="At least one number" isValid={/\\d/.test(password)} />',
      '<ValidationIndicator label="At least one number" isValid={/\\d/.test(password)} theme={theme} styles={styles} />'
    );
    content = content.replace(
      '<ValidationIndicator label="At least one special character" isValid={/[@$!%*?&#.\\-_^+=~()[\\]{}|\\\\:;"\'<>,/]/.test(password)} />',
      '<ValidationIndicator label="At least one special character" isValid={/[@$!%*?&#.\\-_^+=~()[\\]{}|\\\\:;"\'<>,/]/.test(password)} theme={theme} styles={styles} />'
    );
  }

  if (filePath.includes('TenantHomeScreen')) {
    content = content.replace(
      'function getCategoryColor(cat: string) {',
      'function getCategoryColor(cat: string, theme: any) {'
    );
    content = content.replace(
      'backgroundColor: getCategoryColor(ann.category)',
      'backgroundColor: getCategoryColor(ann.category, theme)'
    );
    content = content.replace(
      'backgroundColor: getCategoryColor(selectedNotice.category)',
      'backgroundColor: getCategoryColor(selectedNotice.category, theme)'
    );
  }

  // TenantInventoryScreen has RenderItem which needs theme and styles
  if (filePath.includes('TenantInventoryScreen')) {
    content = content.replace(
      'const InventoryItemCard = ({ item, onPress }: { item: InventoryItem; onPress: (i: InventoryItem) => void }) => {',
      'const InventoryItemCard = ({ item, onPress, theme, styles }: { item: InventoryItem; onPress: (i: InventoryItem) => void; theme: any; styles: any }) => {'
    );
    content = content.replace(
      '<InventoryItemCard item={item} onPress={handleItemPress} />',
      '<InventoryItemCard item={item} onPress={handleItemPress} theme={theme} styles={styles} />'
    );
  }

  content = content.replace(/Theme\.(Colors|Surface|Rounded|Spacing|Typography|Shadows)/g, 'theme.$1');
  
  fs.writeFileSync(filePath, content, 'utf-8');
}

processFile(path.join(__dirname, 'livic-resident-fe/src/features/auth/screens/SuperAdminSignupScreen.tsx'));
processFile(path.join(__dirname, 'livic-resident-fe/src/features/tenant/screens/TenantHomeScreen.tsx'));
processFile(path.join(__dirname, 'livic-resident-fe/src/features/inventory/screens/TenantInventoryScreen.tsx'));

console.log('Fixed the 3 files!');
