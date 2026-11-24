import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface TextFieldProps extends TextInputProps {
  label: string;
  required?: boolean;
  hint?: string;
  prefix?: string;
}

export function TextField({ label, required, hint, prefix, style, multiline, ...rest }: TextFieldProps) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <ThemedText type="smallBold">
          {label}
          {required && <ThemedText style={{ color: theme.danger }}> *</ThemedText>}
        </ThemedText>
        {hint && (
          <ThemedText type="small" themeColor="textSecondary">
            {hint}
          </ThemedText>
        )}
      </View>
      <View
        style={[
          styles.inputBox,
          multiline && styles.multilineBox,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        {prefix && (
          <ThemedText type="default" themeColor="textSecondary">
            {prefix}
          </ThemedText>
        )}
        <TextInput
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, multiline && styles.multiline, { color: theme.text }, style]}
          multiline={multiline}
          {...rest}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    minHeight: 52,
  },
  multilineBox: {
    alignItems: 'flex-start',
    paddingVertical: Spacing.two,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.two,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
