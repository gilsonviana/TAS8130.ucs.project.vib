import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Icon, type NomeIcone } from '@/components/ui/icon';
import { Tag } from '@/components/ui/status-badge';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface ListRowProps {
  icon: NomeIcone;
  title: string;
  subtitle?: string;
  detail?: string;
  inativo?: boolean;
  right?: ReactNode;
  onPress?: () => void;
}

/** Linha de lista em cartão, usada nos cadastros. */
export function ListRow({ icon, title, subtitle, detail, inativo, right, onPress }: ListRowProps) {
  const theme = useTheme();
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: theme.background }]}>
          <Icon name={icon} size={22} color={inativo ? theme.textSecondary : theme.text} />
        </View>
        <View style={styles.text}>
          <ThemedText numberOfLines={1} themeColor={inativo ? 'textSecondary' : 'text'}>
            {title}
          </ThemedText>
          {subtitle && (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {subtitle}
            </ThemedText>
          )}
          {detail && (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {detail}
            </ThemedText>
          )}
        </View>
        {inativo && <Tag label="INATIVO" />}
        {right}
        {onPress && <Icon name="direita" size={14} color={theme.textSecondary} />}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
});
