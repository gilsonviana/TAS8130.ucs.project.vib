import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon, type NomeIcone } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Loading() {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={theme.textSecondary} />
    </View>
  );
}

export function EmptyState({ icon = 'pet', title, message }: { icon?: NomeIcone; title: string; message?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.empty}>
      <Icon name={icon} size={32} color={theme.textSecondary} />
      <ThemedText type="smallBold" style={styles.textCenter}>
        {title}
      </ThemedText>
      {message && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.textCenter}>
          {message}
        </ThemedText>
      )}
    </View>
  );
}

type Tom = 'success' | 'danger' | 'warning' | 'info';

/** Caixa de aviso colorida (disponibilidade, conflito, erro). */
export function Notice({
  tone,
  title,
  message,
  icon,
}: {
  tone: Tom;
  title: string;
  message?: string;
  icon?: NomeIcone;
}) {
  const theme = useTheme();
  const cores = {
    success: { fundo: theme.successBackground, texto: theme.success, icone: 'disponivel' as const },
    danger: { fundo: theme.dangerBackground, texto: theme.danger, icone: 'alerta' as const },
    warning: { fundo: theme.warningBackground, texto: theme.warning, icone: 'alerta' as const },
    info: { fundo: theme.infoBackground, texto: theme.info, icone: 'info' as const },
  }[tone];

  return (
    <View style={[styles.notice, { backgroundColor: cores.fundo, borderColor: cores.texto + '33' }]}>
      <Icon name={icon ?? cores.icone} size={22} color={cores.texto} />
      <View style={styles.noticeText}>
        <ThemedText type="smallBold">{title}</ThemedText>
        {message && (
          <ThemedText type="small" style={{ color: cores.texto }}>
            {message}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return <Notice tone="danger" title="Algo deu errado" message={message} />;
}

const styles = StyleSheet.create({
  center: {
    padding: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
  },
  textCenter: {
    textAlign: 'center',
  },
  notice: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  noticeText: {
    flex: 1,
    gap: Spacing.half,
  },
});
