const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'livic-resident-fe/src/features/tenant/screens/TenantMaintenanceScreen.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Inject FloatingBackButton import
if (!content.includes('FloatingBackButton')) {
  content = content.replace(
    "import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';",
    "import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';\nimport FloatingBackButton from '@/src/components/common/navigation/FloatingBackButton';"
  );
}

// 2. Replace the headerContainer
const regex = /\{\s*isDesktop\s*\?\s*\([\s\S]*?<DesktopNavBar title="Maintenance & Service Center" \/>[\s\S]*?\)\s*:\s*\([\s\S]*?<View style=\{\[styles\.mobileHeaderContainer[\s\S]*?<\/View>\s*\)/;

const replacement = `
        {isDesktop ? (
          <DesktopNavBar title="Maintenance & Service Center" />
        ) : (
          <FloatingBackButton />
        )}
`.trim();

if (content.match(regex)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Fixed TenantMaintenanceScreen.tsx');
} else {
  console.log('Regex did not match in TenantMaintenanceScreen.tsx');
}
