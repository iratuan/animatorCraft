import type { Origem } from '../types';
import { parseRoteiro } from './parser';

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

type ConteudoImagem = Extract<import('../types').Conteudo, { tipo: 'imagem' }>;

/** Frase do roteiro que corresponde a uma imagem na lousa (usada ao inserir e ao trocar efeitos pela linha do tempo). */
export function fraseDaImagem(nomeAtor: string, c: ConteudoImagem): string {
  const arq = /\s/.test(c.arquivo) ? `"${c.arquivo}"` : c.arquivo;
  const efeito = (e: string) => e === 'nenhum' ? 'sem efeito' : `efeito ${e.replace('-', ' da ').replace('da cima', 'de cima').replace('da baixo', 'de baixo')}`;
  const partes = [`${nomeAtor} mostra a imagem ${arq} no quadro`];
  if (c.posicao !== 'centro') partes.push(`no canto ${c.posicao === 'esquerda' ? 'esquerdo' : 'direito'}`);
  if (c.tamanho !== 'media') partes.push(c.tamanho);
  partes.push(`com ${efeito(c.entrada)}`);
  if (c.saida) partes.push(`e sai com ${efeito(c.saida)}`);
  if (c.exibirPor) partes.push(`por ${String(c.exibirPor).replace('.', ',')} segundos`);
  return `${partes.join(' ')}.`;
}

/** Troca a frase da imagem por uma nova (efeito, canto, tamanho, tempo). */
export function reescreverImagem(texto: string, alvo: Origem, nomeAtor: string, c: ConteudoImagem): string {
  return texto.slice(0, alvo.ini) + fraseDaImagem(nomeAtor, c) + texto.slice(alvo.fim);
}

/**
 * Insere `trecho` no ponto do roteiro onde está o cursor: depois da frase que contém o cursor, ou da última frase que termina antes dele;
 * se o cursor está antes de todas, entra antes da primeira. Assim "inserir no determinado trecho do roteiro" vale para imagens, falas, etc.
 */
export function inserirNoCursor(texto: string, cursor: number, trecho: string): string {
  const origens = parseRoteiro(texto).cenas.flatMap((c) => c.origens);
  const unicas = [...new Map(origens.map((o) => [o.ini, o])).values()].sort((a, b) => a.ini - b.ini);
  if (!unicas.length) return `${texto.trimEnd()}${texto.trim() ? '\n' : ''}${trecho}\n`;
  const dentro = unicas.find((o) => o.ini <= cursor && cursor <= o.fim);
  const antes = [...unicas].reverse().find((o) => o.fim <= cursor);
  const alvo = dentro ?? antes;
  if (!alvo) return `${texto.slice(0, unicas[0]!.ini)}${trecho} ${texto.slice(unicas[0]!.ini)}`;
  return `${texto.slice(0, alvo.fim)} ${trecho}${texto.slice(alvo.fim)}`;
}

