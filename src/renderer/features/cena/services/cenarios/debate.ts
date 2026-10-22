import { bolinha, desenharCadeirasEstudioAtras } from './helpers';
import type { CenarioRenderContext, CenarioStrategy, LayoutCena } from './tipos';

export const cenarioDebate: CenarioStrategy = {
  id: 'debate',
  temLousa: false,

  desenharFundo(ctx: CanvasRenderingContext2D, L: LayoutCena): void {
    ctx.save();
    ctx.strokeStyle = '#111';
    ctx.fillStyle = '#fff';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const painelW = Math.min(L.w * 0.65, 520);
    const painelH = 110;
    const px = (L.w - painelW) / 2;
    const py = L.h * 0.10;

    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.roundRect(px, py, painelW, painelH, 14);
    ctx.fill(); ctx.stroke();

    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(px + 6, py + 6, painelW - 12, painelH - 12, 10);
    ctx.stroke();

    ctx.fillStyle = '#111';
    ctx.font = '900 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GRANDE DEBATE  |  TEMPO OFICIAL', px + painelW / 2, py + 38);

    // Display de cronômetro central
    const cronoW = 160, cronoH = 40;
    const cx = px + (painelW - cronoW) / 2, cy = py + 60;
    ctx.beginPath();
    ctx.roundRect(cx, cy, cronoW, cronoH, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('01:30', cx + cronoW / 2, cy + cronoH / 2 + 1);

    // Luzes indicadoras verde / amarela / vermelha
    bolinha(ctx, cx - 22, cy + cronoH / 2, 7);
    bolinha(ctx, cx + cronoW + 22, cy + cronoH / 2, 7);

    ctx.restore();
  },

  desenharAtras(ctx: CanvasRenderingContext2D, L: LayoutCena, rc: CenarioRenderContext): void {
    desenharCadeirasEstudioAtras(ctx, L, rc, 'debate');
  },

  desenharFrente(ctx: CanvasRenderingContext2D, L: LayoutCena, rc: CenarioRenderContext): void {
    ctx.save();
    ctx.globalAlpha = rc.vis.cenario;
    ctx.strokeStyle = '#111';
    ctx.fillStyle = '#fff';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const mesaY = L.chao - 225;
    const mesaH = L.chao - mesaY + 40;
    const bw = L.vertical ? L.w * 0.95 : L.w * 0.82;
    const bx = (L.w - bw) / 2;

    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(bx, mesaY, bw, mesaH, [16, 16, 0, 0]);
    ctx.fill(); ctx.stroke();

    const bordaH = 26;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.roundRect(bx - 12, mesaY - 12, bw + 24, bordaH, 10);
    ctx.fill(); ctx.stroke();

    // Placa central de mediação
    const placaW = 200, placaH = 50;
    const plx = (L.w - placaW) / 2, ply = mesaY + 45;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(plx, ply, placaW, placaH, 8);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#111';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MEDIAÇÃO', plx + placaW / 2, ply + placaH / 2);

    // Microfones de mesa gooseneck para os participantes
    const atoresX = rc.visiveis
      .filter((id) => (rc.vis.atores[id] ?? 0) > 0.01 && id !== 'paraiba' && id !== 'mingau')
      .map((id) => (rc.estado.atores[id]?.x ?? 0.5) * rc.w);
    const posMics = atoresX.length > 0 ? atoresX : [L.w * 0.3, L.w * 0.5, L.w * 0.7];

    for (const mx of posMics) {
      ctx.lineWidth = 3;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(mx, mesaY - 10, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();

      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(mx, mesaY - 12);
      ctx.quadraticCurveTo(mx - 8, mesaY - 45, mx + 4, mesaY - 70);
      ctx.stroke();

      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.roundRect(mx + 2, mesaY - 80, 8, 14, 3);
      ctx.fill();
    }

    ctx.restore();
  },
};
