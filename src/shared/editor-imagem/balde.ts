import { dentro, sobreporPixel, type Cor, type Mascara, type Pixels } from './pixels';
import { mascaraPorCor } from './selecao';

/**
 * Balde de tinta: pinta a região de cor parecida (medida em `ref`, que pode ser a camada ou a imagem composta).
 * `expandir` (px) engrossa a área por baixo das bordas suavizadas, para não sobrar um fio claro ao redor do desenho.
 * Devolve o retângulo alterado, ou null se o clique caiu fora ou nada mudou.
 */
export function preencher(camada: Pixels, ref: Pixels, x: number, y: number, cor: Cor, tolerancia: number, contiguo: boolean, mascara: Mascara | null = null, expandir = 1): { x: number; y: number; w: number; h: number } | null {
  if (!dentro(camada, x, y)) return null;
  const regiao = mascaraPorCor(ref, x, y, tolerancia, contiguo);
  const { w, h } = camada;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  const toca = (px: number, py: number) => { if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; };
  const cob = new Float32Array(w * h);
  for (let k = 0; k < regiao.data.length; k++) if (regiao.data[k]) cob[k] = 1;
  for (let n = 0; n < expandir; n++) {
    const prox = new Float32Array(cob);
    for (let k = 0; k < cob.length; k++) {
      if (cob[k] !== 1) continue;
      const px = k % w, py = (k / w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nx = px + dx, ny = py + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const nk = ny * w + nx;
        if (prox[nk] === 0) prox[nk] = 0.5;
      }
    }
    cob.set(prox);
  }
  for (let k = 0; k < cob.length; k++) {
    if (!cob[k]) continue;
    const m = (mascara ? mascara.data[k]! / 255 : 1) * cob[k]!;
    if (m <= 0) continue;
    const px = k % w, py = (k / w) | 0;
    sobreporPixel(camada.data, k * 4, cor, m);
    toca(px, py);
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}
