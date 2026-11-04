# Funcionalidades e regras de negócio

## Funcionalidades previstas

| Código | Funcionalidade | Descrição |
|---|---|---|
| RF01 | Gerenciar clientes | Cadastrar, consultar, editar e inativar clientes/tutores. |
| RF02 | Gerenciar animais | Cadastrar, consultar, editar e inativar animais vinculados a um cliente. |
| RF03 | Gerenciar serviços | Manter nome, descrição, duração padrão e preço de referência dos serviços. |
| RF04 | Criar agendamento | Selecionar cliente, animal, serviço, data, hora e valor do atendimento. |
| RF05 | Consultar agenda | Exibir agendamentos por data e permitir filtros por situação. |
| RF06 | Consultar agendamento | Exibir dados do atendimento, tutor, animal, serviço, duração e valor. |
| RF07 | Editar agendamento | Alterar dados de um agendamento, respeitando as regras de disponibilidade. |
| RF08 | Cancelar agendamento | Alterar a situação para cancelado, preservando o registro histórico. |
| RF09 | Concluir atendimento | Marcar o atendimento como concluído e registrar o valor realizado. |
| RF10 | Consultar indicadores | Apresentar informações agregadas de atendimentos e valores registrados. |

## Regras de negócio

- **RN01 — Vínculo do animal:** todo animal deve estar associado a um cliente/tutor cadastrado.
- **RN02 — Dados obrigatórios:** cliente, animal, serviço, data, horário inicial e valor são obrigatórios para criar um agendamento.
- **RN03 — Duração:** a duração inicial do atendimento será sugerida a partir da duração padrão do serviço selecionado. O término previsto será calculado pela aplicação.
- **RN04 — Valor:** o valor sugerido será o preço de referência do serviço, mas poderá ser ajustado no agendamento. O valor aplicado deve ser salvo no próprio agendamento para preservar o histórico mesmo que o preço do serviço mude.
- **RN05 — Conflito de horário:** não permitir sobreposição entre agendamentos ativos do mesmo estabelecimento. Agendamentos cancelados não bloqueiam horários. A verificação considera o intervalo entre início e término previsto.
- **RN06 — Situações:** um agendamento poderá estar `AGENDADO`, `CONCLUIDO` ou `CANCELADO`.
- **RN07 — Cancelamento:** cancelar não deve apagar o agendamento; deve alterar sua situação e manter os dados para histórico e análise.
- **RN08 — Conclusão:** somente um agendamento não cancelado poderá ser concluído.
- **RN09 — Registro financeiro:** ao concluir um atendimento, registrar seu valor em um lançamento financeiro associado ao agendamento. A operação deve evitar lançamentos duplicados.
- **RN10 — Indicadores:** valores de faturamento realizado devem considerar atendimentos concluídos e seus registros financeiros, não agendamentos futuros ou cancelados.
- **RN11 — Persistência local:** operações de cadastro, agenda e consulta devem funcionar sem conexão com internet.
- **RN12 — Integridade:** registros relacionados não devem ser removidos fisicamente se isso comprometer o histórico. Preferir inativação de cadastros.

## Indicadores gerenciais previstos

- Quantidade de atendimentos agendados, concluídos e cancelados por período.
- Valor total registrado em atendimentos concluídos.
- Ticket médio dos atendimentos concluídos.
- Serviços mais realizados.
- Distribuição dos atendimentos por dia e horário.

Os indicadores serão calculados a partir dos registros persistidos localmente. A primeira versão não depende de serviços externos de análise de dados.

## Fora do escopo inicial

- Sincronização em nuvem e uso simultâneo em vários dispositivos.
- Integração com gateways de pagamento.
- Envio de mensagens por WhatsApp ou SMS.
- Emissão fiscal.
- Gestão de estoque.
- Cadastro de múltiplas unidades/filiais.
