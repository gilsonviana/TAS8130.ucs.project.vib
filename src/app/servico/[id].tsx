import { useLocalSearchParams } from 'expo-router';

import { ServicoForm } from '@/components/forms/servico-form';

export default function ServicoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ServicoForm key={id} servicoId={Number(id)} />;
}
