import { desenharCadeirasEstudioAtras } from './helpers';
import type { CenarioRenderContext, CenarioStrategy, LayoutCena } from './tipos';

export const cenarioDebate: CenarioStrategy = {
  id: 'debate',
  temLousa: false,

  desenharFundo(ctx: CanvasRenderingContext2D, L: LayoutCena, rc?: CenarioRenderContext): void {
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

    // Display de cronômetro central dinâmico baseado em t
    const tAtual = rc?.estado.t ?? 0;
    const tempoRestante = Math.max(0, 90 - Math.floor(tAtual % 90));
    const min = Math.floor(tempoRestante / 60);
    const sec = tempoRestante % 60;
    const cronoTexto = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;

    const cronoW = 160, cronoH = 40;
    const cx = px + (painelW - cronoW) / 2, cy = py + 60;
    ctx.beginPath();
    ctx.roundRect(cx, cy, cronoW, cronoH, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(cronoTexto, cx + cronoW / 2, cy + cronoH / 2 + 1);

    // Luzes indicadoras verde / amarela / vermelha piscantes em tempo crítico
    const alertaTempo = tempoRestante < 15;
    const corLuz = alertaTempo ? (tAtual % 0.8 < 0.4 ? '#ef4444' : '#fee2e2') : '#10b981';
    ctx.fillStyle = corLuz;
    ctx.beginPath(); ctx.arc(cx - 22, cy + cronoH / 2, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + cronoW + 22, cy + cronoH / 2, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

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

    // Microfones de mesa gooseneck para os participantes com detecção de fala ativa
    const participantes = rc.visiveis
      .filter((id) => (rc.vis.atores[id] ?? 0) > 0.01 && id !== 'paraiba' && id !== 'mingau')
      .map((id) => ({
        id,
        x: (rc.estado.atores[id]?.x ?? 0.5) * rc.w,
        falando: !!rc.estado.atores[id]?.fala,
      }));
    const posMics = participantes.length > 0 ? participantes : [{ id: 'padrao', x: L.w * 0.5, falando: false }];

    for (const p of posMics) {
      const mx = p.x;
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

      // Cúpula do microfone: se estiver falando, acende anel e cúpula vermelha de "no ar"
      ctx.fillStyle = p.falando ? '#ef4444' : '#111';
      ctx.beginPath();
      ctx.roundRect(mx + 2, mesaY - 80, 8, 14, 3);
      ctx.fill();

      if (p.falando) {
        ctx.save();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mx + 6, mesaY - 73, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.restore();
  },
};
