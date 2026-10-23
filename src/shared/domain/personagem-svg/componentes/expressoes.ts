import type { ExpressaoId } from '../../poses';

export interface GeometriaExpressaoSVG {
  sobrancelhaEsq: string;
  sobrancelhaDir: string;
  olhoAbertura: number; // 0 (fechado) a 1 (aberto normal) ou 1.3 (arregalado)
  olhoCaido?: boolean;  // meia-pálpebra (sarcástico / entediado)
  olhoBravo?: boolean;  // pálpebra diagonal (bravo)
  boca: string;
}

/** Configurações geométricas vetoriais para cada uma das 10 expressões */
export const EXPRESSOES_VETORIAIS: Record<ExpressaoId, GeometriaExpressaoSVG> = {
  neutra: {
    sobrancelhaEsq: 'M -18,-16 Q -10,-17 -2,-16',
    sobrancelhaDir: 'M 2,-16 Q 10,-17 18,-16',
    olhoAbertura: 1.0,
    boca: 'M -10,12 L 10,12',
  },
  feliz: {
    sobrancelhaEsq: 'M -18,-18 Q -10,-22 -2,-18',
    sobrancelhaDir: 'M 2,-18 Q 10,-22 18,-18',
    olhoAbertura: 1.05,
    boca: 'M -12,10 Q 0,22 12,10 Q 0,14 -12,10 Z',
  },
  triste: {
    sobrancelhaEsq: 'M -18,-14 Q -10,-19 -2,-21',
    sobrancelhaDir: 'M 2,-21 Q 10,-19 18,-14',
    olhoAbertura: 0.9,
    boca: 'M -12,16 Q 0,8 12,16',
  },
  brava: {
    sobrancelhaEsq: 'M -18,-21 Q -10,-18 -2,-13',
    sobrancelhaDir: 'M 2,-13 Q 10,-18 18,-21',
    olhoAbertura: 0.85,
    olhoBravo: true,
    boca: 'M -11,15 L 11,13',
  },
  surpresa: {
    sobrancelhaEsq: 'M -18,-24 Q -10,-28 -2,-24',
    sobrancelhaDir: 'M 2,-24 Q 10,-28 18,-24',
    olhoAbertura: 1.35,
    boca: 'M 0,6 A 8,11 0 1,1 0,28 A 8,11 0 1,1 0,6 Z',
  },
  confusa: {
    sobrancelhaEsq: 'M -18,-13 Q -10,-16 -2,-14',
    sobrancelhaDir: 'M 2,-23 Q 10,-26 18,-22', // assimétrica
    olhoAbertura: 0.95,
    boca: 'M -11,15 Q -4,11 3,16 Q 8,14 12,12', // linha ondulada
  },
  sarcastica: {
    sobrancelhaEsq: 'M -18,-14 Q -10,-17 -2,-15',
    sobrancelhaDir: 'M 2,-22 Q 10,-25 18,-21', // sobrancelha erguida
    olhoAbertura: 0.85,
    olhoCaido: true,
    boca: 'M -8,14 Q 2,13 12,9', // sorriso de lado
  },
  assustada: {
    sobrancelhaEsq: 'M -19,-25 Q -10,-29 -1,-23',
    sobrancelhaDir: 'M 1,-23 Q 10,-29 19,-25',
    olhoAbertura: 1.4,
    boca: 'M -14,14 Q -7,8 0,14 Q 7,20 14,14',
  },
  empolgada: {
    sobrancelhaEsq: 'M -18,-22 Q -10,-26 -2,-20',
    sobrancelhaDir: 'M 2,-20 Q 10,-26 18,-22',
    olhoAbertura: 1.2,
    boca: 'M -14,8 Q 0,26 14,8 Q 7,14 0,14 Q -7,14 -14,8 Z',
  },
  entediada: {
    sobrancelhaEsq: 'M -18,-13 L -2,-14',
    sobrancelhaDir: 'M 2,-14 L 18,-13',
    olhoAbertura: 0.7,
    olhoCaido: true,
    boca: 'M -10,13 L 10,13',
  },
  deboche: {
    sobrancelhaEsq: 'M -18,-14 Q -10,-17 -2,-13',
    sobrancelhaDir: 'M 2,-25 Q 10,-28 18,-23', // sobrancelha altamente levantada
    olhoAbertura: 0.8,
    olhoCaido: true,
    boca: 'M -10,15 Q 0,14 13,8', // sorriso de deboche torto
  },
  desespero: {
    sobrancelhaEsq: 'M -19,-26 Q -10,-21 -2,-28',
    sobrancelhaDir: 'M 2,-28 Q 10,-21 19,-26',
    olhoAbertura: 1.45,
    boca: 'M -12,8 Q 0,30 12,8 Q 0,16 -12,8 Z', // boca aberta em pânico
  },
  pensativa: {
    sobrancelhaEsq: 'M -18,-16 Q -10,-19 -2,-15',
    sobrancelhaDir: 'M 2,-19 Q 10,-23 18,-18',
    olhoAbertura: 0.9,
    boca: 'M -8,14 L 8,13',
  },
  piscadela: {
    sobrancelhaEsq: 'M -18,-20 Q -10,-24 -2,-19',
    sobrancelhaDir: 'M 2,-19 Q 10,-23 18,-18',
    olhoAbertura: 1.15,
    boca: 'M -12,10 Q 0,22 12,10 Q 0,14 -12,10 Z',
  },
};

/** Formatos de boca para sincronia labial (visemas) */
export const VISEMAS_SVG: Record<string, string> = {
  m: 'M -10,12 L 10,12',                                   // lábios fechados (B, M, P)
  o: 'M 0,8 A 7,9 0 1,1 0,26 A 7,9 0 1,1 0,8 Z',           // O / U redondo
  a: 'M -12,8 Q 0,24 12,8 Q 0,14 -12,8 Z',                 // A bem aberto
  e: 'M -13,10 Q 0,18 13,10 Q 0,12 -13,10 Z',              // E / I dentes semi-visíveis
};
