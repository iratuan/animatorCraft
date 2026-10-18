import { ATORES, clipeDaPose, poseDef, type ActorId, type AtorEstado, type NomeExpressao, type PoseId } from '@shared/domain';
import { desenharAtor, resolver } from './ator';
import { desenharRostoNaCaixa, desenharSpriteNaCaixa, temSprites } from './sprites';

/**
 * Miniatura quadrada de um personagem em uma pose (biblioteca e seletor de poses).
 * Personagens com ficha usam o sprite da pose; os demais, o boneco de reserva.
 */
export function desenharMiniatura(
  ctx: CanvasRenderingContext2D, id: ActorId, pose: PoseId, expressao: NomeExpressao, tamanho: number,
  modo: 'corpo' | 'rosto' = 'corpo', fase = 0.8, etiqueta?: string,
) {
  if (temSprites(id) && modo === 'rosto' && desenharRostoNaCaixa(ctx, id, expressao, tamanho)) return;
  if (temSprites(id) && desenharSpriteNaCaixa(ctx, id, etiqueta ? [etiqueta] : clipeDaPose(pose).passos[0]!.tags, tamanho, modo === 'rosto')) return;

  const real = ATORES[id]!;
  const a: AtorEstado = {
    id, visivel: true, x: 0.5, facing: 1, pose, poseDe: pose, poseDesde: -10, fase, faseDe: fase,
    expressao, expressaoDe: expressao, expressaoDesde: -10,
  };
  ctx.clearRect(0, 0, tamanho, tamanho);
  const escala = (tamanho * 0.72) / real.altura;
  const x = tamanho / 2, chao = tamanho * 0.92;
  if (modo === 'rosto') {
    const e0 = resolver(poseDef('parado'), x, chao, (escala * real.altura) / 440, 1.3, 1);
    const k = (tamanho * 0.36) / e0.raio;
    ctx.save();
    ctx.translate(tamanho / 2, tamanho * 0.52);
    ctx.scale(k, k);
    ctx.translate(-e0.cabeca.x, -e0.cabeca.y);
    desenharAtor(ctx, a, x, chao, escala, { t: 1.3, idadePose: 5 });
    ctx.restore();
    return;
  }
  desenharAtor(ctx, a, x, chao, escala, { t: 1.3, idadePose: 5 });
}



