/** Mantém `v` entre `min` e `max`. */
export const limitar = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

/** Mantém `v` entre 0 e 1. */
export const clamp01 = (v: number): number => limitar(v, 0, 1);

/** Curva suave (smoothstep) de 0 a 1: aceleração e desaceleração nas pontas. */
export const suave = (x: number): number => { const k = clamp01(x); return k * k * (3 - 2 * k); };
