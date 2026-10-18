import type { Cor, Pixels } from './pixels';

/**
 * Paleta de um sprite: as cores mais frequentes (agrupadas em faixas de 32 níveis por canal), ignorando o que é quase
 * transparente. Serve de "cores do personagem" para pintar sem sair do tom (pele, cabelo, roupa).
 */
export function paletaDoSprite(p: Pixels, quantas = 14): Cor[] {
  const grupos = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < p.data.length; i += 4) {
    if (p.data[i + 3]! < 200) continue;
    const r = p.data[i]!, g = p.data[i + 1]!, b = p.data[i + 2]!;
    const chave = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
    const o = grupos.get(chave) ?? { n: 0, r: 0, g: 0, b: 0 };
    o.n++; o.r += r; o.g += g; o.b += b;
    grupos.set(chave, o);
  }
  const lista = [...grupos.values()].sort((a, b) => b.n - a.n);
  const out: Cor[] = [];
  for (const g of lista) {
    const c = { r: Math.round(g.r / g.n), g: Math.round(g.g / g.n), b: Math.round(g.b / g.n), a: 255 };
    // pula tons quase iguais a um já escolhido (varia pouco) para a paleta mostrar cores distintas
    if (out.some((o) => Math.abs(o.r - c.r) + Math.abs(o.g - c.g) + Math.abs(o.b - c.b) < 48)) continue;
    out.push(c);
    if (out.length >= quantas) break;
  }
  return out;
}
