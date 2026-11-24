import type { SQLiteDatabase } from 'expo-sqlite';

import { calcularHoraFim, dataValida, horaValida, textoOpcional } from '@/lib/formatos';

import { RegraNegocioError } from './erros';
import type { Agendamento, AgendamentoDetalhado, Animal, Cliente, Servico, StatusAgendamento } from './types';

export const FORMAS_PAGAMENTO = ['Dinheiro', 'PIX', 'Cartão de débito', 'Cartão de crédito'] as const;

export interface AgendamentoInput {
  cliente_id: number | null;
  animal_id: number | null;
  servico_id: number | null;
  data: string;
  hora_inicio: string;
  duracao_minutos: number | null;
  valor: number | null;
  observacoes?: string | null;
}

export interface ConclusaoInput {
  valor: number | null;
  forma_pagamento?: string | null;
}

export interface ContagemPorDia {
  data: string;
  total: number;
}

const SELECT_DETALHADO = `
  SELECT ag.*,
         c.nome           AS cliente_nome,
         c.telefone       AS cliente_telefone,
         an.nome          AS animal_nome,
         an.especie       AS animal_especie,
         an.raca          AS animal_raca,
         s.nome           AS servico_nome,
         p.id             AS pagamento_id,
         p.valor          AS pagamento_valor,
         p.forma_pagamento AS pagamento_forma,
         p.status         AS pagamento_status,
         p.registrado_em  AS pagamento_registrado_em
    FROM agendamentos ag
    JOIN clientes c  ON c.id  = ag.cliente_id
    JOIN animais an  ON an.id = ag.animal_id
    JOIN servicos s  ON s.id  = ag.servico_id
    LEFT JOIN pagamentos p ON p.agendamento_id = ag.id`;

/**
 * RN05: retorna os agendamentos ativos (não cancelados) que se sobrepõem ao intervalo informado.
 * Dois intervalos [início, fim) se sobrepõem quando início_A < fim_B e fim_A > início_B.
 */
export async function buscarConflitos(
  db: SQLiteDatabase,
  intervalo: { data: string; hora_inicio: string; hora_fim: string; ignorarId?: number | null },
): Promise<AgendamentoDetalhado[]> {
  return db.getAllAsync<AgendamentoDetalhado>(
    `${SELECT_DETALHADO}
      WHERE ag.data = ?
        AND ag.status <> 'CANCELADO'
        AND ag.hora_inicio < ?
        AND ag.hora_fim > ?
        AND (? IS NULL OR ag.id <> ?)
      ORDER BY ag.hora_inicio`,
    intervalo.data,
    intervalo.hora_fim,
    intervalo.hora_inicio,
    intervalo.ignorarId ?? null,
    intervalo.ignorarId ?? null,
  );
}

/**
 * Valida todas as regras de criação/edição (RN02, RN03, RN04, RN05).
 * `original` é o agendamento antes da edição, usado para permitir manter cadastros
 * que foram inativados depois da criação do agendamento.
 */
