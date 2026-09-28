import React from 'react';
import { View } from 'react-native';
import { usePathname } from 'expo-router';
import { LinearGradient, type LinearGradientProps } from 'expo-linear-gradient';
import SidebarNavigation from '@/src/components/common/navigation/SidebarNavigation';
import DesktopNavBar from '@/src/components/common/navigation/DesktopNavBar';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { useProperties } from '@/src/hooks/useProperties';
import { useGlobalPropertySelection } from '@/src/context/PropertySelectionContext';

type LinearGradientWithWebProps = LinearGradientProps & {
  dataSet?: Record<string, string | number | boolean | undefined>;
};
const LinearGradientWithDataSet = LinearGradient as React.ComponentType<LinearGradientWithWebProps>;

/**
 * Desktop chrome for the signed-in app: pinned sidebar and top bar around the screen.
 * The mobile equivalent (header, bottom bar, assistant) lives in the same place —
 * app/(tabs)/_layout.tsx — so no screen has to know which chrome it is inside.
 */
export function DesktopLayoutShell({ children }: { children: React.ReactNode }) {
  const { theme } = useAppTheme();
  const pathname = usePathname();
  const { properties } = useProperties();
  const { selectedPropertyId, setSelectedPropertyId, searchQuery, setSearchQuery } = useGlobalPropertySelection();

  // The portfolio screen has its own search, so the top bar hides its one there
  const isPortfolio = pathname === '/command-center' || pathname === '/';

  return (
    <LinearGradientWithDataSet
      dataSet={{ responsiveLayout: 'desktop' }}
      colors={theme.Colors.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1, flexDirection: 'row' }}
    >
      <SidebarNavigation />

      <View style={{ flex: 1, flexDirection: 'column' }}>
        <DesktopNavBar
          properties={(properties || []).map((p: any) => ({ id: p.id, name: p.name }))}
          selectedPropertyId={selectedPropertyId}
          onPropertyChange={setSelectedPropertyId}
          searchQuery={isPortfolio ? undefined : searchQuery}
          onSearchChange={isPortfolio ? undefined : setSearchQuery}
          showSearch={!isPortfolio}
          searchPlaceholder="Search or jump to..."
        />

        <View style={{ flex: 1 }}>{children}</View>
      </View>
    </LinearGradientWithDataSet>
  );
}
