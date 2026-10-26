import {
  acharClipe, ATORES, avaliarClipe, EFEITO_POSE, misturar, poseDef, rostoBonecoDe, suave, TRANSICAO_POSE,
  type ActorId, type AtorEstado, type ExpressaoId, type ModeloPalito, type PoseDef, type PoseId,
} from '@shared/domain';

/** Aparência do boneco de reserva (usado por todos os personagens). */
export interface VisualPalito { oculos?: boolean; dentesSeparados?: boolean; cilios?: boolean; altura: number; cabeca: number; postura?: { torso: number; cabeca: number } }
const PALITO: Record<ModeloPalito, VisualPalito> = {
  professor: { oculos: true, altura: 1.0, cabeca: 1.2, postura: { torso: -3, cabeca: -6 } },
  aluno: { oculos: true, dentesSeparados: true, altura: 0.8, cabeca: 1.35 },
  mae: { cilios: true, altura: 0.95, cabeca: 1.15 },
  cacula: { altura: 0.55, cabeca: 1.5 },
  priminha: { cilios: true, altura: 0.44, cabeca: 1.6 },
};

const rad = (g: number) => (g * Math.PI) / 180;
const COR = '#14161a';

import { desenharCorpo, flor } from './corpo';
import { circuloTremido, tracoTremido, tremerPt, type Pt } from './tremor';
export interface Esqueleto {
  quadril: Pt; ombro: Pt; cabeca: Pt; raio: number;
  cotF: Pt; maoF: Pt; cotT: Pt; maoT: Pt;
  joeF: Pt; peF: Pt; joeT: Pt; peT: Pt;
  s: number; facing: 1 | -1;
}

const MED = { torso: 140, braco: 75, antebraco: 70, coxa: 100, canela: 100, pescoco: 10, cabeca: 46 };

/** Resolve as posições das articulações a partir da pose; os pés mais baixos tocam o chão. */
export function resolver(pose: PoseDef, x: number, chao: number, s: number, cabecaK: number, facing: 1 | -1): Esqueleto {
  const dir = (g: number, len: number): Pt => ({ x: facing * Math.sin(rad(g)) * len * s, y: Math.cos(rad(g)) * len * s });
  const soma = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y });
  const perna = (p: [number, number]) => {
    const joe = dir(p[0], MED.coxa);
    return { joe, pe: soma(joe, dir(p[0] + p[1], MED.canela)) };
  };
  const lF = perna(pose.pernaF), lT = perna(pose.pernaT);
  const queda = Math.max(lF.pe.y, lT.pe.y);
  const quadril = { x, y: chao - queda - pose.salto * s };
  const abs = (p: Pt) => soma(quadril, p);
  const ombro = abs({ x: facing * Math.sin(rad(pose.torso)) * MED.torso * s, y: -Math.cos(rad(pose.torso)) * MED.torso * s });
  const raio = MED.cabeca * s * cabecaK;
  const cab = soma(ombro, {
    x: facing * Math.sin(rad(pose.cabeca)) * (MED.pescoco * s + raio),
    y: -Math.cos(rad(pose.cabeca)) * (MED.pescoco * s + raio),
  });
  const braco = (p: [number, number]) => {
    const cot = soma(ombro, dir(p[0], MED.braco));
    return { cot, mao: soma(cot, dir(p[0] + p[1], MED.antebraco)) };
  };
  const bF = braco(pose.bracoF), bT = braco(pose.bracoT);
  return {
    quadril, ombro, cabeca: cab, raio,
    cotF: bF.cot, maoF: bF.mao, cotT: bT.cot, maoT: bT.mao,
    joeF: abs(lF.joe), peF: abs(lF.pe), joeT: abs(lT.joe), peT: abs(lT.pe),
    s, facing,
  };
}

/** Estilos de traço dos personagens (comparação de propostas): limpo = contorno uniforme; tinta = espessura variável; rabisco = traço duplo de caderno. */
export type EstiloTraco = 'limpo' | 'tinta' | 'rabisco';
let estilo: EstiloTraco = 'limpo';
export function definirEstilo(e: EstiloTraco) { estilo = e; }

function densificar(pts: Pt[], passo: number): { p: Pt; u: number }[] {
  const comp = pts.slice(1).reduce((s, p, i) => s + Math.hypot(p.x - pts[i]!.x, p.y - pts[i]!.y), 0) || 1;
  const out: { p: Pt; u: number }[] = [{ p: pts[0]!, u: 0 }];
  let andado = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!, b = pts[i]!, len = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(1, Math.ceil(len / passo));
    for (let k = 1; k <= n; k++) out.push({ p: { x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n }, u: (andado + (len * k) / n) / comp });
    andado += len;
  }
  return out;
}

function estender(pts: Pt[], k: number): Pt[] {
  const a = pts[0]!, a1 = pts[1] ?? a, z = pts[pts.length - 1]!, z0 = pts[pts.length - 2] ?? z;
  return [{ x: a.x + (a.x - a1.x) * k, y: a.y + (a.y - a1.y) * k }, ...pts, { x: z.x + (z.x - z0.x) * k, y: z.y + (z.y - z0.y) * k }];
}

function linha(ctx: CanvasRenderingContext2D, ...pts: Pt[]) {
  const lw = ctx.lineWidth;
  if (estilo === 'tinta' && pts.length > 1) { // grossa no meio e fina nas pontas, como pincel de nanquim
    const d = densificar(pts, 5);
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 1; i < d.length; i++) {
      const a = tremerPt(d[i - 1]!.p, lw * 0.18), b = tremerPt(d[i]!.p, lw * 0.18), u = (d[i - 1]!.u + d[i]!.u) / 2;
      ctx.lineWidth = lw * (0.4 + 1.05 * Math.pow(Math.sin(Math.PI * u), 0.55));
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.restore(); return;
  }
  if (estilo === 'rabisco' && pts.length > 1) { // duas passadas finas que não casam, com a ponta passando do ponto
    ctx.save(); ctx.lineWidth = lw * 0.55;
    for (const [fase, amp, ext] of [[0, 0.5, 0.05], [47, 0.6, 0.09]] as const) {
      ctx.beginPath(); tracoTremido(ctx, estender(pts, ext), lw * amp, false, 12, fase); ctx.stroke();
    }
    ctx.restore(); return;
  }
  ctx.beginPath();
  tracoTremido(ctx, pts, lw * 0.22);
  ctx.stroke();
}

