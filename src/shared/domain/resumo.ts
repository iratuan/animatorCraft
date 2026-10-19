import { ROTEIRO_EXEMPLO } from './exemplo';

/** Resumo barato de um roteiro (só conta linhas e palavras; não interpreta), para a tela inicial abrir sem carregar o motor. */
export interface ResumoRoteiro {
  /** nada escrito além do que o app cria sozinho (linha de papéis, "# Cena 1") */
  vazio: boolean;
  /** é o roteiro de exemplo que vem com o app, sem alterações */
  exemplo: boolean;
  cenas: number;
  /** título da primeira cena com texto */
  titulo: string;
  palavras: number;
}

export function resumirRoteiro(texto: string): ResumoRoteiro {
  const linhas = texto.split(/\r?\n/);
  const titulos = linhas.map((l) => /^#\s+(.*\S)\s*$/.exec(l)?.[1]).filter((t): t is string => !!t);
  const corpo = linhas.filter((l) => l.trim() && !/^#\s/.test(l) && !/^\s*\[\s*pap[eé]is\s*:/i.test(l));
  const palavras = corpo.join(' ').replace(/\[[^\]]*\]/g, ' ').split(/\s+/).filter(Boolean).length;
  return {
    vazio: palavras === 0,
    exemplo: texto.trim() === ROTEIRO_EXEMPLO.trim(),
    cenas: titulos.length,
    titulo: titulos[0] ?? '',
    palavras,
  };
}
