import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'petagenda.db';

/** Versão atual do esquema. Incrementar ao adicionar uma nova migração. */
const DATABASE_VERSION = 1;

const SQL_V1 = `
CREATE TABLE IF NOT EXISTS clientes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nome       TEXT    NOT NULL CHECK (length(trim(nome)) > 0),
  telefone   TEXT    NOT NULL CHECK (length(trim(telefone)) > 0),
  email      TEXT,
  endereco   TEXT,
  ativo      INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1)),
  criado_em  TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS animais (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id  INTEGER NOT NULL REFERENCES clientes (id) ON DELETE RESTRICT,
  nome        TEXT    NOT NULL CHECK (length(trim(nome)) > 0),
  especie     TEXT    NOT NULL CHECK (length(trim(especie)) > 0),
  raca        TEXT,
  porte       TEXT,
  observacoes TEXT,
  ativo       INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1))
);

CREATE TABLE IF NOT EXISTS servicos (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  nome             TEXT    NOT NULL CHECK (length(trim(nome)) > 0),
  descricao        TEXT,
  duracao_minutos  INTEGER NOT NULL CHECK (duracao_minutos > 0),
  preco_referencia REAL    NOT NULL CHECK (preco_referencia >= 0),
  ativo            INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1))
);

CREATE TABLE IF NOT EXISTS agendamentos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id      INTEGER NOT NULL REFERENCES clientes (id) ON DELETE RESTRICT,
  animal_id       INTEGER NOT NULL REFERENCES animais (id) ON DELETE RESTRICT,
  servico_id      INTEGER NOT NULL REFERENCES servicos (id) ON DELETE RESTRICT,
  data            TEXT    NOT NULL CHECK (data GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  hora_inicio     TEXT    NOT NULL CHECK (hora_inicio GLOB '[0-2][0-9]:[0-5][0-9]'),
  hora_fim        TEXT    NOT NULL CHECK (hora_fim GLOB '[0-2][0-9]:[0-5][0-9]'),
  duracao_minutos INTEGER NOT NULL CHECK (duracao_minutos > 0),
  valor           REAL    NOT NULL CHECK (valor >= 0),
  status          TEXT    NOT NULL DEFAULT 'AGENDADO'
                          CHECK (status IN ('AGENDADO', 'CONCLUIDO', 'CANCELADO')),
  observacoes     TEXT,
  criado_em       TEXT    NOT NULL,
  CHECK (hora_fim > hora_inicio)
);

CREATE TABLE IF NOT EXISTS pagamentos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  agendamento_id  INTEGER NOT NULL UNIQUE REFERENCES agendamentos (id) ON DELETE RESTRICT,
  valor           REAL    NOT NULL CHECK (valor >= 0),
  forma_pagamento TEXT,
  status          TEXT    NOT NULL DEFAULT 'REGISTRADO'
                          CHECK (status IN ('REGISTRADO', 'ESTORNADO')),
  registrado_em   TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_animais_cliente          ON animais (cliente_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data_status ON agendamentos (data, status);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status      ON agendamentos (status);
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente     ON agendamentos (cliente_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_animal      ON agendamentos (animal_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_servico     ON agendamentos (servico_id);
`;

/** Serviços cadastrados na primeira execução, para o app já ser utilizável. Podem ser editados/inativados. */
const SERVICOS_PADRAO: { nome: string; descricao: string; duracao: number; preco: number }[] = [
  { nome: 'Banho', descricao: 'Banho completo com secagem', duracao: 60, preco: 65 },
  { nome: 'Tosa', descricao: 'Tosa higiênica ou na máquina', duracao: 60, preco: 70 },
  { nome: 'Banho e tosa', descricao: 'Banho completo seguido de tosa', duracao: 90, preco: 110 },
  { nome: 'Corte de unhas', descricao: 'Corte e lixamento das unhas', duracao: 15, preco: 25 },
];

/**
 * Executado pelo SQLiteProvider antes de renderizar o app.
 * Ativa as chaves estrangeiras na conexão e aplica as migrações pendentes.
 */
export async function inicializarBanco(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const resultado = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const versaoAtual = resultado?.user_version ?? 0;

  if (versaoAtual >= DATABASE_VERSION) {
    return;
  }

  if (versaoAtual < 1) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(SQL_V1);
      for (const servico of SERVICOS_PADRAO) {
        await db.runAsync(
          'INSERT INTO servicos (nome, descricao, duracao_minutos, preco_referencia) VALUES (?, ?, ?, ?)',
          servico.nome,
          servico.descricao,
          servico.duracao,
          servico.preco,
        );
      }
    });
  }

  // Próximas migrações: if (versaoAtual < 2) { ... }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
