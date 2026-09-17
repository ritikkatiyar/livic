const fs = require('fs');
const path = require('path');

const REPOS = ['livic-landlord-fe', 'livic-resident-fe'];

for (const repo of REPOS) {
  // 1. GlassCard
  const gcPath = path.join(__dirname, repo, 'src/components/common/display/GlassCard.tsx');
  if (fs.existsSync(gcPath)) {
    let content = fs.readFileSync(gcPath, 'utf8');
    // Fix tint default
    content = content.replace(
      /intensity = 70,\n  tint = 'light',/g, 
      "intensity = 70,\n  tint,"
    );
    // Inside the component before return
    content = content.replace(
      /const styles = React\.useMemo.*?;\n/g,
      "const styles = React.useMemo(() => createStyles(theme, isDark), [theme, isDark]);\n  const activeTint = tint || (isDark ? 'dark' : 'light');\n"
    );
    // Update BlurView tint
    content = content.replace(/tint=\{tint\}/g, "tint={activeTint}");
    
    // Fix border color
    content = content.replace(/borderColor: 'rgba\(255, 255, 255, 0\.8\)'/g, "borderColor: theme.Colors.glassStroke");
    
    fs.writeFileSync(gcPath, content, 'utf8');
    console.log(`Fixed GlassCard.tsx in ${repo}`);
  }

  // 2. ActionButton
  const abPath = path.join(__dirname, repo, 'src/components/common/inputs/ActionButton.tsx');
  if (fs.existsSync(abPath)) {
    let content = fs.readFileSync(abPath, 'utf8');
    
    content = content.replace(/backgroundColor: 'rgba\(0, 104, 117, 0\.08\)'/g, "backgroundColor: theme.Colors.primaryContainer");
    content = content.replace(/backgroundColor: 'rgba\(107, 122, 125, 0\.12\)'/g, "backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(107, 122, 125, 0.12)'");
    content = content.replace(/boxShadow: '0px 4px 15px rgba\(0, 112, 234, 0\.25\)'/g, "boxShadow: isDark ? '0px 4px 15px rgba(0, 229, 255, 0.25)' : '0px 4px 15px rgba(0, 112, 234, 0.25)'");
    
    fs.writeFileSync(abPath, content, 'utf8');
    console.log(`Fixed ActionButton.tsx in ${repo}`);
  }

  // 3. StatCard
  const scPath = path.join(__dirname, repo, 'src/components/common/display/StatCard.tsx');
  if (fs.existsSync(scPath)) {
    let content = fs.readFileSync(scPath, 'utf8');
    content = content.replace(/backgroundColor: 'rgba\(0, 104, 117, 0\.08\)'/g, "backgroundColor: theme.Colors.primaryContainer");
    fs.writeFileSync(scPath, content, 'utf8');
    console.log(`Fixed StatCard.tsx in ${repo}`);
  }

  // 4. EmptyState
  const esPath = path.join(__dirname, repo, 'src/components/common/display/EmptyState.tsx');
  if (fs.existsSync(esPath)) {
    let content = fs.readFileSync(esPath, 'utf8');
    content = content.replace(/tint="light"/g, "tint={isDark ? 'dark' : 'light'}");
    content = content.replace(/color="#6b7a7d"/g, "color={theme.Colors.onSurfaceVariant}");
    content = content.replace(/color: '#6b7a7d'/g, "color: theme.Colors.onSurfaceVariant");
    content = content.replace(/color: '#151d1e'/g, "color: theme.Colors.onBackground");
    content = content.replace(/color: '#006875'/g, "color: theme.Colors.primary");
    content = content.replace(/backgroundColor: '#f0f4f5'/g, "backgroundColor: theme.Colors.surfaceContainerLow");
    fs.writeFileSync(esPath, content, 'utf8');
    console.log(`Fixed EmptyState.tsx in ${repo}`);
  }

  // 5. SectionHeader
  const shPath = path.join(__dirname, repo, 'src/components/common/display/SectionHeader.tsx');
  if (fs.existsSync(shPath)) {
    let content = fs.readFileSync(shPath, 'utf8');
    content = content.replace(/color: '#151d1e'/g, "color: theme.Colors.onBackground");
    content = content.replace(/color: '#6b7a7d'/g, "color: theme.Colors.onSurfaceVariant");
    content = content.replace(/color: '#006875'/g, "color: theme.Colors.primary");
    fs.writeFileSync(shPath, content, 'utf8');
    console.log(`Fixed SectionHeader.tsx in ${repo}`);
  }

  // 6. StatusPill
  const spPath = path.join(__dirname, repo, 'src/components/common/display/StatusPill.tsx');
  if (fs.existsSync(spPath)) {
    let content = fs.readFileSync(spPath, 'utf8');
    // StatusPill might have specific colors
    fs.writeFileSync(spPath, content, 'utf8');
    console.log(`Checked StatusPill.tsx in ${repo}`);
  }
}
