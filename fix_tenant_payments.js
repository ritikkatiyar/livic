const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'livic-resident-fe/src/features/tenant/screens/TenantPaymentsScreen.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Inject FloatingBackButton import
if (!content.includes('FloatingBackButton')) {
  content = content.replace(
    "import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';",
    "import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';\nimport FloatingBackButton from '@/src/components/common/navigation/FloatingBackButton';"
  );
}

const targetStr = `{isDesktop && <DesktopNavBar title="Billing & Rent Payments" />}`;
if (content.includes(targetStr)) {
  content = content.replace(targetStr, `{isDesktop ? <DesktopNavBar title="Billing & Rent Payments" /> : <FloatingBackButton />}`);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Fixed TenantPaymentsScreen.tsx');
} else {
  console.log('Target string not found in TenantPaymentsScreen.tsx');
}
