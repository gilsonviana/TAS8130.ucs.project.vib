import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { DATABASE_NAME, inicializarBanco } from '@/db/schema';

SplashScreen.preventAutoHideAsync();

/** Esconde a splash screen assim que o banco estiver pronto e as telas forem montadas. */
function EsconderSplash() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);
  return null;
}

function erroBanco(erro: Error): never {
  SplashScreen.hideAsync();
  throw erro;
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const escuro = scheme === 'dark';
  const cores = Colors[escuro ? 'dark' : 'light'];
  const base = escuro ? DarkTheme : DefaultTheme;
  const temaNavegacao = {
    ...base,
    colors: {
      ...base.colors,
      primary: cores.primary,
      background: cores.background,
      card: cores.background,
      text: cores.text,
      border: cores.border,
    },
  };

  return (
    <ThemeProvider value={temaNavegacao}>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={inicializarBanco} onError={erroBanco}>
        <EsconderSplash />
        <Stack
          screenOptions={{
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: cores.background },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="agendamento/novo" options={{ title: 'Novo agendamento' }} />
          <Stack.Screen name="agendamento/[id]/index" options={{ title: 'Detalhes do agendamento' }} />
          <Stack.Screen name="agendamento/[id]/editar" options={{ title: 'Editar agendamento' }} />
          <Stack.Screen name="cliente/novo" options={{ title: 'Novo cliente' }} />
          <Stack.Screen name="cliente/[id]" options={{ title: 'Cliente' }} />
          <Stack.Screen name="animal/novo" options={{ title: 'Novo animal' }} />
          <Stack.Screen name="animal/[id]" options={{ title: 'Animal' }} />
          <Stack.Screen name="servico/novo" options={{ title: 'Novo serviço' }} />
          <Stack.Screen name="servico/[id]" options={{ title: 'Serviço' }} />
        </Stack>
      </SQLiteProvider>
    </ThemeProvider>
  );
}
