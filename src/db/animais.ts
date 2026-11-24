import type { SQLiteDatabase } from 'expo-sqlite';

import { textoOpcional } from '@/lib/formatos';

import { RegraNegocioError } from './erros';
import type { AnimalComTutor, Cliente } from './types';

export const ESPECIES = ['Cão', 'Gato', 'Ave', 'Roedor', 'Outro'] as const;
export const PORTES = ['Pequeno', 'Médio', 'Grande'] as const;

export interface AnimalInput {
  cliente_id: number | null;
  nome: string;
  especie: string;
  raca?: string | null;
  porte?: string | null;
  observacoes?: string | null;
}

export interface FiltroAnimais {
  clienteId?: number;
  busca?: string;
  incluirInativos?: boolean;
}

const SELECT_ANIMAL = `
  SELECT a.*, c.nome AS cliente_nome, c.ativo AS cliente_ativo
    FROM animais a
    JOIN clientes c ON c.id = a.cliente_id`;

async function validarAnimal(db: SQLiteDatabase, input: AnimalInput, clienteAtualId?: number) {
  const nome = input.nome.trim();
  const especie = input.especie.trim();

  // RN01: todo animal deve estar vinculado a um cliente cadastrado.
  if (input.cliente_id == null) {
    throw new RegraNegocioError('Selecione o tutor do animal.');
  }
  const cliente = await db.getFirstAsync<Cliente>('SELECT * FROM clientes WHERE id = ?', input.cliente_id);
  if (!cliente) {
    throw new RegraNegocioError('O tutor selecionado não foi encontrado.');
  }
  if (!cliente.ativo && cliente.id !== clienteAtualId) {
    throw new RegraNegocioError('O tutor selecionado está inativo.');
  }
  if (!nome) {
    throw new RegraNegocioError('Informe o nome do animal.');
  }
  if (!especie) {
    throw new RegraNegocioError('Informe a espécie do animal.');
  }

  return {
    cliente_id: cliente.id,
    nome,
    especie,
    raca: textoOpcional(input.raca),
    porte: textoOpcional(input.porte),
    observacoes: textoOpcional(input.observacoes),
  };
}

export async function listarAnimais(
  db: SQLiteDatabase,
  { clienteId, busca = '', incluirInativos = false }: FiltroAnimais = {},
): Promise<AnimalComTutor[]> {
  const termo = busca.trim();
  return db.getAllAsync<AnimalComTutor>(
    `${SELECT_ANIMAL}
      WHERE (? IS NULL OR a.cliente_id = ?)
        AND (? = 1 OR a.ativo = 1)
        AND (? = '' OR a.nome LIKE ? OR c.nome LIKE ? OR a.raca LIKE ?)
      ORDER BY a.ativo DESC, a.nome COLLATE NOCASE`,
    clienteId ?? null,
    clienteId ?? null,
    incluirInativos ? 1 : 0,
    termo,
    `%${termo}%`,
    `%${termo}%`,
    `%${termo}%`,
  );
}

export async function obterAnimal(db: SQLiteDatabase, id: number): Promise<AnimalComTutor | null> {
  return db.getFirstAsync<AnimalComTutor>(`${SELECT_ANIMAL} WHERE a.id = ?`, id);
}

export async function criarAnimal(db: SQLiteDatabase, input: AnimalInput): Promise<number> {
  const dados = await validarAnimal(db, input);
  const resultado = await db.runAsync(
    `INSERT INTO animais (cliente_id, nome, especie, raca, porte, observacoes, ativo)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    dados.cliente_id,
    dados.nome,
    dados.especie,
    dados.raca,
    dados.porte,
    dados.observacoes,
  );
  return resultado.lastInsertRowId;
}

export async function atualizarAnimal(db: SQLiteDatabase, id: number, input: AnimalInput): Promise<void> {
  const atual = await obterAnimal(db, id);
  if (!atual) {
    throw new RegraNegocioError('Animal não encontrado.');
  }
  const dados = await validarAnimal(db, input, atual.cliente_id);

  if (dados.cliente_id !== atual.cliente_id) {
    // O histórico guarda cliente e animal; trocar o tutor deixaria agendamentos antigos inconsistentes.
    const vinculados = await db.getFirstAsync<{ total: number }>(
      'SELECT COUNT(*) AS total FROM agendamentos WHERE animal_id = ?',
      id,
    );
    if ((vinculados?.total ?? 0) > 0) {
      throw new RegraNegocioError(
        'Não é possível trocar o tutor de um animal que já possui agendamentos. Cadastre um novo animal para o novo tutor.',
      );
    }
  }

  await db.runAsync(
    `UPDATE animais
        SET cliente_id = ?, nome = ?, especie = ?, raca = ?, porte = ?, observacoes = ?
      WHERE id = ?`,
    dados.cliente_id,
    dados.nome,
    dados.especie,
    dados.raca,
    dados.porte,
    dados.observacoes,
    id,
  );
}

/** RN12: animais não são excluídos, apenas inativados. */
export async function definirAnimalAtivo(db: SQLiteDatabase, id: number, ativo: boolean): Promise<void> {
  await db.runAsync('UPDATE animais SET ativo = ? WHERE id = ?', ativo ? 1 : 0, id);
}
