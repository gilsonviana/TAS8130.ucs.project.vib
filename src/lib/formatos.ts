/**
 * Funções utilitárias de data, hora e moeda.
 * Datas são trabalhadas como texto `YYYY-MM-DD` e horas como `HH:MM`, iguais ao banco.
 */

const DIAS_CURTOS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const DIAS_ABREV = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_LONGOS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const MINUTOS_NO_DIA = 24 * 60;

function doisDigitos(valor: number): string {
  return String(valor).padStart(2, '0');
}

/** Converte um Date (horário local) em `YYYY-MM-DD`. */
export function dataParaISO(data: Date): string {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

/** Converte `YYYY-MM-DD` em Date no horário local (meio-dia, para evitar problemas de fuso). */
export function isoParaData(iso: string): Date {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(ano, mes - 1, dia, 12, 0, 0, 0);
}

export function hojeISO(): string {
  return dataParaISO(new Date());
}

export function somarDias(iso: string, dias: number): string {
  const data = isoParaData(iso);
  data.setDate(data.getDate() + dias);
  return dataParaISO(data);
}

/** Retorna a segunda-feira da semana da data informada. */
export function inicioDaSemana(iso: string): string {
  const diaSemana = isoParaData(iso).getDay(); // 0 = domingo
  const deslocamento = diaSemana === 0 ? -6 : 1 - diaSemana;
  return somarDias(iso, deslocamento);
}

export function inicioDoMes(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export function fimDoMes(iso: string): string {
  const data = isoParaData(inicioDoMes(iso));
  data.setMonth(data.getMonth() + 1);
  data.setDate(0);
  return dataParaISO(data);
}

export function diaDaSemana(iso: string): number {
  return isoParaData(iso).getDay();
}

export function nomeDiaCurto(diaSemana: number): string {
  return DIAS_CURTOS[diaSemana];
}

export function nomeDiaAbreviado(diaSemana: number): string {
  return DIAS_ABREV[diaSemana];
}

export function nomeDiaLongo(diaSemana: number): string {
  return DIAS_LONGOS[diaSemana];
}

/** `2026-10-08` → `08/10/2026` */
export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

/** `2026-10-08` → `Qui, 08/10/2026` */
export function formatarDataComDia(iso: string): string {
  return `${nomeDiaAbreviado(diaDaSemana(iso))}, ${formatarData(iso)}`;
}

/** Formata data/hora ISO 8601 completa (ex.: criado_em) como `08/10/2026 09:30`. */
export function formatarDataHora(isoCompleto: string): string {
  const data = new Date(isoCompleto);
  if (Number.isNaN(data.getTime())) {
    return isoCompleto;
  }
  return `${formatarData(dataParaISO(data))} ${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
}

export function horaValida(hora: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(hora)) {
    return false;
  }
  const [h, m] = hora.split(':').map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

export function dataValida(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return false;
  }
  return dataParaISO(isoParaData(iso)) === iso;
}

export function horaParaMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

export function minutosParaHora(minutos: number): string {
  return `${doisDigitos(Math.floor(minutos / 60))}:${doisDigitos(minutos % 60)}`;
}

/**
 * Calcula o término previsto. Retorna `null` se o atendimento ultrapassar 23:59,
 * pois a versão atual não permite atendimentos que avancem para o dia seguinte.
 */
export function calcularHoraFim(horaInicio: string, duracaoMinutos: number): string | null {
  if (!horaValida(horaInicio) || !Number.isInteger(duracaoMinutos) || duracaoMinutos <= 0) {
    return null;
  }
  const fim = horaParaMinutos(horaInicio) + duracaoMinutos;
  if (fim >= MINUTOS_NO_DIA) {
    return null;
  }
  return minutosParaHora(fim);
}

export function horaDeDate(data: Date): string {
  return `${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
}

export function dateComHora(hora: string): Date {
  const data = new Date();
  const [h, m] = horaValida(hora) ? hora.split(':').map(Number) : [9, 0];
  data.setHours(h, m, 0, 0);
  return data;
}

/** Formata duração em minutos: 90 → `1h30`, 45 → `45 min`. */
export function formatarDuracao(minutos: number): string {
  if (minutos < 60) {
    return `${minutos} min`;
  }
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `${horas}h` : `${horas}h${doisDigitos(resto)}`;
}

/** 1234.5 → `R$ 1.234,50` */
export function formatarMoeda(valor: number): string {
  const negativo = valor < 0;
  const [inteiro, centavos] = Math.abs(valor).toFixed(2).split('.');
  const comMilhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negativo ? '-' : ''}R$ ${comMilhar},${centavos}`;
}

/** 65 → `65,00` (para preencher campos de valor). */
export function valorParaCampo(valor: number): string {
  return valor.toFixed(2).replace('.', ',');
}

/**
 * Converte o texto digitado em número. Aceita `65`, `65,5`, `1.234,50` e `1234.50`.
 * Retorna `null` se o texto não for um valor válido.
 */
export function campoParaValor(texto: string): number | null {
  let limpo = texto.replace(/R\$|\s/g, '');
  if (limpo === '') {
    return null;
  }
  if (limpo.includes(',')) {
    limpo = limpo.replace(/\./g, '').replace(',', '.');
  }
  if (!/^\d+(\.\d{1,2})?$/.test(limpo)) {
    return null;
  }
  return Number(limpo);
}

export function formatarPercentual(fracao: number): string {
  return `${(fracao * 100).toFixed(1).replace('.', ',')}%`;
}

/** Remove espaços e transforma texto vazio em null (para campos opcionais). */
export function textoOpcional(valor: string | null | undefined): string | null {
  const limpo = valor?.trim() ?? '';
  return limpo === '' ? null : limpo;
}
