# Geração do APK Android

O aplicativo será desenvolvido com Expo e React Native. O pacote Android (APK) poderá ser gerado utilizando o serviço Expo Application Services (EAS Build), que realiza a compilação na nuvem.

## Preparação

1. Manter as dependências compatíveis com a versão do Expo SDK utilizada pelo projeto.
2. Configurar o identificador Android do aplicativo no `app.json` ou `app.config.ts`.
3. Instalar e configurar o EAS CLI.
4. Autenticar-se na conta Expo.
5. Configurar o projeto EAS.

Documentação oficial: https://docs.expo.dev/build/introduction/

## Configuração de build

Criar ou ajustar o arquivo `eas.json` na raiz do projeto com um perfil de distribuição de APK. Exemplo:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

A configuração deverá ser validada com a versão do EAS CLI e do Expo SDK adotadas no momento da compilação.

## Comandos previstos

```bash
# Instalar/configurar o EAS CLI, se necessário
npx eas-cli@latest login

# Configurar o projeto EAS
npx eas-cli@latest build:configure

# Gerar APK Android usando o perfil preview
npx eas-cli@latest build --platform android --profile preview
```

Após a conclusão, o EAS Build disponibilizará um endereço para baixar o APK gerado. O arquivo poderá ser instalado em um dispositivo Android compatível, respeitando as configurações de segurança do aparelho.

## Observações

- O perfil `preview` com `android.buildType: apk` é destinado à geração de um APK instalável para testes e distribuição interna.
- Para publicação na Google Play, normalmente será necessário gerar um Android App Bundle (AAB), com perfil apropriado.
- A geração do APK depende de configuração válida do projeto, credenciais de assinatura e compatibilidade das dependências.
- A documentação descreve o processo planejado; o APK será efetivamente gerado durante a etapa de implementação e testes.