async function validarAgendamento(db: SQLiteDatabase, input: AgendamentoInput, original?: Agendamento) {
  // RN02: dados obrigatórios.
  if (input.cliente_id == null) {
    throw new RegraNegocioError('Selecione o cliente.');
  }
  if (input.animal_id == null) {
    throw new RegraNegocioError('Selecione o animal.');
  }
  if (input.servico_id == null) {
    throw new RegraNegocioError('Selecione o serviço.');
  }
  if (!dataValida(input.data)) {
    throw new RegraNegocioError('Informe uma data válida.');
  }
  if (!horaValida(input.hora_inicio)) {
    throw new RegraNegocioError('Informe um horário inicial válido.');
  }
  if (input.duracao_minutos == null || !Number.isInteger(input.duracao_minutos) || input.duracao_minutos <= 0) {
    throw new RegraNegocioError('A duração deve ser um número inteiro de minutos maior que zero.');
  }
  if (input.valor == null || !Number.isFinite(input.valor) || input.valor < 0) {
    throw new RegraNegocioError('Informe o valor do atendimento.');
  }

  const [cliente, animal, servico] = await Promise.all([
    db.getFirstAsync<Cliente>('SELECT * FROM clientes WHERE id = ?', input.cliente_id),
    db.getFirstAsync<Animal>('SELECT * FROM animais WHERE id = ?', input.animal_id),
    db.getFirstAsync<Servico>('SELECT * FROM servicos WHERE id = ?', input.servico_id),
  ]);

  if (!cliente) {
    throw new RegraNegocioError('O cliente selecionado não foi encontrado.');
  }
  if (!animal) {
    throw new RegraNegocioError('O animal selecionado não foi encontrado.');
  }
  if (!servico) {
    throw new RegraNegocioError('O serviço selecionado não foi encontrado.');
  }
  if (!cliente.ativo && cliente.id !== original?.cliente_id) {
    throw new RegraNegocioError('O cliente selecionado está inativo.');
  }
  if (!animal.ativo && animal.id !== original?.animal_id) {
    throw new RegraNegocioError('O animal selecionado está inativo.');
  }
  if (!servico.ativo && servico.id !== original?.servico_id) {
    throw new RegraNegocioError('O serviço selecionado está inativo.');
  }
  // RN01: o animal precisa pertencer ao cliente informado.
  if (animal.cliente_id !== cliente.id) {
    throw new RegraNegocioError('O animal selecionado não pertence a este cliente.');
  }

  // RN03: término previsto calculado pela aplicação.
  const horaFim = calcularHoraFim(input.hora_inicio, input.duracao_minutos);
  if (!horaFim) {
    throw new RegraNegocioError('O atendimento deve terminar no mesmo dia (até 23:59).');
  }

  // RN05: sem sobreposição com agendamentos ativos.
  const conflitos = await buscarConflitos(db, {
    data: input.data,
    hora_inicio: input.hora_inicio,
    hora_fim: horaFim,
    ignorarId: original?.id,
  });
  if (conflitos.length > 0) {
    const c = conflitos[0];
    throw new RegraNegocioError(
      `Conflito de horário com o atendimento de ${c.animal_nome} (${c.hora_inicio}–${c.hora_fim}). Escolha outro horário.`,
    );
  }

  return {
    cliente_id: cliente.id,
    animal_id: animal.id,
    servico_id: servico.id,
    data: input.data,
    hora_inicio: input.hora_inicio,
    hora_fim: horaFim,
    duracao_minutos: input.duracao_minutos,
    valor: Math.round(input.valor * 100) / 100,
    observacoes: textoOpcional(input.observacoes),
  };
}

async function obterAgendamentoSimples(db: SQLiteDatabase, id: number): Promise<Agendamento> {
  const agendamento = await db.getFirstAsync<Agendamento>('SELECT * FROM agendamentos WHERE id = ?', id);
  if (!agendamento) {
    throw new RegraNegocioError('Agendamento não encontrado.');
  }
  return agendamento;
}

export async function obterAgendamento(db: SQLiteDatabase, id: number): Promise<AgendamentoDetalhado | null> {
  return db.getFirstAsync<AgendamentoDetalhado>(`${SELECT_DETALHADO} WHERE ag.id = ?`, id);
}

export async function listarAgendamentosPorData(db: SQLiteDatabase, data: string): Promise<AgendamentoDetalhado[]> {
  return db.getAllAsync<AgendamentoDetalhado>(
    `${SELECT_DETALHADO} WHERE ag.data = ? ORDER BY ag.hora_inicio, ag.id`,
    data,
  );
}

/** Próximos atendimentos ativos a partir de uma data/hora (usado na tela inicial). */
export async function listarProximosAgendamentos(
  db: SQLiteDatabase,
  data: string,
  hora: string,
  limite = 3,
): Promise<AgendamentoDetalhado[]> {
  return db.getAllAsync<AgendamentoDetalhado>(
    `${SELECT_DETALHADO}
      WHERE ag.status = 'AGENDADO'
        AND (ag.data > ? OR (ag.data = ? AND ag.hora_fim > ?))
      ORDER BY ag.data, ag.hora_inicio
      LIMIT ?`,
    data,
    data,
    hora,
    limite,
  );
}

export async function listarAgendamentosDoAnimal(db: SQLiteDatabase, animalId: number): Promise<AgendamentoDetalhado[]> {
  return db.getAllAsync<AgendamentoDetalhado>(
    `${SELECT_DETALHADO} WHERE ag.animal_id = ? ORDER BY ag.data DESC, ag.hora_inicio DESC`,
    animalId,
  );
}

export async function listarAgendamentosDoCliente(
  db: SQLiteDatabase,
  clienteId: number,
  limite = 10,
): Promise<AgendamentoDetalhado[]> {
  return db.getAllAsync<AgendamentoDetalhado>(
    `${SELECT_DETALHADO} WHERE ag.cliente_id = ? ORDER BY ag.data DESC, ag.hora_inicio DESC LIMIT ?`,
    clienteId,
    limite,
  );
}

/** Quantidade de atendimentos não cancelados por dia em um intervalo (para o seletor de semana). */
export async function contarAgendamentosPorDia(
  db: SQLiteDatabase,
  inicio: string,
  fim: string,
): Promise<ContagemPorDia[]> {
  return db.getAllAsync<ContagemPorDia>(
    `SELECT data, COUNT(*) AS total
       FROM agendamentos
      WHERE data BETWEEN ? AND ?
        AND status <> 'CANCELADO'
      GROUP BY data`,
    inicio,
    fim,
  );
}

