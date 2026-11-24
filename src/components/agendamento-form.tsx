import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { DateField, TimeField } from '@/components/date-time-field';
import { type SelectOption, SelectField } from '@/components/select-field';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorMessage, Loading, Notice } from '@/components/ui/feedback';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import {
  atualizarAgendamento,
  buscarConflitos,
  criarAgendamento,
  obterAgendamento,
} from '@/db/agendamentos';
import { listarAnimais } from '@/db/animais';
import { listarClientes } from '@/db/clientes';
import { mensagemErro } from '@/db/erros';
import { listarServicos } from '@/db/servicos';
import type { AgendamentoDetalhado, AnimalComTutor, Servico } from '@/db/types';
import { useTheme } from '@/hooks/use-theme';
import {
  calcularHoraFim,
  campoParaValor,
  formatarDuracao,
  formatarMoeda,
  hojeISO,
  valorParaCampo,
} from '@/lib/formatos';

export interface AgendamentoFormProps {
  /** Quando informado, o formulário edita o agendamento existente. */
  agendamentoId?: number;
  /** Data pré-selecionada para um novo agendamento (YYYY-MM-DD). */
  dataInicial?: string;
}

function opcaoAnimal(animal: Pick<AnimalComTutor, 'id' | 'nome' | 'especie' | 'raca'>): SelectOption {
  return { id: animal.id, title: animal.nome, subtitle: [animal.especie, animal.raca].filter(Boolean).join(' • ') };
}

function opcaoServico(servico: Servico): SelectOption {
  return {
    id: servico.id,
    title: servico.nome,
    subtitle: `${servico.duracao_minutos} min • ${formatarMoeda(servico.preco_referencia)} padrão`,
  };
}

