const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'livic-landlord-fe/src/features/finance/screens/MeterReadingScreen.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Inject FloatingBackButton import
if (!content.includes('FloatingBackButton')) {
  content = content.replace(
    "import { useRouter, useLocalSearchParams } from 'expo-router';",
    "import FloatingBackButton from '@/src/components/common/navigation/FloatingBackButton';\nimport { useRouter, useLocalSearchParams } from 'expo-router';"
  );
}

// 2. Replace the headerContainer
const regex = /\{\/\*\s*Glassy Overlay Header — clean, title only\s*\*\/\}[\s\S]*?<View style=\{\[styles\.filterSection, \{ paddingTop: 76 \}\]\}>/;

const replacement = `
        <FloatingBackButton onPress={() => router.back()} />

        {/* Filters */}
        <View style={[styles.filterSection, { paddingTop: 64 }]}>
`.trim();

if (content.match(regex)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Fixed MeterReadingScreen.tsx');
} else {
  console.log('Regex did not match in MeterReadingScreen.tsx');
}
