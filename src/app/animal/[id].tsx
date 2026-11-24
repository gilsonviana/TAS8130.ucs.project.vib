import { useLocalSearchParams } from 'expo-router';

import { AnimalForm } from '@/components/forms/animal-form';

export default function AnimalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AnimalForm key={id} animalId={Number(id)} />;
}
