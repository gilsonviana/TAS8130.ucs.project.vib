import { router, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { Button } from '@/components/ui/button';
import { ErrorMessage, Loading, Notice } from '@/components/ui/feedback';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { mensagemErro } from '@/db/erros';
import { atualizarServico, criarServico, definirServicoAtivo, obterServico } from '@/db/servicos';
import type { Servico } from '@/db/types';
import { campoParaValor, valorParaCampo } from '@/lib/formatos';

export function ServicoForm({ servicoId }: { servicoId?: number }) {
  const db = useSQLiteContext();
  const editando = servicoId !== undefined;

  const [carregando, setCarregando] = useState(editando);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [servico, setServico] = useState<Servico | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [duracaoTexto, setDuracaoTexto] = useState('60');
  const [precoTexto, setPrecoTexto] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (servicoId === undefined) return;
    let cancelado = false;
    obterServico(db, servicoId)
      .then((s) => {
        if (cancelado) return;
        if (!s) {
          setErroCarga('Serviço não encontrado.');
          return;
        }
        setServico(s);
        setNome(s.nome);
        setDescricao(s.descricao ?? '');
        setDuracaoTexto(String(s.duracao_minutos));
        setPrecoTexto(valorParaCampo(s.preco_referencia));
      })
      .catch((erro) => !cancelado && setErroCarga(mensagemErro(erro)))
      .finally(() => !cancelado && setCarregando(false));
    return () => {
      cancelado = true;
    };
  }, [db, servicoId]);

  async function salvar() {
    setSalvando(true);
    try {
      const input = {
        nome,
        descricao,
        duracao_minutos: /^\d+$/.test(duracaoTexto) ? Number(duracaoTexto) : null,
        preco_referencia: campoParaValor(precoTexto),
      };
      if (servicoId !== undefined) {
        await atualizarServico(db, servicoId, input);
      } else {
        await criarServico(db, input);
      }
      router.back();
    } catch (erro) {
      Alert.alert('Não foi possível salvar', mensagemErro(erro));
    } finally {
      setSalvando(false);
    }
  }

  function alternarAtivo() {
    if (!servico) return;
    const ativar = !servico.ativo;
    Alert.alert(
      ativar ? 'Reativar serviço?' : 'Inativar serviço?',
      ativar
        ? 'O serviço voltará a aparecer nos novos agendamentos.'
        : 'O serviço não aparecerá em novos agendamentos, mas o histórico será mantido.',
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: ativar ? 'Reativar' : 'Inativar',
          style: ativar ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await definirServicoAtivo(db, servico.id, ativar);
              setServico({ ...servico, ativo: ativar ? 1 : 0 });
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
          title={editando ? 'Salvar alterações' : 'Salvar serviço'}
          icon="concluido"
          loading={salvando}
          disabled={!nome.trim() || !duracaoTexto || !precoTexto}
          onPress={salvar}
        />
      }>
      {servico && <Stack.Screen options={{ title: servico.nome }} />}
      {servico && !servico.ativo && (
        <Notice tone="warning" title="Serviço inativo" message="Não aparece em novos agendamentos." />
      )}

      <TextField label="Nome" required value={nome} onChangeText={setNome} placeholder="Ex.: Banho" />
      <TextField
        label="Descrição"
        multiline
        value={descricao}
        onChangeText={setDescricao}
        placeholder="opcional"
      />
      <TextField
        label="Duração padrão (minutos)"
        required
        keyboardType="number-pad"
        value={duracaoTexto}
        onChangeText={(t) => setDuracaoTexto(t.replace(/\D/g, ''))}
      />
      <TextField
        label="Preço de referência (R$)"
        required
        prefix="R$"
        keyboardType="decimal-pad"
        value={precoTexto}
        onChangeText={setPrecoTexto}
        placeholder="0,00"
      />

      {editando && (
        <Notice
          tone="info"
          title="Agendamentos existentes não mudam"
          message="Alterar duração ou preço vale apenas para novos agendamentos. Os já registrados mantêm os valores originais."
        />
      )}

      {servico && (
        <Button
          title={servico.ativo ? 'Inativar serviço' : 'Reativar serviço'}
          variant={servico.ativo ? 'danger' : 'secondary'}
          onPress={alternarAtivo}
        />
      )}
    </Screen>
  );
}
