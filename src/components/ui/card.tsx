import { Pressable, StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface CardProps extends ViewProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  muted?: boolean;
}

/** Cartão branco com borda suave, usado em listas e seções. */
export function Card({ onPress, style, muted, children, ...rest }: CardProps) {
  const theme = useTheme();
  const estilo = [
    styles.card,
    { backgroundColor: theme.backgroundElement, borderColor: theme.border },
    muted && styles.muted,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [estilo, pressed && styles.pressed]}
        {...rest}>
        {children}
      </Pressable>
    );
  }

  return (
    <View style={estilo} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.large,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  muted: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.85,
  },
});
