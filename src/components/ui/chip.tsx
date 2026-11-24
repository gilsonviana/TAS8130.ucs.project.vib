import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface ChipProps {
  label: string;
  selected?: boolean;
  count?: number;
  onPress: () => void;
}

/** Botão em formato de pílula usado em filtros e opções. */
export function Chip({ label, selected, count, onPress }: ChipProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.primary : theme.backgroundElement,
          borderColor: selected ? theme.primary : theme.border,
        },
        pressed && styles.pressed,
      ]}>
      <ThemedText type="small" style={{ color: selected ? theme.onPrimary : theme.text }}>
        {label}
      </ThemedText>
      {count !== undefined && (
        <View
          style={[
            styles.count,
            { backgroundColor: selected ? theme.textSecondary : theme.backgroundSelected },
          ]}>
          <ThemedText type="smallBold" style={[styles.countText, { color: selected ? theme.onPrimary : theme.text }]}>
            {count}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

export interface OptionChipsProps<T extends string> {
  options: readonly T[];
  value: T | null;
  onChange: (value: T | null) => void;
  /** Se verdadeiro, tocar na opção selecionada remove a seleção. */
  allowDeselect?: boolean;
  scroll?: boolean;
}

/** Grupo de chips de seleção única. */
export function OptionChips<T extends string>({ options, value, onChange, allowDeselect, scroll }: OptionChipsProps<T>) {
  const chips = options.map((opcao) => (
    <Chip
      key={opcao}
      label={opcao}
      selected={value === opcao}
      onPress={() => onChange(value === opcao && allowDeselect ? null : opcao)}
    />
  ));

  if (scroll) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {chips}
      </ScrollView>
    );
  }
  return <View style={[styles.row, styles.wrap]}>{chips}</View>;
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    minHeight: 40,
  },
  count: {
    borderRadius: Radius.pill,
    minWidth: 22,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  wrap: {
    flexWrap: 'wrap',
  },
  pressed: {
    opacity: 0.8,
  },
});
