import { ATORES, ORDEM_ATORES, quebrarLinhasFala, type ActorId, type Estado } from '@shared/domain';
import { desenharAtor } from './ator';
import { interpolarRect, retanguloDaCamera, visibilidadeDaCamera } from './camera';
import { desenharItemPlanejado, FONTE_MANUSCRITA, fonteCSS, planejarLousa } from './lousa';
import { type Rect } from './sprites';
import { tracoTremido } from './tremor';
import { obterEstrategiaCenario } from './cenarios/registro';

export { FONTE_MANUSCRITA };

export interface Layout {
  w: number; h: number; vertical: boolean;
  quadro: Rect;
  chao: number; escalaAtor: number;
}

export function layoutDe(w: number, h: number): Layout {
  const vertical = h > w;
  return vertical
    ? { w, h, vertical, quadro: { x: 50, y: 110, w: w - 100, h: h * 0.47 }, chao: h * 0.9, escalaAtor: 1.3 }
    : { w, h, vertical, quadro: { x: w * 0.17, y: 56, w: w * 0.66, h: h * 0.62 }, chao: h * 0.9, escalaAtor: 1 };
}

function desenharChao(ctx: CanvasRenderingContext2D, L: Layout) {
  ctx.strokeStyle = '#111'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 6;
  ctx.beginPath(); tracoTremido(ctx, [{ x: -200, y: L.chao + 8 }, { x: L.w + 200, y: L.chao + 8 }], 2, false, 22); ctx.stroke();
}

function desenharMoldura(ctx: CanvasRenderingContext2D, L: Layout) {
  const q = L.quadro;
  ctx.strokeStyle = '#111'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const retangulo = (x: number, y: number, rw: number, rh: number) =>
    tracoTremido(ctx, [{ x, y }, { x: x + rw, y }, { x: x + rw, y: y + rh }, { x, y: y + rh }], ctx.lineWidth * 0.18, true, 24);
  ctx.fillStyle = '#fff'; ctx.fillRect(q.x, q.y, q.w, q.h);
  ctx.lineWidth = 9; ctx.beginPath(); retangulo(q.x - 14, q.y - 14, q.w + 28, q.h + 28); ctx.stroke();
  ctx.lineWidth = 3; ctx.beginPath(); retangulo(q.x, q.y, q.w, q.h); ctx.stroke();
  ctx.lineWidth = 6; ctx.beginPath(); ctx.roundRect(q.x + q.w * 0.25, q.y + q.h + 14, q.w * 0.5, 14, 4); ctx.stroke();
  ctx.lineWidth = 4;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.roundRect(q.x + q.w * 0.34 + i * 70, q.y + q.h + 2, 54, 12, 5); ctx.stroke(); }
}


