import { semAcento } from '../util/texto';
import { suave } from '../util/numeros';
/**
 * Imagens na lousa (PNG, JPG ou WebP importados pelo usuário). O domínio só conhece nome e proporção (para o layout) e a matemática dos
 * efeitos de transição; os pixels ficam no renderer.
 */
export interface InfoImagem { nome: string; w: number; h: number }
const registro = new Map<string, InfoImagem>();
export const chaveImagem = (nome: string) => nome.trim().toLowerCase();
export const registrarImagem = (i: InfoImagem): void => { registro.set(chaveImagem(i.nome), i); };
export const removerImagem = (nome: string): void => { registro.delete(chaveImagem(nome)); };
export const infoDaImagem = (nome: string): InfoImagem | undefined => registro.get(chaveImagem(nome));
export const listarImagens = (): InfoImagem[] => [...registro.values()].sort((a, b) => a.nome.localeCompare(b.nome));

export const EFEITOS_IMAGEM = ['nenhum', 'surgir', 'deslizar-esquerda', 'deslizar-direita', 'deslizar-cima', 'deslizar-baixo', 'zoom', 'revelar'] as const;
export type EfeitoImagem = (typeof EFEITOS_IMAGEM)[number];
export const NOME_EFEITO: Record<EfeitoImagem, string> = {
  nenhum: 'Sem efeito', surgir: 'Surgir (aparece aos poucos)', 'deslizar-esquerda': 'Deslizar da esquerda', 'deslizar-direita': 'Deslizar da direita',
  'deslizar-cima': 'Deslizar de cima', 'deslizar-baixo': 'Deslizar de baixo', zoom: 'Zoom (cresce do centro)', revelar: 'Revelar (varre da esquerda p/ direita)',
};
export type PosicaoImagem = 'centro' | 'esquerda' | 'direita';
export type TamanhoImagem = 'pequena' | 'media' | 'grande';
export const DURACAO_EFEITO = 0.8;

/** Como a imagem se mostra com o efeito `efeito` no ponto `p` (0 = fora, 1 = no lugar). dx/dy em frações da largura/altura da lousa. */
export interface ParamsEfeito { alpha: number; dx: number; dy: number; escala: number; clip: number }

export function paramsDoEfeito(efeito: EfeitoImagem, p: number): ParamsEfeito {
  const e = suave(p), base: ParamsEfeito = { alpha: 1, dx: 0, dy: 0, escala: 1, clip: 1 };
  switch (efeito) {
    case 'nenhum': return { ...base, alpha: p >= 1 ? 1 : p <= 0 ? 0 : 1 };
    case 'surgir': return { ...base, alpha: e };
    case 'zoom': return { ...base, alpha: Math.min(1, p * 2), escala: 0.15 + 0.85 * e };
    case 'revelar': return { ...base, clip: e };
    case 'deslizar-esquerda': return { ...base, alpha: Math.min(1, p * 2.5), dx: -(1 - e) * 0.7 };
    case 'deslizar-direita': return { ...base, alpha: Math.min(1, p * 2.5), dx: (1 - e) * 0.7 };
    case 'deslizar-cima': return { ...base, alpha: Math.min(1, p * 2.5), dy: -(1 - e) * 0.8 };
    case 'deslizar-baixo': return { ...base, alpha: Math.min(1, p * 2.5), dy: (1 - e) * 0.8 };
  }
}

/** Leitura dos efeitos escritos em português ("deslizar da esquerda", "zoom", "surgir"...). */
export function lerEfeito(texto: string): EfeitoImagem | undefined {
  const t = semAcento(texto);
  if (/\b(sem efeito|nenhum|direto|cortar)\b/.test(t)) return 'nenhum';
  const d = /\b(?:deslizar|deslizando|slide|entrar|entrando)\b.*?\b(esquerda|direita|cima|baixo)\b/.exec(t) ?? /\b(?:deslizar|deslizando)\b/.exec(t);
  if (d) return (`deslizar-${d[1] ?? 'esquerda'}`) as EfeitoImagem;
  if (/\b(zoom|crescer|crescendo|ampliar)\b/.test(t)) return 'zoom';
  if (/\b(revelar|revelando|varrer|cortina)\b/.test(t)) return 'revelar';
  if (/\b(surgir|surgindo|aparecer|aparecendo|fade|desaparecer|sumir)\b/.test(t)) return 'surgir';
  return undefined;
}

