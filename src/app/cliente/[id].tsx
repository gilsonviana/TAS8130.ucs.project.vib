import { useLocalSearchParams } from 'expo-router';

import { ClienteForm } from '@/components/forms/cliente-form';

export default function ClienteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ClienteForm key={id} clienteId={Number(id)} />;
}
