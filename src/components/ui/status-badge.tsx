import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import type { StatusAgendamento } from '@/db/types';
import { useTheme } from '@/hooks/use-theme';

const ROTULOS: Record<StatusAgendamento, string> = {
  AGENDADO: 'AGENDADO',
  CONCLUIDO: 'CONCLUÍDO',
  CANCELADO: 'CANCELADO',
};

export function StatusBadge({ status }: { status: StatusAgendamento }) {
  const theme = useTheme();
  const cores = {
    AGENDADO: { fundo: theme.infoBackground, texto: theme.info },
    CONCLUIDO: { fundo: theme.successBackground, texto: theme.success },
    CANCELADO: { fundo: theme.backgroundSelected, texto: theme.textSecondary },
  }[status];

  return (
    <View style={[styles.badge, { backgroundColor: cores.fundo }]}>
      <ThemedText type="smallBold" style={[styles.text, { color: cores.texto }]}>
        {ROTULOS[status]}
      </ThemedText>
    </View>
  );
}

/** Pequeno selo genérico (ex.: "INATIVO", "SQLite local"). */
export function Tag({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'success' | 'warning' }) {
  const theme = useTheme();
  const cores = {
    neutral: { fundo: theme.backgroundSelected, texto: theme.textSecondary, ponto: theme.textSecondary },
    success: { fundo: theme.successBackground, texto: theme.success, ponto: theme.success },
    warning: { fundo: theme.warningBackground, texto: theme.warning, ponto: theme.warning },
  }[tone];
  return (
    <View style={[styles.badge, styles.tag, { backgroundColor: cores.fundo }]}>
      <View style={[styles.dot, { backgroundColor: cores.ponto }]} />
      <ThemedText type="smallBold" style={[styles.text, { color: cores.texto }]}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.half,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  text: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
