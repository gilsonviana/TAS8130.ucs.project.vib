import { router } from 'expo-router';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AgendamentoCard } from '@/components/agendamento-card';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OptionChips } from '@/components/ui/chip';
import { EmptyState, ErrorMessage, Loading } from '@/components/ui/feedback';
import { Icon, type NomeIcone } from '@/components/ui/icon';
import { Screen, SectionTitle } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { listarProximosAgendamentos } from '@/db/agendamentos';
import { calcularIndicadores } from '@/db/indicadores';
import { useFocusQuery } from '@/hooks/use-focus-query';
import { useTheme } from '@/hooks/use-theme';
import {
  fimDoMes,
  formatarData,
  formatarDataComDia,
  formatarMoeda,
  formatarPercentual,
  horaDeDate,
  hojeISO,
  inicioDaSemana,
  inicioDoMes,
  nomeDiaAbreviado,
  somarDias,
} from '@/lib/formatos';

const PERIODOS = ['Hoje', 'Semana', 'Mês', 'Ano'] as const;
type Periodo = (typeof PERIODOS)[number];

function intervaloDoPeriodo(periodo: Periodo, hoje: string): { inicio: string; fim: string } {
  switch (periodo) {
    case 'Hoje':
      return { inicio: hoje, fim: hoje };
    case 'Semana': {
      const inicio = inicioDaSemana(hoje);
      return { inicio, fim: somarDias(inicio, 6) };
    }
    case 'Mês':
      return { inicio: inicioDoMes(hoje), fim: fimDoMes(hoje) };
    case 'Ano':
      return { inicio: `${hoje.slice(0, 4)}-01-01`, fim: `${hoje.slice(0, 4)}-12-31` };
  }
}