export async function criarAgendamento(db: SQLiteDatabase, input: AgendamentoInput): Promise<number> {
  const dados = await validarAgendamento(db, input);
  const resultado = await db.runAsync(
    `INSERT INTO agendamentos
       (cliente_id, animal_id, servico_id, data, hora_inicio, hora_fim, duracao_minutos, valor, status, observacoes, criado_em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'AGENDADO', ?, ?)`,
    dados.cliente_id,
    dados.animal_id,
    dados.servico_id,
    dados.data,
    dados.hora_inicio,
    dados.hora_fim,
    dados.duracao_minutos,
    dados.valor,
    dados.observacoes,
    new Date().toISOString(),
  );
  return resultado.lastInsertRowId;
}

/** RF07: somente agendamentos na situação AGENDADO podem ser editados. */
export async function atualizarAgendamento(db: SQLiteDatabase, id: number, input: AgendamentoInput): Promise<void> {
  const original = await obterAgendamentoSimples(db, id);
  if (original.status !== 'AGENDADO') {
    throw new RegraNegocioError('Somente agendamentos com situação "Agendado" podem ser editados.');
  }
  const dados = await validarAgendamento(db, input, original);
  await db.runAsync(
    `UPDATE agendamentos
        SET cliente_id = ?, animal_id = ?, servico_id = ?, data = ?, hora_inicio = ?, hora_fim = ?,
            duracao_minutos = ?, valor = ?, observacoes = ?
      WHERE id = ? AND status = 'AGENDADO'`,
    dados.cliente_id,
    dados.animal_id,
    dados.servico_id,
    dados.data,
    dados.hora_inicio,
    dados.hora_fim,
    dados.duracao_minutos,
    dados.valor,
    dados.observacoes,
    id,
  );
}

/** RN07: cancelar apenas altera a situação; o registro é mantido para histórico. */
export async function cancelarAgendamento(db: SQLiteDatabase, id: number): Promise<void> {
  const agendamento = await obterAgendamentoSimples(db, id);
  if (agendamento.status === 'CANCELADO') {
    throw new RegraNegocioError('Este agendamento já está cancelado.');
  }
  if (agendamento.status === 'CONCLUIDO') {
    throw new RegraNegocioError('Atendimentos concluídos não podem ser cancelados.');
  }
  await db.runAsync("UPDATE agendamentos SET status = 'CANCELADO' WHERE id = ? AND status = 'AGENDADO'", id);
}

/**
 * RN08 + RN09: conclui o atendimento e registra o pagamento na mesma transação.
 * Se qualquer etapa falhar, nada é gravado. A restrição UNIQUE em pagamentos.agendamento_id
 * garante que não haverá lançamento duplicado.
 */
export async function concluirAgendamento(db: SQLiteDatabase, id: number, input: ConclusaoInput): Promise<void> {
  if (input.valor == null || !Number.isFinite(input.valor) || input.valor < 0) {
    throw new RegraNegocioError('Informe o valor recebido pelo atendimento.');
  }
  const valor = Math.round(input.valor * 100) / 100;
  const forma = textoOpcional(input.forma_pagamento);

  await db.withTransactionAsync(async () => {
    const agendamento = await obterAgendamentoSimples(db, id);
    if (agendamento.status === 'CANCELADO') {
      throw new RegraNegocioError('Agendamentos cancelados não podem ser concluídos.');
    }
    if (agendamento.status === 'CONCLUIDO') {
      throw new RegraNegocioError('Este atendimento já foi concluído.');
    }

    const pagamentoExistente = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM pagamentos WHERE agendamento_id = ?',
      id,
    );
    if (pagamentoExistente) {
      throw new RegraNegocioError('Este atendimento já possui um registro financeiro.');
    }

    const atualizacao = await db.runAsync(
      "UPDATE agendamentos SET status = 'CONCLUIDO' WHERE id = ? AND status = 'AGENDADO'",
      id,
    );
    if (atualizacao.changes !== 1) {
      throw new RegraNegocioError('Não foi possível concluir o atendimento. Atualize a tela e tente novamente.');
    }

    await db.runAsync(
      `INSERT INTO pagamentos (agendamento_id, valor, forma_pagamento, status, registrado_em)
       VALUES (?, ?, ?, 'REGISTRADO', ?)`,
      id,
      valor,
      forma,
      new Date().toISOString(),
    );
  });
}

export const ROTULO_STATUS: Record<StatusAgendamento, string> = {
  AGENDADO: 'Agendado',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};
