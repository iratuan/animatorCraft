import { ATORES } from '../characters';
import { clipesDoPersonagem } from '../clipes';
import { expressoesDe } from '../expressoes';
import { semAcento } from '../../util/texto';
import type { Diagnostico } from '../types';
import { desembrulharColchetes, opcoesColchetes } from './colchetes';

/** Mensagens que significam "o app não consegue executar esta frase"; as demais são avisos. */
const ERROS = /não entendida|Sem ator reconhecido|não tem o clipe|não tem a expressão|Papel não entendido|Falta o nome|Diga o nome/;

/**
 * Transforma um aviso de frase em diagnóstico com as sugestões de correção.
 * `frase` é o texto da frase como está no roteiro; `ini` e `fim` são a posição dela no texto.
 */
export function diagnosticoDe(mensagem: string, frase: string, ini: number, fim: number): Diagnostico {
  const limpa = desembrulharColchetes(frase);
  let sugestoes: string[] = [];
  if (/Sem ator reconhecido/.test(mensagem)) sugestoes = sugestoesDeFrase(limpa, 'sujeito');
  else if (/não tem o clipe|não tem a expressão/.test(mensagem)) sugestoes = sugestoesDeFrase(limpa, 'predicado', candidatosDoAtor(limpa));
  else if (/não entendida/.test(mensagem)) sugestoes = sugestoesDeFrase(limpa, 'predicado');
  return { mensagem, ini, fim, gravidade: ERROS.test(mensagem) ? 'erro' : 'aviso', sugestoes };
}

/** Distância de edição (Levenshtein) entre duas palavras, já sem acento e em minúsculas. */
export function distancia(a: string, b: string): number {
  const x = semAcento(a);
  const y = semAcento(b);
  let anterior = Array.from({ length: y.length + 1 }, (_, j) => j);
  for (let i = 1; i <= x.length; i++) {
    const atual = [i];
    for (let j = 1; j <= y.length; j++) {
      const custo = x[i - 1] === y[j - 1] ? 0 : 1;
      atual[j] = Math.min(anterior[j]! + 1, atual[j - 1]! + 1, anterior[j - 1]! + custo);
    }
    anterior = atual;
  }
  return anterior[y.length]!;
}

/** Até `max` candidatos parecidos com `termo`, do mais parecido para o menos. Vazio quando nada chega perto (um terço das letras). */
export function sugerirParecidos(termo: string, candidatos: string[], max = 3): string[] {
  const t = semAcento(termo).trim();
  if (!t) return [];
  const limite = Math.max(1, Math.ceil(t.length / 3));
  const unicos = [...new Set(candidatos)];
  return unicos
    .map((c) => ({ c, d: distancia(t, c) }))
    .filter((x) => x.d <= limite)
    .sort((a, b) => a.d - b.d)
    .slice(0, max)
    .map((x) => x.c);
}

/** Palavras com que um personagem pode começar a frase: nome, apelidos e os papéis da aula. */
const NOMES_DE_ATOR = new Set<string>(
  Object.values(ATORES).flatMap((a) => [a.nome, ...a.apelidos]).map((n) => semAcento(n)).concat(['professor', 'professora', 'aluno']),
);

/** Separa a frase em sujeito (quem faz, no começo) e predicado (o que faz), mantendo a pontuação final à parte. */
export function separarFrase(frase: string): { sujeito: string; predicado: string; final: string } {
  const final = /[.!?]+$/.exec(frase)?.[0] ?? '';
  const semFinal = frase.slice(0, frase.length - final.length).trimEnd();
  let fimSujeito = 0;
  for (const m of semFinal.matchAll(/\S+/g)) {
    const palavra = semAcento(m[0].replace(/[,;:"]/g, ''));
    if (palavra === 'e' || palavra === '') continue; // "e" só conta se vier entre dois nomes
    if (!NOMES_DE_ATOR.has(palavra)) break;
    fimSujeito = m.index! + m[0].length;
  }
  return {
    sujeito: semFinal.slice(0, fimSujeito),
    predicado: semFinal.slice(fimSujeito).trim(),
    final,
  };
}

/** Ações que o app entende, sem sujeito: as mesmas do menu "[[". */
export function catalogoDeAcoes(): string[] {
  return opcoesColchetes('', []).filter((o) => o.grupo === 'Ações').map((o) => o.conteudo);
}

/** Primeiro personagem citado na frase, se houver (para sugerir só expressões e clipes que ele tem). */
export function atorDaFrase(frase: string): string | undefined {
  const palavras = semAcento(frase).match(/[a-z0-9]+/g) ?? [];
  for (const id of Object.keys(ATORES)) {
    const a = ATORES[id]!;
    if (palavras.some((p) => [a.nome, ...a.apelidos].map(semAcento).some((n) => n === p))) return id;
  }
  return undefined;
}

/**
 * Frases corrigidas que o usuário pode aplicar no lugar da frase com problema.
 * - `predicado`: o que fazer não existe ou está escrito de outro jeito; sugere ações do catálogo (ou as do personagem, se `candidatos` vier).
 * - `sujeito`: o personagem não foi reconhecido; sugere o nome parecido no começo da frase.
 */
export function sugestoesDeFrase(frase: string, motivo: 'predicado' | 'sujeito', candidatos?: string[]): string[] {
  const { sujeito, predicado, final } = separarFrase(frase);
  if (motivo === 'sujeito') {
    const primeira = /^\S+/.exec(frase)?.[0] ?? '';
    const resto = frase.slice(primeira.length).trimStart();
    const nomes = Object.values(ATORES).map((a) => a.nome).concat(['Professor', 'Aluno']);
    return sugerirParecidos(primeira.replace(/[.,;:!?"]/g, ''), nomes).map((n) => `${n} ${resto}`);
  }
  const acoes = sugerirParecidos(predicado, candidatos ?? catalogoDeAcoes());
  return acoes.map((a) => (sujeito ? `${sujeito} ${a}${final}` : `${a}${final}`));
}

/** Ações de expressão e de clipe que o personagem da frase realmente tem. */
export function candidatosDoAtor(frase: string): string[] {
  const id = atorDaFrase(frase);
  if (!id) return [];
  const caras = expressoesDe(id).map((e) => `faz cara de ${e}`);
  const clipes = clipesDoPersonagem(id).map((c) => (/\s/.test(c.nome) ? `faz o clipe "${c.nome}"` : `faz o clipe ${c.nome}`));
  return [...caras, ...clipes];
}
