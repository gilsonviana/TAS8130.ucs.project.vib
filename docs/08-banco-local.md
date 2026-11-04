# Banco de dados local — SQLite

## Tecnologia escolhida

O PetAgenda utilizará SQLite como banco de dados relacional local, integrado ao aplicativo por meio da biblioteca `expo-sqlite`.

Documentação: https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/

## Objetivo

O banco será armazenado no próprio dispositivo em que o aplicativo estiver instalado. Dessa forma, as funcionalidades principais poderão ser utilizadas sem conexão com a internet.

## Implementação prevista

1. Adicionar a dependência compatível com o Expo SDK 57:
   ```bash
   npx expo install expo-sqlite
   ```
2. Abrir ou criar o arquivo de banco de dados local do aplicativo.
3. Criar as tabelas `clientes`, `animais`, `servicos`, `agendamentos` e `pagamentos` na inicialização, utilizando comandos SQL de criação de tabelas.
4. Habilitar a validação de chaves estrangeiras com `PRAGMA foreign_keys = ON`.
5. Implementar operações de inserção, consulta, atualização e inativação dos registros.
6. Utilizar transações nas operações que alteram mais de uma tabela, especialmente na conclusão de um atendimento e no registro financeiro.
7. Criar índices para melhorar as consultas da agenda e dos indicadores.

## Operações que funcionarão offline

- Cadastro e consulta de clientes.
- Cadastro e consulta de animais.
- Cadastro e consulta de serviços.
- Criação, edição e cancelamento de agendamentos.
- Consulta da agenda e dos detalhes dos atendimentos.
- Conclusão de atendimentos e registro financeiro.
- Consulta de indicadores calculados com os dados locais.

## Integridade e segurança dos dados

- As operações relacionadas deverão respeitar as chaves estrangeiras.
- A conclusão do atendimento e a criação do registro financeiro deverão ocorrer em uma transação, evitando que apenas uma das operações seja persistida.
- A aplicação deverá tratar erros de leitura e gravação e apresentar mensagens compreensíveis.
- Cadastros relacionados ao histórico deverão ser inativados em vez de excluídos fisicamente.
- O banco local não substitui uma estratégia de backup. A perda, desinstalação ou limpeza dos dados do aplicativo poderá ocasionar perda dos registros armazenados no dispositivo.

## Sincronização futura

A sincronização com um servidor remoto é uma evolução planejada, mas não será requisito da primeira versão. O funcionamento offline não dependerá de uma API ou serviço em nuvem.

Quando a sincronização for implementada, será necessário definir estratégia de autenticação, identificação de alterações locais, resolução de conflitos, política de backup e proteção dos dados transmitidos.

## Ciência de Dados

Os dados estruturados no SQLite poderão alimentar consultas e indicadores para apoiar decisões do estabelecimento, como:

- Faturamento por período.
- Ticket médio.
- Serviços mais realizados.
- Taxa de cancelamento.
- Distribuição de atendimentos por dia e horário.

Na primeira versão, essas análises serão realizadas localmente por consultas e agregações sobre os dados armazenados.
