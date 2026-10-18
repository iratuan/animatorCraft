import { textoDoConteudo, type Estado, type ItemQuadro } from '@shared/domain';
import type { Rect } from './sprites';

/** Fontes do vídeo: uma para a lousa e outra para as falas (balões). O app escolhe quais; aqui só se guarda e se usa. */
export interface FonteConfig { familia: string; peso: number }
const PADRAO: FonteConfig = { familia: '"Comic Sans MS","Comic Neue",cursive', peso: 700 };
const fontes: Record<'lousa' | 'fala', FonteConfig> = { lousa: { ...PADRAO }, fala: { ...PADRAO } };
export const FONTE_MANUSCRITA = PADRAO.familia;

/** Como a escrita aparece: 'mao' = mão com caneta acompanhando; 'revelar' = só revela o conteúdo com borda suave. */
export type EstiloEscrita = 'mao' | 'revelar';
let estiloEscrita: EstiloEscrita = 'revelar';
export function definirEscrita(e: EstiloEscrita) { estiloEscrita = e; }
export const escritaComMao = () => estiloEscrita === 'mao';

export function definirFontes(f: Partial<Record<'lousa' | 'fala', FonteConfig>>) { Object.assign(fontes, f); }
export const fonteCSS = (papel: 'lousa' | 'fala', tam: number) => `${fontes[papel].peso} ${tam}px ${fontes[papel].familia}`;

export interface ItemPlanejado {
  item: ItemQuadro;
  linhas: string[];
  fonte: number;
  larguras: number[];
  /** y do topo da primeira linha */
  y: number;
  alturaLinha: number;
  total: number;
}
export interface PlanoLousa { itens: ItemPlanejado[]; escala: number; estoura: boolean }

const MARGEM = 0.055;

function quebrar(ctx: CanvasRenderingContext2D, texto: string, larguraMax: number): string[] {
  const linhas: string[] = [];
  let atual = '';
  for (const palavra of texto.split(/\s+/)) {
    const teste = atual ? `${atual} ${palavra}` : palavra;
    if (ctx.measureText(teste).width > larguraMax && atual) { linhas.push(atual); atual = palavra; } else atual = teste;
  }
  if (atual) linhas.push(atual);
  return linhas.length ? linhas : [''];
}

/**
 * Distribui o conteúdo na lousa de cima para baixo. Quebra linhas longas e, se o conjunto não couber, reduz a letra
 * de tudo por igual até caber. `estoura` indica que nem na menor letra legível coube (o editor avisa).
 */
export function planejarLousa(ctx: CanvasRenderingContext2D, itens: ItemQuadro[], q: Rect, vertical: boolean): PlanoLousa {
  const larguraMax = q.w * (1 - 2 * MARGEM);
  const alturaMax = q.h * (1 - 2 * MARGEM);
  const base = (it: ItemQuadro) => (it.conteudo.tipo === 'latex' ? 0.105 : 0.082) * q.w * (vertical ? 1.15 : 1);
  let m = 1;
  for (let tentativa = 0; tentativa < 30; tentativa++) {
    const plano: ItemPlanejado[] = [];
    let y = q.y + q.h * MARGEM, altura = 0;
    for (const item of itens) {
      const fonte = base(item) * m;
      ctx.font = fonteCSS('lousa', fonte);
      const linhas = quebrar(ctx, textoDoConteudo(item.conteudo), larguraMax);
      const alturaLinha = fonte * 1.2;
      const h = linhas.length * alturaLinha;
      plano.push({ item, linhas, fonte, larguras: linhas.map((l) => ctx.measureText(l).width), y, alturaLinha, total: linhas.reduce((s, l) => s + l.length, 0) });
      y += h + fonte * 0.35;
      altura += h + fonte * 0.35;
    }
    const cabe = altura - (itens.length ? base(itens[itens.length - 1]!) * m * 0.35 : 0) <= alturaMax;
    if (cabe) return { itens: plano, escala: m, estoura: false };
    if (m <= 0.42) return { itens: plano, escala: m, estoura: true };
    m *= 0.93;
  }
  return { itens: [], escala: m, estoura: true };
}

export function desenharItemPlanejado(ctx: CanvasRenderingContext2D, p: ItemPlanejado, q: Rect): { x: number; y: number } {
  const it = p.item;
  ctx.save();
  ctx.font = fonteCSS('lousa', p.fonte);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.globalAlpha *= it.opacidade;
  ctx.fillStyle = '#111';
  let restante = it.progresso * p.total;
  let front = { x: q.x + q.w / 2, y: p.y + p.alturaLinha * 0.7 };
  for (let i = 0; i < p.linhas.length; i++) {
    const linha = p.linhas[i]!, larg = p.larguras[i]!;
    const x0 = q.x + (q.w - larg) / 2, base = p.y + i * p.alturaLinha + p.fonte * 0.95;
    const frac = Math.min(1, Math.max(0, restante / Math.max(1, linha.length)));
    if (frac > 0) {
      const topo = base - p.fonte * 1.1, alto = p.alturaLinha * 1.3, fim = x0 + larg * frac;
      ctx.save();
      ctx.beginPath(); ctx.rect(x0 - 8, topo, fim - x0 + 8, alto); ctx.clip();
      ctx.fillText(linha, x0, base);
      ctx.restore();
      if (frac < 1) { // borda suave: algumas fatias com transparência crescente, para o texto "aparecer" em vez de ser cortado
        const passo = Math.max(3, p.fonte * 0.06);
        for (let s = 0; s < 7; s++) {
          ctx.save();
          ctx.globalAlpha *= 1 - (s + 1) / 8;
          ctx.beginPath(); ctx.rect(fim + s * passo, topo, passo, alto); ctx.clip();
          ctx.fillText(linha, x0, base);
          ctx.restore();
        }
      }
      front = { x: fim, y: base - p.fonte * 0.3 };
    }
    restante -= linha.length;
    if (restante <= 0) break;
  }
  ctx.restore();
  return front;
}

/** Contexto auxiliar só para medir texto (fora da tela). */
let medidor: CanvasRenderingContext2D | null = null;
function ctxMedidor(): CanvasRenderingContext2D {
  medidor ??= document.createElement('canvas').getContext('2d')!;
  return medidor;
}

/** Verifica se o conteúdo escrito até o fim de cada cena cabe na lousa. Retorna os índices das cenas que estouram. */
export function verificarLousa(estadosFinais: Estado[], quadro: Rect, vertical: boolean): number[] {
  const ruins: number[] = [];
  estadosFinais.forEach((e, i) => { if (planejarLousa(ctxMedidor(), e.quadro, quadro, vertical).estoura) ruins.push(i); });
  return ruins;
}


