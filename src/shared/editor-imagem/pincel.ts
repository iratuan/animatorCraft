import { clamp01 } from '../util/numeros';
import { apagarPixel, sobreporPixel, type Cor, type Mascara, type Pixels } from './pixels';

export interface OpcoesPincel {
  /** diâmetro em px */
  tamanho: number;
  /** 0 = borda totalmente suave, 100 = borda dura */
  dureza: number;
  /** 0..1: opacidade máxima do traço (o traço inteiro tem a mesma, sem acumular ao cruzar a si mesmo) */
  opacidade: number;
  cor: Cor;
  modo: 'pintar' | 'apagar';
  /** sem suavização de borda (lápis) */
  serrilhado?: boolean;
}

/**
 * Um traço do pincel/borracha. A cobertura é guardada por pixel (máximo entre os carimbos), então a opacidade escolhida vale
 * para o traço todo e voltar por cima de si mesmo não escurece. A camada original é preservada e o resultado recalculado a cada
 * atualização, o que dá a pré-visualização correta ao arrastar.
 */
export class Traco {
  private readonly cobertura: Float32Array;
  private readonly antes: Uint8ClampedArray;
  private ultimo: { x: number; y: number } | null = null;
  /** retângulo alterado desde a última chamada de `aplicar` */
  private sujo: { x0: number; y0: number; x1: number; y1: number } | null = null;

  constructor(private readonly camada: Pixels, private readonly op: OpcoesPincel, private readonly mascara: Mascara | null = null) {
    this.cobertura = new Float32Array(camada.w * camada.h);
    this.antes = new Uint8ClampedArray(camada.data);
  }

  private carimbar(cx: number, cy: number, pressao = 1): void {
    const { w, h } = this.camada, raio = Math.max(0.5, (this.op.tamanho * pressao) / 2);
    const dur = this.op.serrilhado ? 1 : clamp01(this.op.dureza / 100);
    const x0 = Math.max(0, Math.floor(cx - raio - 1)), x1 = Math.min(w - 1, Math.ceil(cx + raio + 1));
    const y0 = Math.max(0, Math.floor(cy - raio - 1)), y1 = Math.min(h - 1, Math.ceil(cy + raio + 1));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        let c: number;
        if (this.op.serrilhado) c = d <= raio ? 1 : 0;
        else {
          const interno = raio * dur;
          // dureza 100: só 1 px de suavização na borda; senão a queda vai do raio interno até o raio
          const fim = dur >= 0.999 ? raio + 0.5 : raio, ini = dur >= 0.999 ? raio - 0.5 : interno;
          c = d <= ini ? 1 : d >= fim ? 0 : 1 - (d - ini) / Math.max(1e-6, fim - ini);
          if (dur < 0.999) c = c * c * (3 - 2 * c);
        }
        if (c <= 0) continue;
        const k = y * w + x;
        if (c > this.cobertura[k]!) this.cobertura[k] = c;
      }
    }
    const s = this.sujo;
    this.sujo = s ? { x0: Math.min(s.x0, x0), y0: Math.min(s.y0, y0), x1: Math.max(s.x1, x1), y1: Math.max(s.y1, y1) } : { x0, y0, x1, y1 };
  }

  /** Leva o pincel até (x,y), carimbando ao longo do caminho; `pressao` (0..1) vem da caneta e escala o diâmetro. */
  mover(x: number, y: number, pressao = 1): void {
    const raio = Math.max(0.5, (this.op.tamanho * pressao) / 2), passo = Math.max(0.75, raio * 0.2);
    if (!this.ultimo) { this.carimbar(x, y, pressao); this.ultimo = { x, y }; return; }
    const dx = x - this.ultimo.x, dy = y - this.ultimo.y, dist = Math.hypot(dx, dy);
    const n = Math.max(1, Math.ceil(dist / passo));
    for (let i = 1; i <= n; i++) this.carimbar(this.ultimo.x + (dx * i) / n, this.ultimo.y + (dy * i) / n, pressao);
    this.ultimo = { x, y };
  }

  /** Desfaz tudo o que este traço pintou (ex.: um segundo dedo tocou a tela e o gesto virou zoom). */
  cancelar(): void { this.camada.data.set(this.antes); this.sujo = null; }

  /** Reescreve na camada os pixels tocados. Devolve o retângulo alterado (para redesenhar só ele), ou null. */
  aplicar(): { x: number; y: number; w: number; h: number } | null {
    const s = this.sujo;
    if (!s) return null;
    const { w } = this.camada, d = this.camada.data;
    for (let y = s.y0; y <= s.y1; y++) {
      for (let x = s.x0; x <= s.x1; x++) {
        const k = y * w + x, cob = this.cobertura[k]!;
        if (cob <= 0) continue;
        const i = k * 4;
        const m = (this.mascara ? this.mascara.data[k]! / 255 : 1) * cob * this.op.opacidade;
        d[i] = this.antes[i]!; d[i + 1] = this.antes[i + 1]!; d[i + 2] = this.antes[i + 2]!; d[i + 3] = this.antes[i + 3]!;
        if (m <= 0) continue;
        if (this.op.modo === 'apagar') apagarPixel(d, i, m);
        else sobreporPixel(d, i, this.op.cor, m);
      }
    }
    this.sujo = null;
    return { x: s.x0, y: s.y0, w: s.x1 - s.x0 + 1, h: s.y1 - s.y0 + 1 };
  }
}

/** Atalho: um traço completo por uma lista de pontos. */
export function desenharCaminho(camada: Pixels, pontos: { x: number; y: number; pressao?: number }[], op: OpcoesPincel, mascara: Mascara | null = null): void {
  const t = new Traco(camada, op, mascara);
  for (const p of pontos) t.mover(p.x, p.y, p.pressao ?? 1);
  t.aplicar();
}


