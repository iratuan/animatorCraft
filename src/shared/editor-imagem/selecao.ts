import { dentro, lerCor, limitesDoConteudo, type Cor, type Mascara, type Pixels } from './pixels';

export const criarMascara = (w: number, h: number): Mascara => ({ w, h, data: new Uint8Array(w * h) });
export const clonarMascara = (m: Mascara): Mascara => ({ w: m.w, h: m.h, data: new Uint8Array(m.data) });
export const mascaraVazia = (m: Mascara): boolean => !m.data.some((v) => v > 0);

export function limitesDaMascara(m: Mascara): { x: number; y: number; w: number; h: number } | null {
  let x0 = m.w, y0 = m.h, x1 = -1, y1 = -1;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.data[y * m.w + x]! > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** Retângulo com bordas inclusivas em (x,y) e exclusivas em (x+w, y+h). */
export function mascaraRetangulo(w: number, h: number, x: number, y: number, rw: number, rh: number): Mascara {
  const m = criarMascara(w, h);
  const x0 = Math.max(0, Math.round(Math.min(x, x + rw))), x1 = Math.min(w, Math.round(Math.max(x, x + rw)));
  const y0 = Math.max(0, Math.round(Math.min(y, y + rh))), y1 = Math.min(h, Math.round(Math.max(y, y + rh)));
  for (let yy = y0; yy < y1; yy++) m.data.fill(255, yy * w + x0, yy * w + x1);
  return m;
}

/** Elipse inscrita no retângulo (x,y,rw,rh); a borda tem 1 px de suavização. */
export function mascaraElipse(w: number, h: number, x: number, y: number, rw: number, rh: number): Mascara {
  const m = criarMascara(w, h);
  const ax = Math.abs(rw) / 2, ay = Math.abs(rh) / 2, cx = Math.min(x, x + rw) + ax, cy = Math.min(y, y + rh) + ay;
  if (ax < 0.5 || ay < 0.5) return m;
  for (let yy = Math.max(0, Math.floor(cy - ay - 1)); yy < Math.min(h, Math.ceil(cy + ay + 1)); yy++) {
    for (let xx = Math.max(0, Math.floor(cx - ax - 1)); xx < Math.min(w, Math.ceil(cx + ax + 1)); xx++) {
      const dx = (xx + 0.5 - cx) / ax, dy = (yy + 0.5 - cy) / ay, d = Math.sqrt(dx * dx + dy * dy);
      const borda = 1 / Math.min(ax, ay); // 1 px em unidades normalizadas
      const v = d <= 1 - borda ? 1 : d >= 1 + borda ? 0 : (1 + borda - d) / (2 * borda);
      m.data[yy * w + xx] = Math.round(v * 255);
    }
  }
  return m;
}

/** Laço: polígono preenchido (regra par-ímpar) por varredura de linhas. */
export function mascaraLaco(w: number, h: number, pontos: { x: number; y: number }[]): Mascara {
  const m = criarMascara(w, h);
  if (pontos.length < 3) return m;
  let ymin = Infinity, ymax = -Infinity; // (sem Math.min(...lista): um laço longo estouraria a pilha)
  for (const p of pontos) { if (p.y < ymin) ymin = p.y; if (p.y > ymax) ymax = p.y; }
  for (let y = Math.max(0, Math.floor(ymin)); y < Math.min(h, Math.ceil(ymax)); y++) {
    const cruz: number[] = [], yc = y + 0.5;
    for (let i = 0; i < pontos.length; i++) {
      const a = pontos[i]!, b = pontos[(i + 1) % pontos.length]!;
      if ((a.y <= yc && b.y > yc) || (b.y <= yc && a.y > yc)) cruz.push(a.x + ((yc - a.y) / (b.y - a.y)) * (b.x - a.x));
    }
    cruz.sort((p, q) => p - q);
    for (let k = 0; k + 1 < cruz.length; k += 2) {
      const x0 = Math.max(0, Math.round(cruz[k]!)), x1 = Math.min(w, Math.round(cruz[k + 1]!));
      if (x1 > x0) m.data.fill(255, y * w + x0, y * w + x1);
    }
  }
  return m;
}

/** Varinha mágica: seleciona a região de cor parecida ligada a (x,y) (ou todos os pixels parecidos, se `contiguo` for falso). */
export function mascaraPorCor(ref: Pixels, x: number, y: number, tolerancia: number, contiguo = true): Mascara {
  const m = criarMascara(ref.w, ref.h);
  if (!dentro(ref, x, y)) return m;
  const alvo = lerCor(ref, x, y);
  const parecido = (i: number) => distanciaCor(ref.data, i, alvo) <= tolerancia;
  if (!contiguo) { for (let k = 0; k < ref.w * ref.h; k++) if (parecido(k * 4)) m.data[k] = 255; return m; }
  const pilha = [y * ref.w + x];
  while (pilha.length) {
    const k = pilha.pop()!;
    if (m.data[k] || !parecido(k * 4)) continue;
    m.data[k] = 255;
    const px = k % ref.w, py = (k / ref.w) | 0;
    if (px > 0) pilha.push(k - 1); if (px < ref.w - 1) pilha.push(k + 1); if (py > 0) pilha.push(k - ref.w); if (py < ref.h - 1) pilha.push(k + ref.w);
  }
  return m;
}

/** Distância entre a cor do pixel e `alvo` (maior diferença entre os canais, incluindo o alfa): 0 = igual, 255 = oposto. */
export function distanciaCor(d: Uint8ClampedArray, i: number, alvo: Cor): number {
  // dois pixels totalmente transparentes são "iguais" qualquer que seja o RGB guardado
  if (d[i + 3] === 0 && alvo.a === 0) return 0;
  return Math.max(Math.abs(d[i]! - alvo.r), Math.abs(d[i + 1]! - alvo.g), Math.abs(d[i + 2]! - alvo.b), Math.abs(d[i + 3]! - alvo.a));
}

export type OperacaoMascara = 'substituir' | 'somar' | 'subtrair' | 'interseccao';
export function combinarMascaras(base: Mascara | null, nova: Mascara, op: OperacaoMascara): Mascara {
  if (!base || op === 'substituir') return nova;
  const o = criarMascara(nova.w, nova.h);
  for (let k = 0; k < o.data.length; k++) {
    const a = base.data[k]!, b = nova.data[k]!;
    o.data[k] = op === 'somar' ? Math.max(a, b) : op === 'subtrair' ? Math.max(0, a - b) : Math.min(a, b);
  }
  return o;
}
export function inverterMascara(m: Mascara): Mascara {
  const o = criarMascara(m.w, m.h);
  for (let k = 0; k < o.data.length; k++) o.data[k] = 255 - m.data[k]!;
  return o;
}
export function deslocarMascara(m: Mascara, dx: number, dy: number): Mascara {
  const o = criarMascara(m.w, m.h);
  for (let y = 0; y < m.h; y++) {
    const ty = y + dy;
    if (ty < 0 || ty >= m.h) continue;
    for (let x = 0; x < m.w; x++) { const tx = x + dx; if (tx >= 0 && tx < m.w) o.data[ty * m.w + tx] = m.data[y * m.w + x]!; }
  }
  return o;
}

/** Copia os pixels selecionados (alfa multiplicado pela máscara) para um recorte do tamanho da seleção. */
export function extrairSelecao(p: Pixels, m: Mascara): { pixels: Pixels; x: number; y: number } | null {
  const b = limitesDaMascara(m);
  if (!b) return null;
  const out: Pixels = { w: b.w, h: b.h, data: new Uint8ClampedArray(b.w * b.h * 4) };
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
    const mv = m.data[(b.y + y) * m.w + b.x + x]! / 255;
    if (mv === 0) continue;
    const si = ((b.y + y) * p.w + b.x + x) * 4, di = (y * b.w + x) * 4;
    out.data[di] = p.data[si]!; out.data[di + 1] = p.data[si + 1]!; out.data[di + 2] = p.data[si + 2]!; out.data[di + 3] = p.data[si + 3]! * mv;
  }
  return { pixels: out, x: b.x, y: b.y };
}

/** Apaga (deixa transparente) os pixels cobertos pela máscara. */
export function apagarSelecao(p: Pixels, m: Mascara): void {
  for (let k = 0; k < m.data.length; k++) {
    const mv = m.data[k]! / 255;
    if (mv === 0) continue;
    const i = k * 4;
    p.data[i + 3] = p.data[i + 3]! * (1 - mv);
    if (p.data[i + 3] === 0) { p.data[i] = 0; p.data[i + 1] = 0; p.data[i + 2] = 0; }
  }
}

export { limitesDoConteudo };
