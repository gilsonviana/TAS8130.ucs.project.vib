import { router } from 'expo-router';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AgendamentoCard } from '@/components/agendamento-card';
import { DateField } from '@/components/date-time-field';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState, ErrorMessage, Loading } from '@/components/ui/feedback';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { contarAgendamentosPorDia, listarAgendamentosPorData } from '@/db/agendamentos';
import type { StatusAgendamento } from '@/db/types';
import { useFocusQuery } from '@/hooks/use-focus-query';
import { useTheme } from '@/hooks/use-theme';
import {
  diaDaSemana,
  formatarDataComDia,
  hojeISO,
  inicioDaSemana,
  nomeDiaCurto,
  somarDias,
} from '@/lib/formatos';

type Filtro = 'TODOS' | StatusAgendamento;

const FILTROS: { valor: Filtro; rotulo: string }[] = [
  { valor: 'TODOS', rotulo: 'Todos' },
  { valor: 'AGENDADO', rotulo: 'Agendados' },
  { valor: 'CONCLUIDO', rotulo: 'Concluídos' },
  { valor: 'CANCELADO', rotulo: 'Cancelados' },
];

export default function AgendaScreen() {
  const theme = useTheme();
  const [data, setData] = useState(hojeISO());
  const [filtro, setFiltro] = useState<Filtro>('TODOS');

  const inicioSemana = inicioDaSemana(data);
  const dias = Array.from({ length: 7 }, (_, i) => somarDias(inicioSemana, i));

  const carregar = useCallback(
    async (db: SQLiteDatabase) => {
      const semana = inicioDaSemana(data);
      const [agendamentos, porDia] = await Promise.all([
        listarAgendamentosPorData(db, data),
        contarAgendamentosPorDia(db, semana, somarDias(semana, 6)),
      ]);
      return { agendamentos, porDia: new Map(porDia.map((d) => [d.data, d.total])) };
    },
    [data],
  );
  const { data: resultado, loading, error } = useFocusQuery(carregar);

  const agendamentos = resultado?.agendamentos ?? [];
  const contagem = (f: Filtro) => (f === 'TODOS' ? agendamentos.length : agendamentos.filter((a) => a.status === f).length);
  const visiveis = filtro === 'TODOS' ? agendamentos : agendamentos.filter((a) => a.status === filtro);
  const hoje = hojeISO();

  return (
    <Screen tab title="Agenda">
      <Button
        title="Novo agendamento"
        icon="mais"
        onPress={() => router.push({ pathname: '/agendamento/novo', params: { data } })}
      />

      <Card>
        <View style={styles.weekHeader}>
          <View style={styles.arrows}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Semana anterior"
              hitSlop={10}
              onPress={() => setData(somarDias(data, -7))}>
              <Icon name="esquerda" size={18} color={theme.textSecondary} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Próxima semana"
              hitSlop={10}
              onPress={() => setData(somarDias(data, 7))}>
              <Icon name="direita" size={18} color={theme.textSecondary} />
            </Pressable>
          </View>
          <View style={styles.weekTitle}>
            <ThemedText type="smallBold" style={styles.dateTitle}>
              {formatarDataComDia(data)}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {agendamentos.length} {agendamentos.length === 1 ? 'atendimento cadastrado' : 'atendimentos cadastrados'}
            </ThemedText>
          </View>
          <Button title="Hoje" variant="secondary" compact onPress={() => setData(hoje)} disabled={data === hoje} />
        </View>

        <View style={styles.days}>
          {dias.map((dia) => {
            const selecionado = dia === data;
            const total = resultado?.porDia.get(dia) ?? 0;
            return (
              <Pressable
                key={dia}
                accessibilityRole="button"
                accessibilityState={{ selected: selecionado }}
                accessibilityLabel={`${formatarDataComDia(dia)}, ${total} atendimentos`}
                onPress={() => setData(dia)}
                style={[styles.day, selecionado && { backgroundColor: theme.primary }]}>
                <ThemedText
                  type="small"
                  style={[styles.dayName, { color: selecionado ? theme.onPrimary : theme.textSecondary }]}>
                  {nomeDiaCurto(diaDaSemana(dia))}
                </ThemedText>
                <ThemedText type="smallBold" style={{ color: selecionado ? theme.onPrimary : theme.text }}>
                  {dia.slice(8, 10)}
                </ThemedText>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: total > 0 ? (selecionado ? theme.onPrimary : theme.info) : 'transparent' },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>

        <DateField label="Ir para a data" value={data} onChange={setData} />
      </Card>

      <View style={styles.filters}>
        {FILTROS.map((f) => (
          <Chip
            key={f.valor}
            label={f.rotulo}
            count={contagem(f.valor)}
            selected={filtro === f.valor}
            onPress={() => setFiltro(f.valor)}
          />
        ))}
      </View>

      {error && <ErrorMessage message={error} />}
      {loading && !resultado ? (
        <Loading />
      ) : visiveis.length === 0 ? (
        <EmptyState
          icon="agenda"
          title={agendamentos.length === 0 ? 'Nenhum atendimento nesta data' : 'Nenhum atendimento com este filtro'}
          message={agendamentos.length === 0 ? 'Toque em "Novo agendamento" para cadastrar.' : undefined}
        />
      ) : (
        visiveis.map((a) => (
          <AgendamentoCard
            key={a.id}
            agendamento={a}
            onPress={() => router.push({ pathname: '/agendamento/[id]', params: { id: String(a.id) } })}
          />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  arrows: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  weekTitle: {
    flex: 1,
    alignItems: 'center',
  },
  dateTitle: {
    fontSize: 17,
  },
  days: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radius.medium,
    gap: 2,
  },
  dayName: {
    fontSize: 12,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
