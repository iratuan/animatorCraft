import type { PoseDef } from '@shared/domain';
import type { Esqueleto } from './ator';
import { bolinha, poli, tubo } from './corpo';
import type { Pt } from './tremor';

/**
 * Animais do elenco (Paraíba, cachorro; Mingau, gato): mesma cabeça, rosto e expressões dos bonecos de palito,
 * mas com corpo de quadrúpede. O esqueleto é o mesmo (quadril, ombro, cabeça, quatro patas), só que o corpo fica
 * na horizontal e as patas da frente saem do ombro. Assim as poses e as expressões funcionam sem código novo.
 */
export const ANIMAIS: ReadonlySet<string> = new Set(['paraiba', 'mingau']);
export const ehAnimal = (id?: string): boolean => !!id && ANIMAIS.has(id);

const rad = (g: number) => (g * Math.PI) / 180;
const MED = { torso: 150, braco: 75, antebraco: 70, coxa: 100, canela: 100, pescoco: 10, cabeca: 46 };
const P = (x: number, y: number): Pt => ({ x, y });

/**
 * Converte a pose de um bípede na de um quadrúpede. Ângulos: 0 = para baixo nos membros; 0 = para cima no tronco e na cabeça.
 * O tronco vai para 88° (horizontal, cabeça à frente); as pernas de trás mantêm o ritmo da pose; as da frente
 * andam em oposição às de trás do mesmo lado, como num passo de cachorro ou gato.
 */
export function poseDeAnimal(p: PoseDef): PoseDef {
  return {
    ...p,
    torso: 88 + p.torso * 0.25,
    cabeca: 55 + p.cabeca * 0.5,
    bracoF: [-p.pernaT[0] * 0.5, 6],
    bracoT: [-p.pernaF[0] * 0.5, 6],
  };
}

/** Esqueleto do quadrúpede: as patas de trás saem do quadril e as da frente do ombro; o corpo sobe até a pata mais baixa tocar o chão. */
export function resolverAnimal(pose: PoseDef, x: number, chao: number, s: number, cabecaK: number, facing: 1 | -1): Esqueleto {
  const dir = (g: number, len: number): Pt => ({ x: facing * Math.sin(rad(g)) * len * s, y: Math.cos(rad(g)) * len * s });
  const soma = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y });
  const perna = (p: [number, number]) => {
    const joe = dir(p[0], MED.coxa);
    return { joe, pe: soma(joe, dir(p[0] + p[1], MED.canela)) };
  };
  const braco = (p: [number, number]) => {
    const cot = dir(p[0], MED.braco);
    return { cot, mao: soma(cot, dir(p[0] + p[1], MED.antebraco)) };
  };
  const tF = perna(pose.pernaF), tT = perna(pose.pernaT);
  const dF = braco(pose.bracoF), dT = braco(pose.bracoT);
  // ombro em relação ao quadril: tronco para a frente (y para cima é negativo)
  const ombroRel: Pt = { x: facing * Math.sin(rad(pose.torso)) * MED.torso * s, y: -Math.cos(rad(pose.torso)) * MED.torso * s };
  const maisBaixo = Math.max(tF.pe.y, tT.pe.y, ombroRel.y + dF.mao.y, ombroRel.y + dT.mao.y);
  const quadril = P(x, chao - maisBaixo - pose.salto * s);
  const abs = (p: Pt) => soma(quadril, p);
  const ombro = abs(ombroRel);
  const raio = MED.cabeca * s * cabecaK;
  const cab = soma(ombro, {
    x: facing * Math.sin(rad(pose.cabeca)) * (MED.pescoco * s + raio),
    y: -Math.cos(rad(pose.cabeca)) * (MED.pescoco * s + raio),
  });
  return {
    quadril, ombro, cabeca: cab, raio,
    cotF: abs(soma(ombroRel, dF.cot)), maoF: abs(soma(ombroRel, dF.mao)),
    cotT: abs(soma(ombroRel, dT.cot)), maoT: abs(soma(ombroRel, dT.mao)),
    joeF: abs(tF.joe), peF: abs(tF.pe), joeT: abs(tT.joe), peT: abs(tT.pe),
    s, facing,
  };
}

