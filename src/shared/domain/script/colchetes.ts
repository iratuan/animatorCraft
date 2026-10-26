import { ATORES } from '../characters';
import { clipesPersonalizados } from '../clipes';
import { EXPRESSOES, FRASE_POSE } from '../poses';
import { semAcento } from '../../util/texto';

/**
 * "[[...]]" no roteiro: referência a algo que já existe (lousa, imagem, clipe) ou uma ação completa escolhida no menu.
 * Dentro dos colchetes o texto é lido como uma frase comum: "Professor [[aponta para a lousa]]" = "Professor aponta para a lousa".
 */

/** "[[aponta para a lousa]]" -> "aponta para a lousa": o que está entre colchetes duplos é lido como frase comum. */
export const desembrulharColchetes = (s: string): string => s.replace(/\[\[\s*([^[\]]*?)\s*\]\]/g, '$1');

/** "[[" aberto logo antes do cursor: `inicio` é a posição do primeiro "[" e `filtro` o texto digitado depois. */
export interface Colchetes { inicio: number; filtro: string }

export interface OpcaoColchetes { chave: string; grupo: 'Elementos' | 'Ações'; rotulo: string; detalhe: string; conteudo: string }

export function colchetesNoCursor(texto: string, cursor: number): Colchetes | null {
  const antes = texto.slice(0, cursor);
  const m = /\[\[([^[\]\n]{0,80})$/.exec(antes);
  if (!m) return null;
  return { inicio: antes.length - m[0].length, filtro: m[1] ?? '' };
}

/** Ações do menu: as frases que o parser já entende, sem sujeito (o sujeito é o personagem escrito antes). */
const ACOES_BASE = [
  'dança', 'aponta para a lousa', 'entra pela esquerda andando', 'sai pela direita andando',
  'anda para a posição 50%', 'diz "Olá!"', 'escreve "Texto" no quadro', 'espera 2 segundos', 'apaga',
];

/** Nomes de imagem citados no roteiro ("mostra a imagem ciclo.png"), sem repetição: são os elementos que o menu oferece. */
export function imagensCitadas(texto: string): string[] {
  const nomes = [...texto.matchAll(/\bimagem\s+(?:"([^"]+)"|([^\s"]+))/gi)].map((m) => (m[1] ?? m[2] ?? '').replace(/[.,;!?]+$/, ''));
  return [...new Set(nomes.filter(Boolean))];
}

/** Opções do menu "[[": elementos já existentes primeiro, depois ações. `imagens` são os nomes de arquivo citados no roteiro. */
export function opcoesColchetes(filtro: string, imagens: string[]): OpcaoColchetes[] {
  const elementos: OpcaoColchetes[] = [
    { chave: 'elem:lousa', grupo: 'Elementos', rotulo: 'Lousa (quadro)', detalhe: 'quadro branco da cena', conteudo: 'lousa' },
    // a imagem entra com a ação que a mostra ("mostra a imagem ..."): sem o verbo o parser não a reconhece
    ...imagens.map((nome): OpcaoColchetes => ({
      chave: `elem:imagem:${nome}`, grupo: 'Elementos', rotulo: `Imagem ${nome}`, detalhe: 'já citada no roteiro',
      conteudo: /\s/.test(nome) ? `mostra a imagem "${nome}"` : `mostra a imagem ${nome}`,
    })),
  ];
  const poses = Object.values(FRASE_POSE).filter((f): f is string => !!f).map((f): OpcaoColchetes => ({ chave: `acao:${f}`, grupo: 'Ações', rotulo: f, detalhe: 'pose', conteudo: f }));
  const base = ACOES_BASE.map((f): OpcaoColchetes => ({ chave: `acao:${f}`, grupo: 'Ações', rotulo: f, detalhe: 'ação', conteudo: f }));
  const expressoes = EXPRESSOES.map((e): OpcaoColchetes => ({ chave: `acao:cara:${e}`, grupo: 'Ações', rotulo: `faz cara de ${e}`, detalhe: 'expressão', conteudo: `faz cara de ${e}` }));
  const clipes = clipesPersonalizados().map((c): OpcaoColchetes => ({
    chave: `clipe:${c.ator}:${c.id}`, grupo: 'Ações', rotulo: `faz o clipe ${c.nome}`, detalhe: `clipe de ${ATORES[c.ator]?.nome ?? c.ator}`,
    conteudo: /\s/.test(c.nome) ? `faz o clipe "${c.nome}"` : `faz o clipe ${c.nome}`,
  }));
  const todas = [...elementos, ...base, ...poses, ...expressoes, ...clipes];
  const f = semAcento(filtro.trim());
  const unicas = [...new Map(todas.map((o) => [o.chave, o])).values()];
  if (!f) return unicas;
  const casam = unicas.filter((o) => semAcento(`${o.rotulo} ${o.conteudo}`).includes(f));
  // quem começa com o filtro vem antes de quem só o contém; a ordem de grupo (Elementos, Ações) se mantém dentro de cada um
  const prioridade = (o: OpcaoColchetes) => (semAcento(o.rotulo).startsWith(f) ? 0 : 1);
  return casam.sort((a, b) => prioridade(a) - prioridade(b));
}

/** Substitui "[[filtro" pelo conteúdo escolhido, já entre colchetes. Se o "]]" automático já estiver depois do cursor, ele é aproveitado. */
export function inserirColchetes(texto: string, gatilho: Colchetes, cursor: number, conteudo: string): { texto: string; cursor: number } {
  let depois = texto.slice(cursor);
  if (depois.startsWith(']]')) depois = depois.slice(2);
  const novo = `${texto.slice(0, gatilho.inicio)}[[${conteudo}]]${depois}`;
  return { texto: novo, cursor: gatilho.inicio + conteudo.length + 4 };
}

/**
 * Teclas de edição dos colchetes: digitar o segundo "[" fecha com "]]" e deixa o cursor no meio;
 * digitar "]" com um "]" logo depois do cursor, dentro de "[[...", só avança o cursor (não duplica).
 * Devolve null quando a tecla deve seguir o caminho normal.
 */
export function teclaColchetes(texto: string, cursor: number, tecla: string): { texto: string; cursor: number } | null {
  const antes = texto.slice(0, cursor);
  const depois = texto.slice(cursor);
  if (tecla === '[' && antes.endsWith('[') && !antes.endsWith('[[') && !depois.startsWith(']')) {
    return { texto: `${antes}[]]${depois}`, cursor: cursor + 1 };
  }
  // dentro de "[[..." (já com um "]" avançado, se for o caso): o próximo "]" é o que já está depois do cursor
  if (tecla === ']' && depois.startsWith(']') && /\[\[[^[\]\n]*\]?$/.test(antes)) {
    return { texto, cursor: cursor + 1 };
  }
  return null;
}
