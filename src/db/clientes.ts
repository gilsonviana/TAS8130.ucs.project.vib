import type { SQLiteDatabase } from 'expo-sqlite';

import { textoOpcional } from '@/lib/formatos';

import { RegraNegocioError } from './erros';
import type { Cliente, ClienteResumo } from './types';

export interface ClienteInput {
  nome: string;
  telefone: string;
  email?: string | null;
  endereco?: string | null;
}

export interface FiltroClientes {
  busca?: string;
  incluirInativos?: boolean;
}

function validarCliente(input: ClienteInput) {
  const nome = input.nome.trim();
  const telefone = input.telefone.trim();
  const email = textoOpcional(input.email);

  if (!nome) {
    throw new RegraNegocioError('Informe o nome do cliente.');
  }
  if (!telefone) {
    throw new RegraNegocioError('Informe o telefone do cliente.');
  }
  if (telefone.replace(/\D/g, '').length < 8) {
    throw new RegraNegocioError('Informe um telefone válido (com DDD).');
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new RegraNegocioError('Informe um e-mail válido ou deixe o campo em branco.');
  }

  return { nome, telefone, email, endereco: textoOpcional(input.endereco) };
}

export async function listarClientes(
  db: SQLiteDatabase,
  { busca = '', incluirInativos = false }: FiltroClientes = {},
): Promise<ClienteResumo[]> {
  const termo = busca.trim();
  return db.getAllAsync<ClienteResumo>(
    `SELECT c.*,
            (SELECT COUNT(*) FROM animais a WHERE a.cliente_id = c.id AND a.ativo = 1) AS total_animais
       FROM clientes c
      WHERE (? = 1 OR c.ativo = 1)
        AND (? = '' OR c.nome LIKE ? OR c.telefone LIKE ?)
      ORDER BY c.ativo DESC, c.nome COLLATE NOCASE`,
    incluirInativos ? 1 : 0,
    termo,
    `%${termo}%`,
    `%${termo}%`,
  );
}

export async function obterCliente(db: SQLiteDatabase, id: number): Promise<Cliente | null> {
  return db.getFirstAsync<Cliente>('SELECT * FROM clientes WHERE id = ?', id);
}

export async function criarCliente(db: SQLiteDatabase, input: ClienteInput): Promise<number> {
  const dados = validarCliente(input);
  const resultado = await db.runAsync(
    'INSERT INTO clientes (nome, telefone, email, endereco, ativo, criado_em) VALUES (?, ?, ?, ?, 1, ?)',
    dados.nome,
    dados.telefone,
    dados.email,
    dados.endereco,
    new Date().toISOString(),
  );
  return resultado.lastInsertRowId;
}

export async function atualizarCliente(db: SQLiteDatabase, id: number, input: ClienteInput): Promise<void> {
  const dados = validarCliente(input);
  const resultado = await db.runAsync(
    'UPDATE clientes SET nome = ?, telefone = ?, email = ?, endereco = ? WHERE id = ?',
    dados.nome,
    dados.telefone,
    dados.email,
    dados.endereco,
    id,
  );
  if (resultado.changes === 0) {
    throw new RegraNegocioError('Cliente não encontrado.');
  }
}

/** RN12: clientes não são excluídos, apenas inativados para preservar o histórico. */
export async function definirClienteAtivo(db: SQLiteDatabase, id: number, ativo: boolean): Promise<void> {
  await db.runAsync('UPDATE clientes SET ativo = ? WHERE id = ?', ativo ? 1 : 0, id);
}
