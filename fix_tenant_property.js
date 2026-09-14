const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'livic-resident-fe/src/features/tenant/screens/TenantPropertyScreen.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Inject FloatingBackButton import
if (!content.includes('FloatingBackButton')) {
  content = content.replace(
    "import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';",
    "import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';\nimport FloatingBackButton from '@/src/components/common/navigation/FloatingBackButton';"
  );
}

const targetStr = `{isDesktop && <DesktopNavBar title="My Unit & Property Lease" />}`;
if (content.includes(targetStr)) {
  content = content.replace(targetStr, `{isDesktop ? <DesktopNavBar title="My Unit & Property Lease" /> : <FloatingBackButton />}`);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Fixed TenantPropertyScreen.tsx');
} else {
  console.log('Target string not found in TenantPropertyScreen.tsx');
}