/** Pata de bicho: uma almofadinha oval no chão, com dois dedos marcados. */
function pata(ctx: CanvasRenderingContext2D, pe: Pt, f: number, s: number, lw: number) {
  ctx.save(); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#14161a'; ctx.lineWidth = lw; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.ellipse(pe.x + f * 3 * s, pe.y - 2 * s, 8 * s, 4.5 * s, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(pe.x - 1 * s, pe.y - 5 * s); ctx.lineTo(pe.x - 1 * s, pe.y - 1 * s); ctx.stroke();
  ctx.restore();
}

/** Corpo de quadrúpede: rabo, patas de trás, tronco, patas da frente, orelhas e coleira. A cabeça e o rosto são desenhados depois, como nos bonecos. */
export function desenharAnimal(ctx: CanvasRenderingContext2D, e: Esqueleto, lw: number, id: string) {
  const { quadril: q, ombro: o, cabeca: c, raio: r, s, facing: f } = e;
  const ehPara = id === 'paraiba';
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  // rabo: cachorro abanando para cima; gato em S comprido
  const inicioRabo = P(q.x - f * 16 * s, q.y - 4 * s);
  ctx.strokeStyle = '#14161a'; ctx.lineWidth = lw * (ehPara ? 1.3 : 1.1);
  ctx.beginPath(); ctx.moveTo(inicioRabo.x, inicioRabo.y);
  if (ehPara) ctx.bezierCurveTo(inicioRabo.x - f * 16 * s, inicioRabo.y - 16 * s, inicioRabo.x - f * 22 * s, inicioRabo.y - 34 * s, inicioRabo.x - f * 6 * s, inicioRabo.y - 40 * s);
  else ctx.bezierCurveTo(inicioRabo.x - f * 14 * s, inicioRabo.y - 14 * s, inicioRabo.x - f * 4 * s, inicioRabo.y - 34 * s, inicioRabo.x - f * 26 * s, inicioRabo.y - 46 * s);
  ctx.stroke();

  // patas de trás (atrás do corpo), depois o tronco, depois as da frente
  const perna = 9 * s;
  tubo(ctx, [q, e.joeT, e.peT], perna, lw);
  pata(ctx, e.peT, f, s, lw);
  tubo(ctx, [q, o], 24 * s, lw);
  tubo(ctx, [o, e.cotF, e.maoF], 8 * s, lw);
  pata(ctx, e.maoF, f, s, lw);
  tubo(ctx, [q, e.joeF, e.peF], perna, lw);
  pata(ctx, e.peF, f, s, lw);

  // pescoço e orelhas
  const pescoco = P(o.x + (c.x - o.x) * 0.7, o.y + (c.y - o.y) * 0.7);
  tubo(ctx, [o, pescoco], 12 * s, lw);
  ctx.strokeStyle = '#14161a'; ctx.lineWidth = lw; ctx.fillStyle = '#fff';
  if (ehPara) {
    // orelha caída, pendurada atrás da cabeça
    ctx.beginPath(); ctx.ellipse(c.x - f * r * 0.78, c.y + r * 0.18, r * 0.3, r * 0.6, f * 0.35, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  } else {
    // orelhas pontudas de gato
    for (const k of [0, 0.55]) {
      const base = P(c.x - f * (r * (0.15 + k * 0.55)), c.y - r * 0.55);
      poli(ctx, [base, P(base.x - f * r * 0.22, base.y - r * 0.62), P(base.x - f * r * 0.42, base.y + r * 0.02)]);
    }
  }

  // coleira com medalha
  const colar = P(o.x + (c.x - o.x) * 0.22, o.y + (c.y - o.y) * 0.22);
  ctx.beginPath(); ctx.moveTo(colar.x - r * 0.45, colar.y); ctx.lineTo(colar.x + r * 0.45, colar.y); ctx.lineWidth = lw * 1.1; ctx.stroke();
  bolinha(ctx, colar.x, colar.y + 7 * s, (ehPara ? 4 : 3) * s);
  ctx.restore();
}
