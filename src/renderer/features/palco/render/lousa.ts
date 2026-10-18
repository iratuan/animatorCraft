import { amostrarFuncao, textoDoConteudo, type Estado, type GraficoDef, type ItemQuadro } from '@shared/domain';
import type { Rect } from './sprites';

/** Fontes do vídeo: uma para a lousa e outra para as falas (balões). O app escolhe quais; aqui só se guarda e se usa. */
export interface FonteConfig { familia: string; peso: number }
const PADRAO: FonteConfig = { familia: '"Comic Sans MS","Comic Neue",cursive', peso: 700 };
const fontes: Record<'lousa' | 'fala', FonteConfig> = { lousa: { ...PADRAO }, fala: { ...PADRAO } };
export const FONTE_MANUSCRITA = PADRAO.familia;


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
  /** item que é um gráfico: ocupa lturaLinha px de altura, sem linhas de texto */
  grafico?: GraficoDef;
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
      if (item.conteudo.tipo === 'grafico') {
        const h = Math.min(q.h * 0.52, q.w * 0.42) * m;
        plano.push({ item, linhas: [], fonte, larguras: [], y, alturaLinha: h, total: 0, grafico: item.conteudo.grafico });
        y += h + fonte * 0.35; altura += h + fonte * 0.35;
        continue;
      }
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
  if (p.grafico) return desenharGrafico(ctx, p, q);
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

