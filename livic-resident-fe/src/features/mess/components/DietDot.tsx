import React from 'react';
import { View } from 'react-native';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { DietType } from '../api/messMenu.api';
import { DIET_LABELS } from '../utils/messMenu';
import { createMessMenuStyles, dietColor } from './MessMenu.styles';

/** The square-and-dot mark Indian menus use: green for veg, amber for egg, red for non-veg. */
export function DietDot({ diet }: { diet: DietType }) {
  const { theme, isDark } = useAppTheme();
  const styles = React.useMemo(() => createMessMenuStyles(theme, isDark), [theme, isDark]);
  const color = dietColor(theme, diet);

  return (
    <View style={[styles.dietMark, { borderColor: color }]} accessible accessibilityLabel={DIET_LABELS[diet]}>
      <View style={[styles.dietMarkDot, { backgroundColor: color }]} />
    </View>
  );
}
