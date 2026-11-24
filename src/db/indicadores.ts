import type { SQLiteDatabase } from 'expo-sqlite';

import type { StatusAgendamento } from './types';

export interface ServicoRanking {
  servico_id: number;
  nome: string;
  total: number;
  valor: number;
}

export interface Indicadores {
  total: number;
  agendados: number;
  concluidos: number;
  cancelados: number;
  /** Soma dos pagamentos registrados de atendimentos concluídos (RN10). */
  faturamento: number;
  ticketMedio: number;
  /** Cancelados / total de agendamentos no período (0 a 1). */
  taxaCancelamento: number;
  servicosMaisRealizados: ServicoRanking[];
  /** Índice 0 = domingo … 6 = sábado. */
  porDiaDaSemana: number[];
  porHora: { hora: string; total: number }[];
}

/** RF10: indicadores gerenciais calculados com os dados locais, para um intervalo de datas (inclusivo). */
export async function calcularIndicadores(db: SQLiteDatabase, inicio: string, fim: string): Promise<Indicadores> {
  const [porStatus, financeiro, ranking, porDia, porHora] = await Promise.all([
    db.getAllAsync<{ status: StatusAgendamento; total: number }>(
      `SELECT status, COUNT(*) AS total
         FROM agendamentos
        WHERE data BETWEEN ? AND ?
        GROUP BY status`,
      inicio,
      fim,
    ),
    // RN10: faturamento considera apenas atendimentos concluídos com pagamento registrado.
    db.getFirstAsync<{ faturamento: number; quantidade: number }>(
      `SELECT COALESCE(SUM(p.valor), 0) AS faturamento, COUNT(p.id) AS quantidade
         FROM pagamentos p
         JOIN agendamentos a ON a.id = p.agendamento_id
        WHERE p.status = 'REGISTRADO'
          AND a.status = 'CONCLUIDO'
          AND a.data BETWEEN ? AND ?`,
      inicio,
      fim,
    ),
    db.getAllAsync<ServicoRanking>(
      `SELECT s.id AS servico_id, s.nome, COUNT(*) AS total, COALESCE(SUM(p.valor), 0) AS valor
         FROM agendamentos a
         JOIN servicos s ON s.id = a.servico_id
         LEFT JOIN pagamentos p ON p.agendamento_id = a.id AND p.status = 'REGISTRADO'
        WHERE a.status = 'CONCLUIDO'
          AND a.data BETWEEN ? AND ?
        GROUP BY s.id, s.nome
        ORDER BY total DESC, valor DESC
        LIMIT 5`,
      inicio,
      fim,
    ),
    db.getAllAsync<{ dia: number; total: number }>(
      `SELECT CAST(strftime('%w', data) AS INTEGER) AS dia, COUNT(*) AS total
         FROM agendamentos
        WHERE status <> 'CANCELADO'
          AND data BETWEEN ? AND ?
        GROUP BY dia`,
      inicio,
      fim,
    ),
    db.getAllAsync<{ hora: string; total: number }>(
      `SELECT substr(hora_inicio, 1, 2) || 'h' AS hora, COUNT(*) AS total
         FROM agendamentos
        WHERE status <> 'CANCELADO'
          AND data BETWEEN ? AND ?
        GROUP BY substr(hora_inicio, 1, 2)
        ORDER BY hora`,
      inicio,
      fim,
    ),
  ]);

  const contagem: Record<StatusAgendamento, number> = { AGENDADO: 0, CONCLUIDO: 0, CANCELADO: 0 };
  for (const linha of porStatus) {
    contagem[linha.status] = linha.total;
  }
  const total = contagem.AGENDADO + contagem.CONCLUIDO + contagem.CANCELADO;

  const faturamento = financeiro?.faturamento ?? 0;
  const quantidadePagamentos = financeiro?.quantidade ?? 0;

  const porDiaDaSemana = [0, 0, 0, 0, 0, 0, 0];
  for (const linha of porDia) {
    porDiaDaSemana[linha.dia] = linha.total;
  }

  return {
    total,
    agendados: contagem.AGENDADO,
    concluidos: contagem.CONCLUIDO,
    cancelados: contagem.CANCELADO,
    faturamento,
    ticketMedio: quantidadePagamentos > 0 ? faturamento / quantidadePagamentos : 0,
    taxaCancelamento: total > 0 ? contagem.CANCELADO / total : 0,
    servicosMaisRealizados: ranking,
    porDiaDaSemana,
    porHora,
  };
}

export interface ResumoBanco {
  clientes: number;
  animais: number;
  servicos: number;
  agendamentos: number;
}

export async function obterResumoBanco(db: SQLiteDatabase): Promise<ResumoBanco> {
  const resumo = await db.getFirstAsync<ResumoBanco>(
    `SELECT (SELECT COUNT(*) FROM clientes WHERE ativo = 1) AS clientes,
            (SELECT COUNT(*) FROM animais WHERE ativo = 1) AS animais,
            (SELECT COUNT(*) FROM servicos WHERE ativo = 1) AS servicos,
            (SELECT COUNT(*) FROM agendamentos) AS agendamentos`,
  );
  return resumo ?? { clientes: 0, animais: 0, servicos: 0, agendamentos: 0 };
}
