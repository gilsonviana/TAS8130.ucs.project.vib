import type { SQLiteDatabase } from 'expo-sqlite';

import { textoOpcional } from '@/lib/formatos';

import { RegraNegocioError } from './erros';
import type { Servico } from './types';

export interface ServicoInput {
  nome: string;
  descricao?: string | null;
  duracao_minutos: number | null;
  preco_referencia: number | null;
}

export interface FiltroServicos {
  busca?: string;
  incluirInativos?: boolean;
}

function validarServico(input: ServicoInput) {
  const nome = input.nome.trim();
  if (!nome) {
    throw new RegraNegocioError('Informe o nome do serviço.');
  }
  if (input.duracao_minutos == null || !Number.isInteger(input.duracao_minutos) || input.duracao_minutos <= 0) {
    throw new RegraNegocioError('Informe a duração padrão em minutos (número inteiro maior que zero).');
  }
  if (input.duracao_minutos >= 24 * 60) {
    throw new RegraNegocioError('A duração padrão deve ser menor que 24 horas.');
  }
  if (input.preco_referencia == null || !Number.isFinite(input.preco_referencia) || input.preco_referencia < 0) {
    throw new RegraNegocioError('Informe um preço de referência válido.');
  }
  return {
    nome,
    descricao: textoOpcional(input.descricao),
    duracao_minutos: input.duracao_minutos,
    preco_referencia: input.preco_referencia,
  };
}

export async function listarServicos(
  db: SQLiteDatabase,
  { busca = '', incluirInativos = false }: FiltroServicos = {},
): Promise<Servico[]> {
  const termo = busca.trim();
  return db.getAllAsync<Servico>(
    `SELECT * FROM servicos
      WHERE (? = 1 OR ativo = 1)
        AND (? = '' OR nome LIKE ? OR descricao LIKE ?)
      ORDER BY ativo DESC, nome COLLATE NOCASE`,
    incluirInativos ? 1 : 0,
    termo,
    `%${termo}%`,
    `%${termo}%`,
  );
}

export async function obterServico(db: SQLiteDatabase, id: number): Promise<Servico | null> {
  return db.getFirstAsync<Servico>('SELECT * FROM servicos WHERE id = ?', id);
}

export async function criarServico(db: SQLiteDatabase, input: ServicoInput): Promise<number> {
  const dados = validarServico(input);
  const resultado = await db.runAsync(
    'INSERT INTO servicos (nome, descricao, duracao_minutos, preco_referencia, ativo) VALUES (?, ?, ?, ?, 1)',
    dados.nome,
    dados.descricao,
    dados.duracao_minutos,
    dados.preco_referencia,
  );
  return resultado.lastInsertRowId;
}

/**
 * RN04: alterar duração ou preço do serviço não modifica agendamentos já registrados,
 * pois esses valores são copiados para o agendamento no momento da criação.
 */
export async function atualizarServico(db: SQLiteDatabase, id: number, input: ServicoInput): Promise<void> {
  const dados = validarServico(input);
  const resultado = await db.runAsync(
    'UPDATE servicos SET nome = ?, descricao = ?, duracao_minutos = ?, preco_referencia = ? WHERE id = ?',
    dados.nome,
    dados.descricao,
    dados.duracao_minutos,
    dados.preco_referencia,
    id,
  );
  if (resultado.changes === 0) {
    throw new RegraNegocioError('Serviço não encontrado.');
  }
}

/** RN12: serviços não são excluídos, apenas inativados. */
export async function definirServicoAtivo(db: SQLiteDatabase, id: number, ativo: boolean): Promise<void> {
  await db.runAsync('UPDATE servicos SET ativo = ? WHERE id = ?', ativo ? 1 : 0, id);
}
