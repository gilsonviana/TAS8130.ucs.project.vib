import { useFocusEffect } from 'expo-router';
import { type SQLiteDatabase, useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';

import { mensagemErro } from '@/db/erros';

/**
 * Executa uma consulta no banco sempre que a tela ganha foco
 * (assim os dados ficam atualizados ao voltar de um formulário).
 *
 * O `loader` deve ser estável (envolvido em useCallback) — quando ele muda, a consulta é refeita.
 */
export function useFocusQuery<T>(loader: (db: SQLiteDatabase) => Promise<T>) {
  const db = useSQLiteContext();
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Identifica a execução mais recente; respostas de execuções antigas são descartadas.
  const execucaoAtual = useRef(0);

  const executar = useCallback(() => {
    const execucao = ++execucaoAtual.current;
    const vigente = () => execucao === execucaoAtual.current;
    setLoading(true);
    loader(db)
      .then((resultado) => {
        if (vigente()) {
          setData(resultado);
          setError(null);
        }
      })
      .catch((erro: unknown) => {
        if (vigente()) setError(mensagemErro(erro));
      })
      .finally(() => {
        if (vigente()) setLoading(false);
      });
  }, [db, loader]);

  useFocusEffect(executar);

  return { data, error, loading, recarregar: executar };
}
