const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'livic-landlord-fe/src/features/properties/screens/EditPropertyScreen.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Inject FloatingBackButton import
if (!content.includes('FloatingBackButton')) {
  content = content.replace(
    "import { useRouter, Href } from 'expo-router';",
    "import FloatingBackButton from '@/src/components/common/navigation/FloatingBackButton';\nimport { useRouter, Href } from 'expo-router';"
  );
}

// 2. Replace the headerContainer and the duplicate mobile form with a clean layout
const regex = /\{\/\*\s*Pinned Glassy Overlay Back Header\s*\*\/\}[\s\S]*?<\/KeyboardAvoidingView>/;

const replacement = `
        <FloatingBackButton onPress={onBack} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <Animated.ScrollView 
            contentContainerStyle={[styles.scrollContent, { paddingTop: 68 + insets.top }]}
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false, listener: handleScroll }
            )}
            scrollEventThrottle={16}
          >
            <BlurView intensity={60} tint="light" style={styles.card}>
              {renderFormFieldsContent(true)}
              <View style={styles.divider} />
              {renderConfigCardContent()}
            </BlurView>
          </Animated.ScrollView>
        </KeyboardAvoidingView>
`.trim();

content = content.replace(regex, replacement);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed EditPropertyScreen.tsx');
