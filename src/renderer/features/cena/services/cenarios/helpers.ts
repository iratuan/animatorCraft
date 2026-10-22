import { ATORES } from '@shared/domain';
import type { CenarioRenderContext, LayoutCena } from './tipos';

export const linha = (ctx: CanvasRenderingContext2D, ...pts: { x: number; y: number }[]) => {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0]!.x, pts[0]!.y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y);
  ctx.stroke();
};

export const bolinha = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
};

/** Cadeira de estúdio atrás do personagem (ergonômica/gamer no podcast, executiva no telejornal/debate) */
export function desenharCadeiraEstudio(ctx: CanvasRenderingContext2D, x: number, chao: number, s: number, cenario: 'podcast' | 'telejornal' | 'debate') {
  ctx.save();
  ctx.strokeStyle = '#111';
  ctx.fillStyle = '#fff';
  ctx.lineWidth = Math.max(2, 4.5 * s);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const cy = chao - 235 * s;
  const encostoH = 260 * s;
  const encostoW = 95 * s;

  if (cenario === 'podcast') {
    linha(ctx, { x, y: cy }, { x, y: chao });
    linha(ctx, { x: x - 40 * s, y: chao }, { x: x + 40 * s, y: chao });
    ctx.beginPath();
    ctx.roundRect(x - encostoW / 2, cy - encostoH, encostoW, encostoH, 18 * s);
    ctx.fill(); ctx.stroke();
    ctx.lineWidth = 2.5 * s;
    ctx.beginPath();
    ctx.roundRect(x - 30 * s, cy - encostoH + 35 * s, 24 * s, 12 * s, 4 * s);
    ctx.roundRect(x + 6 * s, cy - encostoH + 35 * s, 24 * s, 12 * s, 4 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(x - 32 * s, cy - encostoH - 12 * s, 64 * s, 22 * s, 8 * s);
    ctx.fill(); ctx.stroke();
  } else if (cenario === 'debate') {
    linha(ctx, { x, y: cy }, { x, y: chao });
    linha(ctx, { x: x - 45 * s, y: chao }, { x: x + 45 * s, y: chao });
    ctx.beginPath();
    ctx.roundRect(x - (encostoW + 10 * s) / 2, cy - encostoH - 10 * s, encostoW + 10 * s, encostoH + 10 * s, 12 * s);
    ctx.fill(); ctx.stroke();
    ctx.lineWidth = 2 * s;
    linha(ctx, { x: x - 22 * s, y: cy - encostoH }, { x: x - 22 * s, y: cy - 10 * s });
    linha(ctx, { x: x + 22 * s, y: cy - encostoH }, { x: x + 22 * s, y: cy - 10 * s });
  } else {
    linha(ctx, { x, y: cy }, { x, y: chao });
    linha(ctx, { x: x - 45 * s, y: chao }, { x: x + 45 * s, y: chao });
    ctx.beginPath();
    ctx.roundRect(x - encostoW / 2, cy - encostoH, encostoW, encostoH, 22 * s);
    ctx.fill(); ctx.stroke();
    ctx.lineWidth = 2 * s;
    linha(ctx, { x: x - 18 * s, y: cy - encostoH + 20 * s }, { x: x - 18 * s, y: cy - 10 * s });
    linha(ctx, { x: x + 18 * s, y: cy - encostoH + 20 * s }, { x: x + 18 * s, y: cy - 10 * s });
    linha(ctx, { x: x - encostoW / 2 + 8 * s, y: cy - encostoH * 0.5 }, { x: x + encostoW / 2 - 8 * s, y: cy - encostoH * 0.5 });
  }
  ctx.restore();
}

/** Renderiza cadeiras atrás de atores visíveis para cenários formais/estúdio */
export function desenharCadeirasEstudioAtras(
  ctx: CanvasRenderingContext2D,
  L: LayoutCena,
  rc: CenarioRenderContext,
  tipo: 'podcast' | 'telejornal' | 'debate'
) {
  ctx.globalAlpha = rc.vis.cenario;
  for (const id of rc.visiveis) {
    if (id === 'paraiba' || id === 'mingau') continue;
    const alpha = rc.vis.atores[id] ?? 0;
    if (alpha <= 0.01) continue;
    const a = rc.estado.atores[id];
    if (!a) continue;
    const x = a.x * rc.w;
    const real = ATORES[a.id];
    const s = real ? (rc.escalaG * real.altura) / 440 : rc.escalaG;
    ctx.save();
    ctx.globalAlpha = alpha;
    desenharCadeiraEstudio(ctx, x, L.chao, s, tipo);
    ctx.restore();
  }
}
