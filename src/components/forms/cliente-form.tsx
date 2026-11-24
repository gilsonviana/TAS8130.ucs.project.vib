import { router, Stack, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { AgendamentoCard } from '@/components/agendamento-card';
import { ListRow } from '@/components/list-row';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { ErrorMessage, Loading, Notice } from '@/components/ui/feedback';
import { Screen, SectionTitle } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { listarAgendamentosDoCliente } from '@/db/agendamentos';
import { listarAnimais } from '@/db/animais';
import { atualizarCliente, criarCliente, definirClienteAtivo, obterCliente } from '@/db/clientes';
import { mensagemErro } from '@/db/erros';
import type { AgendamentoDetalhado, AnimalComTutor, Cliente } from '@/db/types';

export function ClienteForm({ clienteId }: { clienteId?: number }) {
  const db = useSQLiteContext();
  const editando = clienteId !== undefined;

  const [carregando, setCarregando] = useState(editando);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [salvando, setSalvando] = useState(false);

  const [animais, setAnimais] = useState<AnimalComTutor[]>([]);
  const [historico, setHistorico] = useState<AgendamentoDetalhado[]>([]);

  useEffect(() => {
    if (clienteId === undefined) return;
    let cancelado = false;
    obterCliente(db, clienteId)
      .then((c) => {
        if (cancelado) return;
        if (!c) {
          setErroCarga('Cliente não encontrado.');
          return;
        }
        setCliente(c);
        setNome(c.nome);
        setTelefone(c.telefone);
        setEmail(c.email ?? '');
        setEndereco(c.endereco ?? '');
      })
      .catch((erro) => !cancelado && setErroCarga(mensagemErro(erro)))
      .finally(() => !cancelado && setCarregando(false));
    return () => {
      cancelado = true;
    };
  }, [db, clienteId]);

  // Animais e histórico são recarregados ao voltar para a tela (ex.: depois de cadastrar um animal).
  useFocusEffect(
    useCallback(() => {
      if (clienteId === undefined) return;
      let cancelado = false;
      Promise.all([
        listarAnimais(db, { clienteId, incluirInativos: true }),
        listarAgendamentosDoCliente(db, clienteId, 5),
      ])
        .then(([listaAnimais, listaHistorico]) => {
          if (!cancelado) {
            setAnimais(listaAnimais);
            setHistorico(listaHistorico);
          }
        })
        .catch(() => undefined);
      return () => {
        cancelado = true;
      };
    }, [db, clienteId]),
  );

  async function salvar() {
    setSalvando(true);
    try {
      const input = { nome, telefone, email, endereco };
      if (clienteId !== undefined) {
        await atualizarCliente(db, clienteId, input);
        router.back();
      } else {
        const id = await criarCliente(db, input);
        router.replace({ pathname: '/cliente/[id]', params: { id: String(id) } });
      }
    } catch (erro) {
      Alert.alert('Não foi possível salvar', mensagemErro(erro));
    } finally {
      setSalvando(false);
    }
  }

  function alternarAtivo() {
    if (!cliente) return;
    const ativar = !cliente.ativo;
    Alert.alert(
      ativar ? 'Reativar cliente?' : 'Inativar cliente?',
      ativar
        ? 'O cliente voltará a aparecer nos novos agendamentos.'
        : 'O cliente não aparecerá em novos agendamentos, mas o histórico será mantido.',
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: ativar ? 'Reativar' : 'Inativar',
          style: ativar ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await definirClienteAtivo(db, cliente.id, ativar);
              setCliente({ ...cliente, ativo: ativar ? 1 : 0 });
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
          title={editando ? 'Salvar alterações' : 'Salvar cliente'}
          icon="concluido"
          loading={salvando}
          disabled={!nome.trim() || !telefone.trim()}
          onPress={salvar}
        />
      }>
      {cliente && <Stack.Screen options={{ title: cliente.nome }} />}
      {cliente && !cliente.ativo && (
        <Notice tone="warning" title="Cliente inativo" message="Não aparece em novos agendamentos." />
      )}

      <TextField label="Nome" required value={nome} onChangeText={setNome} placeholder="Nome completo" />
      <TextField
        label="Telefone"
        required
        value={telefone}
        onChangeText={setTelefone}
        keyboardType="phone-pad"
        placeholder="(54) 99999-0000"
      />
      <TextField
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="opcional"
      />
      <TextField label="Endereço" value={endereco} onChangeText={setEndereco} placeholder="opcional" />

      {cliente && (
        <>
          <SectionTitle>Animais</SectionTitle>
          {animais.length === 0 && (
            <ThemedText type="small" themeColor="textSecondary">
              Nenhum animal cadastrado para este cliente.
            </ThemedText>
          )}
          {animais.map((a) => (
            <ListRow
              key={a.id}
              icon="pet"
              title={a.nome}
              subtitle={[a.especie, a.raca, a.porte].filter(Boolean).join(' • ')}
              inativo={!a.ativo}
              onPress={() => router.push({ pathname: '/animal/[id]', params: { id: String(a.id) } })}
            />
          ))}
          {cliente.ativo === 1 && (
            <Button
              title="Adicionar animal"
              icon="mais"
              variant="secondary"
              onPress={() =>
                router.push({ pathname: '/animal/novo', params: { clienteId: String(cliente.id) } })
              }
            />
          )}

          <SectionTitle>Últimos atendimentos</SectionTitle>
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
            title={cliente.ativo ? 'Inativar cliente' : 'Reativar cliente'}
            variant={cliente.ativo ? 'danger' : 'secondary'}
            onPress={alternarAtivo}
          />
        </>
      )}
    </Screen>
  );
}
