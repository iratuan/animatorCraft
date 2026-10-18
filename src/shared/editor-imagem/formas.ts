import { Traco, type OpcoesPincel } from './pincel';
import { sobreporPixel, type Cor, type Mascara, type Pixels } from './pixels';

export type Forma = 'linha' | 'retangulo' | 'elipse';

/** Contorno de uma forma desenhado com o pincel (mesmas opções de tamanho, dureza e opacidade). */
export function contornoDeForma(camada: Pixels, forma: Forma, x0: number, y0: number, x1: number, y1: number, op: OpcoesPincel, mascara: Mascara | null = null): void {
  const t = new Traco(camada, op, mascara);
  if (forma === 'linha') { t.mover(x0, y0); t.mover(x1, y1); }
  else if (forma === 'retangulo') { for (const [x, y] of [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]] as const) t.mover(x, y); }
  else {
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = Math.abs(x1 - x0) / 2, ry = Math.abs(y1 - y0) / 2;
    const n = Math.max(24, Math.ceil(Math.PI * (rx + ry) / 2));
    for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2; t.mover(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry); }
  }
  t.aplicar();
}

/** Forma preenchida com bordas suaves (1 px). */
export function preencherForma(camada: Pixels, forma: 'retangulo' | 'elipse', x0: number, y0: number, x1: number, y1: number, cor: Cor, opacidade: number, mascara: Mascara | null = null): void {
  const ax = Math.min(x0, x1), bx = Math.max(x0, x1), ay = Math.min(y0, y1), by = Math.max(y0, y1);
  const cx = (ax + bx) / 2, cy = (ay + by) / 2, rx = (bx - ax) / 2, ry = (by - ay) / 2;
  for (let y = Math.max(0, Math.floor(ay)); y < Math.min(camada.h, Math.ceil(by) + 1); y++) {
    for (let x = Math.max(0, Math.floor(ax)); x < Math.min(camada.w, Math.ceil(bx) + 1); x++) {
      let c: number;
      if (forma === 'retangulo') {
        const cxp = Math.min(x + 1, bx) - Math.max(x, ax), cyp = Math.min(y + 1, by) - Math.max(y, ay);
        c = Math.max(0, cxp) * Math.max(0, cyp);
      } else {
        if (rx < 0.5 || ry < 0.5) continue;
        const d = Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry), borda = 1 / Math.min(rx, ry);
        c = d <= 1 - borda ? 1 : d >= 1 + borda ? 0 : (1 + borda - d) / (2 * borda);
      }
      if (c <= 0) continue;
      const k = y * camada.w + x, m = (mascara ? mascara.data[k]! / 255 : 1) * c * opacidade;
      if (m > 0) sobreporPixel(camada.data, k * 4, cor, m);
    }
  }
}
