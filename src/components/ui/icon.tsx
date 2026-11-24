import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { StyleProp, ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/** Ícones usados no app: SF Symbols no iOS e Material Symbols no Android. */
export const ICONES = {
  agenda: { ios: 'calendar', android: 'calendar_month' },
  relogio: { ios: 'clock', android: 'schedule' },
  pet: { ios: 'pawprint.fill', android: 'pets' },
  pessoa: { ios: 'person', android: 'person' },
  servico: { ios: 'scissors', android: 'content_cut' },
  mais: { ios: 'plus', android: 'add' },
  direita: { ios: 'chevron.right', android: 'chevron_right' },
  esquerda: { ios: 'chevron.left', android: 'chevron_left' },
  concluido: { ios: 'checkmark.circle.fill', android: 'check_circle' },
  cancelado: { ios: 'xmark.circle', android: 'cancel' },
  alerta: { ios: 'exclamationmark.triangle.fill', android: 'warning' },
  busca: { ios: 'magnifyingglass', android: 'search' },
  editar: { ios: 'pencil', android: 'edit' },
  dinheiro: { ios: 'dollarsign.circle', android: 'payments' },
  inicio: { ios: 'house', android: 'home' },
  pasta: { ios: 'folder', android: 'folder' },
  info: { ios: 'info.circle', android: 'info' },
  grafico: { ios: 'chart.bar', android: 'bar_chart' },
  banco: { ios: 'externaldrive', android: 'database' },
  telefone: { ios: 'phone', android: 'call' },
  fechar: { ios: 'xmark', android: 'close' },
  calculado: { ios: 'sparkles', android: 'auto_awesome' },
  disponivel: { ios: 'checkmark.seal', android: 'verified' },
} as const satisfies Record<string, SymbolViewProps['name']>;

export type NomeIcone = keyof typeof ICONES;

export function Icon({
  name,
  size = 20,
  color,
  style,
}: {
  name: NomeIcone;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  return <SymbolView name={ICONES[name]} size={size} tintColor={color ?? theme.text} style={style} />;
}
