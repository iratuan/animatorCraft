export interface Pt { x: number; y: number }

/** Ruído suave e determinístico no espaço: o contorno "ferve" um pouco quando o desenho se move (tremidinha de lineart de TV). */
export function ruido(x: number, y: number): number {
  return Math.sin(x * 0.19 + y * 0.07) * 0.6 + Math.sin(y * 0.15 - x * 0.05 + 1.7) * 0.4;
}

/** Acrescenta ao caminho atual uma polilinha subdividida com tremor leve. Não faz stroke/fill. */
export function tremerPt(p: Pt, amp: number, fase = 0): Pt {
  return { x: p.x + ruido(p.x + fase, p.y) * amp, y: p.y + ruido(p.y + 31 + fase, p.x - 17) * amp };
}

export function tracoTremido(ctx: CanvasRenderingContext2D, pts: Pt[], amp: number, fechar = false, passo = 14, fase = 0) {
  const lista = fechar ? [...pts, pts[0]!] : pts;
  const tremer = (p: Pt): Pt => tremerPt(p, amp, fase);
  let primeiro = true;
  for (let i = 0; i < lista.length - 1; i++) {
    const a = lista[i]!, b = lista[i + 1]!;
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / passo));
    for (let k = primeiro ? 0 : 1; k <= n; k++) {
      const p = tremer({ x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n });
      if (primeiro) { ctx.moveTo(p.x, p.y); primeiro = false; } else ctx.lineTo(p.x, p.y);
    }
  }
  if (fechar) ctx.closePath();
}

export function circuloTremido(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, amp: number, fase = 0) {
  const n = 44;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    pts.push({ x: px + ruido(px + fase, py) * amp, y: py + ruido(py + 9 + fase, px) * amp });
  }
  ctx.moveTo(pts[0]!.x, pts[0]!.y);
  for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y);
  ctx.closePath();
}