function desenharCabeca(ctx: CanvasRenderingContext2D, e: Esqueleto) {
  const lw = ctx.lineWidth, { x, y } = e.cabeca;
  ctx.beginPath(); circuloTremido(ctx, x, y, e.raio, lw * 0.22); ctx.fill();
  if (estilo === 'tinta') {
    ctx.beginPath(); circuloTremido(ctx, x, y, e.raio, lw * 0.18); ctx.lineWidth = lw * 0.8; ctx.stroke();
    ctx.lineWidth = lw * 1.5; ctx.beginPath(); ctx.arc(x, y, e.raio, 0.05 * Math.PI, 0.95 * Math.PI); ctx.stroke(); // sombra de espessura embaixo
    ctx.lineWidth = lw; return;
  }
  if (estilo === 'rabisco') {
    ctx.save(); ctx.lineWidth = lw * 0.55;
    for (const [fase, amp, k] of [[0, 0.5, 1.0], [61, 0.8, 1.035]] as const) { ctx.beginPath(); circuloTremido(ctx, x, y, e.raio * k, lw * amp, fase); ctx.stroke(); }
    ctx.restore(); return;
  }
  ctx.beginPath(); circuloTremido(ctx, x, y, e.raio, lw * 0.22); ctx.stroke();
}

// ---------------------------------------------------------------- rosto

interface Rosto { olho: 'normal' | 'grande' | 'meia' | 'estreito'; sobr: number; sobrAssimetrica?: boolean; boca: 'sorriso' | 'triste' | 'o' | 'reta' | 'lado' | 'dentes' | 'onda' | 'aberta' }
const ROSTOS: Record<ExpressaoId, Rosto> = {
  neutra: { olho: 'normal', sobr: 0, boca: 'reta' },
  feliz: { olho: 'normal', sobr: 3, boca: 'sorriso' },
  triste: { olho: 'normal', sobr: 9, boca: 'triste' },
  brava: { olho: 'estreito', sobr: -11, boca: 'dentes' },
  surpresa: { olho: 'grande', sobr: 8, boca: 'o' },
  confusa: { olho: 'normal', sobr: 6, sobrAssimetrica: true, boca: 'onda' },
  sarcastica: { olho: 'meia', sobr: 7, sobrAssimetrica: true, boca: 'lado' },
  assustada: { olho: 'grande', sobr: 10, boca: 'onda' },
  empolgada: { olho: 'grande', sobr: 6, boca: 'aberta' },
  entediada: { olho: 'meia', sobr: 0, boca: 'reta' },
  deboche: { olho: 'meia', sobr: 10, sobrAssimetrica: true, boca: 'lado' },
  desespero: { olho: 'grande', sobr: 12, sobrAssimetrica: false, boca: 'aberta' },
  pensativa: { olho: 'normal', sobr: 4, sobrAssimetrica: true, boca: 'reta' },
  piscadela: { olho: 'grande', sobr: 4, boca: 'sorriso' },
};

