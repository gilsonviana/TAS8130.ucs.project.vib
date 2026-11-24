/**
 * Paleta de cores do PetAgenda (modo claro e escuro).
 * Baseada nos wireframes: fundo claro acinzentado, cartões brancos e ações em azul-marinho.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F172A',
    textSecondary: '#64748B',
    background: '#F4F6F9',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E2E8F0',
    border: '#E2E8F0',
    primary: '#0F172A',
    onPrimary: '#FFFFFF',
    success: '#047857',
    successBackground: '#ECFDF5',
    danger: '#DC2626',
    dangerBackground: '#FEF2F2',
    warning: '#B45309',
    warningBackground: '#FFFBEB',
    info: '#1D4ED8',
    infoBackground: '#EFF6FF',
    bar: '#334155',
  },
  dark: {
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    background: '#0B1120',
    backgroundElement: '#172033',
    backgroundSelected: '#253047',
    border: '#253047',
    primary: '#F1F5F9',
    onPrimary: '#0F172A',
    success: '#34D399',
    successBackground: '#06281E',
    danger: '#F87171',
    dangerBackground: '#2A1215',
    warning: '#FBBF24',
    warningBackground: '#2A2108',
    info: '#60A5FA',
    infoBackground: '#0F1F3A',
    bar: '#CBD5E1',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type ThemeColors = { [K in ThemeColor]: string };

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 8,
  medium: 14,
  large: 20,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
