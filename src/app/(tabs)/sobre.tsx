import Constants from 'expo-constants';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Screen, SectionTitle } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { APP_INFO } from '@/constants/app-info';
import { obterResumoBanco } from '@/db/indicadores';
import { useFocusQuery } from '@/hooks/use-focus-query';
import { useTheme } from '@/hooks/use-theme';

export default function SobreScreen() {
  const theme = useTheme();
  const versao = Constants.expoConfig?.version ?? '1.0.0';
  const carregar = useCallback((db: SQLiteDatabase) => obterResumoBanco(db), []);
  const { data: resumo } = useFocusQuery(carregar);

  return (
    <Screen tab title="Sobre">
      <Card style={styles.hero}>
        <View style={[styles.logo, { backgroundColor: theme.primary }]}>
          <Icon name="pet" size={32} color={theme.onPrimary} />
        </View>
        <ThemedText type="subtitle">{APP_INFO.nome}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Versão {versao}
        </ThemedText>
        <ThemedText type="small" style={styles.center}>
          {APP_INFO.descricao}
        </ThemedText>
      </Card>

      <SectionTitle>Projeto acadêmico</SectionTitle>
      <Card>
        <Linha rotulo="Disciplina" valor={APP_INFO.disciplina} />
        <Linha rotulo="Instituição" valor={APP_INFO.instituicao} />
        {APP_INFO.curso !== '' && <Linha rotulo="Curso" valor={APP_INFO.curso} />}
      </Card>

      <SectionTitle>Integrantes do grupo</SectionTitle>
      <Card>
        {APP_INFO.integrantes.map((nome) => (
          <View key={nome} style={styles.member}>
            <Icon name="pessoa" size={18} color={theme.textSecondary} />
            <ThemedText>{nome}</ThemedText>
          </View>
        ))}
      </Card>

      <SectionTitle>Armazenamento</SectionTitle>
      <Card>
        <View style={styles.member}>
          <Icon name="banco" size={18} color={theme.success} />
          <ThemedText type="smallBold">Banco de dados local (SQLite)</ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          Todos os dados ficam salvos neste aparelho e o app funciona sem internet. Desinstalar o app ou limpar seus
          dados apaga os registros.
        </ThemedText>
        {resumo && (
          <View style={styles.stats}>
            <Linha rotulo="Clientes ativos" valor={String(resumo.clientes)} />
            <Linha rotulo="Animais ativos" valor={String(resumo.animais)} />
            <Linha rotulo="Serviços ativos" valor={String(resumo.servicos)} />
            <Linha rotulo="Agendamentos registrados" valor={String(resumo.agendamentos)} />
          </View>
        )}
      </Card>
    </Screen>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={styles.line}>
      <ThemedText type="small" themeColor="textSecondary">
        {rotulo}
      </ThemedText>
      <ThemedText type="smallBold" style={styles.lineValue}>
        {valor}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: Radius.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    textAlign: 'center',
  },
  member: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  stats: {
    marginTop: Spacing.two,
    gap: Spacing.one,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  lineValue: {
    flexShrink: 1,
    textAlign: 'right',
  },
});
