const fs = require('fs');
const path = require('path');

const filesToFix = [
  {
    path: path.join(__dirname, 'livic-landlord-fe/src/features/properties/components/CommandCenterEmptyState.tsx'),
    transform: (content) => {
      // 1. Inject useAppTheme import
      if (!content.includes('useAppTheme')) {
        content = content.replace(
          "import { LinearGradient } from 'expo-linear-gradient';",
          "import { LinearGradient } from 'expo-linear-gradient';\nimport { useAppTheme } from '@/src/theme/ThemeContext';"
        );
      }
      
      // 2. Add useAppTheme hook inside component
      if (!content.includes('const { theme, isDark } = useAppTheme();')) {
        content = content.replace(
          "export function CommandCenterEmptyState({ onNavigateToCreateProperty }: CommandCenterEmptyStateProps) {",
          "export function CommandCenterEmptyState({ onNavigateToCreateProperty }: CommandCenterEmptyStateProps) {\n  const { theme, isDark } = useAppTheme();\n  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);"
        );
      }

      // 3. Change StyleSheet.create to createStyles
      content = content.replace(/const styles = StyleSheet\.create\(\{/g, "const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({");
      
      // 4. Replace hardcoded colors
      content = content.replace(/color: '#151d1e'/g, "color: theme.Colors.onBackground");
      content = content.replace(/color: '#6b7a7d'/g, "color: theme.Colors.onSurfaceVariant");
      content = content.replace(/color: '#006875'/g, "color: theme.Colors.primary");
      content = content.replace(/backgroundColor: 'rgba\(255, 255, 255, 0\.45\)'/g, "backgroundColor: theme.Colors.glassFill");
      content = content.replace(/borderColor: 'rgba\(255, 255, 255, 0\.75\)'/g, "borderColor: theme.Surface.border");
      
      return content;
    }
  },
  {
    path: path.join(__dirname, 'livic-landlord-fe/src/features/properties/components/BroadcastComposerModal.tsx'),
    transform: (content) => {
      // 1. Inject useAppTheme import
      if (!content.includes('useAppTheme')) {
        content = content.replace(
          "import { LinearGradient } from 'expo-linear-gradient';",
          "import { LinearGradient } from 'expo-linear-gradient';\nimport { useAppTheme } from '@/src/theme/ThemeContext';"
        );
      }
      
      // 2. Add useAppTheme hook inside component
      if (!content.includes('const { theme, isDark } = useAppTheme();')) {
        content = content.replace(
          "export function BroadcastComposerModal({",
          "export function BroadcastComposerModal({"
        );
        content = content.replace(
          "}: BroadcastComposerModalProps) {",
          "}: BroadcastComposerModalProps) {\n  const { theme, isDark } = useAppTheme();\n  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);"
        );
      }

      // 3. Change StyleSheet.create to createStyles
      content = content.replace(/const styles = StyleSheet\.create\(\{/g, "const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({");
      
      // 4. Replace hardcoded colors
      content = content.replace(/color: '#151d1e'/g, "color: theme.Colors.onBackground");
      content = content.replace(/color: '#6b7a7d'/g, "color: theme.Colors.onSurfaceVariant");
      content = content.replace(/color: '#163235'/g, "color: theme.Colors.onBackground");
      content = content.replace(/backgroundColor: '#f3fbfc'/g, "backgroundColor: theme.Colors.inverseSurface");
      content = content.replace(/backgroundColor: 'rgba\(255, 255, 255, 0\.7\)'/g, "backgroundColor: theme.Colors.glassFill");
      content = content.replace(/borderColor: 'rgba\(255, 255, 255, 0\.6\)'/g, "borderColor: theme.Surface.border");
      content = content.replace(/borderColor: 'rgba\(0, 104, 117, 0\.15\)'/g, "borderColor: theme.Surface.border");
      content = content.replace(/backgroundColor: '#006875'/g, "backgroundColor: theme.Colors.primary");
      content = content.replace(/borderColor: '#006875'/g, "borderColor: theme.Colors.primary");
      
      return content;
    }
  }
];

filesToFix.forEach(f => {
  let content = fs.readFileSync(f.path, 'utf-8');
  content = f.transform(content);
  fs.writeFileSync(f.path, content, 'utf-8');
  console.log(`Fixed ${path.basename(f.path)}`);
});