function desenharBalao(
  ctx: CanvasRenderingContext2D,
  L: Layout,
  f: { texto: string; completo: string; opacidade: number; decorrido: number },
  ancora: { x: number; y: number },
  viewRect?: Rect,
) {
  const tam = L.vertical ? 46 : 38;
  const pad = { x: 30, y: 20 };
  ctx.save();
  ctx.globalAlpha *= f.opacidade;
  ctx.font = fonteCSS('fala', tam);
  const maxW = L.vertical ? 680 : 560;
  // o tamanho do balão vem da fala inteira: ele não "cresce" enquanto as palavras aparecem
  const linhas = quebrarLinhasFala(ctx, f.completo, maxW);
  const larguras = linhas.map((l) => l.largura);
  const larg = Math.max(...larguras, 60) + pad.x * 2;
  const alto = Math.max(1, linhas.length) * tam * 1.22 + pad.y * 2;
  // Margens: se há viewRect ativo (ex.: close de câmera), delimita dentro da viewport visível
  const minX = viewRect ? viewRect.x + 16 : 24;
  const maxX = viewRect ? viewRect.x + viewRect.w - 16 - larg : L.w - 24 - larg;
  const minY = viewRect ? viewRect.y + 16 : 20;

  const bx = Math.min(Math.max(minX, maxX), Math.max(minX, ancora.x - larg / 2));
  const by = Math.max(minY, ancora.y - 38 - alto);
  const base = by + alto;
  const tx = Math.min(bx + larg - 56, Math.max(bx + 56, ancora.x));

  // entrada "pop": o balão cresce a partir da cabeça de quem fala
  const u = Math.min(1, f.decorrido / 0.2), c1 = 1.70158, c3 = c1 + 1;
  const escala = f.decorrido <= 0 ? 0.6 : 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2) - (1 - Math.min(1, 0.6 + u * 0.4)) * 0.0;
  ctx.translate(ancora.x, ancora.y); ctx.scale(Math.max(0.6, escala), Math.max(0.6, escala)); ctx.translate(-ancora.x, -ancora.y);

  const rabinho = (deslocamento: number) => {
    ctx.beginPath();
    ctx.moveTo(tx - 22 + deslocamento, base - 2);
    ctx.quadraticCurveTo(tx - 4 + deslocamento, base + (ancora.y - base) * 0.55, ancora.x, ancora.y);
    ctx.quadraticCurveTo(tx + 8 + deslocamento, base + (ancora.y - base) * 0.35, tx + 18 + deslocamento, base - 2);
  };
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // sombra suave
  ctx.save(); ctx.translate(7, 9); ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.beginPath(); ctx.roundRect(bx, by, larg, alto, 32); ctx.fill(); rabinho(0); ctx.fill(); ctx.restore();
  // corpo + rabinho
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.roundRect(bx, by, larg, alto, 32); ctx.fill(); ctx.stroke();
  rabinho(0); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(tx - 19, base - 1); ctx.lineTo(tx + 15, base - 1); ctx.stroke();

  // texto: só as palavras já ditas, nas posições finais
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  let restante = f.texto.split(/\s+/).filter(Boolean).length;
  linhas.forEach((linha, i) => {
    if (restante <= 0) return;
    const y = by + pad.y + tam * 0.61 + i * tam * 1.22;
    const xBase = bx + (larg - linha.largura) / 2;
    const qtdVisivel = Math.min(restante, linha.palavras.length);
    restante -= qtdVisivel;

    if (!linha.temDestaque) {
      const visiveis = linha.palavras.slice(0, qtdVisivel).map((p) => p.texto).join(' ');
      ctx.fillStyle = '#111';
      ctx.fillText(visiveis, xBase, y);
    } else {
      const espacoW = ctx.measureText(' ').width;
      let curX = xBase;
      for (let wIdx = 0; wIdx < qtdVisivel; wIdx++) {
        const p = linha.palavras[wIdx]!;
        const pW = ctx.measureText(p.texto).width;

        if (p.fundo) {
          ctx.save();
          ctx.fillStyle = p.fundo;
          ctx.beginPath();
          ctx.roundRect(curX - 4, y - tam * 0.55, pW + 8, tam * 1.1, 6);
          ctx.fill();
          ctx.restore();
        }

        ctx.fillStyle = p.cor ?? '#111';
        ctx.fillText(p.texto, curX, y);
        curX += pW + espacoW;
      }
    }
  });
  ctx.restore();
}
export interface OpcoesCena { selecionado?: ActorId | null; guias?: boolean }
export interface ResultadoCena { lousaEstoura: boolean }

