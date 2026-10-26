import { ORDEM_ATORES, type ActorId, type AlvoCamera, type Estado } from '@shared/domain';
import type { Rect } from './geometria';

/**
 * Câmera: o palco inteiro, a lousa ou o rosto de um personagem. A câmera é um retângulo do palco que vira a tela toda;
 * a transição interpola o retângulo e some com o que não faz parte do plano (outros personagens, cenário).
 */
export interface Visibilidade { cenario: number; lousa: number; balao: number; atores: Record<ActorId, number> }

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export function interpolarRect(a: Rect, b: Rect, k: number): Rect {
  return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), w: lerp(a.w, b.w, k), h: lerp(a.h, b.h, k) };
}

/** Ajusta um retângulo ao enquadramento (mesma proporção da tela) mantendo o centro. */
function enquadrar(centro: { x: number; y: number }, w: number, h: number, proporcao: number): Rect {
  const largura = Math.max(w, h * proporcao);
  const altura = largura / proporcao;
  return { x: centro.x - largura / 2, y: centro.y - altura / 2, w: largura, h: altura };
}

export function retanguloDaCamera(alvo: AlvoCamera, tela: { w: number; h: number }, quadro: Rect, cabecas: Partial<Record<ActorId, Rect>>): Rect {
  const proporcao = tela.w / tela.h;
  if (alvo.alvo === 'lousa') return enquadrar({ x: quadro.x + quadro.w / 2, y: quadro.y + quadro.h / 2 }, quadro.w * 1.06, quadro.h * 1.06, proporcao);
  if (alvo.alvo === 'personagem' && alvo.ator) {
    const c = cabecas[alvo.ator];
    if (c) {
      const largAlvo = Math.max(c.w * 3.6, 680);
      const altoAlvo = Math.max(c.h * 3.8, 480);
      return enquadrar({ x: c.x + c.w / 2, y: c.y - c.h * 0.7 }, largAlvo, altoAlvo, proporcao);
    }
  }
  return { x: 0, y: 0, w: tela.w, h: tela.h };
}

function visibilidadeDe(alvo: AlvoCamera): Visibilidade {
  const atores = Object.fromEntries(ORDEM_ATORES.map((id) => [id, alvo.alvo === 'aberto' ? 1 : alvo.alvo === 'personagem' && alvo.ator === id ? 1 : 0])) as Record<ActorId, number>;
  return { cenario: alvo.alvo === 'personagem' ? 0 : 1, lousa: alvo.alvo === 'personagem' ? 0 : 1, balao: alvo.alvo === 'lousa' ? 0 : 1, atores };
}

export function visibilidadeDaCamera(cam: Estado['camera']): Visibilidade {
  const a = visibilidadeDe(cam.anterior), b = visibilidadeDe(cam.atual), k = cam.progresso;
  return {
    cenario: lerp(a.cenario, b.cenario, k), lousa: lerp(a.lousa, b.lousa, k), balao: lerp(a.balao, b.balao, k),
    atores: Object.fromEntries(ORDEM_ATORES.map((id) => [id, lerp(a.atores[id], b.atores[id], k)])) as Record<ActorId, number>,
  };
}


