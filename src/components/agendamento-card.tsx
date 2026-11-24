import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { StatusBadge } from '@/components/ui/status-badge';
import { Radius, Spacing } from '@/constants/theme';
import type { AgendamentoDetalhado } from '@/db/types';
import { useTheme } from '@/hooks/use-theme';
import { formatarDataComDia, formatarMoeda } from '@/lib/formatos';

export interface AgendamentoCardProps {
  agendamento: AgendamentoDetalhado;
  onPress: () => void;
  /** Exibe a data no cartão (útil em listas que misturam dias). */
  mostrarData?: boolean;
}

export function AgendamentoCard({ agendamento: a, onPress, mostrarData }: AgendamentoCardProps) {
  const theme = useTheme();
  const cancelado = a.status === 'CANCELADO';
  const riscado = cancelado ? styles.riscado : undefined;

  return (
    <Card onPress={onPress} muted={cancelado} accessibilityLabel={`Atendimento de ${a.animal_nome} às ${a.hora_inicio}`}>
      <View style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: theme.background }]}>
          <Icon name={cancelado ? 'cancelado' : 'relogio'} size={20} color={theme.textSecondary} />
        </View>
        <View style={styles.flex}>
          {mostrarData && (
            <ThemedText type="small" themeColor="textSecondary">
              {formatarDataComDia(a.data)}
            </ThemedText>
          )}
          <ThemedText style={[styles.hora, riscado]}>
            {a.hora_inicio} – {a.hora_fim}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Duração: {a.duracao_minutos} min
          </ThemedText>
        </View>
        <StatusBadge status={a.status} />
      </View>

      <View style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: theme.background }]}>
          <Icon name="pet" size={20} color={theme.textSecondary} />
        </View>
        <View style={styles.flex}>
          <ThemedText type="smallBold" style={[styles.animal, riscado]}>
            {a.animal_nome} ({a.animal_especie})
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {a.cliente_nome}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.footer, { borderColor: theme.border }]}>
        <Icon name="servico" size={16} color={theme.textSecondary} />
        <ThemedText type="small" style={[styles.flex, riscado]} numberOfLines={1}>
          {a.servico_nome}
          <ThemedText type="small" themeColor="textSecondary">
            {'  •  '}
            {formatarMoeda(a.pagamento_valor ?? a.valor)}
          </ThemedText>
        </ThemedText>
        {cancelado ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.italic}>
            Horário liberado
          </ThemedText>
        ) : (
          <ThemedText type="smallBold">Ver detalhes →</ThemedText>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  flex: {
    flex: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hora: {
    fontSize: 20,
    fontWeight: 700,
  },
  animal: {
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderTopWidth: 1,
    paddingTop: Spacing.three,
    marginTop: Spacing.one,
  },
  riscado: {
    textDecorationLine: 'line-through',
  },
  italic: {
    fontStyle: 'italic',
  },
});
