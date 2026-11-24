import { useLocalSearchParams } from 'expo-router';

import { AgendamentoForm } from '@/components/agendamento-form';
import { ErrorMessage } from '@/components/ui/feedback';
import { Screen } from '@/components/ui/screen';

export default function EditarAgendamentoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const agendamentoId = Number(id);

  if (!Number.isInteger(agendamentoId)) {
    return (
      <Screen>
        <ErrorMessage message="Agendamento inválido." />
      </Screen>
    );
  }
  return <AgendamentoForm agendamentoId={agendamentoId} />;
}
