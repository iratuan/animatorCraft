import { desenharCadeirasEstudioAtras, linha } from './helpers';
import type { CenarioRenderContext, CenarioStrategy, LayoutCena } from './tipos';

export const cenarioTelejornal: CenarioStrategy = {
  id: 'telejornal',
  temLousa: false,

  desenharFundo(ctx: CanvasRenderingContext2D, L: LayoutCena): void {
    ctx.save();
    ctx.strokeStyle = '#111';
    ctx.fillStyle = '#fff';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const vwX = L.w * 0.12, vwY = L.h * 0.14;
    const vwW = L.w * 0.76, vwH = L.h * 0.52;

    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(vwX, vwY, vwW, vwH, 16);
    ctx.fill(); ctx.stroke();

    ctx.lineWidth = 2;
    linha(ctx, { x: vwX, y: vwY + 48 }, { x: vwX + vwW, y: vwY + 48 });
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillStyle = '#111';
    ctx.textAlign = 'left';
    ctx.fillText('🔴 STICK NEWS NETWORK  |  EDIÇÃO DAS 20H', vwX + 24, vwY + 31);
    ctx.textAlign = 'right';
    ctx.fillText('20:00:00 UTC', vwX + vwW - 24, vwY + 31);

    const cx = vwX + vwW / 2, cy = vwY + 54 + (vwH - 54) / 2;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, vwW * 0.38, vwH * 0.34, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy, vwW * 0.22, vwH * 0.34, 0, 0, Math.PI * 2);
    ctx.stroke();
    linha(ctx, { x: cx - vwW * 0.38, y: cy }, { x: cx + vwW * 0.38, y: cy });

    const ilhas: [number, number, number, number][] = [
      [cx - 160, cy - 35, 75, 45],
      [cx - 120, cy + 30, 45, 60],
      [cx + 10, cy - 30, 65, 45],
      [cx + 25, cy + 25, 65, 55],
      [cx + 130, cy - 25, 95, 60],
      [cx + 160, cy + 50, 45, 35],
    ];
    ctx.fillStyle = '#111';
    for (const [ix, iy, iw, ih] of ilhas) {
      for (let px = ix - iw / 2; px <= ix + iw / 2; px += 14) {
        for (let py = iy - ih / 2; py <= iy + ih / 2; py += 14) {
          if (Math.hypot((px - ix) / iw, (py - iy) / ih) < 0.5) {
            ctx.beginPath();
            ctx.arc(px, py, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    ctx.restore();
  },

  desenharAtras(ctx: CanvasRenderingContext2D, L: LayoutCena, rc: CenarioRenderContext): void {
    desenharCadeirasEstudioAtras(ctx, L, rc, 'telejornal');
  },

  desenharFrente(ctx: CanvasRenderingContext2D, L: LayoutCena, rc: CenarioRenderContext): void {
    ctx.save();
    ctx.globalAlpha = rc.vis.cenario;
    ctx.strokeStyle = '#111';
    ctx.fillStyle = '#fff';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const mesaY = L.chao - 230;
    const mesaH = L.chao - mesaY + 40;
    const bw = L.vertical ? L.w * 0.94 : L.w * 0.72;
    const bx = (L.w - bw) / 2;

    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(bx, mesaY, bw, mesaH, [24, 24, 0, 0]);
    ctx.fill(); ctx.stroke();

    ctx.lineWidth = 3;
    linha(ctx, { x: bx + 24, y: mesaY + 45 }, { x: bx + bw - 24, y: mesaY + 45 });
    linha(ctx, { x: bx + 40, y: mesaY + 85 }, { x: bx + bw - 40, y: mesaY + 85 });

    const tampoW = bw + 36;
    const tampoX = bx - 18;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(tampoX, mesaY - 14, tampoW, 28, 14);
    ctx.fill(); ctx.stroke();

    const ancorasX = rc.visiveis
      .filter((id) => (rc.vis.atores[id] ?? 0) > 0.01 && id !== 'paraiba' && id !== 'mingau')
      .map((id) => (rc.estado.atores[id]?.x ?? 0.5) * rc.w);
    const posFinal = ancorasX.length > 0 ? ancorasX : [L.w * 0.5];

    for (const ax of posFinal) {
      const px = ax - 35, py = mesaY - 6;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(px, py, 60, 20, 2);
      ctx.fill(); ctx.stroke();
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) {
        linha(ctx, { x: px + 8, y: py + 5 + i * 5 }, { x: px + 52, y: py + 5 + i * 5 });
      }
      ctx.lineWidth = 2.5;
      linha(ctx, { x: px + 68, y: py + 2 }, { x: px + 76, y: py + 18 });

      const micX = ax + 55, micY = mesaY - 10;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(micX - 8, micY, 16, 8, 2);
      ctx.fill(); ctx.stroke();
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(micX, micY);
      ctx.quadraticCurveTo(micX - 10, micY - 30, micX - 4, micY - 55);
      ctx.stroke();
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(micX - 4, micY - 57, 5, 8, -0.2, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    }

    if (posFinal.length > 1) {
      const cx = (posFinal[0]! + posFinal[1]!) / 2;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(cx - 30, mesaY - 4, 60, 16, 3);
      ctx.fill(); ctx.stroke();
    } else {
      const gx = (posFinal[0] ?? L.w * 0.5) - 75;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(gx - 8, mesaY - 6, 16, 22, 2);
      ctx.fill(); ctx.stroke();
      linha(ctx, { x: gx - 6, y: mesaY + 4 }, { x: gx + 6, y: mesaY + 4 });
    }

    const tarjaH = 54;
    const tarjaY = L.h - tarjaH - 16;
    const tarjaW = L.w * 0.88;
    const tarjaX = (L.w - tarjaW) / 2;

    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.roundRect(tarjaX, tarjaY, tarjaW, tarjaH, 8);
    ctx.fill(); ctx.stroke();

    const seloW = 145;
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.roundRect(tarjaX, tarjaY, seloW, tarjaH, [8, 0, 0, 8]);
    ctx.fill();
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔴 AO VIVO', tarjaX + seloW / 2, tarjaY + tarjaH / 2);

    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillStyle = '#111';
    ctx.textAlign = 'left';
    ctx.fillText('DROPS DA SEMANA  |  ANÁLISE COMPLETA & PRINCIPAIS ATUALIDADES', tarjaX + seloW + 22, tarjaY + tarjaH / 2);

    ctx.restore();
  },
};
