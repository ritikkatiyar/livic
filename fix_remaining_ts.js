const fs = require('fs');

// 1. Fix AnnouncementAdminScreen
const annPath = 'livic-landlord-fe/src/features/announcements/screens/AnnouncementAdminScreen.tsx';
let annContent = fs.readFileSync(annPath, 'utf8');
annContent = annContent.replace(
  /function getCategoryColor\(cat: string\) \{/,
  "function getCategoryColor(cat: string, theme: any) {"
);
annContent = annContent.replace(
  /getCategoryColor\(item\.category\)/g,
  "getCategoryColor(item.category, theme)"
);
fs.writeFileSync(annPath, annContent, 'utf8');

// 2. Fix TenantInventoryScreen
const invPath = 'livic-landlord-fe/src/features/inventory/screens/TenantInventoryScreen.tsx';
let invContent = fs.readFileSync(invPath, 'utf8');
invContent = invContent.replace(
  /function TenantItemCard\(\{ item \}: \{ item: InventoryItem \}\) \{/,
  "function TenantItemCard({ item, theme, isDark, styles }: { item: InventoryItem, theme: any, isDark: boolean, styles: any }) {"
);
invContent = invContent.replace(
  /<TenantItemCard key=\{item\.id\} item=\{item\} \/>/g,
  "<TenantItemCard key={item.id} item={item} theme={theme} isDark={isDark} styles={styles} />"
);
invContent = invContent.replace(
  /function MetricRow\(\{ label, value \}: \{ label: string; value: string \}\) \{/,
  "function MetricRow({ label, value, theme, styles }: { label: string; value: string, theme: any, styles: any }) {"
);
invContent = invContent.replace(
  /<MetricRow label="(.*?)" value=(.*?) \/>/g,
  "<MetricRow label=\"$1\" value=$2 theme={theme} styles={styles} />"
);
fs.writeFileSync(invPath, invContent, 'utf8');

// 3. Fix SuperAdminSignupScreen
const authPath = 'livic-landlord-fe/src/features/auth/screens/SuperAdminSignupScreen.tsx';
let authContent = fs.readFileSync(authPath, 'utf8');

// Inject ValidationIndicator into SuperAdminSignupScreen
if (!authContent.includes('const ValidationIndicator = ({')) {
  authContent = authContent.replace(
    /const emailInputRef = useRef<TextInput>\(null\);/,
    `const emailInputRef = useRef<TextInput>(null);

  const ValidationIndicator = ({ label, isValid }: { label: string; isValid: boolean }) => (
    <View style={styles.requirementRow}>
      <MaterialIcons 
        name={isValid ? "check-circle" : "radio-button-unchecked"} 
        size={14} 
        color={isValid ? theme.Colors.primary : theme.Colors.outlineVariant} 
      />
      <Text style={[styles.requirementText, isValid && styles.requirementTextValid]}>
        {label}
      </Text>
    </View>
  );`
  );
  fs.writeFileSync(authPath, authContent, 'utf8');
}

console.log('Fixed TS errors in remaining components');
