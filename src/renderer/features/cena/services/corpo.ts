import type { ActorId, ModeloPalito } from '@shared/domain';
import type { Esqueleto } from './ator';
import { tracoTremido, type Pt } from './tremor';

const COR = '#14161a';
const P = (x: number, y: number): Pt => ({ x, y });
const lerp = (a: Pt, b: Pt, k: number): Pt => P(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k);

// ---------------------------------------------------------------- primitivas

/** Polígono fechado com contorno trêmulo. Usa ctx.lineWidth/strokeStyle atuais. */
export function poli(ctx: CanvasRenderingContext2D, pts: Pt[], preenchimento: string | null = '#fff') {
  ctx.beginPath(); tracoTremido(ctx, pts, ctx.lineWidth * 0.22, true);
  if (preenchimento) { ctx.save(); ctx.fillStyle = preenchimento; ctx.fill(); ctx.restore(); }
  ctx.stroke();
}

function fio(ctx: CanvasRenderingContext2D, lw: number, ...pts: Pt[]) {
  ctx.save(); ctx.lineWidth = lw; ctx.beginPath(); tracoTremido(ctx, pts, lw * 0.25); ctx.stroke(); ctx.restore();
}

// Simple stick line without double stroke
function linha(ctx: CanvasRenderingContext2D, lw: number, ...pts: Pt[]) {
  ctx.save(); ctx.lineWidth = lw; ctx.beginPath(); tracoTremido(ctx, pts, lw * 0.25); ctx.stroke(); ctx.restore();
}

/** Membro "de borracha": um traço largo preto com um traço mais fino por cima, o que dá contorno duplo e juntas limpas. */
export function tubo(ctx: CanvasRenderingContext2D, pts: Pt[], w: number, lw: number, miolo: string = '#fff') {
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = COR; ctx.lineWidth = w + 2 * lw; ctx.beginPath(); tracoTremido(ctx, pts, lw * 0.25); ctx.stroke();
  ctx.strokeStyle = miolo; ctx.lineWidth = w; ctx.beginPath(); tracoTremido(ctx, pts, lw * 0.25); ctx.stroke();
  ctx.restore();
}

export function bolinha(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save(); ctx.fillStyle = COR; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.restore();
}
export function flor(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  for (let i = 0; i < 5; i++) { const a = (i * Math.PI * 2) / 5; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.7, 0, 7); ctx.stroke(); }
  bolinha(ctx, x, y, r * 0.5);
}
function estrela(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number) {
  const pts: Pt[] = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, k = i % 2 ? R * 0.45 : R; pts.push(P(cx + Math.cos(a) * k, cy + Math.sin(a) * k)); }
  poli(ctx, pts, COR);
}
function coracao(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save(); ctx.fillStyle = COR; ctx.beginPath();
  ctx.moveTo(x, y + 4 * r); ctx.bezierCurveTo(x - 6 * r, y - r, x - 2 * r, y - 5 * r, x, y - 1.5 * r);
  ctx.bezierCurveTo(x + 2 * r, y - 5 * r, x + 6 * r, y - r, x, y + 4 * r); ctx.fill(); ctx.restore();
}

function controleVideogame(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  // corpo do controle
  poli(ctx, [P(cx - 15 * s, cy - 8 * s), P(cx + 15 * s, cy - 8 * s), P(cx + 12 * s, cy + 8 * s), P(cx - 12 * s, cy + 8 * s)]);
  fio(ctx, 1.2, P(cx - 10 * s, cy + 8 * s), P(cx - 14 * s, cy + 13 * s));
  fio(ctx, 1.2, P(cx + 10 * s, cy + 8 * s), P(cx + 14 * s, cy + 13 * s));
  // D-pad (+)
  const d = 3.2 * s;
  poli(ctx, [P(cx - 6 * s - d, cy - d / 2), P(cx - 6 * s + d, cy - d / 2), P(cx - 6 * s + d, cy + d / 2), P(cx - 6 * s - d, cy + d / 2)], COR);
  poli(ctx, [P(cx - 6 * s - d / 2, cy - d), P(cx - 6 * s + d / 2, cy - d), P(cx - 6 * s + d / 2, cy + d), P(cx - 6 * s - d / 2, cy + d)], COR);
  // botões (o o)
  bolinha(ctx, cx + 5 * s, cy - 2 * s, 1.6 * s);
  bolinha(ctx, cx + 9 * s, cy + 2 * s, 1.6 * s);
}


