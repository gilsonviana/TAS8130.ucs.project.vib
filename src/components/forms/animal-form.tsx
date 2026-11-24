import { router, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import { AgendamentoCard } from '@/components/agendamento-card';
import { type SelectOption, SelectField } from '@/components/select-field';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { OptionChips } from '@/components/ui/chip';
import { ErrorMessage, Loading, Notice } from '@/components/ui/feedback';
import { Screen, SectionTitle } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { listarAgendamentosDoAnimal } from '@/db/agendamentos';
import { atualizarAnimal, criarAnimal, definirAnimalAtivo, ESPECIES, obterAnimal, PORTES } from '@/db/animais';
import { listarClientes, obterCliente } from '@/db/clientes';
import { mensagemErro } from '@/db/erros';
import type { AgendamentoDetalhado, AnimalComTutor } from '@/db/types';

type Especie = (typeof ESPECIES)[number];
type Porte = (typeof PORTES)[number];

function comoEspecie(valor: string): Especie | null {
  return (ESPECIES as readonly string[]).includes(valor) ? (valor as Especie) : null;
}

function comoPorte(valor: string | null): Porte | null {
  return valor && (PORTES as readonly string[]).includes(valor) ? (valor as Porte) : null;
}

export function AnimalForm({ animalId, clienteIdInicial }: { animalId?: number; clienteIdInicial?: number }) {
  const db = useSQLiteContext();
  const editando = animalId !== undefined;

  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [animal, setAnimal] = useState<AnimalComTutor | null>(null);
  const [historico, setHistorico] = useState<AgendamentoDetalhado[]>([]);

  const [opcoesClientes, setOpcoesClientes] = useState<SelectOption[]>([]);
  const [tutor, setTutor] = useState<SelectOption | null>(null);
  const [nome, setNome] = useState('');
  const [especie, setEspecie] = useState<Especie | null>('Cão');
  const [raca, setRaca] = useState('');
  const [porte, setPorte] = useState<Porte | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const clientes = await listarClientes(db);
        if (cancelado) return;
        setOpcoesClientes(clientes.map((c) => ({ id: c.id, title: c.nome, subtitle: c.telefone })));

        if (animalId !== undefined) {
          const [existente, lista] = await Promise.all([
            obterAnimal(db, animalId),
            listarAgendamentosDoAnimal(db, animalId),
          ]);
          if (cancelado) return;
          if (!existente) {
            setErroCarga('Animal não encontrado.');
            return;
          }
          setAnimal(existente);
          setHistorico(lista);
          setTutor({ id: existente.cliente_id, title: existente.cliente_nome });
          setNome(existente.nome);
          setEspecie(comoEspecie(existente.especie) ?? 'Outro');
          setRaca(existente.raca ?? '');
          setPorte(comoPorte(existente.porte));
          setObservacoes(existente.observacoes ?? '');
        } else if (clienteIdInicial !== undefined) {
          const cliente = await obterCliente(db, clienteIdInicial);
          if (!cancelado && cliente) {
            setTutor({ id: cliente.id, title: cliente.nome, subtitle: cliente.telefone });
          }
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
  }, [db, animalId, clienteIdInicial]);

  async function salvar() {
    setSalvando(true);
    try {
      const input = {
        cliente_id: tutor?.id ?? null,
        nome,
        especie: especie ?? '',
        raca,
        porte,
        observacoes,
      };
      if (animalId !== undefined) {
        await atualizarAnimal(db, animalId, input);
      } else {
        await criarAnimal(db, input);
      }
      router.back();
    } catch (erro) {
      Alert.alert('Não foi possível salvar', mensagemErro(erro));
    } finally {
      setSalvando(false);
    }
  }

  function alternarAtivo() {
    if (!animal) return;
    const ativar = !animal.ativo;
    Alert.alert(
      ativar ? 'Reativar animal?' : 'Inativar animal?',
      ativar
        ? 'O animal voltará a aparecer nos novos agendamentos.'
        : 'O animal não aparecerá em novos agendamentos, mas o histórico será mantido.',
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: ativar ? 'Reativar' : 'Inativar',
          style: ativar ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await definirAnimalAtivo(db, animal.id, ativar);
              setAnimal({ ...animal, ativo: ativar ? 1 : 0 });
            } catch (erro) {
              Alert.alert('Erro', mensagemErro(erro));
            }
          },
        },
      ],
    );
  }

  if (carregando) return <Loading />;
  if (erroCarga) {
    return (
      <Screen>
        <ErrorMessage message={erroCarga} />
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <Button
          title={editando ? 'Salvar alterações' : 'Salvar animal'}
          icon="concluido"
          loading={salvando}
          disabled={!tutor || !nome.trim() || !especie}
          onPress={salvar}
        />
      }>
      {animal && <Stack.Screen options={{ title: animal.nome }} />}
      {animal && !animal.ativo && (
        <Notice tone="warning" title="Animal inativo" message="Não aparece em novos agendamentos." />
      )}

      <SelectField
        label="Tutor"
        icon="pessoa"
        placeholder="Selecione o cliente/tutor"
        required
        options={opcoesClientes}
        value={tutor}
        onChange={setTutor}
        emptyMessage="Nenhum cliente ativo. Cadastre o cliente primeiro."
      />
      <TextField label="Nome" required value={nome} onChangeText={setNome} placeholder="Ex.: Luna" />

      <View style={{ gap: Spacing.two }}>
        <ThemedText type="smallBold">Espécie *</ThemedText>
        <OptionChips options={ESPECIES} value={especie} onChange={setEspecie} />
      </View>

      <TextField label="Raça" value={raca} onChangeText={setRaca} placeholder="opcional" />

      <View style={{ gap: Spacing.two }}>
        <ThemedText type="smallBold">Porte</ThemedText>
        <OptionChips options={PORTES} value={porte} onChange={setPorte} allowDeselect />
      </View>

      <TextField
        label="Observações"
        multiline
        value={observacoes}
        onChangeText={setObservacoes}
        placeholder="Alergias, comportamento, cuidados especiais…"
      />

      {animal && (
        <>
          <SectionTitle>Histórico de atendimentos</SectionTitle>
          {historico.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              Nenhum atendimento registrado.
            </ThemedText>
          ) : (
            historico.map((ag) => (
              <AgendamentoCard
                key={ag.id}
                agendamento={ag}
                mostrarData
                onPress={() => router.push({ pathname: '/agendamento/[id]', params: { id: String(ag.id) } })}
              />
            ))
          )}
          <Button
            title={animal.ativo ? 'Inativar animal' : 'Reativar animal'}
            variant={animal.ativo ? 'danger' : 'secondary'}
            onPress={alternarAtivo}
          />
        </>
      )}
    </Screen>
  );
}
