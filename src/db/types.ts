/**
 * Tipos que representam as linhas das tabelas do SQLite.
 * Os nomes dos campos seguem as colunas do banco (docs/03-modelagem-banco-de-dados.md).
 */

export type StatusAgendamento = 'AGENDADO' | 'CONCLUIDO' | 'CANCELADO';
export type StatusPagamento = 'REGISTRADO' | 'ESTORNADO';

/** Valores 0/1 usados nas colunas booleanas do SQLite. */
export type FlagAtivo = 0 | 1;

export interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  email: string | null;
  endereco: string | null;
  ativo: FlagAtivo;
  criado_em: string;
}

export interface ClienteResumo extends Cliente {
  total_animais: number;
}

export interface Animal {
  id: number;
  cliente_id: number;
  nome: string;
  especie: string;
  raca: string | null;
  porte: string | null;
  observacoes: string | null;
  ativo: FlagAtivo;
}

export interface AnimalComTutor extends Animal {
  cliente_nome: string;
  cliente_ativo: FlagAtivo;
}

export interface Servico {
  id: number;
  nome: string;
  descricao: string | null;
  duracao_minutos: number;
  preco_referencia: number;
  ativo: FlagAtivo;
}

export interface Agendamento {
  id: number;
  cliente_id: number;
  animal_id: number;
  servico_id: number;
  /** YYYY-MM-DD */
  data: string;
  /** HH:MM */
  hora_inicio: string;
  /** HH:MM */
  hora_fim: string;
  duracao_minutos: number;
  valor: number;
  status: StatusAgendamento;
  observacoes: string | null;
  criado_em: string;
}

/** Agendamento com os dados de cliente, animal, serviço e pagamento já resolvidos. */
export interface AgendamentoDetalhado extends Agendamento {
  cliente_nome: string;
  cliente_telefone: string;
  animal_nome: string;
  animal_especie: string;
  animal_raca: string | null;
  servico_nome: string;
  pagamento_id: number | null;
  pagamento_valor: number | null;
  pagamento_forma: string | null;
  pagamento_status: StatusPagamento | null;
  pagamento_registrado_em: string | null;
}

export interface Pagamento {
  id: number;
  agendamento_id: number;
  valor: number;
  forma_pagamento: string | null;
  status: StatusPagamento;
  registrado_em: string;
}
