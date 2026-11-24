import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/feedback';
import { Icon, type NomeIcone } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface SelectOption {
  id: number;
  title: string;
  subtitle?: string;
}

export interface SelectFieldProps {
  label: string;
  icon: NomeIcone;
  placeholder: string;
  options: SelectOption[];
  value: SelectOption | null;
  onChange: (option: SelectOption) => void;
  required?: boolean;
  disabled?: boolean;
  /** Texto exibido quando o campo está desabilitado (ex.: "Selecione o cliente primeiro"). */
  disabledHint?: string;
  emptyMessage?: string;
  hint?: string;
}

/** Campo em formato de cartão que abre uma lista pesquisável para seleção. */
export function SelectField({
  label,
  icon,
  placeholder,
  options,
  value,
  onChange,
  required,
  disabled,
  disabledHint,
  emptyMessage = 'Nenhum registro ativo encontrado.',
  hint,
}: SelectFieldProps) {
  const theme = useTheme();
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');

  const termo = busca.trim().toLowerCase();
  const filtradas = termo
    ? options.filter(
        (o) => o.title.toLowerCase().includes(termo) || (o.subtitle ?? '').toLowerCase().includes(termo),
      )
    : options;

  function fechar() {
    setAberto(false);
    setBusca('');
  }

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <ThemedText type="smallBold">
          {label}
          {required && <ThemedText style={{ color: theme.danger }}> *</ThemedText>}
        </ThemedText>
        {hint && (
          <ThemedText type="small" themeColor="textSecondary">
            {hint}
          </ThemedText>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value?.title ?? placeholder}`}
        disabled={disabled}
        onPress={() => setAberto(true)}
        style={({ pressed }) => [
          styles.field,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          pressed && styles.pressed,
          disabled && styles.disabled,
        ]}>
        <View style={[styles.iconBox, { backgroundColor: theme.background }]}>
          <Icon name={icon} size={22} />
        </View>
        <View style={styles.fieldText}>
          {value ? (
            <>
              <ThemedText numberOfLines={1}>{value.title}</ThemedText>
              {value.subtitle && (
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                  {value.subtitle}
                </ThemedText>
              )}
            </>
          ) : (
            <ThemedText themeColor="textSecondary">{disabled && disabledHint ? disabledHint : placeholder}</ThemedText>
          )}
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {value ? 'Alterar' : 'Selecionar'}
        </ThemedText>
        <Icon name="direita" size={14} color={theme.textSecondary} />
      </Pressable>

      <Modal visible={aberto} animationType="slide" presentationStyle="pageSheet" onRequestClose={fechar}>
        <SafeAreaView style={[styles.modal, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <ThemedText type="smallBold" style={styles.modalTitle}>
              {label}
            </ThemedText>
            <Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={fechar} hitSlop={12}>
              <Icon name="fechar" size={22} />
            </Pressable>
          </View>

          <View style={[styles.search, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <Icon name="busca" size={18} color={theme.textSecondary} />
            <TextInput
              value={busca}
              onChangeText={setBusca}
              placeholder="Pesquisar"
              placeholderTextColor={theme.textSecondary}
              style={[styles.searchInput, { color: theme.text }]}
              autoCorrect={false}
            />
          </View>

          <FlatList
            data={filtradas}
            keyExtractor={(item) => String(item.id)}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.list}
            ListEmptyComponent={<EmptyState icon="busca" title={emptyMessage} />}
            renderItem={({ item }) => {
              const selecionado = item.id === value?.id;
              return (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    onChange(item);
                    fechar();
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      backgroundColor: selecionado ? theme.backgroundSelected : theme.backgroundElement,
                      borderColor: theme.border,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <View style={styles.fieldText}>
                    <ThemedText>{item.title}</ThemedText>
                    {item.subtitle && (
                      <ThemedText type="small" themeColor="textSecondary">
                        {item.subtitle}
                      </ThemedText>
                    )}
                  </View>
                  {selecionado && <Icon name="concluido" size={20} color={theme.success} />}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.three,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldText: {
    flex: 1,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
  modal: {
    flex: 1,
    paddingHorizontal: Spacing.three,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  modalTitle: {
    fontSize: 18,
  },
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
  list: {
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
});
