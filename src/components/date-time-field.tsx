import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Icon, type NomeIcone } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dataParaISO, dateComHora, formatarData, horaDeDate, isoParaData } from '@/lib/formatos';

type Modo = 'date' | 'time';

interface PickerProps {
  label: string;
  required?: boolean;
  mode: Modo;
  /** `YYYY-MM-DD` para data, `HH:MM` para hora. */
  value: string;
  onChange: (value: string) => void;
}

function paraDate(mode: Modo, value: string): Date {
  return mode === 'date' ? isoParaData(value) : dateComHora(value);
}

function deDate(mode: Modo, date: Date): string {
  return mode === 'date' ? dataParaISO(date) : horaDeDate(date);
}

/**
 * Campo que abre o seletor nativo de data/hora.
 * Android: diálogo nativo. iOS: seletor exibido em uma folha inferior com botão "Confirmar".
 */
function PickerField({ label, required, mode, value, onChange }: PickerProps) {
  const theme = useTheme();
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState<Date>(() => paraDate(mode, value));
  const icone: NomeIcone = mode === 'date' ? 'agenda' : 'relogio';

  function abrir() {
    setRascunho(paraDate(mode, value));
    setAberto(true);
  }

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold">
        {label}
        {required && <ThemedText style={{ color: theme.danger }}> *</ThemedText>}
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${mode === 'date' ? formatarData(value) : value}`}
        onPress={abrir}
        style={({ pressed }) => [
          styles.field,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          pressed && styles.pressed,
        ]}>
        <ThemedText>{mode === 'date' ? formatarData(value) : value}</ThemedText>
        <Icon name={icone} size={20} color={theme.textSecondary} />
      </Pressable>

      {aberto && Platform.OS === 'android' && (
        <DateTimePicker
          value={paraDate(mode, value)}
          mode={mode}
          is24Hour
          presentation="dialog"
          onValueChange={(_, data) => {
            setAberto(false);
            onChange(deDate(mode, data));
          }}
          onDismiss={() => setAberto(false)}
        />
      )}

      {Platform.OS !== 'android' && (
        <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
          <Pressable style={styles.backdrop} onPress={() => setAberto(false)}>
            <Pressable style={[styles.sheet, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold">{label}</ThemedText>
              <DateTimePicker
                value={rascunho}
                mode={mode}
                display={mode === 'date' ? 'inline' : 'spinner'}
                locale="pt_BR"
                onValueChange={(_, data) => setRascunho(data)}
              />
              <Button
                title="Confirmar"
                onPress={() => {
                  setAberto(false);
                  onChange(deDate(mode, rascunho));
                }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

export function DateField(props: Omit<PickerProps, 'mode'>) {
  return <PickerField {...props} mode="date" />;
}

export function TimeField(props: Omit<PickerProps, 'mode'>) {
  return <PickerField {...props} mode="time" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.two,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    minHeight: 52,
  },
  pressed: {
    opacity: 0.8,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    padding: Spacing.four,
    paddingBottom: Spacing.five,
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
    gap: Spacing.three,
  },
});
