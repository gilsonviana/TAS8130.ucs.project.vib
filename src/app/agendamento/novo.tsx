import { useLocalSearchParams } from 'expo-router';

import { AgendamentoForm } from '@/components/agendamento-form';
import { dataValida } from '@/lib/formatos';

export default function NovoAgendamentoScreen() {
  const { data } = useLocalSearchParams<{ data?: string }>();
  return <AgendamentoForm dataInicial={data && dataValida(data) ? data : undefined} />;
}