/** Gráfico traçado aos poucos (eixos, depois a curva, as barras uma a uma ou a pizza girando). Devolve a ponta do traço, onde a mão aparece. */
function desenharGrafico(ctx: CanvasRenderingContext2D, p: ItemPlanejado, q: Rect): { x: number; y: number } {
  const g = p.grafico!, pr = p.item.progresso;
  const h = p.alturaLinha, w = Math.min(q.w * 0.8, h * 1.7);
  const x0 = q.x + (q.w - w) / 2, y0 = p.y;
  const traco = Math.max(2, q.w * 0.0045), peq = Math.max(10, h * 0.075);
  ctx.save();
  ctx.globalAlpha *= p.item.opacidade;
  ctx.strokeStyle = '#111'; ctx.fillStyle = '#111'; ctx.lineWidth = traco; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.font = fonteCSS('lousa', peq); ctx.textBaseline = 'middle';
  let ponta = { x: x0, y: y0 + h };
  const reta = (ax: number, ay: number, bx: number, by: number, f: number) => { if (f <= 0) return; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + (bx - ax) * Math.min(1, f), ay + (by - ay) * Math.min(1, f)); ctx.stroke(); };
  const fase = (a: number, b: number) => Math.min(1, Math.max(0, (pr - a) / (b - a)));
  if (g.tipo === 'funcao') {
    const { pontos, ymin, ymax } = amostrarFuncao(g);
    const margem = peq * 1.6, ex = x0 + margem, ey = y0 + peq * 0.6, ew = w - margem * 1.4, eh = h - margem - peq * 0.6;
    const X = (v: number) => ex + ((v - g.xmin) / (g.xmax - g.xmin)) * ew, Y = (v: number) => ey + eh - ((v - ymin) / (ymax - ymin)) * eh;
    const eixoY = g.xmin <= 0 && g.xmax >= 0 ? X(0) : ex, eixoX = ymin <= 0 && ymax >= 0 ? Y(0) : ey + eh;
    const fa = fase(0, 0.22);
    reta(ex, eixoX, ex + ew, eixoX, fa); reta(eixoY, ey + eh, eixoY, ey, fa);
    if (fa >= 1) {
      const passo = (mx: number, mn: number) => { const bruto = (mx - mn) / 8; const e = Math.pow(10, Math.floor(Math.log10(bruto))); return [1, 2, 5, 10].map((k) => k * e).find((s) => s >= bruto) ?? bruto; };
      ctx.lineWidth = traco * 0.6; ctx.textAlign = 'center';
      const sx = passo(g.xmax, g.xmin), sy = passo(ymax, ymin);
      for (let v = Math.ceil(g.xmin / sx) * sx; v <= g.xmax + 1e-9; v += sx) { if (Math.abs(v) < sx / 2) continue; ctx.beginPath(); ctx.moveTo(X(v), eixoX - peq * 0.3); ctx.lineTo(X(v), eixoX + peq * 0.3); ctx.stroke(); ctx.fillText(String(+v.toFixed(2)), X(v), Math.min(ey + eh + peq, eixoX + peq * 1.1)); }
      ctx.textAlign = 'right';
      for (let v = Math.ceil(ymin / sy) * sy; v <= ymax + 1e-9; v += sy) { if (Math.abs(v) < sy / 2) continue; ctx.beginPath(); ctx.moveTo(eixoY - peq * 0.3, Y(v)); ctx.lineTo(eixoY + peq * 0.3, Y(v)); ctx.stroke(); ctx.fillText(String(+v.toFixed(2)), eixoY - peq * 0.5, Y(v)); }
      ctx.lineWidth = traco * 1.5;
      const alvo = Math.floor(fase(0.22, 1) * (pontos.length - 1));
      let aberto = false;
      for (let i = 0; i <= alvo; i++) { const pt = pontos[i]; if (!pt) { aberto = false; continue; } if (!aberto) { ctx.beginPath(); ctx.moveTo(X(pt.x), Y(pt.y)); aberto = true; } else { ctx.lineTo(X(pt.x), Y(pt.y)); } if (i === alvo || !pontos[i + 1]) ctx.stroke(); if (!pontos[i + 1] && i !== alvo) aberto = false; if (pt) ponta = { x: X(pt.x), y: Y(pt.y) }; }
    } else ponta = { x: ex + ew * fa, y: eixoX };
  } else if (g.tipo === 'barras') {
    const maior = Math.max(...g.dados.map((d) => d.valor), 1e-9), margem = peq * 1.8;
    const bx = x0 + margem * 0.4, by = y0 + h - margem, bw = w - margem * 0.4, bh = h - margem - peq * 1.4;
    const fa = fase(0, 0.15);
    reta(bx, by, bx + bw, by, fa); reta(bx, by, bx, by - bh, fa);
    ponta = { x: bx + bw * fa, y: by };
    const larg = bw / g.dados.length;
    g.dados.forEach((d, i) => {
      const f = fase(0.15 + (0.85 * i) / g.dados.length, 0.15 + (0.85 * (i + 1)) / g.dados.length);
      if (f <= 0) return;
      const altBar = (d.valor / maior) * bh * f, bl = larg * 0.62, bxi = bx + larg * i + (larg - bl) / 2;
      ctx.fillStyle = ['#d4d4d4', '#9a9a9a', '#6b6b6b', '#bdbdbd'][i % 4]!;
      ctx.fillRect(bxi, by - altBar, bl, altBar); ctx.strokeRect(bxi, by - altBar, bl, altBar);
      ctx.fillStyle = '#111'; ctx.textAlign = 'center';
      ctx.fillText(d.rotulo, bxi + bl / 2, by + peq * 0.9, larg);
      if (f >= 1) ctx.fillText(String(d.valor), bxi + bl / 2, by - altBar - peq * 0.7);
      ponta = { x: bxi + bl / 2, y: by - altBar };
    });
  } else {
    const total = g.dados.reduce((s, d) => s + d.valor, 0) || 1, r = Math.min(w * 0.3, h * 0.38), cx = x0 + w / 2, cy = y0 + h / 2;
    const giro = fase(0, 1) * Math.PI * 2;
    let a = -Math.PI / 2;
    g.dados.forEach((d, i) => {
      const fatia = (d.valor / total) * Math.PI * 2, ate = Math.min(a + fatia, -Math.PI / 2 + giro);
      if (ate > a) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a, ate); ctx.closePath(); ctx.fillStyle = ['#e6e6e6', '#a8a8a8', '#707070', '#c9c9c9'][i % 4]!; ctx.fill(); ctx.stroke(); }
      if (a + fatia <= -Math.PI / 2 + giro) { const m = a + fatia / 2; ctx.fillStyle = '#111'; ctx.textAlign = Math.cos(m) >= 0 ? 'left' : 'right'; ctx.fillText(`${d.rotulo} ${Math.round((d.valor / total) * 100)}%`, cx + Math.cos(m) * (r + peq * 0.6), cy + Math.sin(m) * (r + peq * 0.6)); }
      a += fatia;
    });
    ponta = { x: cx + Math.cos(-Math.PI / 2 + giro) * r, y: cy + Math.sin(-Math.PI / 2 + giro) * r };
  }
  ctx.restore();
  return ponta;
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




