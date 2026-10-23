import { bolinha, desenharCadeirasEstudioAtras, linha } from './helpers';
import type { CenarioRenderContext, CenarioStrategy, LayoutCena } from './tipos';

export const cenarioPodcast: CenarioStrategy = {
  id: 'podcast',
  temLousa: false,

  desenharFundo(ctx: CanvasRenderingContext2D, L: LayoutCena): void {
    ctx.save();
    ctx.strokeStyle = '#111';
    ctx.fillStyle = '#fff';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.lineWidth = 2;
    const paineis = [
      { x: L.w * 0.08, y: L.h * 0.18, w: L.w * 0.22, h: L.h * 0.38 },
      { x: L.w * 0.70, y: L.h * 0.18, w: L.w * 0.22, h: L.h * 0.38 },
    ];
    for (const p of paineis) {
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.w, p.h, 12);
      ctx.stroke();
      ctx.save();
      ctx.clip();
      for (let lx = p.x - p.h; lx < p.x + p.w + p.h; lx += 26) {
        linha(ctx, { x: lx, y: p.y }, { x: lx + p.h, y: p.y + p.h });
      }
      ctx.restore();
    }

    const letreiroW = 320, letreiroH = 64;
    const lx = (L.w - letreiroW) / 2, ly = L.h * 0.12;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(lx, ly, letreiroW, letreiroH, 14);
    ctx.fill(); ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(lx + 5, ly + 5, letreiroW - 10, letreiroH - 10, 10);
    ctx.stroke();

    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(lx + 42, ly + letreiroH / 2, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('NO AR  |  PODCAST', lx + 66, ly + letreiroH / 2);

    ctx.restore();
  },

  desenharAtras(ctx: CanvasRenderingContext2D, L: LayoutCena, rc: CenarioRenderContext): void {
    desenharCadeirasEstudioAtras(ctx, L, rc, 'podcast');
  },

  desenharFrente(ctx: CanvasRenderingContext2D, L: LayoutCena, rc: CenarioRenderContext): void {
    ctx.save();
    ctx.globalAlpha = rc.vis.cenario;
    ctx.strokeStyle = '#111';
    ctx.fillStyle = '#fff';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const mesaY = L.chao - 220;
    const mesaH = L.chao - mesaY + 40;

    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.rect(-50, mesaY, L.w + 100, mesaH);
    ctx.fill(); ctx.stroke();

    const bordaH = 28;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.rect(-50, mesaY, L.w + 100, bordaH);
    ctx.fill(); ctx.stroke();
    linha(ctx, { x: -50, y: mesaY + bordaH }, { x: L.w + 50, y: mesaY + bordaH });

    ctx.lineWidth = 1.5;
    for (let rx = 100; rx < L.w - 100; rx += 70) {
      linha(ctx, { x: rx, y: mesaY + bordaH }, { x: rx, y: L.chao });
    }

    const cx = L.w * 0.5;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(cx - 52, mesaY + 6, 104, 12, 3);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(cx - 48, mesaY - 60, 96, 68, 6);
    ctx.fill(); ctx.stroke();
    bolinha(ctx, cx, mesaY - 32, 6);
    linha(ctx, { x: cx, y: mesaY - 26 }, { x: cx, y: mesaY - 14 });
    linha(ctx, { x: cx - 8, y: mesaY - 22 }, { x: cx + 8, y: mesaY - 22 });

    const mx = cx + 80;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(mx, mesaY + 4, 70, 20, 4);
    ctx.fill(); ctx.stroke();
    for (let i = 0; i < 4; i++) {
      linha(ctx, { x: mx + 12 + i * 14, y: mesaY + 8 }, { x: mx + 12 + i * 14, y: mesaY + 20 });
      bolinha(ctx, mx + 12 + i * 14, mesaY + 12 + (i % 2) * 5, 2.5);
    }

    const participantes = rc.visiveis
      .filter((id) => (rc.vis.atores[id] ?? 0) > 0.01 && id !== 'paraiba' && id !== 'mingau')
      .map((id) => ({
        id,
        x: (rc.estado.atores[id]?.x ?? 0.5) * rc.w,
        falando: !!rc.estado.atores[id]?.fala,
      }));
    const microfones = participantes.length > 0 ? participantes : [{ id: 'padrao', x: L.w * 0.5, falando: false }];

    for (const p of microfones) {
      const ax = p.x;
      const cugX = ax + (ax < L.w * 0.5 ? 85 : -85);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(cugX - 14, mesaY + 4, 28, 22, 4);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.arc(cugX + (ax < L.w * 0.5 ? 14 : -14), mesaY + 15, 6, -Math.PI * 0.5, Math.PI * 0.5, ax >= L.w * 0.5);
      ctx.stroke();
      ctx.lineWidth = 1.5;
      linha(ctx, { x: cugX - 4, y: mesaY }, { x: cugX - 6, y: mesaY - 8 }, { x: cugX - 2, y: mesaY - 16 });
      linha(ctx, { x: cugX + 4, y: mesaY }, { x: cugX + 2, y: mesaY - 8 }, { x: cugX + 6, y: mesaY - 16 });

      const baseMicX = ax + (ax < L.w * 0.5 ? 45 : -45);
      const jointX = baseMicX + (ax < L.w * 0.5 ? 25 : -25);
      const jointY = mesaY - 80;
      const micHeadX = ax + (ax < L.w * 0.5 ? 20 : -20);
      const micHeadY = mesaY - 140;

      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(baseMicX - 10, mesaY + 2, 20, 14, 3);
      ctx.fill(); ctx.stroke();
      linha(ctx, { x: baseMicX - 3, y: mesaY + 2 }, { x: jointX - 3, y: jointY });
      linha(ctx, { x: baseMicX + 3, y: mesaY + 2 }, { x: jointX + 3, y: jointY });
      bolinha(ctx, jointX, jointY, 5);
      linha(ctx, { x: jointX, y: jointY }, { x: micHeadX, y: micHeadY });
      bolinha(ctx, micHeadX, micHeadY, 4.5);

      ctx.lineWidth = 3.5;
      const facing = ax < L.w * 0.5 ? -1 : 1;
      const mxAng = micHeadX + facing * 24;
      const myAng = micHeadY + 12;
      linha(ctx, { x: micHeadX, y: micHeadY }, { x: mxAng, y: myAng });

      ctx.save();
      ctx.translate(mxAng, myAng);
      ctx.rotate(facing * 0.35);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.roundRect(-14, -20, 28, 42, 10);
      ctx.fill(); ctx.stroke();

      // Anel de indicação de estúdio ativo
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = p.falando ? '#ef4444' : '#111';
      linha(ctx, { x: -12, y: -4 }, { x: 12, y: -4 });
      ctx.strokeStyle = '#111';
      linha(ctx, { x: -10, y: 4 }, { x: 10, y: 4 });

      if (p.falando) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, -10, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  },
};
