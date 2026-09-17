const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'livic-resident-fe/src/features/inventory/screens/TenantInventoryScreen.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Use AppTheme
if (!content.includes('useAppTheme')) {
  content = content.replace(
    "import { Theme } from '@/src/theme/Theme';",
    "import { Theme } from '@/src/theme/Theme';\nimport { useAppTheme } from '@/src/theme/ThemeContext';"
  );
}

// Add hooks
if (!content.includes('const { theme, isDark } = useAppTheme()')) {
  content = content.replace(
    'export default function TenantInventoryScreen() {',
    'export default function TenantInventoryScreen() {\n  const { theme, isDark } = useAppTheme();\n  const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);'
  );
}

// Update styles
content = content.replace(
  'const styles = StyleSheet.create({',
  'const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({'
);

// Update MetricRow
content = content.replace(
  '<MetricRow label="Total Visible Items" value={String(tenantVisibleItems.length)} />',
  '<MetricRow label="Total Visible Items" value={String(tenantVisibleItems.length)} styles={styles} />'
);
content = content.replace(
  '<MetricRow label="Excellent Condition" value="2" />',
  '<MetricRow label="Excellent Condition" value="2" styles={styles} />'
);
content = content.replace(
  '<MetricRow label="Minor Wear" value="1" />',
  '<MetricRow label="Minor Wear" value="1" styles={styles} />'
);
content = content.replace(
  'function MetricRow({ label, value }: { label: string; value: string }) {',
  'function MetricRow({ label, value, styles }: { label: string; value: string; styles: any }) {'
);

// Update TenantItemCard
content = content.replace(
  '<TenantItemCard key={item.id} item={item} />',
  '<TenantItemCard key={item.id} item={item} theme={theme} styles={styles} />'
);
content = content.replace(
  'function TenantItemCard({ item }: { item: InventoryItem }) {',
  'function TenantItemCard({ item, theme, styles }: { item: InventoryItem; theme: any; styles: any }) {'
);

// Theme -> theme
content = content.replace(/Theme\.(Colors|Surface|Rounded|Spacing|Typography|Shadows)/g, 'theme.$1');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed TenantInventoryScreen.tsx');
