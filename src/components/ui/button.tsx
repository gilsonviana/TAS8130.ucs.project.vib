import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon, type NomeIcone } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variante = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variante;
  icon?: NomeIcone;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  compact,
  style,
}: ButtonProps) {
  const theme = useTheme();

  const cores: Record<Variante, { fundo: string; texto: string; borda: string }> = {
    primary: { fundo: theme.primary, texto: theme.onPrimary, borda: theme.primary },
    secondary: { fundo: theme.backgroundElement, texto: theme.text, borda: theme.border },
    danger: { fundo: theme.dangerBackground, texto: theme.danger, borda: theme.dangerBackground },
    success: { fundo: theme.success, texto: '#FFFFFF', borda: theme.success },
    ghost: { fundo: 'transparent', texto: theme.textSecondary, borda: 'transparent' },
  };
  const cor = cores[variant];
  const inativo = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inativo }}
      disabled={inativo}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        { backgroundColor: cor.fundo, borderColor: cor.borda },
        pressed && styles.pressed,
        inativo && styles.disabled,
        style,
      ]}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={cor.texto} />
        ) : (
          icon && <Icon name={icon} size={compact ? 16 : 20} color={cor.texto} />
        )}
        <ThemedText style={[styles.title, compact && styles.titleCompact, { color: cor.texto }]}>{title}</ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: Radius.medium,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
  },
  compact: {
    minHeight: 40,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.small,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
  },
  titleCompact: {
    fontSize: 14,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
});
