import { ROSTOS_ESPECIAIS } from './nomenclatura';
import { EXPRESSOES, type ExpressaoId } from './poses';

/**
 * Expressões de cada personagem. Além das 10 padrão, o personagem pode ter expressões próprias:
 *  - no estilo Chibi, qualquer sprite rosto_<nome>.png (e rosto_<nome>_1, _2… para animar);
 *  - no estilo Stickman, uma "receita" de rosto (olhos, sobrancelha, boca), com até 4 quadros para animar.
 * O interpretador do roteiro consulta este registro para aceitar "Fulano faz cara de apaixonada.".
 */
export type NomeExpressao = ExpressaoId | (string & {});

export const OLHOS = ['normal', 'grande', 'meia', 'estreito'] as const;
export const BOCAS = ['sorriso', 'triste', 'o', 'reta', 'lado', 'dentes', 'onda', 'aberta'] as const;
export const MAX_QUADROS_EXPRESSAO = 4;
/** Quadros por segundo de uma expressão animada do boneco. */
export const QUADROS_EXPRESSAO_POR_SEGUNDO = 4;

/** Como o boneco de palito desenha o rosto. */
export interface RostoBoneco {
  olho: (typeof OLHOS)[number];
  /** inclinação das sobrancelhas: positivo = alegres/tristes (pontas para cima), negativo = bravas */
  sobr: number;
  sobrAssimetrica?: boolean;
  boca: (typeof BOCAS)[number];
}

export interface ExpressaoBoneco {
  ator: string;
  /** nome usado no roteiro (minúsculas, sem acento, hífen): "cara de apaixonada" */
  nome: string;
  quadros: RostoBoneco[];
}

const semAcento = (s: string) => (typeof s === 'string' ? s : '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
/** "Com Sono!" -> "com-sono" */
export const nomeDeExpressao = (s: string): string => semAcento(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const deSprites = new Map<string, string[]>();
let deBoneco: ExpressaoBoneco[] = [];

/** Nomes dos sprites rosto_* do personagem (o desenho carrega isso ao preparar os sprites). Bocas e piscada não são expressões. */
export function definirExpressoesDeSprites(ator: string, nomes: string[]): void {
  deSprites.set(ator, [...new Set(nomes.filter((n) => !ROSTOS_ESPECIAIS.includes(n)))]);
}
export function esquecerExpressoesDe(ator: string): void { deSprites.delete(ator); deBoneco = deBoneco.filter((e) => e.ator !== ator); }

const rostoValido = (r: RostoBoneco): boolean => !!r && typeof r === 'object' && (OLHOS as readonly string[]).includes(r.olho) && (BOCAS as readonly string[]).includes(r.boca) && Number.isFinite(r.sobr);

/** Substitui todas as expressões de boneco (as que o usuário criou). Entradas inválidas são descartadas. */
export function definirExpressoesBoneco(lista: ExpressaoBoneco[]): void {
  const vistos = new Set<string>();
  deBoneco = (Array.isArray(lista) ? lista : []).flatMap((e): ExpressaoBoneco[] => {
    const nome = nomeDeExpressao(e?.nome ?? '');
    const chave = `${e?.ator}|${nome}`;
    const quadros = (Array.isArray(e?.quadros) ? e.quadros : []).filter(rostoValido).slice(0, MAX_QUADROS_EXPRESSAO)
      .map((r): RostoBoneco => ({ olho: r.olho, sobr: Math.max(-14, Math.min(14, r.sobr)), ...(r.sobrAssimetrica ? { sobrAssimetrica: true } : {}), boca: r.boca }));
    if (!e?.ator || !nome || !quadros.length || vistos.has(chave) || (EXPRESSOES as readonly string[]).includes(nome)) return [];
    vistos.add(chave);
    return [{ ator: e.ator, nome, quadros }];
  });
}
export const expressoesBoneco = (ator?: string): ExpressaoBoneco[] => (ator ? deBoneco.filter((e) => e.ator === ator) : [...deBoneco]);

/** Todas as expressões que o personagem aceita: as padrão, as do boneco e as dos sprites. */
export function expressoesDe(ator: string): string[] {
  return [...new Set<string>([...EXPRESSOES, ...expressoesBoneco(ator).map((e) => e.nome), ...(deSprites.get(ator) ?? [])])];
}
export const ehExpressao = (ator: string, nome: string): boolean => expressoesDe(ator).includes(nome);

/** Receita de rosto do boneco para uma expressão criada pelo usuário, no instante t (anima entre os quadros). */
export function rostoBonecoDe(ator: string, nome: string, t = 0): RostoBoneco | undefined {
  const e = deBoneco.find((x) => x.ator === ator && x.nome === nome);
  if (!e) return undefined;
  return e.quadros[Math.floor(Math.max(0, t) * QUADROS_EXPRESSAO_POR_SEGUNDO) % e.quadros.length];
}
