import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Tag } from '@/components/ui/status-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface ScreenProps {
  children: ReactNode;
  /** Título grande exibido no topo (telas das abas, que não têm barra de navegação). */
  title?: string;
  /** Elemento exibido à direita do título. */
  headerRight?: ReactNode;
  /** Tela dentro das abas: reserva espaço para a barra inferior e respeita a área segura do topo. */
  tab?: boolean;
  /** Rodapé fixo (ex.: botão salvar). */
  footer?: ReactNode;
}

/** Contêiner padrão das telas: rolagem, margens, teclado e área segura. */
export function Screen({ children, title, headerRight, tab, footer }: ScreenProps) {
  const theme = useTheme();

  const conteudo = (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, tab && { paddingBottom: BottomTabInset + Spacing.four }]}>
        <View style={styles.inner}>
          {title && (
            <View style={styles.header}>
              <ThemedText type="subtitle" style={styles.title}>
                {title}
              </ThemedText>
              {headerRight ?? <Tag label="SQLite local" tone="success" />}
            </View>
          )}
          {children}
        </View>
      </ScrollView>
      {footer && (
        <View style={[styles.footer, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <View style={styles.inner}>{footer}</View>
        </View>
      )}
    </KeyboardAvoidingView>
  );

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      {tab ? (
        <SafeAreaView style={styles.flex} edges={['top']}>
          {conteudo}
        </SafeAreaView>
      ) : (
        <SafeAreaView style={styles.flex} edges={footer ? ['bottom'] : []}>
          {conteudo}
        </SafeAreaView>
      )}
    </View>
  );
}

export function SectionTitle({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <View style={styles.sectionTitle}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionText}>
        {children.toUpperCase()}
      </ThemedText>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.five,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  title: {
    flexShrink: 1,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  sectionTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  sectionText: {
    letterSpacing: 0.8,
    fontSize: 12,
  },
});