/** Desenha um quadro completo da animação. É a única função de desenho usada no preview e na exportação. */
export function renderizarCena(ctx: CanvasRenderingContext2D, estado: Estado, w: number, h: number, op: OpcoesCena = {}): ResultadoCena {
  const L = layoutDe(w, h);
  const escalaG = L.escalaAtor;
  const visiveis = ORDEM_ATORES.filter((id) => estado.atores[id]?.visivel);

  // geometria dos atores: serve à câmera (rosto) e aos balões
  const cabecas: Partial<Record<ActorId, Rect>> = {};
  for (const id of visiveis) {
    const a = estado.atores[id], x = a.x * w;
    const alt = ATORES[id]!.altura * escalaG;
    cabecas[id] = { x: x - alt * 0.14, y: L.chao - alt * 1.05, w: alt * 0.28, h: alt * 0.28 };
  }
  const rect = interpolarRect(
    retanguloDaCamera(estado.camera.anterior, { w, h }, L.quadro, cabecas),
    retanguloDaCamera(estado.camera.atual, { w, h }, L.quadro, cabecas),
    estado.camera.progresso,
  );
  const vis = visibilidadeDaCamera(estado.camera);

  ctx.save();
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
  const k = w / rect.w;
  ctx.scale(k, k);
  ctx.translate(-rect.x, -rect.y);

  ctx.globalAlpha = vis.cenario;
  desenharChao(ctx, L);

  // Resolução e aplicação da estratégia de cenário (Open-Closed Principle)
  const cenarioNome = estado.cenario ?? (
    estado.formato === 'podcast' ? 'podcast' :
    estado.formato === 'telejornal' ? 'telejornal' :
    estado.formato === 'debate' ? 'debate' :
    (estado.formato === 'papo_livre' || estado.formato === 'livre') ? 'papo_livre' : 'lousa'
  );
  const estrategia = obterEstrategiaCenario(cenarioNome);
  const rc = { visiveis, estado, w, escalaG, vis };
  estrategia.desenharFundo(ctx, L, rc);

  // lousa: moldura e conteúdo planejado para caber (somente se não estiver desativada pelo cenário/tag)
  const temLousa = estrategia.temLousa && !estado.semLousa;
  let plano: ReturnType<typeof planejarLousa> = { itens: [], escala: 1, estoura: false };
  if (temLousa) {
    ctx.globalAlpha = vis.lousa;
    desenharMoldura(ctx, L);
    plano = planejarLousa(ctx, estado.quadro, L.quadro, L.vertical);
    // o conteúdo só é revelado aos poucos; não há mão nem caneta na lousa
    for (const p of plano.itens) desenharItemPlanejado(ctx, p, L.quadro);
  }

  // Camada atrás dos personagens (ex.: cadeiras de estúdio)
  estrategia.desenharAtras?.(ctx, L, rc);

  // personagens: renderizados 100% no estilo Stickman cinematográfico
  const ancoras: Partial<Record<ActorId, { x: number; y: number }>> = {};
  for (const id of visiveis) {
    const alpha = vis.atores[id];
    if (alpha <= 0.01) continue;
    const a = estado.atores[id], x = a.x * w;
    ctx.save();
    ctx.globalAlpha = alpha;
    const e = desenharAtor(ctx, a, x, L.chao, escalaG, {
      t: estado.t,
      idadePose: estado.t - a.poseDesde,
      cenario: cenarioNome,
      selecionado: op.selecionado === id,
    });
    ancoras[id] = { x: e.cabeca.x, y: e.cabeca.y - e.raio * 1.2 };
    ctx.restore();
  }

  // Bancada ou móveis em primeiro plano
  estrategia.desenharFrente?.(ctx, L, rc);
  for (const id of visiveis) {
    const f = estado.atores[id].fala, alpha = Math.min(vis.atores[id], vis.balao);
    if (f && ancoras[id] && alpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = alpha;
      desenharBalao(ctx, L, { texto: f.texto, completo: f.completo, opacidade: f.opacidade, decorrido: f.progresso * f.duracao }, ancoras[id]!, rect);
      ctx.restore();
    }
  }
  ctx.restore();
  return { lousaEstoura: plano.estoura };
}

/** Ator mais próximo do clique (em fração da largura); usado para selecionar atores no palco. */
export function atorEm(estado: Estado, fx: number): ActorId | null {
  let melhor: { id: ActorId; d: number } | null = null;
  for (const id of ORDEM_ATORES) {
    const a = estado.atores[id];
    if (!a?.visivel) continue;
    const d = Math.abs(a.x - fx);
    if (d < 0.07 && (!melhor || d < melhor.d)) melhor = { id, d };
  }
  return melhor?.id ?? null;
}