export default function InicioScreen() {
  const [periodo, setPeriodo] = useState<Periodo>('Mês');

  const carregar = useCallback(
    async (db: SQLiteDatabase) => {
      const hoje = hojeISO();
      const { inicio, fim } = intervaloDoPeriodo(periodo, hoje);
      const [doDia, indicadores, proximos] = await Promise.all([
        calcularIndicadores(db, hoje, hoje),
        calcularIndicadores(db, inicio, fim),
        listarProximosAgendamentos(db, hoje, horaDeDate(new Date()), 3),
      ]);
      return { hoje, inicio, fim, doDia, indicadores, proximos };
    },
    [periodo],
  );
  const { data, loading, error } = useFocusQuery(carregar);

  return (
    <Screen tab title="PetAgenda">
      {error && <ErrorMessage message={error} />}
      {loading && !data ? (
        <Loading />
      ) : data ? (
        <>
          <Card>
            <ThemedText type="small" themeColor="textSecondary">
              Resumo de hoje • {formatarDataComDia(data.hoje)}
            </ThemedText>
            <View style={styles.summaryRow}>
              <Resumo valor={data.doDia.agendados} rotulo="A realizar" />
              <Resumo valor={data.doDia.concluidos} rotulo="Concluídos" />
              <Resumo valor={data.doDia.cancelados} rotulo="Cancelados" />
            </View>
            <View style={styles.summaryFooter}>
              <ThemedText type="small" themeColor="textSecondary">
                Recebido hoje
              </ThemedText>
              <ThemedText type="smallBold">{formatarMoeda(data.doDia.faturamento)}</ThemedText>
            </View>
          </Card>

          <Button title="Novo agendamento" icon="mais" onPress={() => router.push('/agendamento/novo')} />

          <SectionTitle>Próximos atendimentos</SectionTitle>
          {data.proximos.length === 0 ? (
            <Card>
              <EmptyState icon="agenda" title="Nenhum atendimento futuro agendado" />
            </Card>
          ) : (
            data.proximos.map((a) => (
              <AgendamentoCard
                key={a.id}
                agendamento={a}
                mostrarData
                onPress={() => router.push({ pathname: '/agendamento/[id]', params: { id: String(a.id) } })}
              />
            ))
          )}

          <SectionTitle>Indicadores</SectionTitle>
          <OptionChips options={PERIODOS} value={periodo} onChange={(p) => p && setPeriodo(p)} />
          <ThemedText type="small" themeColor="textSecondary">
            Período: {formatarData(data.inicio)} a {formatarData(data.fim)}
          </ThemedText>

          <View style={styles.grid}>
            <Metrica icone="dinheiro" rotulo="Faturamento" valor={formatarMoeda(data.indicadores.faturamento)} />
            <Metrica icone="grafico" rotulo="Ticket médio" valor={formatarMoeda(data.indicadores.ticketMedio)} />
            <Metrica icone="concluido" rotulo="Concluídos" valor={String(data.indicadores.concluidos)} />
            <Metrica icone="agenda" rotulo="Agendados" valor={String(data.indicadores.agendados)} />
            <Metrica icone="cancelado" rotulo="Cancelados" valor={String(data.indicadores.cancelados)} />
            <Metrica
              icone="alerta"
              rotulo="Taxa de cancelamento"
              valor={formatarPercentual(data.indicadores.taxaCancelamento)}
            />
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            Faturamento e ticket médio consideram apenas atendimentos concluídos com pagamento registrado.
          </ThemedText>

          <Card>
            <ThemedText type="smallBold">Serviços mais realizados</ThemedText>
            {data.indicadores.servicosMaisRealizados.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                Nenhum atendimento concluído no período.
              </ThemedText>
            ) : (
              <Barras
                itens={data.indicadores.servicosMaisRealizados.map((s) => ({
                  rotulo: s.nome,
                  valor: s.total,
                  detalhe: `${s.total} • ${formatarMoeda(s.valor)}`,
                }))}
              />
            )}
          </Card>

          <Card>
            <ThemedText type="smallBold">Atendimentos por dia da semana</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Agendados e concluídos (sem cancelados)
            </ThemedText>
            <Barras
              itens={[1, 2, 3, 4, 5, 6, 0].map((dia) => ({
                rotulo: nomeDiaAbreviado(dia),
                valor: data.indicadores.porDiaDaSemana[dia],
              }))}
            />
          </Card>

          <Card>
            <ThemedText type="smallBold">Atendimentos por horário de início</ThemedText>
            {data.indicadores.porHora.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                Nenhum atendimento no período.
              </ThemedText>
            ) : (
              <Barras itens={data.indicadores.porHora.map((h) => ({ rotulo: h.hora, valor: h.total }))} />
            )}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function Resumo({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <View style={styles.summaryItem}>
      <ThemedText style={styles.summaryValue}>{valor}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {rotulo}
      </ThemedText>
    </View>
  );
}

function Metrica({ icone, rotulo, valor }: { icone: NomeIcone; rotulo: string; valor: string }) {
  const theme = useTheme();
  return (
    <Card style={styles.metric}>
      <Icon name={icone} size={18} color={theme.textSecondary} />
      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
        {rotulo}
      </ThemedText>
      <ThemedText style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
        {valor}
      </ThemedText>
    </Card>
  );
}

/** Gráfico de barras horizontais simples, feito apenas com Views. */
function Barras({ itens }: { itens: { rotulo: string; valor: number; detalhe?: string }[] }) {
  const theme = useTheme();
  const maximo = Math.max(1, ...itens.map((i) => i.valor));
  return (
    <View style={styles.bars}>
      {itens.map((item) => (
        <View key={item.rotulo} style={styles.barRow}>
          <ThemedText type="small" style={styles.barLabel} numberOfLines={1}>
            {item.rotulo}
          </ThemedText>
          <View style={[styles.barTrack, { backgroundColor: theme.backgroundSelected }]}>
            <View
              style={[
                styles.barFill,
                { backgroundColor: theme.bar, width: `${(item.valor / maximo) * 100}%` },
              ]}
            />
          </View>
          <ThemedText type="smallBold" style={styles.barValue} numberOfLines={1}>
            {item.detalhe ?? item.valor}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 700,
  },
  summaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  metric: {
    flexBasis: '48%',
    flexGrow: 1,
    gap: Spacing.one,
  },
  metricValue: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: 700,
  },
  bars: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  barLabel: {
    width: 96,
  },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  barValue: {
    minWidth: 28,
    textAlign: 'right',
  },
});
