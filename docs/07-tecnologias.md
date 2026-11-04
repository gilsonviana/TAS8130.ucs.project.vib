# Tecnologias, linguagens e bibliotecas

Tecnologias e dependências identificadas no `package.json` fornecido pela equipe. As versões abaixo refletem o arquivo informado e poderão ser atualizadas durante o desenvolvimento.

## Linguagens e plataforma

| Item | Versão declarada | Link |
|---|---:|---|
| TypeScript | 6.0.3 | https://www.typescriptlang.org/ |
| React | 19.2.3 | https://react.dev/ |
| React Native | 0.86.3 | https://reactnative.dev/ |
| Expo SDK | 57.0.28 | https://docs.expo.dev/versions/v57.0.0/ |
| SQLite | A definir pela dependência `expo-sqlite` | https://www.sqlite.org/ |

## Navegação

| Biblioteca | Versão declarada | Link |
|---|---:|---|
| Expo Router | 57.0.26 | https://docs.expo.dev/router/introduction/ |
| Expo Linking | 57.0.12 | https://docs.expo.dev/versions/v57.0.0/sdk/linking/ |

## Interface e recursos nativos

| Biblioteca | Versão declarada | Link |
|---|---:|---|
| Expo UI | 57.0.23 | https://docs.expo.dev/versions/v57.0.0/sdk/ui/ |
| Expo Image | 57.0.5 | https://docs.expo.dev/versions/v57.0.0/sdk/image/ |
| Expo Font | 57.0.4 | https://docs.expo.dev/versions/v57.0.0/sdk/font/ |
| Expo Symbols | 57.0.3 | https://docs.expo.dev/versions/v57.0.0/sdk/symbols/ |
| Expo Glass Effect | 57.0.4 | https://docs.expo.dev/versions/v57.0.0/sdk/glass-effect/ |
| React Native Gesture Handler | 2.32.0 | https://docs.swmansion.com/react-native-gesture-handler/ |
| React Native Reanimated | 4.5.1 | https://docs.swmansion.com/react-native-reanimated/ |
| React Native Safe Area Context | 5.7.0 | https://github.com/th3rdwave/react-native-safe-area-context |
| React Native Screens | 4.26.0 | https://github.com/software-mansion/react-native-screens |

## Utilitários Expo

| Biblioteca | Versão declarada | Link |
|---|---:|---|
| Expo Constants | 57.0.21 | https://docs.expo.dev/versions/v57.0.0/sdk/constants/ |
| Expo Device | 57.0.2 | https://docs.expo.dev/versions/v57.0.0/sdk/device/ |
| Expo Splash Screen | 57.0.10 | https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/ |
| Expo Status Bar | 57.0.1 | https://docs.expo.dev/versions/v57.0.0/sdk/status-bar/ |
| Expo System UI | 57.0.4 | https://docs.expo.dev/versions/v57.0.0/sdk/system-ui/ |
| Expo Web Browser | 57.0.3 | https://docs.expo.dev/versions/v57.0.0/sdk/webbrowser/ |
| Expo Worklets | Não aplicável | https://docs.swmansion.com/react-native-reanimated/ |

## Banco de dados

| Biblioteca | Situação | Link |
|---|---|---|
| Expo SQLite (`expo-sqlite`) | Prevista para inclusão no projeto | https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/ |

## Build Android

| Ferramenta | Finalidade | Link |
|---|---|---|
| EAS Build | Compilação do aplicativo Android | https://docs.expo.dev/build/introduction/ |
| EAS CLI | Execução dos comandos de build | https://github.com/expo/eas-cli |

## Observação sobre as dependências

O `package.json` fornecido ainda não declara `expo-sqlite` nem `eas-cli`. O SQLite será adicionado com a versão compatível com o Expo SDK 57 por meio do comando `npx expo install expo-sqlite`. O EAS CLI será utilizado como ferramenta de linha de comando, sem necessidade de ser uma dependência de execução do aplicativo.
