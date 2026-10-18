/** Formas de boca usadas na sincronia labial: m = fechada, o = arredondada, a = aberta, e = larga. */
export type Visema = 'm' | 'o' | 'a' | 'e';

const VOGAL: Record<string, Visema> = { a: 'a', á: 'a', â: 'a', ã: 'a', à: 'a', e: 'e', é: 'e', ê: 'e', i: 'e', í: 'e', o: 'o', ó: 'o', ô: 'o', õ: 'o', u: 'o', ú: 'o' };
const BILABIAL = new Set(['b', 'm', 'p']);

/** Converte o texto em uma sequência de visemas: cada vogal abre a boca de um jeito, b/m/p e pausas fecham. */
export function sequenciaDeVisemas(texto: string): Visema[] {
  const seq: Visema[] = [];
  for (const ch of texto.toLowerCase()) {
    const v = VOGAL[ch];
    if (v) { if (seq[seq.length - 1] !== v) seq.push(v); }
    else if (BILABIAL.has(ch) || /[\s.,!?;:…]/.test(ch)) { if (seq[seq.length - 1] !== 'm') seq.push('m'); }
  }
  return seq;
}

/** Visema no instante `progresso` (0..1) da fala. Mantém a boca parada ~0.08 s por forma para não parecer vibração. */
export function visemaEm(texto: string, progresso: number, duracao: number): Visema {
  const seq = sequenciaDeVisemas(texto);
  if (seq.length === 0) return 'm';
  const passo = Math.max(0.08, duracao / seq.length);
  const i = Math.min(seq.length - 1, Math.floor((Math.max(0, Math.min(1, progresso)) * duracao) / passo));
  return seq[i]!;
}

/** Piscada: ~140 ms a cada ~3,6 s, com defasagem por ator para não piscarem todos juntos. */
export function piscando(t: number, deslocamento: number): boolean {
  return ((t * 1000 + deslocamento * 900) % 3600) < 140;
}
