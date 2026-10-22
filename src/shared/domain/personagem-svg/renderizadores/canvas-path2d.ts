import type { ActorId } from '../../characters';
import type { ExpressaoId } from '../../poses';
import { obterMoldePersonagem } from '../fabrica';
import { EXPRESSOES_VETORIAIS, VISEMAS_SVG } from '../componentes/expressoes';

// Cache em memória de instâncias Path2D nativas para não recriar strings a cada frame de 60fps
const CACHE_PATH2D = new Map<string, Path2D>();

function obterOuCriarPath2D(d: string): Path2D {
  let p = CACHE_PATH2D.get(d);
  if (!p) {
    p = new Path2D(d);
    CACHE_PATH2D.set(d, p);
  }
  return p;
}

/**
 * Renderiza a cabeça e expressão vetorial SVG diretamente em um contexto Canvas 2D
 */
export function desenharCabecaSVGCached(
  ctx: CanvasRenderingContext2D,
  id: ActorId,
  x: number,
  y: number,
  raio: number,
  facing: 1 | -1,
  expressao: ExpressaoId = 'neutra',
  visema?: string,
  piscar = false,
  corTraco = '#14161a',
  corFundo = '#ffffff',
) {
  const molde = obterMoldePersonagem(id);
  const expGeom = EXPRESSOES_VETORIAIS[expressao as keyof typeof EXPRESSOES_VETORIAIS] ?? EXPRESSOES_VETORIAIS.neutra;
  const escala = raio / molde.proporcoes.raioCabeca;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * escala, escala);

  // 1. Cabelo traseiro
  if (molde.cabelo?.traseiro) {
    for (const c of molde.cabelo.traseiro) {
      const p = obterOuCriarPath2D(c.d);
      ctx.fillStyle = c.preenchimento ?? corFundo;
      ctx.fill(p);
      ctx.strokeStyle = c.traco ?? corTraco;
      ctx.lineWidth = (c.espessura ?? 1) * 2.4;
      ctx.stroke(p);
    }
  }

  // 2. Silhueta do crânio
  ctx.fillStyle = corFundo;
  ctx.strokeStyle = corTraco;
  ctx.lineWidth = 2.8;
  if ('rx' in molde.cabeca.silhueta) {
    const { rx, ry } = molde.cabeca.silhueta;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    const p = obterOuCriarPath2D(molde.cabeca.silhueta.d);
    ctx.fill(p);
    ctx.stroke(p);
  }

  // 3. Olhos
  const { posicaoRelativa: posOlhos } = molde.olhos;
  const rOlho = posOlhos.raioOlho * (expGeom.olhoAbertura ?? 1);
  const olhX1 = posOlhos.x - posOlhos.espacamento / 2;
  const olhX2 = posOlhos.x + posOlhos.espacamento / 2;
  const olhY = posOlhos.y;

  if (piscar) {
    ctx.strokeStyle = corTraco;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(olhX1 - rOlho, olhY);
    ctx.lineTo(olhX1 + rOlho, olhY);
    ctx.moveTo(olhX2 - rOlho, olhY);
    ctx.lineTo(olhX2 + rOlho, olhY);
    ctx.stroke();
  } else {
    // Globos oculares
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = corTraco;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(olhX1, olhY, rOlho, 0, Math.PI * 2);
    ctx.arc(olhX2, olhY, rOlho, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pupilas pretas
    ctx.fillStyle = corTraco;
    ctx.beginPath();
    ctx.arc(olhX1 + rOlho * 0.25, olhY, rOlho * 0.36, 0, Math.PI * 2);
    ctx.arc(olhX2 + rOlho * 0.25, olhY, rOlho * 0.36, 0, Math.PI * 2);
    ctx.fill();

    // Meia-pálpebra (sarcástico)
    if (expGeom.olhoCaido) {
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = corTraco;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(olhX1, olhY, rOlho, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(olhX2, olhY, rOlho, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  // 4. Sobrancelhas dinâmicas
  ctx.strokeStyle = corTraco;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.stroke(obterOuCriarPath2D(expGeom.sobrancelhaEsq));
  ctx.stroke(obterOuCriarPath2D(expGeom.sobrancelhaDir));

  // 5. Óculos
  if (molde.olhos.oculos?.armacao) {
    for (const c of molde.olhos.oculos.armacao) {
      const p = obterOuCriarPath2D(c.d);
      ctx.strokeStyle = c.traco ?? corTraco;
      ctx.lineWidth = (c.espessura ?? 1) * 2.2;
      ctx.stroke(p);
    }
  }

  // 6. Focinho / Bigodes (animais)
  if (molde.boca.tipoFocinho === 'canino') {
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = corTraco;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 8, 14, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = corTraco;
    ctx.beginPath();
    ctx.ellipse(0, 4, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (molde.boca.tipoFocinho === 'felino' && molde.boca.bigodes) {
    ctx.strokeStyle = corTraco;
    ctx.lineWidth = 1.6;
    for (const b of molde.boca.bigodes) ctx.stroke(obterOuCriarPath2D(b.d));
  }

  // 7. Boca
  const dBoca = (visema ? VISEMAS_SVG[visema.toLowerCase()] : undefined) ?? expGeom.boca ?? molde.boca.formatoBase;
  const pBoca = obterOuCriarPath2D(dBoca);
  ctx.strokeStyle = corTraco;
  ctx.lineWidth = 2.4;
  ctx.lineJoin = 'round';
  if (expressao === 'feliz' || expressao === 'empolgada') {
    ctx.fillStyle = corTraco;
    ctx.fill(pBoca);
  }
  ctx.stroke(pBoca);

  // 8. Cabelo frontal
  if (molde.cabelo?.frontal) {
    for (const c of molde.cabelo.frontal) {
      const p = obterOuCriarPath2D(c.d);
      ctx.fillStyle = c.preenchimento ?? corFundo;
      ctx.fill(p);
      ctx.strokeStyle = c.traco ?? corTraco;
      ctx.lineWidth = (c.espessura ?? 1) * 2.4;
      ctx.stroke(p);
    }
  }
  if (molde.cabelo?.presilhasOuLacos) {
    for (const c of molde.cabelo.presilhasOuLacos) {
      const p = obterOuCriarPath2D(c.d);
      ctx.fillStyle = c.preenchimento ?? corFundo;
      ctx.fill(p);
      ctx.strokeStyle = c.traco ?? corTraco;
      ctx.lineWidth = (c.espessura ?? 1) * 2.4;
      ctx.stroke(p);
    }
  }

  ctx.restore();
}
