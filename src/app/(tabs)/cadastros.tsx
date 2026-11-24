import { router } from 'expo-router';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { StyleSheet, Switch, TextInput, View } from 'react-native';

import { ListRow } from '@/components/list-row';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { OptionChips } from '@/components/ui/chip';
import { EmptyState, ErrorMessage, Loading } from '@/components/ui/feedback';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { listarAnimais } from '@/db/animais';
import { listarClientes } from '@/db/clientes';
import { listarServicos } from '@/db/servicos';
import { useFocusQuery } from '@/hooks/use-focus-query';
import { useTheme } from '@/hooks/use-theme';
import { formatarDuracao, formatarMoeda } from '@/lib/formatos';

const ABAS = ['Clientes', 'Animais', 'Serviços'] as const;
type Aba = (typeof ABAS)[number];

const BOTAO_NOVO: Record<Aba, string> = {
  Clientes: 'Novo cliente',
  Animais: 'Novo animal',
  Serviços: 'Novo serviço',
};

export default function CadastrosScreen() {
  const theme = useTheme();
  const [aba, setAba] = useState<Aba>('Clientes');
  const [busca, setBusca] = useState('');
  const [incluirInativos, setIncluirInativos] = useState(false);

  const carregar = useCallback(
    async (db: SQLiteDatabase) => {
      const filtro = { busca, incluirInativos };
      if (aba === 'Clientes') return { aba, clientes: await listarClientes(db, filtro) } as const;
      if (aba === 'Animais') return { aba, animais: await listarAnimais(db, filtro) } as const;
      return { aba, servicos: await listarServicos(db, filtro) } as const;
    },
    [aba, busca, incluirInativos],
  );
  const { data, loading, error } = useFocusQuery(carregar);

  function novo() {
    if (aba === 'Clientes') router.push('/cliente/novo');
    else if (aba === 'Animais') router.push('/animal/novo');
    else router.push('/servico/novo');
  }

  function renderLista() {
    if (!data || data.aba !== aba) {
      return <Loading />;
    }
    if (data.aba === 'Clientes') {
      if (data.clientes.length === 0) {
        return <EmptyState icon="pessoa" title="Nenhum cliente encontrado" />;
      }
      return data.clientes.map((c) => (
        <ListRow
          key={c.id}
          icon="pessoa"
          title={c.nome}
          subtitle={c.telefone}
          detail={c.total_animais === 1 ? '1 animal' : `${c.total_animais} animais`}
          inativo={!c.ativo}
          onPress={() => router.push({ pathname: '/cliente/[id]', params: { id: String(c.id) } })}
        />
      ));
    }
    if (data.aba === 'Animais') {
      if (data.animais.length === 0) {
        return <EmptyState icon="pet" title="Nenhum animal encontrado" />;
      }
      return data.animais.map((a) => (
        <ListRow
          key={a.id}
          icon="pet"
          title={a.nome}
          subtitle={[a.especie, a.raca, a.porte].filter(Boolean).join(' • ')}
          detail={`Tutor: ${a.cliente_nome}`}
          inativo={!a.ativo}
          onPress={() => router.push({ pathname: '/animal/[id]', params: { id: String(a.id) } })}
        />
      ));
    }
    if (data.servicos.length === 0) {
      return <EmptyState icon="servico" title="Nenhum serviço encontrado" />;
    }
    return data.servicos.map((s) => (
      <ListRow
        key={s.id}
        icon="servico"
        title={s.nome}
        subtitle={`${formatarDuracao(s.duracao_minutos)} • ${formatarMoeda(s.preco_referencia)}`}
        detail={s.descricao ?? undefined}
        inativo={!s.ativo}
        onPress={() => router.push({ pathname: '/servico/[id]', params: { id: String(s.id) } })}
      />
    ));
  }

  return (
    <Screen tab title="Cadastros">
      <OptionChips
        options={ABAS}
        value={aba}
        onChange={(valor) => {
          if (valor) {
            setAba(valor);
            setBusca('');
          }
        }}
      />

      <View style={[styles.search, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Icon name="busca" size={18} color={theme.textSecondary} />
        <TextInput
          value={busca}
          onChangeText={setBusca}
          placeholder={`Pesquisar ${aba.toLowerCase()}`}
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.text }]}
          autoCorrect={false}
        />
      </View>

      <View style={styles.toggle}>
        <ThemedText type="small" themeColor="textSecondary">
          Mostrar inativos
        </ThemedText>
        <Switch value={incluirInativos} onValueChange={setIncluirInativos} />
      </View>

      <Button title={BOTAO_NOVO[aba]} icon="mais" onPress={novo} />

      {error && <ErrorMessage message={error} />}
      {loading && !data ? <Loading /> : renderLista()}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
