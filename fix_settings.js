const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'livic-resident-fe/app/settings.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Inject FloatingBackButton import
if (!content.includes('FloatingBackButton')) {
  content = content.replace(
    "import { GlassCard } from '@/src/components/common/display/GlassCard';",
    "import { GlassCard } from '@/src/components/common/display/GlassCard';\nimport FloatingBackButton from '@/src/components/common/navigation/FloatingBackButton';\nimport { useRouter } from 'expo-router';"
  );
}

// 2. Add useRouter
if (!content.includes('const router = useRouter();')) {
  content = content.replace(
    "const { isDesktop } = useResponsive();",
    "const { isDesktop } = useResponsive();\n  const router = useRouter();"
  );
}

// 3. Add FloatingBackButton inside the return but outside PageShell, wait, PageShell wraps the whole thing. Let's put it as the first thing inside PageShell.
const targetStr = `contentContainerStyle={[styles.container, isDesktop && styles.containerDesktop]}\n    >`;
if (content.includes(targetStr) && !content.includes('<FloatingBackButton')) {
  content = content.replace(
    targetStr,
    `${targetStr}\n      {!isDesktop && <FloatingBackButton onPress={() => router.back()} />}`
  );
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed settings.tsx');
