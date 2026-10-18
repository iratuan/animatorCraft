import type { Origem } from '../types';

/**
 * Edições da linha do tempo que reescrevem o texto do roteiro (a fonte da verdade é sempre o texto).
 * Cada função recebe o texto e a origem (posição da frase) vinda de `Evento.origem`, e devolve o texto novo.
 */

const MARCA = /^(ao mesmo tempo|simultaneamente)\s*[,:]?\s*/i;
const maiuscula = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s);
const fraseCom = (s: string) => (/[.!?]$/.test(s) ? s : `${s}.`);

/** Frase sem a marca "Ao mesmo tempo," e sem "Enquanto A, B" (que vira A. B.). */
function frasePura(frase: string): string {
  let f = frase.trim();
  const m = MARCA.exec(f);
  if (m) f = f.slice(m[0].length);
  return maiuscula(f.trim());
}

/** Remove [ini, fim) e um espaço vizinho, para não deixar buraco. */
function remover(texto: string, o: Origem): { texto: string; delta: number } {
  let { ini, fim } = o;
  if (ini > 0 && texto[ini - 1] === ' ') ini--;
  else if (texto[fim] === ' ') fim++;
  return { texto: texto.slice(0, ini) + texto.slice(fim), delta: fim - ini };
}

/** Apaga "Enquanto" de uma frase com duas partes, devolvendo duas frases em sequência. */
function desfazerEnquanto(frase: string): string {
  const mascara = frase.replace(/"[^"]*"|\$[^$]*\$/g, (m) => ' '.repeat(m.length)).toLowerCase();
  const inicio = /^enquanto\s/.exec(mascara);
  if (inicio) {
    const v = mascara.indexOf(',');
    if (v < 0) return frase;
    return `${fraseCom(maiuscula(frase.slice(inicio[0].length, v).trim()))} ${fraseCom(maiuscula(frase.slice(v + 1).trim()))}`;
  }
  const meio = /\senquanto\s/.exec(mascara);
  if (meio) return `${fraseCom(maiuscula(frase.slice(0, meio.index).trim()))} ${fraseCom(maiuscula(frase.slice(meio.index + meio[0].length).trim()))}`;
  return frase;
}

/** `alvo` passa a acontecer junto com `ancora` (vai para logo depois dela, com "Ao mesmo tempo,"). */
export function tornarSimultanea(texto: string, alvo: Origem, ancora: Origem): string {
  if (alvo.ini === ancora.ini) return texto;
  const nova = `Ao mesmo tempo, ${frasePura(desfazerEnquanto(texto.slice(alvo.ini, alvo.fim)))}`;
  const sem = remover(texto, alvo);
  const fimAncora = ancora.fim - (alvo.ini < ancora.ini ? sem.delta : 0);
  return `${sem.texto.slice(0, fimAncora)} ${nova}${sem.texto.slice(fimAncora)}`;
}

/** Tira a simultaneidade de `alvo`; com `depoisDe`, também o move para logo depois dessa frase. */
export function tornarSequencial(texto: string, alvo: Origem, depoisDe?: Origem): string {
  const original = texto.slice(alvo.ini, alvo.fim);
  const limpa = desfazerEnquanto(frasePura(original));
  if (!depoisDe || depoisDe.ini === alvo.ini) return texto.slice(0, alvo.ini) + limpa + texto.slice(alvo.fim);
  const sem = remover(texto, alvo);
  const fim = depoisDe.fim - (alvo.ini < depoisDe.ini ? sem.delta : 0);
  return `${sem.texto.slice(0, fim)} ${limpa}${sem.texto.slice(fim)}`;
}

/** Troca (ou acrescenta) "por N segundos" na frase. */
export function reescreverDuracao(texto: string, alvo: Origem, segundos: number): string {
  const s = Math.max(0.5, Math.round(segundos * 10) / 10);
  const frase = texto.slice(alvo.ini, alvo.fim);
  const numero = String(s).replace('.', ',');
  const pausa = /(\d+(?:[.,]\d+)?)(\s*segundos?)/i;
  let nova: string;
  if (/\bpor\s+\d/i.test(frase) || /\b(espera|pausa|aguarda)\b/i.test(frase)) nova = frase.replace(pausa, `${numero}$2`);
  else nova = frase.replace(/([.!?])$/, ` por ${numero} segundos$1`);
  return texto.slice(0, alvo.ini) + nova + texto.slice(alvo.fim);
}

/** Apaga a frase. */
export function excluirFrase(texto: string, alvo: Origem): string {
  return remover(texto, alvo).texto;
}

/**
 * Registra no roteiro que `nome` ficou na posição `pct`% da largura do palco (arrastar o sprite no palco).
 * `substituir` (a frase "fica na posição N%" já existente do mesmo personagem) é reescrita; senão a frase entra logo depois de `ancora`
 * (ou no fim do texto). A ação tem duração zero, então não atrasa nada que vem depois.
 */
export function posicionarNoRoteiro(texto: string, nome: string, pct: number, ancora?: Origem, substituir?: Origem): string {
  const n = Math.min(100, Math.max(0, Math.round(pct)));
  const frase = `${nome} fica na posição ${n}%.`;
  if (substituir) return texto.slice(0, substituir.ini) + frase + texto.slice(substituir.fim);
  if (!ancora) return `${texto.trimEnd()} ${frase}\n`;
  return `${texto.slice(0, ancora.fim)} ${frase}${texto.slice(ancora.fim)}`;
}
