import { useLocalSearchParams } from 'expo-router';

import { AnimalForm } from '@/components/forms/animal-form';

export default function NovoAnimalScreen() {
  const { clienteId } = useLocalSearchParams<{ clienteId?: string }>();
  return <AnimalForm clienteIdInicial={clienteId ? Number(clienteId) : undefined} />;
}