function desenharRosto(ctx: CanvasRenderingContext2D, e: Esqueleto, rosto: Rosto, falando: number, t: number, grosso: boolean, v: VisualPalito, atorId?: ActorId) {
  if (atorId === 'mingau') {
    // Rosto felino expressivo com olhos amendoados e bigodes
    const r = e.raio, f = e.facing, { x, y } = e.cabeca;
    const piscar = (t * 1000) % 3600 < 130;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = COR;
    ctx.fillStyle = COR;
    const ey = y - 0.06 * r;
    const e1x = x + (f * 0.18 - 0.28) * r, e2x = x + (f * 0.18 + 0.28) * r;
    for (const ox of [e1x, e2x]) {
      if (piscar) {
        linha(ctx, { x: ox - r * 0.14, y: ey }, { x: ox + r * 0.14, y: ey });
      } else {
        ctx.fillStyle = COR;
        ctx.beginPath(); ctx.ellipse(ox, ey, r * 0.14, r * 0.16, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(ox - r * 0.04, ey - r * 0.04, r * 0.05, 0, Math.PI * 2); ctx.fill();
      }
    }
    const fx = x + f * 0.18 * r, fy = y + 0.22 * r;
    ctx.fillStyle = COR;
    ctx.beginPath();
    ctx.moveTo(fx - r * 0.08, fy - r * 0.06);
    ctx.lineTo(fx + r * 0.08, fy - r * 0.06);
    ctx.lineTo(fx, fy + r * 0.02);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = r * 0.06;
    ctx.beginPath(); ctx.arc(fx - r * 0.08, fy + r * 0.08, r * 0.09, 0, Math.PI * 0.85); ctx.stroke();
    ctx.beginPath(); ctx.arc(fx + r * 0.08, fy + r * 0.08, r * 0.09, Math.PI * 0.15, Math.PI); ctx.stroke();
    ctx.lineWidth = r * 0.04;
    for (const side of [-1, 1]) {
      linha(ctx, { x: fx + side * r * 0.15, y: fy }, { x: fx + side * r * 0.55, y: fy - r * 0.1 });
      linha(ctx, { x: fx + side * r * 0.15, y: fy + r * 0.06 }, { x: fx + side * r * 0.58, y: fy + r * 0.06 });
      linha(ctx, { x: fx + side * r * 0.15, y: fy + r * 0.12 }, { x: fx + side * r * 0.52, y: fy + r * 0.2 });
    }
    ctx.restore();
    return;
  }
  if (atorId === 'paraiba') {
    // Rosto de vira-lata caramelo leal e simpático
    const r = e.raio, f = e.facing, { x, y } = e.cabeca;
    const piscar = (t * 1000) % 3400 < 130;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = COR;
    ctx.fillStyle = COR;
    const ey = y - 0.08 * r;
    const e1x = x + (f * 0.2 - 0.26) * r, e2x = x + (f * 0.2 + 0.26) * r;
    for (const ox of [e1x, e2x]) {
      if (piscar) {
        linha(ctx, { x: ox - r * 0.12, y: ey }, { x: ox + r * 0.12, y: ey });
      } else {
        ctx.fillStyle = COR;
        ctx.beginPath(); ctx.arc(ox, ey, r * 0.13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(ox - r * 0.04, ey - r * 0.04, r * 0.04, 0, Math.PI * 2); ctx.fill();
      }
    }
    // Sobrancelhas caninas expressivas
    ctx.lineWidth = r * 0.06;
    ctx.beginPath(); ctx.arc(e1x, ey - r * 0.2, r * 0.12, -Math.PI * 0.8, -Math.PI * 0.2); ctx.stroke();
    ctx.beginPath(); ctx.arc(e2x, ey - r * 0.2, r * 0.12, -Math.PI * 0.8, -Math.PI * 0.2); ctx.stroke();
    // Focinho volumoso
    const fx = x + f * 0.22 * r, fy = y + 0.26 * r;
    ctx.fillStyle = '#fff';
    ctx.lineWidth = r * 0.06;
    ctx.beginPath();
    ctx.ellipse(fx, fy, r * 0.36, r * 0.26, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // Trufa / Nariz preto de cachorro
    const nx = fx, ny = fy - r * 0.12;
    ctx.fillStyle = COR;
    ctx.beginPath();
    ctx.ellipse(nx, ny, r * 0.14, r * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    linha(ctx, { x: nx, y: ny + r * 0.08 }, { x: nx, y: fy + r * 0.08 });
    // Sorriso canino em 'w'
    const bw = r * 0.14;
    ctx.beginPath(); ctx.arc(nx - bw * 0.75, fy + r * 0.08, bw, 0, Math.PI * 0.75); ctx.stroke();
    ctx.beginPath(); ctx.arc(nx + bw * 0.75, fy + r * 0.08, bw, Math.PI * 0.25, Math.PI); ctx.stroke();
    // Língua canina para fora quando falando/alegre
    if (falando || rosto.boca === 'sorriso' || rosto.boca === 'aberta') {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(nx, fy + r * 0.2, r * 0.09, r * 0.13, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      linha(ctx, { x: nx, y: fy + r * 0.12 }, { x: nx, y: fy + r * 0.25 });
    }
    // Pontinhos de bigode
    ctx.fillStyle = COR;
    for (const side of [-1, 1]) {
      for (const [pdx, pdy] of [[0.18, 0], [0.24, -0.06], [0.24, 0.06]]) {
        ctx.beginPath();
        ctx.arc(fx + side * pdx * r, fy + pdy * r, r * 0.02, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    return;
  }

  const r = e.raio, f = e.facing, { x, y } = e.cabeca;
  const ex = x + f * 0.22 * r, ey = y - 0.08 * r;
  const olhos: Pt[] = [{ x: ex - 0.31 * r, y: ey }, { x: ex + 0.31 * r, y: ey }];
  const piscar = (t * 1000) % 3400 < 130;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.fillStyle = COR;
  ctx.strokeStyle = COR;
  ctx.lineWidth = r * 0.07;
  olhos.forEach((o, i) => {
    // Olhos no estilo Rick and Morty: bola branca com contorno e pupila pequena.
    const R = r * (rosto.olho === 'grande' ? 0.25 : 0.2);
    if (piscar && rosto.olho !== 'grande') { linha(ctx, { x: o.x - R * 0.8, y: o.y }, { x: o.x + R * 0.8, y: o.y }); return; }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(o.x, o.y, R, 0, 7); ctx.fill(); ctx.stroke();
    const caida = rosto.olho === 'meia' ? R * 0.3 : 0;
    ctx.fillStyle = COR; ctx.beginPath(); ctx.arc(o.x + f * R * 0.38, o.y + caida, R * (rosto.olho === 'grande' ? 0.24 : 0.32), 0, 7); ctx.fill();
    if (rosto.olho === 'meia') { // pálpebra pesada: cobre a metade de cima do olho
      ctx.beginPath(); ctx.arc(o.x, o.y, R, Math.PI, 0); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();
      linha(ctx, { x: o.x - R, y: o.y }, { x: o.x + R, y: o.y }); ctx.beginPath(); ctx.arc(o.x, o.y, R, 0, Math.PI); ctx.stroke();
      ctx.fillStyle = COR; ctx.beginPath(); ctx.arc(o.x + f * R * 0.38, o.y + R * 0.4, R * 0.28, 0, Math.PI); ctx.fill();
    }
    if (rosto.olho === 'estreito') { // sobrancelha pesada cai sobre o olho
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(o.x - R, o.y - R * (i === 0 ? 1 : 0.1)); ctx.lineTo(o.x + R, o.y - R * (i === 0 ? 0.1 : 1)); ctx.lineTo(o.x + R, o.y - R * 1.2); ctx.lineTo(o.x - R, o.y - R * 1.2); ctx.closePath(); ctx.fill();
      linha(ctx, { x: o.x - R, y: o.y - R * (i === 0 ? 1 : 0.1) }, { x: o.x + R, y: o.y - R * (i === 0 ? 0.1 : 1) });
    }
    if (v.cilios) { // cílios no canto externo
      const lado = i === 0 ? -1 : 1;
      for (const [dx, dy] of [[0.9, -0.55], [1.15, -0.2], [1.1, 0.15]] as const) {
        linha(ctx, { x: o.x + lado * R * dx * 0.85, y: o.y + R * dy * 0.85 }, { x: o.x + lado * R * (dx + 0.45), y: o.y + R * (dy - 0.3) });
      }
    }
    // sobrancelhas
    // sobr > 0 levanta a ponta interna (triste/surpreso); < 0 abaixa (bravo). Assimétrica: só a sobrancelha direita sobe.
    const by = o.y - r * (rosto.sobrAssimetrica && i === 1 ? 0.44 : 0.3);
    const subida = (rosto.sobr * r) / 60;
    const externo = o.x + (i === 0 ? -1 : 1) * r * 0.17, interno = o.x + (i === 0 ? 1 : -1) * r * 0.17;
    ctx.lineWidth = r * (grosso ? 0.13 : 0.07);
    linha(ctx, { x: externo, y: by }, { x: interno, y: by - subida });
    ctx.lineWidth = r * 0.07;
  });
  // boca
  const mx = x + f * 0.2 * r, my = y + 0.46 * r, w = r * 0.28;
  ctx.lineWidth = r * 0.07;
  ctx.fillStyle = '#fff';
  const abre = falando ? 0.5 + 0.5 * Math.sin(t * 18) : 0;
  // dentes da frente levemente separados (Aluno): dois retângulos com uma fresta no meio
  const dentes = (cx: number, topo: number) => {
    if (!v.dentesSeparados) return;
    const dw = r * 0.1, gap = r * 0.05, dh = r * 0.14;
    ctx.save(); ctx.fillStyle = '#fff'; ctx.lineWidth = r * 0.04;
    for (const x0 of [cx - gap / 2 - dw, cx + gap / 2]) { ctx.beginPath(); ctx.rect(x0, topo, dw, dh); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  };
  if (falando && abre > 0.15) {
    const ry = r * (0.05 + 0.15 * abre);
    ctx.beginPath(); ctx.ellipse(mx, my, w * 0.7, ry, 0, 0, 7); ctx.fill(); ctx.stroke();
    dentes(mx, my - ry + ctx.lineWidth * 0.5);
  } else {
    ctx.beginPath();
    switch (rosto.boca) {
      case 'sorriso': ctx.arc(mx, my - r * 0.1, w, 0.15 * Math.PI, 0.85 * Math.PI); break;
      case 'triste': ctx.arc(mx, my + r * 0.25, w, 1.15 * Math.PI, 1.85 * Math.PI); break;
      case 'reta': ctx.moveTo(mx - w * 0.7, my); ctx.lineTo(mx + w * 0.7, my); break;
      case 'lado': ctx.moveTo(mx - w * 0.7, my + r * 0.04); ctx.quadraticCurveTo(mx + w * 0.1, my + r * 0.05, mx + w * 0.9, my - r * 0.14); break;
      case 'onda':
        ctx.moveTo(mx - w, my); ctx.bezierCurveTo(mx - w * 0.5, my - r * 0.14, mx - w * 0.1, my + r * 0.14, mx + w * 0.4, my); ctx.lineTo(mx + w, my - r * 0.04); break;
      case 'o': ctx.ellipse(mx, my + r * 0.04, w * 0.45, r * 0.16, 0, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); break;
      case 'dentes': ctx.rect(mx - w * 0.8, my - r * 0.05, w * 1.6, r * 0.2); ctx.fillStyle = '#fff'; ctx.fill(); break;
      case 'aberta': ctx.moveTo(mx - w, my - r * 0.06); ctx.quadraticCurveTo(mx, my + r * 0.4, mx + w, my - r * 0.06); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); break;
    }
    ctx.stroke();
    if (rosto.boca === 'dentes') linha(ctx, { x: mx, y: my - r * 0.05 }, { x: mx, y: my + r * 0.15 });
    if (rosto.boca === 'sorriso') dentes(mx, my - r * 0.1 + w - r * 0.15);
    if (rosto.boca === 'aberta') dentes(mx, my - r * 0.06 + ctx.lineWidth * 0.5);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- acessórios por ator

function desenharCabelo(ctx: CanvasRenderingContext2D, e: Esqueleto, id: ModeloPalito, atorId?: ActorId) {
  const { x, y } = e.cabeca, r = e.raio, f = e.facing;
  const ponto = (a: number, k: number): Pt => ({ x: x + Math.cos(a) * r * k, y: y + Math.sin(a) * r * k });
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = COR; ctx.fillStyle = COR; ctx.lineWidth = r * 0.07;

  // Elizendra: cabelo grisalho ondulado com mechinhas presas com grampos em 'X'
  if (atorId === 'elizendra') {
    // Ondas grisalhas volumosas contornando a cabeça
    for (let i = 0; i <= 6; i++) {
      const a = -Math.PI * 0.95 + (Math.PI * 0.9 * i) / 6;
      const c = ponto(a, 1.06);
      const cr = r * 0.22;
      ctx.beginPath(); ctx.arc(c.x, c.y, cr, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(x, y, r * 1.03, -Math.PI * 0.96, -Math.PI * 0.04); ctx.stroke();
    // Grampos em 'X' nas mechinhas
    const g1x = x + f * r * 0.48, g1y = y - r * 0.48;
    const g2x = x - f * r * 0.42, g2y = y - r * 0.58;
    const dG = r * 0.09;
    linha(ctx, { x: g1x - dG, y: g1y - dG }, { x: g1x + dG, y: g1y + dG });
    linha(ctx, { x: g1x - dG, y: g1y + dG }, { x: g1x + dG, y: g1y - dG });
    linha(ctx, { x: g2x - dG, y: g2y - dG }, { x: g2x + dG, y: g2y + dG });
    linha(ctx, { x: g2x - dG, y: g2y + dG }, { x: g2x + dG, y: g2y - dG });
    ctx.restore();
    return;
  }

  // Artur: cabelo liso curto com franjinha reta bem certinha na testa
  if (atorId === 'artur') {
    const a0 = Math.asin(0.35);
    ctx.beginPath(); ctx.arc(x, y, r * 1.02, Math.PI + a0, -a0); ctx.closePath(); ctx.fill();
    const fx1 = x - r * 0.76, fx2 = x + r * 0.76, fy = y - r * 0.28;
    ctx.lineWidth = r * 0.08;
    linha(ctx, { x: fx1, y: fy }, { x: fx2, y: fy });
    for (let k = -2; k <= 2; k++) {
      linha(ctx, { x: x + k * r * 0.24, y: fy }, { x: x + k * r * 0.24, y: fy - r * 0.12 });
    }
    ctx.restore();
    return;
  }

  // Carol: ondulada com rabo de cavalo, blusa de adolescente e saia, muito vaidosa
  if (atorId === 'carol') {
    // Wavy hair strands
    ctx.lineWidth = r * 0.08;
    for (let i = 0; i <= 5; i++) {
      const a = -Math.PI * 0.9 + (Math.PI * 0.8 * i) / 5;
      const c = ponto(a, 1.05);
      ctx.beginPath();
      ctx.arc(c.x, c.y, r * 0.12, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Ponytail at back
    const ptX = x - f * 0.3 * r;
    const ptY = y - r * 0.6;
    ctx.beginPath();
    ctx.moveTo(ptX, ptY);
    ctx.quadraticCurveTo(ptX - f * 0.2 * r, ptY - r * 0.4, ptX - f * 0.5 * r, ptY - r * 1.0);
    ctx.stroke();
    // Scrunchie (pink)
    ctx.fillStyle = '#ff69b4';
    ctx.beginPath();
    ctx.arc(ptX - f * 0.5 * r, ptY - r * 1.0, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  // Mingau: orelhas triangulares felinas pontudas com detalhe interno
  if (atorId === 'mingau') {
    ctx.save();
    ctx.strokeStyle = COR; ctx.lineWidth = r * 0.08; ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(x - 0.65 * r, y - 0.45 * r);
    ctx.lineTo(x - 0.7 * r, y - 1.35 * r);
    ctx.lineTo(x - 0.15 * r, y - 0.8 * r);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.lineWidth = r * 0.04;
    linha(ctx, { x: x - 0.6 * r, y: y - 0.6 * r }, { x: x - 0.6 * r, y: y - 1.15 * r }, { x: x - 0.25 * r, y: y - 0.8 * r });
    ctx.lineWidth = r * 0.08;
    ctx.beginPath();
    ctx.moveTo(x + 0.15 * r, y - 0.8 * r);
    ctx.lineTo(x + 0.7 * r, y - 1.35 * r);
    ctx.lineTo(x + 0.65 * r, y - 0.45 * r);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.lineWidth = r * 0.04;
    linha(ctx, { x: x + 0.25 * r, y: y - 0.8 * r }, { x: x + 0.6 * r, y: y - 1.15 * r }, { x: x + 0.6 * r, y: y - 0.6 * r });
    ctx.restore();
    return;
  }

  // Paraíba: orelhas caídas expressivas caninas dos dois lados com dobra suave
  if (atorId === 'paraiba') {
    for (const s of [-1, 1]) {
      const ox = x + s * r * 0.75, oy = y - r * 0.2;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.quadraticCurveTo(ox + s * r * 0.45, oy + r * 0.7, ox + s * r * 0.2, oy + r * 1.25);
      ctx.quadraticCurveTo(ox - s * r * 0.1, oy + r * 0.7, ox, oy);
      ctx.fill(); ctx.stroke();
      linha(ctx, { x: ox, y: oy + r * 0.2 }, { x: ox + s * r * 0.15, y: oy + r * 0.8 });
    }
    ctx.restore();
    return;
  }

  // Véia: coque clássico volumoso com mechas
  if (atorId === 'veia') {
    // Coque no topo/trás da cabeça
    const cx = x - f * r * 0.7, cy = y - r * 0.85;
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.lineWidth = r * 0.05; ctx.strokeStyle = '#fff';
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 1.5); ctx.stroke();
    // Cabelo ondulado grisalho preso
    ctx.strokeStyle = COR; ctx.lineWidth = r * 0.08;
    ctx.beginPath(); ctx.arc(x, y, r * 1.02, -Math.PI * 0.9, -Math.PI * 0.1); ctx.stroke();
    ctx.restore();
    return;
  }

  // Véio: mechas de cabelo ralo lateral de poeta e sobrancelhas proeminentes
  if (atorId === 'veio') {
    for (const lado of [-1, 1]) {
      const p = ponto(lado > 0 ? -0.1 : Math.PI + 0.1, 1.0);
      linha(ctx, p, { x: p.x + lado * r * 0.35, y: p.y + r * 0.25 }, { x: p.x + lado * r * 0.2, y: p.y + r * 0.5 });
    }
    // Bigode farto de poeta
    const bx = x + f * 0.22 * r, by = y + 0.3 * r;
    ctx.lineWidth = r * 0.09;
    ctx.beginPath();
    ctx.moveTo(bx - r * 0.3, by + r * 0.08);
    ctx.quadraticCurveTo(bx, by - r * 0.04, bx + r * 0.35, by + r * 0.08);
    ctx.stroke();
    ctx.restore();
    return;
  }

  switch (id) {
    case 'professor': { // corte social espetado para cima: fileira de espetos curtos e retos
      const n = 9;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI * 0.9 + (Math.PI * 0.8 * i) / (n - 1);
        const b0 = ponto(a - 0.1, 0.97), b1 = ponto(a + 0.1, 0.97), m = ponto(a, 1);
        ctx.beginPath(); ctx.moveTo(b0.x, b0.y); ctx.lineTo(m.x + Math.cos(a) * r * 0.2, m.y - r * 0.44); ctx.lineTo(b1.x, b1.y); ctx.fill();
      }
      for (const lado of [-1, 1]) { const p = ponto(lado > 0 ? -0.15 : Math.PI + 0.15, 0.98); linha(ctx, p, { x: p.x, y: p.y + r * 0.3 }); } // costeletas
      break;
    }
    case 'aluno': { // cabelo cacheado, para cima e despenteado: cachos de tamanhos irregulares
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI * 0.97 + (Math.PI * 0.94 * i) / 8 + ((i * 37) % 5 - 2) * 0.04;
        const c = ponto(a, 1.08 + ((i * 53) % 4) * 0.05), cr = r * (0.2 + 0.05 * ((i * 29) % 3));
        ctx.fillStyle = COR; ctx.beginPath(); ctx.arc(c.x, c.y, cr, 0, 7); ctx.fill();
        ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = r * 0.04; ctx.beginPath(); ctx.arc(c.x, c.y, cr * 0.5, i, i + 4.4); ctx.stroke(); ctx.restore();
      }
      break;
    }
    case 'mae': { // cabelos ondulados e longos, franja de lado
      for (const s of [-1, 1]) for (const j of [0, 1]) {
        ctx.beginPath();
        for (let i = 0; i <= 8; i++) {
          const px = x + s * (r * (1.0 + 0.14 * j) + Math.sin(i * 1.1 + j * 1.5) * r * 0.17), py = y - r * 0.4 + i * r * 0.4;
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.stroke();
      }
      ctx.lineWidth = r * 0.1;
      ctx.beginPath(); ctx.arc(x, y, r * 1.03, -Math.PI * 0.95, -Math.PI * 0.05); ctx.stroke();
      ctx.lineWidth = r * 0.07;
      ctx.beginPath(); ctx.moveTo(x - f * r * 0.8, y - r * 0.6); ctx.quadraticCurveTo(x + f * r * 0.2, y - r * 0.95, x + f * r * 0.9, y - r * 0.3); ctx.stroke();
      // faixa hippie na cabeça com uma florzinha
      ctx.lineWidth = r * 0.09; ctx.beginPath(); ctx.arc(x, y, r * 0.93, -Math.PI * 0.88, -Math.PI * 0.12); ctx.stroke();
      ctx.lineWidth = r * 0.06; flor(ctx, x - f * r * 0.72, y - r * 0.6, r * 0.13);
      break;
    }
    case 'cacula': { // cabelo preto curto: capa preenchida no alto da cabeça
      const a = Math.asin(0.45);
      ctx.beginPath(); ctx.arc(x, y, r * 1.02, Math.PI + a, -a); ctx.closePath(); ctx.fill();
      break;
    }
    case 'priminha': { // franja + maria-chiquinha com laços
      ctx.lineWidth = r * 0.12; ctx.beginPath(); ctx.arc(x, y, r * 1.0, -Math.PI * 0.92, -Math.PI * 0.08); ctx.stroke();
      ctx.lineWidth = r * 0.08;
      for (const k of [-1, 1]) {
        const bx = x + k * r * 0.98, by = y - r * 0.15;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + k * r * 0.7, by + r * 0.3, bx + k * r * 0.4, by + r * 1.1); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + k * r * 0.34, by - r * 0.22); ctx.lineTo(bx + k * r * 0.34, by + r * 0.22); ctx.closePath(); ctx.fill();
      }
      break;
    }
  }
  ctx.restore();
}
function desenharNariz(ctx: CanvasRenderingContext2D, e: Esqueleto, atorId?: ActorId) {
  if (atorId === 'paraiba' || atorId === 'mingau') return; // Paraíba e Mingau têm focinho e trufa próprios no rosto
  const { x, y } = e.cabeca, r = e.raio, f = e.facing, nx = x + f * 0.22 * r;
  ctx.save(); ctx.strokeStyle = COR; ctx.lineCap = 'round'; ctx.lineWidth = r * 0.06;
  ctx.beginPath(); ctx.moveTo(nx, y - 0.02 * r); ctx.quadraticCurveTo(nx - f * 0.03 * r, y + 0.24 * r, nx + f * 0.16 * r, y + 0.28 * r); ctx.stroke();
  ctx.restore();
}
function desenharOculos(ctx: CanvasRenderingContext2D, e: Esqueleto, atorId?: ActorId) {
  const r = e.raio, f = e.facing, ex = e.cabeca.x + f * 0.22 * r, ey = e.cabeca.y - 0.08 * r;
  ctx.save();
  ctx.lineWidth = r * 0.07; ctx.strokeStyle = COR;

  if (atorId === 'elizendra') {
    // Óculos de grau ovais com correntinha delicada caindo sobre os ombros
    for (const k of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(ex + k * 0.31 * r, ey, r * 0.26, r * 0.18, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Ponte entre as lentes
    linha(ctx, { x: ex - 0.05 * r, y: ey }, { x: ex + 0.05 * r, y: ey });
    // Haste lateral
    linha(ctx, { x: ex - 0.57 * r, y: ey }, { x: ex - 0.95 * r * (f > 0 ? 1 : 0.6), y: ey - 0.04 * r });
    // Correntinha delicada
    ctx.lineWidth = r * 0.035;
    const c1x = ex - 0.57 * r, c1y = ey;
    linha(ctx, { x: c1x, y: c1y }, { x: c1x - 0.06 * r, y: c1y + 0.3 * r }, { x: e.ombro.x - 0.1 * r, y: e.ombro.y });
    const c2x = ex + 0.57 * r, c2y = ey;
    linha(ctx, { x: c2x, y: c2y }, { x: c2x + 0.06 * r, y: c2y + 0.3 * r }, { x: e.ombro.x + 0.15 * r, y: e.ombro.y });
    ctx.restore();
    return;
  }

  if (atorId === 'artur') {
    // Óculos de armação quadrada / retangular de gamer
    const ow = r * 0.27, oh = r * 0.2;
    for (const k of [-1, 1]) {
      const ox = ex + k * 0.31 * r;
      ctx.beginPath();
      ctx.rect(ox - ow, ey - oh, ow * 2, oh * 2);
      ctx.stroke();
    }
    linha(ctx, { x: ex - 0.04 * r, y: ey - oh * 0.2 }, { x: ex + 0.04 * r, y: ey - oh * 0.2 });
    linha(ctx, { x: ex - 0.58 * r, y: ey - oh * 0.2 }, { x: ex - 0.98 * r * (f > 0 ? 1 : 0.6), y: ey - oh * 0.3 });
    ctx.restore();
    return;
  }

  // Padrão redondo
  for (const k of [-1, 1]) { ctx.beginPath(); ctx.arc(ex + k * 0.31 * r, ey, r * 0.25, 0, 7); ctx.stroke(); }
  linha(ctx, { x: ex - 0.06 * r, y: ey }, { x: ex + 0.06 * r, y: ey });
  linha(ctx, { x: ex - 0.56 * r, y: ey }, { x: ex - 0.98 * r * (f > 0 ? 1 : 0.6), y: ey - 0.05 * r });
  ctx.restore();
}

// ---------------------------------------------------------------- efeitos sobre a cabeça

function desenharFonesOuvido(ctx: CanvasRenderingContext2D, e: Esqueleto) {
  const { x, y } = e.cabeca, r = e.raio;
  ctx.save();
  ctx.strokeStyle = COR;
  ctx.fillStyle = '#fff';
  ctx.lineWidth = r * 0.11;
  ctx.lineCap = 'round';
  // Arco do fone sobre o topo da cabeça
  ctx.beginPath();
  ctx.arc(x, y - r * 0.1, r * 1.14, -Math.PI * 0.88, -Math.PI * 0.12);
  ctx.stroke();
  // Concha esquerda
  ctx.lineWidth = r * 0.08;
  ctx.beginPath();
  ctx.roundRect(x - r * 1.18, y - r * 0.22, r * 0.26, r * 0.52, r * 0.1);
  ctx.fill(); ctx.stroke();
  // Concha direita
  ctx.beginPath();
  ctx.roundRect(x + r * 0.92, y - r * 0.22, r * 0.26, r * 0.52, r * 0.1);
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

function desenharEfeito(ctx: CanvasRenderingContext2D, e: Esqueleto, efeito: 'ideia' | 'duvida' | 'exclamacao' | 'raiva', idade: number, t: number) {
  const pop = suave(idade / 0.25);
  if (pop <= 0) return;
  const r = e.raio, cx = e.cabeca.x + e.facing * r * 0.2, cy = e.cabeca.y - r * 2.1;
  ctx.save();
  ctx.translate(cx, cy); ctx.scale(pop, pop);
  ctx.lineCap = 'round'; ctx.lineWidth = r * 0.1;
  if (efeito === 'ideia') {
    ctx.strokeStyle = COR; ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(-r * 0.25, r * 0.5, r * 0.5, r * 0.3); ctx.strokeRect(-r * 0.25, r * 0.5, r * 0.5, r * 0.3);
    ctx.strokeStyle = COR;
    for (let i = 0; i < 7; i++) { const a = -Math.PI + (i * Math.PI) / 6 + Math.sin(t * 8) * 0.03; linha(ctx, { x: Math.cos(a) * r * 0.8, y: Math.sin(a) * r * 0.8 - 2 }, { x: Math.cos(a) * r * 1.1, y: Math.sin(a) * r * 1.1 - 2 }); }
  } else if (efeito === 'duvida' || efeito === 'exclamacao') {
    ctx.fillStyle = efeito === 'duvida' ? COR : COR;
    ctx.font = `800 ${r * 1.9}px "Ink Free","Segoe Print","Comic Sans MS",cursive`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.rotate(0.12 * Math.sin(t * 6));
    ctx.fillText(efeito === 'duvida' ? '?' : '!', 0, 0);
  } else {
    ctx.strokeStyle = COR;
    const g = (dx: number, dy: number, k: number) => {
      ctx.beginPath(); ctx.moveTo(dx - k, dy - k); ctx.lineTo(dx + k * 0.2, dy - k * 0.2); ctx.lineTo(dx - k * 0.2, dy + k * 0.2); ctx.lineTo(dx + k, dy + k); ctx.stroke();
    };
    const s = r * 0.35 * (1 + 0.15 * Math.sin(t * 14));
    g(-r * 0.4, 0, s); g(r * 0.4, -r * 0.2, s * 0.8);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- ator completo

export interface OpcoesAtor {
  selecionado?: boolean;
  t: number;
  idadePose: number;
  cenario?: 'lousa' | 'podcast' | 'telejornal' | 'debate' | 'papo_livre' | 'neutro';
}

export function poseAtual(a: AtorEstado, t: number): PoseDef {
  const k = suave((t - a.poseDesde) / TRANSICAO_POSE);
  const alvo = poseDef(a.pose, a.fase, t);
  return k >= 1 ? alvo : misturar(poseDef(a.poseDe, a.faseDe, t), alvo, k);
}

/** Desenha um ator em (x, chao) na escala `s` (1 = 440 px de altura). */
export function desenharAtor(ctx: CanvasRenderingContext2D, a: AtorEstado, x: number, chao: number, escala: number, o: OpcoesAtor) {
  const real = ATORES[a.id]!;
  const modelo = real.modeloPalito;
  const spec = { visual: { ...PALITO[modelo] } };
  if (a.id === 'elizendra') {
    spec.visual.oculos = true;
    spec.visual.cilios = true;
    spec.visual.dentesSeparados = false;
  } else if (a.id === 'artur') {
    spec.visual.oculos = true;
    spec.visual.cilios = false;
    spec.visual.dentesSeparados = true;
  } else if (a.id === 'carol') {
    spec.visual.oculos = false;
    spec.visual.cilios = true;
    spec.visual.dentesSeparados = false;
  } else if (a.id === 'paraiba' || a.id === 'mingau') {
    spec.visual.oculos = false;
    spec.visual.cilios = false;
    spec.visual.dentesSeparados = false;
    spec.visual.postura = { torso: 84, cabeca: -72 };
  }
  const s = (escala * real.altura) / 440;
  // clipe do personagem (estilo Stickman): pose do boneco do passo atual + o movimento do passo
  const clipe = a.clipe ? acharClipe(a.id, a.clipe, 'stickman') : undefined;
  const tc = clipe ? avaliarClipe(clipe, Math.max(0, o.t - a.poseDesde)) : undefined;
  const pose = tc ? poseDef(tc.poseBoneco ?? 'parado', a.fase, o.t) : poseAtual(a, o.t);
  if ((o.cenario === 'podcast' || o.cenario === 'telejornal' || o.cenario === 'debate') && a.id !== 'paraiba' && a.id !== 'mingau' && !tc && a.pose === 'parado') {
    pose.pernaF = [82, -84];
    pose.pernaT = [78, -78];
    pose.torso = 2;
    if (a.fala?.boca) {
      pose.bracoF = [42 + 10 * Math.sin(o.t * 5), 45];
      pose.bracoT = [-28, 58];
    } else {
      pose.bracoF = [32 + 2 * Math.sin(o.t * 2), 52];
      pose.bracoT = [-30 - 2 * Math.sin(o.t * 2), 52];
    }
  }
  if (spec.visual.postura) { pose.torso += spec.visual.postura.torso; pose.cabeca += spec.visual.postura.cabeca; }
  const e = resolver(pose, x, chao, s, spec.visual.cabeca, a.facing);
  const lw = Math.max(1.2, 5.4 * Math.pow(s, 0.6));
  const expr = o.t - a.expressaoDesde < 0.15 ? a.expressaoDe : a.expressao;

  // sombra no chão: só um traço, sem cinza (lineart)
  ctx.save();
  ctx.strokeStyle = COR; ctx.lineWidth = Math.max(1, 3 * Math.pow(s, 0.6)); ctx.lineCap = 'round';
  linha(ctx, { x: x - 60 * s, y: chao + 8 * s }, { x: x + 60 * s, y: chao + 8 * s });
  ctx.restore();

  ctx.save();
  if (tc) { const alt = real.altura * escala; ctx.translate(x + tc.dx * alt, chao + tc.dy * alt); ctx.rotate(rad(tc.rot)); ctx.scale(tc.sx * (tc.espelhar ? -1 : 1), tc.sy); ctx.translate(-x, -chao); }
  if (pose.rot) { ctx.translate(x, chao); ctx.rotate(rad(pose.rot) * a.facing); ctx.translate(-x, -chao); }
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = lw; ctx.strokeStyle = COR;

  if (a.pose === 'sentar') { // banquinho
    ctx.lineWidth = lw * 0.8;
    linha(ctx, { x: e.quadril.x - 40 * s, y: e.quadril.y + 4 * s }, { x: e.quadril.x + 40 * s, y: e.quadril.y + 4 * s });
    linha(ctx, { x: e.quadril.x - 30 * s, y: e.quadril.y + 4 * s }, { x: e.quadril.x - 34 * s, y: chao });
    linha(ctx, { x: e.quadril.x + 30 * s, y: e.quadril.y + 4 * s }, { x: e.quadril.x + 34 * s, y: chao });
    ctx.lineWidth = lw;
  }

  // corpo com volume (tubos com contorno duplo, mãos, sapatos, roupa) + pescoço, orelha de trás e cabeça
  desenharCorpo(ctx, e, modelo, lw, a.id);
  ctx.strokeStyle = COR;
  if (a.id !== 'paraiba' && a.id !== 'mingau') {
    linha(ctx, e.ombro, { x: e.ombro.x + (e.cabeca.x - e.ombro.x) * 0.75, y: e.ombro.y + (e.cabeca.y - e.ombro.y) * 0.75 });
    ctx.lineWidth = lw * 0.85; ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(e.cabeca.x - a.facing * e.raio * 0.98, e.cabeca.y + e.raio * 0.08, e.raio * 0.13, e.raio * 0.2, 0, 0, 7); ctx.fill(); ctx.stroke();
  }
  ctx.lineWidth = lw;  ctx.fillStyle = '#fff';
  desenharCabeca(ctx, e);
  desenharCabelo(ctx, e, modelo, a.id);
  desenharNariz(ctx, e, a.id);
  desenharRosto(ctx, e, ROSTOS[expr as ExpressaoId] ?? rostoBonecoDe(a.id, expr, o.t) ?? ROSTOS.neutra, a.fala?.boca ? 1 : 0, o.t, modelo === 'professor', spec.visual, a.id);
  if (spec.visual.oculos) desenharOculos(ctx, e, a.id);
  if (o.cenario === 'podcast' && a.id !== 'paraiba' && a.id !== 'mingau') {
    desenharFonesOuvido(ctx, e);
  }
  ctx.restore();

  const efeito = EFEITO_POSE[a.pose];
  if (efeito) desenharEfeito(ctx, e, efeito, o.t - a.poseDesde, o.t);

  if (o.selecionado) {
    ctx.save();
    ctx.strokeStyle = '#2d9cff'; ctx.lineWidth = 3; ctx.setLineDash([10, 8]);
    const larg = 150 * s, alto = 460 * s * Math.max(1, spec.visual.cabeca * 0.9);
    ctx.strokeRect(x - larg / 2, chao - alto, larg, alto + 16);
    ctx.restore();
  }
  return e;
}

export type { PoseId };






export { definirEstilo as definirEstiloTraco };



