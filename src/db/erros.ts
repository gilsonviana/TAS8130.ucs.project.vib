/**
 * Erro lançado quando uma regra de negócio é violada.
 * A mensagem é sempre pensada para ser exibida diretamente ao usuário.
 */
export class RegraNegocioError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RegraNegocioError';
  }
}

/** Converte qualquer erro em uma mensagem compreensível para o usuário. */
export function mensagemErro(erro: unknown): string {
  if (erro instanceof RegraNegocioError) {
    return erro.message;
  }

  const texto = erro instanceof Error ? erro.message : String(erro);

  if (texto.includes('UNIQUE constraint failed: pagamentos.agendamento_id')) {
    return 'Este atendimento já possui um registro financeiro.';
  }
  if (texto.includes('FOREIGN KEY constraint failed')) {
    return 'Operação não permitida: o registro está vinculado a outros dados.';
  }
  if (texto.includes('CHECK constraint failed') || texto.includes('NOT NULL constraint failed')) {
    return 'Alguns dados informados são inválidos. Revise os campos e tente novamente.';
  }

  console.error('[PetAgenda] Erro inesperado:', erro);
  return 'Não foi possível concluir a operação. Tente novamente.';
}
