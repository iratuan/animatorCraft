/**
 * Base do editor de imagem: tudo opera em buffers RGBA (não pré-multiplicados), sem canvas nem DOM,
 * para ser testável em Node e idêntico no navegador, no Electron e no Android.
 */
export interface Pixels { w: number; h: number; data: Uint8ClampedArray }
export interface Cor { r: number; g: number; b: number; a: number }
/** Máscara de seleção: 0 = fora, 255 = dentro (valores intermediários = borda suave). */
export interface Mascara { w: number; h: number; data: Uint8Array }

export const criarPixels = (w: number, h: number): Pixels => ({ w, h, data: new Uint8ClampedArray(w * h * 4) });
export const clonarPixels = (p: Pixels): Pixels => ({ w: p.w, h: p.h, data: new Uint8ClampedArray(p.data) });
export const dentro = (p: { w: number; h: number }, x: number, y: number) => x >= 0 && y >= 0 && x < p.w && y < p.h;

export function lerCor(p: Pixels, x: number, y: number): Cor {
  const i = (y * p.w + x) * 4, d = p.data;
  return { r: d[i]!, g: d[i + 1]!, b: d[i + 2]!, a: d[i + 3]! };
}
export function escreverCor(p: Pixels, x: number, y: number, c: Cor): void {
  const i = (y * p.w + x) * 4, d = p.data;
  d[i] = c.r; d[i + 1] = c.g; d[i + 2] = c.b; d[i + 3] = c.a;
}

/** Pinta `cor` sobre o pixel (i = índice do byte R) com cobertura 0..1 (fórmula "over" sem pré-multiplicação). */
export function sobreporPixel(d: Uint8ClampedArray, i: number, cor: Cor, cobertura: number): void {
  const sa = (cor.a / 255) * cobertura;
  if (sa <= 0) return;
  const da = d[i + 3]! / 255, oa = sa + da * (1 - sa);
  if (oa <= 0) return;
  d[i] = (cor.r * sa + d[i]! * da * (1 - sa)) / oa;
  d[i + 1] = (cor.g * sa + d[i + 1]! * da * (1 - sa)) / oa;
  d[i + 2] = (cor.b * sa + d[i + 2]! * da * (1 - sa)) / oa;
  d[i + 3] = oa * 255;
}

/** Reduz a opacidade do pixel (borracha): `cobertura` 1 apaga por completo. */
export function apagarPixel(d: Uint8ClampedArray, i: number, cobertura: number): void {
  if (cobertura <= 0) return;
  d[i + 3] = d[i + 3]! * (1 - Math.min(1, cobertura));
  if (d[i + 3] === 0) { d[i] = 0; d[i + 1] = 0; d[i + 2] = 0; }
}

/** Retângulo (em px) que contém todos os pixels com alfa acima de `limiar`; null se não houver. */
export function limitesDoConteudo(p: Pixels, limiar = 8): { x: number; y: number; w: number; h: number } | null {
  let x0 = p.w, y0 = p.h, x1 = -1, y1 = -1;
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
    if (p.data[(y * p.w + x) * 4 + 3]! > limiar) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

export function recortar(p: Pixels, x: number, y: number, w: number, h: number): Pixels {
  const o = criarPixels(w, h);
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    const sx = x + xx, sy = y + yy;
    if (!dentro(p, sx, sy)) continue;
    const si = (sy * p.w + sx) * 4, di = (yy * w + xx) * 4;
    o.data[di] = p.data[si]!; o.data[di + 1] = p.data[si + 1]!; o.data[di + 2] = p.data[si + 2]!; o.data[di + 3] = p.data[si + 3]!;
  }
  return o;
}

