import React, { useMemo } from 'react';
import { PageShell } from '@/src/components/common/layout/PageShell';
import { PropertyRequiredBanner } from '@/src/components/common/feedback/PropertyRequiredBanner';
import { useScrollNav } from '@/src/components/common/navigation/ScrollContext';
import { useGlobalPropertySelection } from '@/src/context/PropertySelectionContext';
import { useProperties } from '@/src/hooks/useProperties';
import { useResponsive } from '@/src/hooks/useResponsive';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { createMessMenuStyles } from '../components/MessMenu.styles';
import { MessMenuEditor } from '../components/MessMenuEditor';
import { MessMenuHeader } from '../components/MessMenuHeader';

/** The weekly mess menu for the property picked in the top bar. */
export default function MessMenuScreen() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createMessMenuStyles(theme), [theme]);
  const { isDesktop } = useResponsive();
  const { handleScroll } = useScrollNav();
  const { selectedPropertyId, setSelectedPropertyId } = useGlobalPropertySelection();
  const { properties } = useProperties();
  const propertyName = properties.find((p) => p.id === selectedPropertyId)?.name;

  return (
    <PageShell
      scrollable
      edges={isDesktop ? ['top'] : []}
      onScroll={handleScroll}
      contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
    >
      {selectedPropertyId ? (
        <MessMenuEditor key={selectedPropertyId} propertyId={selectedPropertyId} propertyName={propertyName} />
      ) : (
        <>
          <MessMenuHeader />
          <PropertyRequiredBanner
            title="Select a property for its mess menu"
            description="Each property has its own weekly menu. Pick the one you want to plan."
            icon="restaurant-menu"
            properties={properties}
            selectedPropertyId={selectedPropertyId}
            onSelectProperty={setSelectedPropertyId}
          />
        </>
      )}
    </PageShell>
  );
}
