const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'livic-landlord-fe/src/features/finance/screens/CreateExpenseScreen.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Inject FloatingBackButton import
if (!content.includes('FloatingBackButton')) {
  content = content.replace(
    "import { useRouter, useLocalSearchParams } from 'expo-router';",
    "import FloatingBackButton from '@/src/components/common/navigation/FloatingBackButton';\nimport { useRouter, useLocalSearchParams } from 'expo-router';"
  );
}

// 2. Replace the headerContainer and the layout
const regex = /\{\/\*\s*Pinned Glassy Header\s*\*\/\}[\s\S]*?<\/Animated\.ScrollView>/;

const replacement = `
        <FloatingBackButton onPress={() => router.back()} />

        <Animated.ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: 68 + insets.top }]}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false, listener: handleScroll }
          )}
          scrollEventThrottle={16}
        >
          {/* Hero Titles */}
          <Animated.View style={[styles.titleContainer, { opacity: largeTitleOpacity }]}>
            <Text style={styles.titleLine}>{isEditMode ? 'Update' : 'New'}</Text>
            <Text style={styles.titleLine}>Charge</Text>
          </Animated.View>

          {renderCard1()}
          {renderCard2()}
          {renderCard3()}
          {renderLivePreview()}

          {renderActionButtons(false)}

          <View style={{ height: 40 }} />
        </Animated.ScrollView>
`.trim();

if (content.match(regex)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Fixed CreateExpenseScreen.tsx');
} else {
  console.log('Regex did not match in CreateExpenseScreen.tsx');
}