/** Cola `origem` sobre `destino` na posição (dx,dy), com opacidade e máscara opcionais (a máscara está em coordenadas do destino). */
export function colarSobre(destino: Pixels, origem: Pixels, dx: number, dy: number, opacidade = 1, mascara?: Mascara | null): void {
  for (let y = 0; y < origem.h; y++) {
    const ty = y + dy;
    if (ty < 0 || ty >= destino.h) continue;
    for (let x = 0; x < origem.w; x++) {
      const tx = x + dx;
      if (tx < 0 || tx >= destino.w) continue;
      const si = (y * origem.w + x) * 4;
      const sa = origem.data[si + 3]!;
      if (sa === 0) continue;
      const m = mascara ? mascara.data[ty * destino.w + tx]! / 255 : 1;
      if (m === 0) continue;
      sobreporPixel(destino.data, (ty * destino.w + tx) * 4, { r: origem.data[si]!, g: origem.data[si + 1]!, b: origem.data[si + 2]!, a: sa }, opacidade * m);
    }
  }
}

export function espelhar(p: Pixels, horizontal: boolean): Pixels {
  const o = criarPixels(p.w, p.h);
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
    const sx = horizontal ? p.w - 1 - x : x, sy = horizontal ? y : p.h - 1 - y;
    const si = (sy * p.w + sx) * 4, di = (y * p.w + x) * 4;
    o.data[di] = p.data[si]!; o.data[di + 1] = p.data[si + 1]!; o.data[di + 2] = p.data[si + 2]!; o.data[di + 3] = p.data[si + 3]!;
  }
  return o;
}

/** Gira 90° (horário ou anti-horário); a largura e a altura trocam. */
export function girar90(p: Pixels, horario: boolean): Pixels {
  const o = criarPixels(p.h, p.w);
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
    const nx = horario ? p.h - 1 - y : y, ny = horario ? x : p.w - 1 - x;
    const si = (y * p.w + x) * 4, di = (ny * o.w + nx) * 4;
    o.data[di] = p.data[si]!; o.data[di + 1] = p.data[si + 1]!; o.data[di + 2] = p.data[si + 2]!; o.data[di + 3] = p.data[si + 3]!;
  }
  return o;
}

/** Redimensiona com interpolação bilinear (alfa pré-multiplicado nas contas, para a borda transparente não "sujar" a cor). */
export function redimensionar(p: Pixels, nw: number, nh: number): Pixels {
  nw = Math.max(1, Math.round(nw)); nh = Math.max(1, Math.round(nh));
  const o = criarPixels(nw, nh), sx = p.w / nw, sy = p.h / nh;
  for (let y = 0; y < nh; y++) {
    const fy = Math.min(p.h - 1, Math.max(0, (y + 0.5) * sy - 0.5)), y0 = Math.floor(fy), y1 = Math.min(p.h - 1, y0 + 1), ty = fy - y0;
    for (let x = 0; x < nw; x++) {
      const fx = Math.min(p.w - 1, Math.max(0, (x + 0.5) * sx - 0.5)), x0 = Math.floor(fx), x1 = Math.min(p.w - 1, x0 + 1), tx = fx - x0;
      let r = 0, g = 0, b = 0, a = 0;
      for (const [xx, yy, w] of [[x0, y0, (1 - tx) * (1 - ty)], [x1, y0, tx * (1 - ty)], [x0, y1, (1 - tx) * ty], [x1, y1, tx * ty]] as const) {
        const i = (yy * p.w + xx) * 4, al = p.data[i + 3]! / 255;
        r += p.data[i]! * al * w; g += p.data[i + 1]! * al * w; b += p.data[i + 2]! * al * w; a += al * w;
      }
      const di = (y * nw + x) * 4;
      if (a > 0) { o.data[di] = r / a; o.data[di + 1] = g / a; o.data[di + 2] = b / a; o.data[di + 3] = a * 255; }
    }
  }
  return o;
}

export const corDeHex = (hex: string, a = 255): Cor => {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return { r: parseInt(v.slice(0, 2), 16) || 0, g: parseInt(v.slice(2, 4), 16) || 0, b: parseInt(v.slice(4, 6), 16) || 0, a };
};
export const hexDeCor = (c: Cor): string => `#${[c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
