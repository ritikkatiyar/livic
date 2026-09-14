const fs = require('fs');
const path = require('path');

const sidebarPath = path.join(__dirname, 'livic-landlord-fe/src/components/common/navigation/SidebarNavigation.tsx');
let sidebar = fs.readFileSync(sidebarPath, 'utf-8');

sidebar = sidebar.replace(/tint="light"/g, 'tint={isDark ? "dark" : "light"}');
sidebar = sidebar.replace(/backgroundColor: 'rgba\(255, 255, 255, 0\.55\)'/g, 'backgroundColor: theme.Colors.glassFill');
sidebar = sidebar.replace(/borderRightColor: 'rgba\(255, 255, 255, 0\.8\)'/g, 'borderRightColor: theme.Surface.border');

fs.writeFileSync(sidebarPath, sidebar, 'utf-8');
console.log('Fixed SidebarNavigation.tsx');

const navbarPath = path.join(__dirname, 'livic-landlord-fe/src/components/common/navigation/DesktopNavBar.tsx');
let navbar = fs.readFileSync(navbarPath, 'utf-8');

if (!navbar.includes('useAppTheme')) {
  navbar = navbar.replace(
    "import { useRouter } from 'expo-router';",
    "import { useRouter } from 'expo-router';\nimport { useAppTheme } from '@/src/theme/ThemeContext';"
  );
}

if (!navbar.includes('const { theme, isDark } = useAppTheme();')) {
  navbar = navbar.replace(
    "const { user } = useAuth();",
    "const { user } = useAuth();\n  const { theme, isDark } = useAppTheme();\n  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);"
  );
}

navbar = navbar.replace(/const styles = StyleSheet\.create\(\{/g, 'const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({');

navbar = navbar.replace(/tint="light"/g, 'tint={isDark ? "dark" : "light"}');
navbar = navbar.replace(/borderColor: 'rgba\(255, 255, 255, 0\.4\)'/g, 'borderColor: theme.Surface.border');
navbar = navbar.replace(/backgroundColor: 'rgba\(255, 255, 255, 0\.55\)'/g, 'backgroundColor: theme.Colors.glassFill');
navbar = navbar.replace(/color: '#151d1e'/g, 'color: theme.Colors.onBackground');
navbar = navbar.replace(/backgroundColor: 'rgba\(255, 255, 255, 0\.85\)'/g, 'backgroundColor: theme.Surface.card');
navbar = navbar.replace(/borderColor: 'rgba\(255, 255, 255, 0\.95\)'/g, 'borderColor: theme.Surface.border');

fs.writeFileSync(navbarPath, navbar, 'utf-8');
console.log('Fixed DesktopNavBar.tsx');
