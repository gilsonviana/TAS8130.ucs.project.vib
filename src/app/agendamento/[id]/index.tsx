import { router, useLocalSearchParams } from 'expo-router';
import { type SQLiteDatabase, useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OptionChips } from '@/components/ui/chip';
import { ErrorMessage, Loading, Notice } from '@/components/ui/feedback';
import { Icon, type NomeIcone } from '@/components/ui/icon';
import { Screen, SectionTitle } from '@/components/ui/screen';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import {
  cancelarAgendamento,
  concluirAgendamento,
  FORMAS_PAGAMENTO,
  obterAgendamento,
} from '@/db/agendamentos';
import { mensagemErro } from '@/db/erros';
import { useFocusQuery } from '@/hooks/use-focus-query';
import { useTheme } from '@/hooks/use-theme';
import {
  campoParaValor,
  formatarDataComDia,
  formatarDataHora,
  formatarDuracao,
  formatarMoeda,
  valorParaCampo,
} from '@/lib/formatos';

type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number];

export default function DetalhesAgendamentoScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const agendamentoId = Number(id);

  const carregar = useCallback((database: SQLiteDatabase) => obterAgendamento(database, agendamentoId), [agendamentoId]);
  const { data: agendamento, loading, error, recarregar } = useFocusQuery(carregar);

  const [concluindo, setConcluindo] = useState(false);
  const [valorTexto, setValorTexto] = useState('');
  const [forma, setForma] = useState<FormaPagamento | null>(null);
  const [processando, setProcessando] = useState(false);

  if (loading && agendamento === undefined) {
    return <Loading />;
  }
  if (error || !agendamento) {
    return (
      <Screen>
        <ErrorMessage message={error ?? 'Agendamento não encontrado.'} />
      </Screen>
    );
  }

  const a = agendamento;
  const ativo = a.status === 'AGENDADO';

  function abrirConclusao() {
    setValorTexto(valorParaCampo(a.valor));
    setForma(null);
    setConcluindo(true);
  }

  async function confirmarConclusao() {
    setProcessando(true);
    try {
      await concluirAgendamento(db, a.id, { valor: campoParaValor(valorTexto), forma_pagamento: forma });
      setConcluindo(false);
      recarregar();
    } catch (erro) {
      Alert.alert('Não foi possível concluir', mensagemErro(erro));
    } finally {
      setProcessando(false);
    }
  }

  function confirmarCancelamento() {
    Alert.alert(
      'Cancelar agendamento?',
      'O agendamento continuará no histórico com a situação "Cancelado" e o horário será liberado.',
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Cancelar agendamento',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelarAgendamento(db, a.id);
              recarregar();
            } catch (erro) {
              Alert.alert('Não foi possível cancelar', mensagemErro(erro));
            }
          },
        },
      ],
    );
  }

  return (
    <Screen
      footer={
        ativo ? (
          <View style={styles.actions}>
            <Button title="Concluir atendimento" icon="concluido" variant="success" onPress={abrirConclusao} />
            <View style={styles.row}>
              <Button
                title="Editar"
                icon="editar"
                variant="secondary"
                style={styles.flex}
                onPress={() => router.push({ pathname: '/agendamento/[id]/editar', params: { id: String(a.id) } })}
              />
              <Button
                title="Cancelar"
                icon="cancelado"
                variant="danger"
                style={styles.flex}
                onPress={confirmarCancelamento}
              />
            </View>
          </View>
        ) : undefined
      }>
      <Card>
        <View style={styles.spaceBetween}>
          <StatusBadge status={a.status} />
          <ThemedText type="small" themeColor="textSecondary">
            Nº {a.id}
          </ThemedText>
        </View>
        <ThemedText style={styles.hora}>
          {a.hora_inicio} – {a.hora_fim}
        </ThemedText>
        <ThemedText themeColor="textSecondary">{formatarDataComDia(a.data)}</ThemedText>
      </Card>

      <Card>
        <Item icone="pet" rotulo="Animal" valor={`${a.animal_nome} (${a.animal_especie}${a.animal_raca ? ` • ${a.animal_raca}` : ''})`} />
        <Item icone="pessoa" rotulo="Tutor" valor={a.cliente_nome} />
        <Item icone="telefone" rotulo="Telefone" valor={a.cliente_telefone} />
      </Card>

      <Card>
        <Item icone="servico" rotulo="Serviço" valor={a.servico_nome} />
        <Item icone="relogio" rotulo="Duração" valor={formatarDuracao(a.duracao_minutos)} />
        <Item icone="dinheiro" rotulo="Valor registrado" valor={formatarMoeda(a.valor)} />
      </Card>

      <SectionTitle>Janela operacional</SectionTitle>
      <Card style={{ backgroundColor: theme.background }}>
        <View style={styles.timeline}>
          <View style={styles.timePoint}>
            <ThemedText type="small" themeColor="textSecondary">
              Início
            </ThemedText>
            <ThemedText type="smallBold" style={styles.timeValue}>
              {a.hora_inicio}
            </ThemedText>
          </View>
          <View style={[styles.timeBar, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="small" themeColor="textSecondary">
              {a.duracao_minutos} min
            </ThemedText>
          </View>
          <View style={styles.timePoint}>
            <ThemedText type="small" themeColor="textSecondary">
              Término previsto
            </ThemedText>
            <ThemedText type="smallBold" style={styles.timeValue}>
              {a.hora_fim}
            </ThemedText>
          </View>
        </View>
      </Card>

      {a.observacoes && (
        <>
          <SectionTitle>Observações</SectionTitle>
          <Card>
            <ThemedText type="small">{a.observacoes}</ThemedText>
          </Card>
        </>
      )}

      {a.status === 'CONCLUIDO' && a.pagamento_id !== null && (
        <>
          <SectionTitle>Registro financeiro</SectionTitle>
          <Card>
            <Item icone="dinheiro" rotulo="Valor recebido" valor={formatarMoeda(a.pagamento_valor ?? 0)} />
            <Item icone="concluido" rotulo="Forma de pagamento" valor={a.pagamento_forma ?? 'Não informada'} />
            {a.pagamento_registrado_em && (
              <Item icone="agenda" rotulo="Registrado em" valor={formatarDataHora(a.pagamento_registrado_em)} />
            )}
          </Card>
        </>
      )}

      {a.status === 'CANCELADO' && (
        <Notice
          tone="info"
          title="Agendamento cancelado"
          message="O registro foi mantido para histórico e o horário está liberado para novos agendamentos."
        />
      )}

      <ThemedText type="small" themeColor="textSecondary">
        Criado em {formatarDataHora(a.criado_em)}
      </ThemedText>

      <Modal visible={concluindo} transparent animationType="fade" onRequestClose={() => setConcluindo(false)}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.backdrop} onPress={() => setConcluindo(false)}>
            <Pressable style={[styles.sheet, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold" style={styles.sheetTitle}>
                Concluir atendimento
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {a.animal_nome} • {a.servico_nome}. Ao confirmar, a situação muda para Concluído e o valor é lançado no
                controle financeiro.
              </ThemedText>
              <TextField
                label="Valor recebido (R$)"
                required
                prefix="R$"
                keyboardType="decimal-pad"
                value={valorTexto}
                onChangeText={setValorTexto}
              />
              <ThemedText type="smallBold">Forma de pagamento</ThemedText>
              <OptionChips options={FORMAS_PAGAMENTO} value={forma} onChange={setForma} allowDeselect />
              <Button
                title="Confirmar conclusão"
                icon="concluido"
                variant="success"
                loading={processando}
                disabled={campoParaValor(valorTexto) === null}
                onPress={confirmarConclusao}
              />
              <Button title="Voltar" variant="ghost" compact onPress={() => setConcluindo(false)} />
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

function Item({ icone, rotulo, valor }: { icone: NomeIcone; rotulo: string; valor: string }) {
  const theme = useTheme();
  return (
    <View style={styles.item}>
      <View style={[styles.itemIcon, { backgroundColor: theme.background }]}>
        <Icon name={icone} size={18} color={theme.textSecondary} />
      </View>
      <View style={styles.flex}>
        <ThemedText type="small" themeColor="textSecondary">
          {rotulo}
        </ThemedText>
        <ThemedText>{valor}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actions: {
    gap: Spacing.two,
  },
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hora: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: 700,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.one,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  timePoint: {
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 18,
  },
  timeBar: {
    flex: 1,
    alignItems: 'center',
    borderRadius: Radius.pill,
    paddingVertical: Spacing.one,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    padding: Spacing.four,
    paddingBottom: Spacing.five,
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
    gap: Spacing.three,
  },
  sheetTitle: {
    fontSize: 18,
  },
});
