const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'livic-landlord-fe/src/features/properties/components/PropertyCard.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Convert static styles to createStyles
if (!content.includes('const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({')) {
  content = content.replace(
    /const styles = StyleSheet\.create\(\{/g, 
    "const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({"
  );
  
  // Inject the useMemo hook inside PropertyCard
  content = content.replace(
    "const { theme, isDark } = useAppTheme();",
    "const { theme, isDark } = useAppTheme();\n  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);"
  );
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed PropertyCard.tsx styles definition');
