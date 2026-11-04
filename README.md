# PetAgenda

Aplicativo mobile para gestão de pet shops e estabelecimentos de banho e tosa, com foco no controle de clientes, animais, serviços e agendamentos. O aplicativo utilizará armazenamento local com SQLite para permitir o uso das funcionalidades principais mesmo sem conexão com a internet.

> **Status da proposta:** documentação inicial do Projeto Integrador VI-B. A implementação poderá ajustar detalhes técnicos, desde que os requisitos e as regras de negócio documentados sejam mantidos ou atualizados.

## Objetivo

Facilitar a organização da rotina de um estabelecimento de cuidados para animais e disponibilizar informações que auxiliem o responsável na tomada de decisões, como faturamento, serviços mais realizados, volume de atendimentos e cancelamentos.

## Problema e solução

Pequenos estabelecimentos podem controlar seus agendamentos e informações de clientes de maneira descentralizada, por anotações, planilhas ou ferramentas que dependem de conexão com a internet. Isso dificulta a consulta rápida do histórico, a identificação de conflitos de horário e a análise do desempenho do negócio.

O PetAgenda centraliza essas informações em um aplicativo mobile. Os dados são armazenados localmente no dispositivo por meio do SQLite, permitindo consultar e registrar informações sem conexão. A sincronização com um serviço remoto é considerada uma possibilidade futura e não faz parte do escopo inicial.

## Público-alvo

- Proprietários e administradores de pet shops.
- Profissionais autônomos de banho e tosa.
- Atendentes responsáveis pela agenda e pelo cadastro de clientes.
- Pequenos estabelecimentos que precisam organizar atendimentos e acompanhar resultados.

## Principais funcionalidades

- Cadastro e consulta de clientes/tutores.
- Cadastro e consulta de animais vinculados aos seus tutores.
- Cadastro de serviços, duração padrão e preço de referência.
- Criação, edição, consulta e cancelamento de agendamentos.
- Verificação de conflito de horário para agendamentos ativos.
- Conclusão de atendimentos e registro financeiro.
- Consulta de agenda por data e filtro por situação.
- Apresentação de indicadores gerenciais calculados a partir dos dados locais.

## Armazenamento e funcionamento offline

O banco de dados local será SQLite, integrado ao aplicativo por meio da biblioteca `expo-sqlite`. Os cadastros e agendamentos serão persistidos no próprio dispositivo. As operações principais não dependerão de internet.

A sincronização com servidor poderá ser estudada em uma evolução futura. Na versão inicial, não será prometido envio automático de dados para nuvem nem compartilhamento entre dispositivos.

## Tecnologias

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)
- [React Native](https://reactnative.dev/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Expo SQLite](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/)
- [EAS Build](https://docs.expo.dev/build/introduction/)

A lista detalhada está em [`docs/07-tecnologias.md`](docs/07-tecnologias.md).

## Documentação

| Documento | Conteúdo |
|---|---|
| [Público-alvo](docs/01-publico-alvo.md) | Perfis de usuários e necessidades |
| [Funcionalidades e regras de negócio](docs/02-funcionalidades.md) | Escopo funcional e regras |
| [Modelo de dados](docs/03-modelagem-banco-de-dados.md) | Entidades, atributos, tipos e relacionamentos |
| [Wireframes](docs/04-wireframes.md) | Telas e fluxos previstos |
| [Equipe](docs/05-equipe.md) | Integrantes do grupo |
| [Geração do APK](docs/06-geracao-apk.md) | Processo de build Android |
| [Tecnologias](docs/07-tecnologias.md) | Linguagens, ferramentas e bibliotecas |
| [Banco local](docs/08-banco-local.md) | Estratégia de persistência SQLite |

