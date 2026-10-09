import React from 'react';
import { Text, View } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { createMessMenuStyles } from './MessMenu.styles';

type MessMenuHeaderProps = {
  propertyName?: string;
  /** Right-hand actions, e.g. the desktop Save button. */
  children?: React.ReactNode;
};

export function MessMenuHeader({ propertyName, children }: MessMenuHeaderProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createMessMenuStyles(theme), [theme]);

  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={styles.kicker}>{propertyName ? `MESS · ${propertyName.toUpperCase()}` : 'MESS'}</Text>
        <Text style={styles.title}>Mess menu</Text>
        <Text style={styles.subtitle}>Plan the meals your mess serves each day of the week.</Text>
      </View>
      {children ? <View style={styles.headerActions}>{children}</View> : null}
    </View>
  );
}