function pataCao(ctx: CanvasRenderingContext2D, pe: Pt, s: number, lw: number) {
  ctx.save(); ctx.fillStyle = '#fff'; ctx.strokeStyle = COR; ctx.lineWidth = lw; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.ellipse(pe.x, pe.y - 2 * s, 8 * s, 4.5 * s, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  fio(ctx, lw * 0.6, P(pe.x - 2.5 * s, pe.y - 4 * s), P(pe.x - 2.5 * s, pe.y));
  fio(ctx, lw * 0.6, P(pe.x + 2.5 * s, pe.y - 4 * s), P(pe.x + 2.5 * s, pe.y));
  ctx.restore();
}

// ---------------------------------------------------------------- visual de cada personagem

interface Look { manga: 'curta' | 'longa'; calca: 'longa' | 'curta' | 'nua'; calcaPreta: boolean; sapato: 'social' | 'tenis' | 'sandalia' | 'sapatilha' }
const LOOK: Record<ModeloPalito, Look> = {
  professor: { manga: 'longa', calca: 'longa', calcaPreta: true, sapato: 'social' },
  aluno: { manga: 'curta', calca: 'longa', calcaPreta: false, sapato: 'tenis' },
  mae: { manga: 'longa', calca: 'nua', calcaPreta: false, sapato: 'sandalia' },
  cacula: { manga: 'curta', calca: 'curta', calcaPreta: false, sapato: 'tenis' },
  priminha: { manga: 'curta', calca: 'nua', calcaPreta: false, sapato: 'sapatilha' },
};

function sapato(ctx: CanvasRenderingContext2D, pe: Pt, f: number, s: number, tipo: Look['sapato'], lw: number) {
  const preto = tipo === 'social' || tipo === 'sapatilha';
  ctx.save(); ctx.strokeStyle = COR; ctx.lineWidth = lw; ctx.lineJoin = 'round';
  const y0 = pe.y - 0.5 * s;
  const pts = tipo === 'sandalia'
    ? [P(pe.x - f * 6 * s, y0 - 4 * s), P(pe.x + f * 18 * s, y0 - 2 * s), P(pe.x + f * 18 * s, y0), P(pe.x - f * 6 * s, y0)]
    : [P(pe.x - f * 7 * s, y0 - 11 * s), P(pe.x + f * 6 * s, y0 - 12 * s), P(pe.x + f * 22 * s, y0 - 4 * s), P(pe.x + f * 22 * s, y0), P(pe.x - f * 7 * s, y0)];
  poli(ctx, pts, preto ? COR : '#fff');
  if (tipo === 'tenis') {
    fio(ctx, lw * 0.7, P(pe.x - f * 7 * s, y0 - 3.5 * s), P(pe.x + f * 22 * s, y0 - 3.5 * s));
    fio(ctx, lw * 0.6, P(pe.x + f * 4 * s, y0 - 11 * s), P(pe.x + f * 9 * s, y0 - 6 * s));
    fio(ctx, lw * 0.6, P(pe.x + f * 9 * s, y0 - 9 * s), P(pe.x + f * 13 * s, y0 - 5 * s));
  } else if (tipo === 'sandalia') {
    fio(ctx, lw * 0.7, P(pe.x - f * 2 * s, y0 - 4 * s), P(pe.x + f * 8 * s, y0 - 12 * s), P(pe.x + f * 12 * s, y0 - 3 * s));
  } else if (tipo === 'sapatilha') {
    ctx.save(); ctx.strokeStyle = '#fff'; fio(ctx, lw * 0.6, P(pe.x - f * 2 * s, y0 - 9 * s), P(pe.x + f * 9 * s, y0 - 6 * s)); ctx.restore();
  }
  ctx.restore();
}

function mao(ctx: CanvasRenderingContext2D, m: Pt, cot: Pt, s: number, lw: number, f: number) {
  const ang = Math.atan2(m.y - cot.y, m.x - cot.x);
  ctx.save(); ctx.strokeStyle = COR; ctx.lineWidth = lw; ctx.fillStyle = '#fff';
  const polegar = P(m.x + Math.cos(ang + f * 1.2) * 8 * s, m.y + Math.sin(ang + f * 1.2) * 8 * s);
  ctx.beginPath(); ctx.arc(polegar.x, polegar.y, 3.6 * s, 0, 7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(m.x + Math.cos(ang) * 3 * s, m.y + Math.sin(ang) * 3 * s, 8.5 * s, 0, 7); ctx.fill(); ctx.stroke();
  ctx.restore();
}

function braco(ctx: CanvasRenderingContext2D, e: Esqueleto, lado: 'F' | 'T', _look: Look, lw: number, atorId?: ActorId) {
  const { ombro: o, s } = e;
  const c = lado === 'F' ? e.cotF : e.cotT, m = lado === 'F' ? e.maoF : e.maoT;
  if (atorId === 'paraiba' || atorId === 'mingau') {
    const chao = Math.max(e.peF.y, e.peT.y);
    const pawX = o.x + (lado === 'F' ? 4 * s : -6 * s);
    const cotY = (o.y + chao) / 2;
    linha(ctx, lw, o, P(pawX - e.facing * 4 * s, cotY), P(pawX, chao));
    pataCao(ctx, P(pawX, chao), s, lw);
    return;
  }
  linha(ctx, lw, o, c, m);
  mao(ctx, m, c, s, lw, e.facing);
}

function perna(ctx: CanvasRenderingContext2D, e: Esqueleto, lado: 'F' | 'T', look: Look, lw: number, atorId?: ActorId) {
  const { quadril: q, s } = e;
  const j = lado === 'F' ? e.joeF : e.joeT, pe = lado === 'F' ? e.peF : e.peT;
  if (atorId === 'paraiba' || atorId === 'mingau') {
    linha(ctx, lw, q, j, pe);
    pataCao(ctx, pe, s, lw);
    return;
  }
  if (look.calca === 'longa') {
    linha(ctx, lw, q, j, pe);
    if (!look.calcaPreta) { // jeans: costura tracejada e remendo no joelho
      ctx.save(); ctx.setLineDash([6 * s, 5 * s]); fio(ctx, lw * 0.5, lerp(q, j, 0.15), j, lerp(j, pe, 0.9)); ctx.restore();
      if (atorId !== 'carol') {
        ctx.save(); ctx.lineWidth = lw * 0.6; ctx.strokeStyle = COR; ctx.strokeRect(j.x - 6 * s, j.y - 6 * s, 12 * s, 12 * s); ctx.restore();
      }
    }
  } else if (look.calca === 'curta') {
    linha(ctx, lw, q, j, pe);
    linha(ctx, lw, q, lerp(q, j, 0.85));
    if (atorId === 'artur' && lado === 'F') {
      const bx = lerp(q, j, 0.5).x + e.facing * 9 * s, by = lerp(q, j, 0.5).y;
      poli(ctx, [P(bx - 5 * s, by - 4 * s), P(bx + 5 * s, by - 4 * s), P(bx + 5 * s, by + 5 * s), P(bx - 5 * s, by + 5 * s)]);
    }
  } else {
    linha(ctx, lw, q, j, pe);
  }
  sapato(ctx, pe, e.facing, s, look.sapato, lw);
}

// ---------------------------------------------------------------- tronco e roupas (com um detalhe de humor em cada uma)

function tronco(ctx: CanvasRenderingContext2D, e: Esqueleto, id: ModeloPalito, lw: number, atorId?: ActorId) {
  const { ombro: o, quadril: q, s, facing: f } = e;
  const ux = o.x - q.x, uy = o.y - q.y, ul = Math.hypot(ux, uy) || 1;
  const n = P(-uy / ul, ux / ul); // perpendicular ao tronco
  const lado = (c: Pt, w: number, k: number): Pt => P(c.x + n.x * w * s * k, c.y + n.y * w * s * k);
  const fino = lw * 0.6;
  ctx.save(); ctx.strokeStyle = COR; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round';

  // Roupas e detalhes específicos por personagem no estilo Stickman
  if (atorId === 'paraiba' || atorId === 'mingau') {
    const bx = (o.x + q.x) / 2, by = (o.y + q.y) / 2;
    poli(ctx, [
      P(o.x + (atorId === 'mingau' ? 10 : 13) * s, o.y),
      P(q.x + (atorId === 'mingau' ? 9 : 12) * s, q.y - 3 * s),
      P(q.x - (atorId === 'mingau' ? 10 : 13) * s, q.y + 6 * s),
      P(bx - (atorId === 'mingau' ? 11 : 14) * s, by + 11 * s),
      P(o.x - (atorId === 'mingau' ? 9 : 11) * s, o.y + 8 * s),
    ]);
    if (atorId === 'paraiba') {
      // Coleira com medalhinha
      fio(ctx, lw * 1.3, P(o.x - 12 * s, o.y + 4 * s), P(o.x + 12 * s, o.y + 4 * s));
      bolinha(ctx, o.x, o.y + 10 * s, 4 * s);
      ctx.save(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(o.x, o.y + 10 * s, 2 * s, 0, 7); ctx.fill(); ctx.restore();
      // Rabo feliz de cachorro bem curvado para cima que abana
      const rx = q.x - f * 12 * s, ry = q.y - 3 * s;
      ctx.lineWidth = lw * 1.2;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.bezierCurveTo(rx - f * 18 * s, ry - 18 * s, rx - f * 24 * s, ry - 38 * s, rx - f * 8 * s, ry - 42 * s);
      ctx.stroke();
    } else {
      // Coleira com guizinho do gato Mingau
      fio(ctx, lw * 1.1, P(o.x - 10 * s, o.y + 4 * s), P(o.x + 10 * s, o.y + 4 * s));
      bolinha(ctx, o.x, o.y + 9 * s, 3.2 * s);
      // Rabinho de gato longo, elegante e ondulado
      const rx = q.x - f * 10 * s, ry = q.y - 2 * s;
      ctx.lineWidth = lw * 1.1;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.bezierCurveTo(rx - f * 16 * s, ry - 14 * s, rx - f * 12 * s, ry - 32 * s, rx - f * 26 * s, ry - 44 * s);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (atorId === 'elizendra') {
    // Elizendra: vestido de vovó com avental florido, colher de pau no bolso e laço atrás
    const yb = (e.peF.y + e.peT.y) / 2 - 14 * s, xl = Math.min(e.peF.x, e.peT.x) - 28 * s, xr = Math.max(e.peF.x, e.peT.x) + 28 * s;
    const saia: Pt[] = [P(q.x - 14 * s, q.y - 6 * s), P(q.x + 14 * s, q.y - 6 * s)];
    for (let i = 0; i <= 8; i++) saia.push(P(xr - ((xr - xl) * i) / 8, yb + Math.sin(i * 1.9) * 5 * s));
    poli(ctx, saia);
    // Avental por cima
    poli(ctx, [lado(o, 13, 1), lado(o, 13, -1), P(q.x + 10 * s, q.y + 36 * s), P(q.x - 10 * s, q.y + 36 * s)]);
    fio(ctx, fino, P(o.x - 8 * s, o.y), P(o.x - 2 * s, o.y + 20 * s));
    fio(ctx, fino, P(o.x + 8 * s, o.y), P(o.x + 2 * s, o.y + 20 * s));
    // Bolso frontal do avental
    const bx = q.x, by = q.y + 12 * s;
    poli(ctx, [P(bx - 9 * s, by), P(bx + 9 * s, by), P(bx + 8 * s, by + 16 * s), P(bx - 8 * s, by + 16 * s)]);
    flor(ctx, q.x - 6 * s, q.y + 28 * s, 2.5 * s);
    // Colher de pau saindo do bolso
    fio(ctx, lw * 0.8, P(bx + 3 * s, by + 8 * s), P(bx + 7 * s, by - 10 * s));
    ctx.beginPath(); ctx.ellipse(bx + 8 * s, by - 13 * s, 3.5 * s, 5 * s, Math.PI / 5, 0, 7); ctx.stroke();
    // Laço amarrado atrás
    const lx = q.x - f * 12 * s, ly = q.y - 4 * s;
    poli(ctx, [P(lx, ly), P(lx - f * 8 * s, ly - 6 * s), P(lx - f * 8 * s, ly + 6 * s)]);
    ctx.restore();
    return;
  }

  if (atorId === 'artur') {
    // Artur: garoto cheinho/robusto, camiseta gamer com estampa de controle e bermuda cargo
    const wTop = 22, wBot = 23;
    poli(ctx, [lado(o, wTop, 1), lado(o, wTop, -1), P(q.x + wBot * s, q.y + 12 * s), P(q.x - wBot * s, q.y + 12 * s)]);
    ctx.beginPath(); ctx.ellipse(o.x, o.y + 3 * s, 14 * s, 6 * s, 0, 0, 7); ctx.stroke();
    controleVideogame(ctx, o.x, o.y + 38 * s, s);
    ctx.restore();
    return;
  }

  if (atorId === 'carol') {
    // Carol: alta e magricela, blusa de adolescente e saia, muito vaidosa
    const wTop = 12, wBot = 12;
    // Blouse (short shirt)
    poli(ctx, [lado(o, wTop, 1), lado(o, wTop, -1), P(q.x + wBot * s, q.y + 14 * s), P(q.x - wBot * s, q.y + 14 * s)]);
    // Skirt
    ctx.beginPath();
    ctx.moveTo(q.x - wBot * s, q.y + 14 * s);
    ctx.lineTo(q.x - wBot * s - 8 * s, q.y + 30 * s);
    ctx.lineTo(q.x + wBot * s + 8 * s, q.y + 30 * s);
    ctx.lineTo(q.x + wBot * s, q.y + 14 * s);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (atorId === 'veia') {
    // Véia: xale / cardigan acolhedor sobre os ombros + saia longa rodada
    const yb = (e.peF.y + e.peT.y) / 2 - 12 * s, xl = Math.min(e.peF.x, e.peT.x) - 30 * s, xr = Math.max(e.peF.x, e.peT.x) + 30 * s;
    const saia: Pt[] = [P(q.x - 14 * s, q.y - 6 * s), P(q.x + 14 * s, q.y - 6 * s)];
    for (let i = 0; i <= 8; i++) saia.push(P(xr - ((xr - xl) * i) / 8, yb + Math.sin(i * 1.8) * 6 * s));
    poli(ctx, saia);
    // Xale com franjas
    poli(ctx, [lado(o, 20, 1), lado(o, 20, -1), P(o.x, o.y + 42 * s)]);
    fio(ctx, fino, P(o.x - 10 * s, o.y + 12 * s), P(o.x + 10 * s, o.y + 12 * s));
    fio(ctx, fino, P(o.x - 6 * s, o.y + 24 * s), P(o.x + 6 * s, o.y + 24 * s));
    ctx.restore();
    return;
  }

  if (atorId === 'veio') {
    // Véio: colete de poeta e gravata borboleta clássica
    poli(ctx, [lado(o, 17, 1), lado(o, 17, -1), P(q.x - 18 * s, q.y + 16 * s), P(q.x + 18 * s, q.y + 16 * s)]);
    fio(ctx, fino, P(o.x, o.y + 18 * s), P(o.x, q.y + 16 * s));
    // Gravata borboleta de poeta
    const bx = o.x, by = o.y + 8 * s;
    poli(ctx, [P(bx - 10 * s, by - 6 * s), P(bx + 10 * s, by + 6 * s), P(bx + 10 * s, by - 6 * s), P(bx - 10 * s, by + 6 * s)], COR);
    bolinha(ctx, bx, by, 3 * s);
    ctx.restore();
    return;
  }

  if (atorId === 'dario') {
    // Dario: garoto enérgico, camiseta com crista/raio e bermuda com bolsos
    const wTop = 15, wBot = 16;
    poli(ctx, [lado(o, wTop, 1), lado(o, wTop, -1), P(q.x + wBot * s, q.y + 10 * s), P(q.x - wBot * s, q.y + 10 * s)]);
    ctx.beginPath(); ctx.ellipse(o.x, o.y + 3 * s, 10 * s, 5 * s, 0, 0, 7); ctx.stroke();
    estrela(ctx, o.x, o.y + 26 * s, 7 * s);
    ctx.restore();
    return;
  }

  if (atorId === 'laura') {
    // Laura: garota atlética, agasalho esportivo com zíper e coração esportivo
    const wTop = 14, wBot = 13;
    poli(ctx, [lado(o, wTop, 1), lado(o, wTop, -1), P(q.x + wBot * s, q.y + 8 * s), P(q.x - wBot * s, q.y + 8 * s)]);
    fio(ctx, fino * 1.2, P(o.x, o.y + 2 * s), P(o.x, q.y + 8 * s));
    coracao(ctx, o.x + f * 5 * s, o.y + 22 * s, 2.2 * s);
    ctx.restore();
    return;
  }

  switch (id) {
    case 'professor': { // jaleco de cientista: camisa e gravata por baixo, lapelas, bolso cheio de canetas, mancha de café
      const L = 82 * s;
      poli(ctx, [lado(o, 19, 1), lado(o, 19, -1), P(q.x - 28 * s, q.y + L), P(q.x + 28 * s, q.y + L)]);
      fio(ctx, fino, P(o.x, o.y + 22 * s), P(q.x, q.y + L));
      poli(ctx, [P(o.x - 3 * s, o.y + 3 * s), P(o.x - 15 * s, o.y + 24 * s), P(o.x - 1 * s, o.y + 32 * s)]);
      poli(ctx, [P(o.x + 3 * s, o.y + 3 * s), P(o.x + 15 * s, o.y + 24 * s), P(o.x + 1 * s, o.y + 32 * s)]);
      poli(ctx, [P(o.x - 4 * s, o.y + 6 * s), P(o.x + 4 * s, o.y + 6 * s), P(o.x + 3 * s, o.y + 30 * s), P(o.x, o.y + 38 * s), P(o.x - 3 * s, o.y + 30 * s)], COR);
      const bx = o.x + f * 11 * s, by = o.y + 54 * s;
      poli(ctx, [P(bx - 9 * s, by), P(bx + 9 * s, by), P(bx + 9 * s, by + 20 * s), P(bx - 9 * s, by + 20 * s)]);
      for (const dx of [-5, 0, 5]) fio(ctx, fino, P(bx + dx * s, by - 12 * s + Math.abs(dx) * 0.5 * s), P(bx + dx * s, by + 3 * s));
      ctx.beginPath(); ctx.arc(q.x - f * 10 * s, q.y + 52 * s, 7 * s, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.arc(q.x - f * 2 * s, q.y + 64 * s, 3.5 * s, 0, 7); ctx.stroke();
      break;
    }
    case 'aluno': { // camiseta de manga curta com gola e estampa
      poli(ctx, [lado(o, 17, 1), lado(o, 17, -1), P(q.x - 17 * s, q.y + 8 * s), P(q.x + 17 * s, q.y + 8 * s)]);
      ctx.beginPath(); ctx.ellipse(o.x, o.y + 2 * s, 11 * s, 5 * s, 0, 0, 7); ctx.stroke();
      poli(ctx, [P(o.x - 15 * s, o.y + 38 * s), P(o.x + 15 * s, o.y + 38 * s), P(o.x, o.y + 78 * s)]);
      bolinha(ctx, o.x - 4 * s, o.y + 50 * s, 2.6 * s); bolinha(ctx, o.x + 5 * s, o.y + 52 * s, 2.6 * s); bolinha(ctx, o.x, o.y + 64 * s, 2.6 * s);
      fio(ctx, fino, P(o.x - 15 * s, o.y + 38 * s), P(o.x + 15 * s, o.y + 38 * s));
      break;
    }
    case 'mae': { // saia longa hippie (barra acompanha os pés) + blusa com decote em V
      const yb = (e.peF.y + e.peT.y) / 2 - 16 * s, xl = Math.min(e.peF.x, e.peT.x) - 34 * s, xr = Math.max(e.peF.x, e.peT.x) + 34 * s;
      const saia: Pt[] = [P(q.x - 12 * s, q.y - 8 * s), P(q.x + 12 * s, q.y - 8 * s)];
      for (let i = 0; i <= 8; i++) saia.push(P(xr - ((xr - xl) * i) / 8, yb + Math.sin(i * 2.1) * 8 * s));
      poli(ctx, saia);
      flor(ctx, q.x - 14 * s, q.y + 42 * s, 4.5 * s); flor(ctx, q.x + 12 * s, q.y + 78 * s, 4.5 * s); flor(ctx, q.x - 4 * s, q.y + 118 * s, 4.5 * s);
      poli(ctx, [lado(o, 15, 1), lado(o, 15, -1), P(q.x - 14 * s, q.y - 4 * s), P(q.x + 14 * s, q.y - 4 * s)]);
      fio(ctx, fino, P(o.x - 8 * s, o.y + 2 * s), P(o.x, o.y + 24 * s), P(o.x + 8 * s, o.y + 2 * s));
      fio(ctx, fino, P(q.x - 14 * s, q.y - 10 * s), P(q.x + 14 * s, q.y - 10 * s));
      break;
    }
    case 'cacula': { // camiseta com estrela / dinossauro
      poli(ctx, [lado(o, 13, 1), lado(o, 13, -1), P(q.x - 14 * s, q.y - 14 * s), P(q.x + 14 * s, q.y - 14 * s)]);
      estrela(ctx, o.x, o.y + 40 * s, 10 * s);
      break;
    }
    case 'priminha': { // vestido de bolinhas com barra em festão, coração e band-aid no joelho (sapeca!)
      const hem = q.y + 56 * s, pts: Pt[] = [lado(o, 10, 1), lado(o, 10, -1)];
      for (let i = 0; i <= 6; i++) pts.push(P(q.x + 32 * s - (64 * s * i) / 6, hem + (i % 2 ? 7 * s : 0)));
      poli(ctx, pts);
      coracao(ctx, o.x, o.y + 28 * s, 2.6 * s);
      for (const [dx, dy] of [[-14, 62], [10, 74], [-4, 92], [18, 50], [-20, 84]] as const) bolinha(ctx, q.x + dx * s * 0.8, o.y + dy * s * 0.7, 2.2 * s);
      const kx = e.joeF.x, ky = e.joeF.y, w = 12 * s, h = 5.5 * s, c = Math.cos(-0.5), sn = Math.sin(-0.5);
      const rot = (x: number, y: number) => P(kx + x * c - y * sn, ky + x * sn + y * c);
      ctx.lineWidth = fino; poli(ctx, [rot(-w, -h), rot(w, -h), rot(w, h), rot(-w, h)]);
      bolinha(ctx, rot(-2.5 * s, 0).x, rot(-2.5 * s, 0).y, 1.1 * s); bolinha(ctx, rot(2.5 * s, 0).x, rot(2.5 * s, 0).y, 1.1 * s);
      break;
    }
  }
  ctx.restore();
}

/** Corpo com volume: membros em tubo, mãos, sapatos e roupa. Ordem: braço de trás, pernas, tronco/roupa, braço da frente. */
export function desenharCorpo(ctx: CanvasRenderingContext2D, e: Esqueleto, id: ModeloPalito, lw: number, atorId?: ActorId) {
  let look = LOOK[id];
  if (atorId === 'artur') {
    look = { manga: 'curta', calca: 'curta', calcaPreta: false, sapato: 'tenis' };
  } else if (atorId === 'carol') {
    look = { manga: 'curta', calca: 'nua', calcaPreta: false, sapato: 'tenis' };
  } else if (atorId === 'elizendra') {
    look = { manga: 'longa', calca: 'nua', calcaPreta: false, sapato: 'sapatilha' };
  } else if (atorId === 'dario') {
    look = { manga: 'curta', calca: 'curta', calcaPreta: false, sapato: 'tenis' };
  } else if (atorId === 'laura') {
    look = { manga: 'longa', calca: 'longa', calcaPreta: true, sapato: 'tenis' };
  } else if (atorId === 'cringefather') {
    look = { manga: 'longa', calca: 'longa', calcaPreta: true, sapato: 'social' };
  } else if (atorId === 'betason') {
    look = { manga: 'curta', calca: 'longa', calcaPreta: false, sapato: 'tenis' };
  } else if (atorId === 'erika') {
    look = { manga: 'longa', calca: 'nua', calcaPreta: false, sapato: 'sandalia' };
  } else if (atorId === 'veia') {
    look = { manga: 'longa', calca: 'nua', calcaPreta: false, sapato: 'sapatilha' };
  } else if (atorId === 'veio') {
    look = { manga: 'longa', calca: 'longa', calcaPreta: true, sapato: 'social' };
  }
  ctx.save();
  braco(ctx, e, 'T', look, lw, atorId);
  perna(ctx, e, 'T', look, lw, atorId);
  perna(ctx, e, 'F', look, lw, atorId);
  tronco(ctx, e, id, lw, atorId);
  braco(ctx, e, 'F', look, lw, atorId);
  ctx.restore();
}


