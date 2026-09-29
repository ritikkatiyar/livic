import React, { useEffect, useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ActionButton } from '@/src/components/common/inputs/ActionButton';
import { FilterPill } from '@/src/components/common/inputs/FilterPill';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { DAYS_OF_WEEK, DayOfWeek } from '@/src/utils/weekdays';
import { dayLabel } from '../utils/messMenu';
import { createMessMenuStyles } from './MessMenu.styles';

const WEEKDAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

type CopyDayModalProps = {
  visible: boolean;
  from: DayOfWeek;
  onClose: () => void;
  onCopy: (to: DayOfWeek[]) => void;
};

/** Pick the days that should get the same dishes as `from`. */
export function CopyDayModal({ visible, from, onClose, onCopy }: CopyDayModalProps) {
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createMessMenuStyles(theme), [theme]);
  const [chosen, setChosen] = useState<DayOfWeek[]>([]);
  const others = DAYS_OF_WEEK.filter((day) => day !== from);

  useEffect(() => {
    if (visible) setChosen([]);
  }, [visible]);

  const toggle = (day: DayOfWeek) =>
    setChosen((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  const pick = (days: DayOfWeek[]) => setChosen(days.filter((day) => day !== from));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose} accessibilityLabel="Close">
        <Pressable style={styles.modalCard} onPress={() => undefined}>
          <View style={styles.modalHeader}>
            <View style={styles.headerText}>
              <Text style={styles.modalTitle}>Copy {dayLabel(from)}&apos;s dishes</Text>
              <Text style={styles.cardHint}>The chosen days get the same dishes. Their own dishes are replaced; notes stay as they are.</Text>
            </View>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
              <MaterialIcons name="close" size={theme.IconSizes.lg} color={theme.Colors.onSurface} />
            </TouchableOpacity>
          </View>

          <View style={styles.quickPicks}>
            <FilterPill label="Weekdays" active={false} onPress={() => pick(WEEKDAYS)} size="sm" />
            <FilterPill label="All other days" active={false} onPress={() => pick(DAYS_OF_WEEK)} size="sm" />
          </View>

          <View>
            {others.map((day) => {
              const checked = chosen.includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={styles.dayOption}
                  onPress={() => toggle(day)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  accessibilityLabel={dayLabel(day)}
                >
                  <MaterialIcons
                    name={checked ? 'check-box' : 'check-box-outline-blank'}
                    size={theme.IconSizes.lg}
                    color={checked ? theme.Colors.primary : theme.Colors.onSurfaceVariant}
                  />
                  <Text style={styles.dayOptionText}>{dayLabel(day)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.modalActions}>
            <ActionButton label="Cancel" variant="ghost" onPress={onClose} />
            <ActionButton
              label={chosen.length ? `Copy to ${chosen.length} ${chosen.length === 1 ? 'day' : 'days'}` : 'Copy'}
              icon="content-copy"
              variant="primary"
              disabled={chosen.length === 0}
              onPress={() => onCopy(chosen)}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
