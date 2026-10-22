import { bolinha, linha } from './helpers';
import type { CenarioRenderContext, CenarioStrategy, LayoutCena } from './tipos';

export const cenarioPapoLivre: CenarioStrategy = {
  id: 'papo_livre',
  temLousa: false,

  desenharFundo(ctx: CanvasRenderingContext2D, L: LayoutCena): void {
    ctx.save();
    ctx.strokeStyle = '#111';
    ctx.fillStyle = '#fff';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Quadro de arte moderna stickman na parede
    const qW = 220, qH = 140;
    const qx = (L.w - qW) / 2, qy = L.h * 0.15;
    ctx.lineWidth = 4;
    ctx.strokeRect(qx, qy, qW, qH);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(qx + 80, qy + 70, 35, 0, Math.PI * 2);
    ctx.stroke();
    linha(ctx, { x: qx + 40, y: qy + 110 }, { x: qx + 180, y: qy + 40 });

    // Luminária de chão de arco à esquerda
    const lx = L.w * 0.12, ly = L.chao;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.quadraticCurveTo(lx - 40, ly - 360, lx + 100, ly - 380);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(lx + 100, ly - 380, 24, Math.PI, 0);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Tapete oval no chão
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(L.w * 0.5, L.chao - 20, Math.min(L.w * 0.45, 420), 45, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  },

  desenharFrente(ctx: CanvasRenderingContext2D, L: LayoutCena, rc: CenarioRenderContext): void {
    ctx.save();
    ctx.globalAlpha = rc.vis.cenario;
    ctx.strokeStyle = '#111';
    ctx.fillStyle = '#fff';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const mesaW = 180;
    const mx = (L.w - mesaW) / 2, my = L.chao - 80;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(mx + mesaW / 2, my, mesaW / 2, 22, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    linha(ctx, { x: mx + 30, y: my + 14 }, { x: mx + 15, y: L.chao });
    linha(ctx, { x: mx + mesaW - 30, y: my + 14 }, { x: mx + mesaW - 15, y: L.chao });

    ctx.lineWidth = 2;
    ctx.strokeRect(mx + mesaW / 2 - 12, my - 24, 24, 20);
    bolinha(ctx, mx + mesaW / 2, my - 30, 8);

    ctx.restore();
  },
};