export function AgendamentoForm({ agendamentoId, dataInicial }: AgendamentoFormProps) {
  const db = useSQLiteContext();
  const theme = useTheme();
  const editando = agendamentoId !== undefined;

  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [original, setOriginal] = useState<AgendamentoDetalhado | null>(null);

  const [opcoesClientes, setOpcoesClientes] = useState<SelectOption[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [animaisDoCliente, setAnimaisDoCliente] = useState<{ clienteId: number; opcoes: SelectOption[] } | null>(null);

  const [cliente, setCliente] = useState<SelectOption | null>(null);
  const [animal, setAnimal] = useState<SelectOption | null>(null);
  const [servico, setServico] = useState<SelectOption | null>(null);
  const [data, setData] = useState(dataInicial ?? hojeISO());
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [duracaoTexto, setDuracaoTexto] = useState('');
  const [valorTexto, setValorTexto] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const [verificacao, setVerificacao] = useState<{ chave: string; conflitos: AgendamentoDetalhado[] } | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Carga inicial: cadastros ativos e, na edição, o agendamento atual.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const [clientes, listaServicos, existente] = await Promise.all([
          listarClientes(db),
          listarServicos(db),
          agendamentoId !== undefined ? obterAgendamento(db, agendamentoId) : Promise.resolve(null),
        ]);
        if (cancelado) return;

        setOpcoesClientes(clientes.map((c) => ({ id: c.id, title: c.nome, subtitle: c.telefone })));
        setServicos(listaServicos);

        if (agendamentoId !== undefined) {
          if (!existente) {
            setErroCarga('Agendamento não encontrado.');
            return;
          }
          setOriginal(existente);
          setCliente({ id: existente.cliente_id, title: existente.cliente_nome, subtitle: existente.cliente_telefone });
          setAnimal(
            opcaoAnimal({
              id: existente.animal_id,
              nome: existente.animal_nome,
              especie: existente.animal_especie,
              raca: existente.animal_raca,
            }),
          );
          setServico({
            id: existente.servico_id,
            title: existente.servico_nome,
            subtitle: `${existente.duracao_minutos} min`,
          });
          setData(existente.data);
          setHoraInicio(existente.hora_inicio);
          setDuracaoTexto(String(existente.duracao_minutos));
          setValorTexto(valorParaCampo(existente.valor));
          setObservacoes(existente.observacoes ?? '');
        }
      } catch (erro) {
        if (!cancelado) setErroCarga(mensagemErro(erro));
      } finally {
        if (!cancelado) setCarregando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [db, agendamentoId]);

  // Animais ativos do cliente selecionado.
  const clienteId = cliente?.id ?? null;
  useEffect(() => {
    if (clienteId === null) return;
    let cancelado = false;
    listarAnimais(db, { clienteId })
      .then((animais) => {
        if (!cancelado) setAnimaisDoCliente({ clienteId, opcoes: animais.map(opcaoAnimal) });
      })
      .catch((erro) => {
        if (!cancelado) Alert.alert('Erro', mensagemErro(erro));
      });
    return () => {
      cancelado = true;
    };
  }, [db, clienteId]);
  const opcoesAnimais = animaisDoCliente && animaisDoCliente.clienteId === clienteId ? animaisDoCliente.opcoes : [];

  const duracao = /^\d+$/.test(duracaoTexto) ? Number(duracaoTexto) : null;
  const valor = campoParaValor(valorTexto);
  const horaFim = duracao ? calcularHoraFim(horaInicio, duracao) : null;

  // RN05: verificação de disponibilidade em tempo real.
  const chaveVerificacao = horaFim ? `${data}|${horaInicio}|${horaFim}` : null;
  useEffect(() => {
    if (!horaFim || !chaveVerificacao) return;
    let cancelado = false;
    buscarConflitos(db, { data, hora_inicio: horaInicio, hora_fim: horaFim, ignorarId: agendamentoId })
      .then((lista) => {
        if (!cancelado) setVerificacao({ chave: chaveVerificacao, conflitos: lista });
      })
      .catch(() => {
        if (!cancelado) setVerificacao({ chave: chaveVerificacao, conflitos: [] });
      });
    return () => {
      cancelado = true;
    };
  }, [db, data, horaInicio, horaFim, chaveVerificacao, agendamentoId]);
  // Só considera o resultado se ele corresponder aos valores atuais do formulário.
  const verificacaoAtual = verificacao && verificacao.chave === chaveVerificacao ? verificacao : null;
  const conflitos = verificacaoAtual?.conflitos ?? [];

  function selecionarCliente(opcao: SelectOption) {
    if (opcao.id !== cliente?.id) {
      setAnimal(null);
      // Se o cliente tiver apenas um animal ativo, já seleciona.
      listarAnimais(db, { clienteId: opcao.id })
        .then((animais) => {
          if (animais.length === 1) setAnimal(opcaoAnimal(animais[0]));
        })
        .catch(() => undefined);
    }
    setCliente(opcao);
  }

  function selecionarServico(opcao: SelectOption) {
    const escolhido = servicos.find((s) => s.id === opcao.id);
    setServico(opcao);
    // RN03 e RN04: duração e valor sugeridos a partir do serviço (podem ser ajustados).
    if (escolhido && opcao.id !== servico?.id) {
      setDuracaoTexto(String(escolhido.duracao_minutos));
      setValorTexto(valorParaCampo(escolhido.preco_referencia));
    }
  }

  async function salvar() {
    setSalvando(true);
    try {
      const input = {
        cliente_id: cliente?.id ?? null,
        animal_id: animal?.id ?? null,
        servico_id: servico?.id ?? null,
        data,
        hora_inicio: horaInicio,
        duracao_minutos: duracao,
        valor,
        observacoes,
      };
      if (agendamentoId !== undefined) {
        await atualizarAgendamento(db, agendamentoId, input);
        router.back();
      } else {
        const id = await criarAgendamento(db, input);
        router.replace({ pathname: '/agendamento/[id]', params: { id: String(id) } });
      }
    } catch (erro) {
      Alert.alert('Não foi possível salvar', mensagemErro(erro));
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <Loading />;
  }
  if (erroCarga) {
    return (
      <Screen>
        <ErrorMessage message={erroCarga} />
      </Screen>
    );
  }
  if (original && original.status !== 'AGENDADO') {
    return (
      <Screen>
        <Notice
          tone="warning"
          title="Edição indisponível"
          message="Somente agendamentos com situação Agendado podem ser editados."
        />
      </Screen>
    );
  }

  const camposObrigatoriosOk =
    cliente !== null && animal !== null && servico !== null && duracao !== null && duracao > 0 && valor !== null;
  const temConflito = conflitos.length > 0;
  const passaDoDia = duracao !== null && duracao > 0 && horaFim === null;

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Button
            title={editando ? 'Salvar alterações' : 'Salvar agendamento'}
            icon="concluido"
            onPress={salvar}
            loading={salvando}
            disabled={!camposObrigatoriosOk || temConflito || passaDoDia || !verificacaoAtual}
          />
          <Button title="Cancelar / Descartar" variant="ghost" compact onPress={() => router.back()} />
        </View>
      }>
      <SelectField
        label="Cliente"
        icon="pessoa"
        placeholder="Selecione o cliente"
        required
        hint={editando ? undefined : 'Etapa 1/3'}
        options={opcoesClientes}
        value={cliente}
        onChange={selecionarCliente}
        emptyMessage="Nenhum cliente ativo. Cadastre um cliente na aba Cadastros."
      />
      <SelectField
        label="Animal"
        icon="pet"
        placeholder="Selecione o animal"
        required
        hint={editando ? undefined : 'Etapa 2/3'}
        disabled={!cliente}
        disabledHint="Selecione o cliente primeiro"
        options={opcoesAnimais}
        value={animal}
        onChange={setAnimal}
        emptyMessage="Este cliente não possui animais ativos. Cadastre o animal pela tela do cliente."
      />
      <SelectField
        label="Serviço"
        icon="servico"
        placeholder="Selecione o serviço"
        required
        hint={editando ? undefined : 'Etapa 3/3'}
        options={servicos.map(opcaoServico)}
        value={servico}
        onChange={selecionarServico}
      />

      <View style={styles.row}>
        <DateField label="Data" required value={data} onChange={setData} />
        <TimeField label="Horário de início" required value={horaInicio} onChange={setHoraInicio} />
      </View>

      <TextField
        label="Duração (minutos)"
        required
        hint="Sugerida pelo serviço"
        keyboardType="number-pad"
        value={duracaoTexto}
        onChangeText={(t) => setDuracaoTexto(t.replace(/\D/g, ''))}
        placeholder="Ex.: 60"
      />

      <Card style={{ backgroundColor: theme.background }}>
        <View style={styles.spaceBetween}>
          <View style={styles.inline}>
            <Icon name="relogio" size={18} color={theme.textSecondary} />
            <ThemedText type="small">
              Duração: <ThemedText type="smallBold">{duracao ? formatarDuracao(duracao) : '—'}</ThemedText>
            </ThemedText>
          </View>
          <ThemedText type="small">
            Término previsto: <ThemedText type="smallBold">{horaFim ?? '—'}</ThemedText>
          </ThemedText>
        </View>
        <View style={styles.inline}>
          <Icon name="calculado" size={14} color={theme.textSecondary} />
          <ThemedText type="small" themeColor="textSecondary">
            Calculado automaticamente a partir do horário e da duração
          </ThemedText>
        </View>
      </Card>

      <TextField
        label="Valor do atendimento (R$)"
        required
        hint="Editável"
        prefix="R$"
        keyboardType="decimal-pad"
        value={valorTexto}
        onChangeText={setValorTexto}
        placeholder="0,00"
      />

      <TextField
        label="Observações"
        multiline
        value={observacoes}
        onChangeText={setObservacoes}
        placeholder="Ex.: animal sensível a secador"
      />

      <Card>
        <View style={styles.spaceBetween}>
          <View>
            <ThemedText type="small" themeColor="textSecondary">
              {editando ? 'Situação atual' : 'Situação inicial'}
            </ThemedText>
            <ThemedText type="smallBold">Registro no sistema</ThemedText>
          </View>
          <StatusBadge status="AGENDADO" />
        </View>
      </Card>

      {passaDoDia ? (
        <Notice
          tone="warning"
          title="Horário inválido"
          message="O atendimento deve terminar no mesmo dia (até 23:59)."
        />
      ) : temConflito ? (
        <Notice
          tone="danger"
          title="Conflito de horário"
          message={conflitos
            .map((c) => `${c.hora_inicio}–${c.hora_fim}: ${c.animal_nome} (${c.servico_nome})`)
            .join('\n')}
        />
      ) : horaFim && verificacaoAtual ? (
        <Notice
          tone="success"
          title="Disponibilidade confirmada"
          message="Sem conflito de horário com outros atendimentos."
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  footer: {
    gap: Spacing.one,
  },
});
