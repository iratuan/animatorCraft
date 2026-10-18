import type { PoseId } from './poses';

/**
 * Animação de personagens em sprites: cada pose é uma imagem; o movimento vem de "primitivas" (quicar, balançar, girar...)
 * e de clipes, que são sequências de poses com movimento — as danças e reações reaproveitáveis da biblioteca.
 * Deslocamentos são frações da altura do personagem, para valer para qualquer tamanho.
 */
export type Movimento = 'respirar' | 'quicar' | 'balancar' | 'tremer' | 'girar' | 'pular' | 'inclinar' | 'andar' | 'correr' | 'encolher';

export interface PassoClipe {
  /** Etiquetas de sprite em ordem de preferência; usa a primeira que o personagem tiver. */
  tags: string[];
  dur: number;
  mov: Movimento;
  amp?: number;
  /** Espelha o sprite (inverte para onde o personagem aponta), útil para alternar lados na dança. */
  espelhar?: boolean;
}

export interface Clipe {
  id: string;
  nome: string;
  categoria: 'Dança' | 'Reação' | 'Movimento';
  passos: PassoClipe[];
  loop: boolean;
}

export interface Transformacao {
  tags: string[];
  dx: number; dy: number; rot: number; sx: number; sy: number;
  espelhar: boolean;
}

const { sin, cos, abs, PI } = Math;

function mover(mov: Movimento, u: number, t: number, amp?: number): Pick<Transformacao, 'dx' | 'dy' | 'rot' | 'sx' | 'sy'> {
  const n = { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1 };
  switch (mov) {
    case 'respirar': n.sy = 1 + 0.012 * sin((2 * PI * t) / 3.2); n.sx = 1 - 0.006 * sin((2 * PI * t) / 3.2); break;
    case 'quicar': { const h = abs(sin(PI * u)); n.dy = -(amp ?? 0.05) * h; n.sy = 1 - 0.06 * (1 - h); n.sx = 1 + 0.03 * (1 - h); break; }
    case 'pular': { const h = sin(PI * u); n.dy = -(amp ?? 0.12) * h; n.sy = 1 + 0.05 * h; n.sx = 1 - 0.02 * h; break; }
    case 'balancar': n.rot = (amp ?? 4) * sin(2 * PI * u); n.dx = 0.01 * sin(2 * PI * u); break;
    case 'inclinar': n.rot = (amp ?? 6) * sin(PI * u); break;
    case 'tremer': n.dx = 0.006 * (amp ?? 1) * sin(t * 62); n.dy = -0.004 * (amp ?? 1) * abs(sin(t * 31)); n.rot = 1.5 * (amp ?? 1) * sin(t * 47); break;
    case 'girar': n.sx = cos(2 * PI * u); n.dy = -0.02 * abs(sin(2 * PI * u)); break;
    case 'andar': n.dy = -0.014 * abs(sin(2 * PI * 2.2 * t)); n.rot = 2.4 * sin(2 * PI * 1.1 * t); break;
    case 'correr': n.dy = -0.035 * abs(sin(2 * PI * 3.2 * t)); n.rot = -5 + 2 * sin(2 * PI * 3.2 * t); break;
    case 'encolher': n.sy = 0.96; n.rot = (amp ?? 3) * sin(2 * PI * 0.7 * t); n.dx = 0.012; break;
  }
  return n;
}

const passo = (tags: string[], dur: number, mov: Movimento, amp?: number, espelhar = false): PassoClipe => ({ tags, dur, mov, amp, espelhar });

/** Danças: o estilo vem da sequência de poses e do movimento. Cada personagem usa as etiquetas que tem na ficha. */
export const CLIPES_DANCA: Record<string, Clipe> = {
  danca_funky: {
    id: 'danca_funky', nome: 'Dança funky (anos 70)', categoria: 'Dança', loop: true,
    passos: [
      passo(['apontar', 'apresentar'], 0.45, 'balancar', 3), passo(['apontar', 'apresentar'], 0.45, 'balancar', 3, true),
      passo(['gesticular', 'apontar'], 0.45, 'quicar', 0.03), passo(['gesticular', 'apontar'], 0.45, 'quicar', 0.03, true),
      passo(['susto', 'comemorar'], 0.4, 'pular', 0.08), passo(['parado-calmo', 'parado'], 0.4, 'balancar', 5),
    ],
  },
  danca_atual: {
    id: 'danca_atual', nome: 'Dança atual', categoria: 'Dança', loop: true,
    passos: [
      passo(['comemorar', 'susto'], 0.4, 'pular', 0.1), passo(['parado-calmo', 'parado'], 0.4, 'balancar', 6),
      passo(['correr', 'andar'], 0.35, 'quicar', 0.05), passo(['skate', 'comemorar'], 0.5, 'balancar', 6),
      passo(['comemorar', 'susto'], 0.4, 'pular', 0.1, true), passo(['parado-calmo', 'parado'], 0.4, 'balancar', 6, true),
    ],
  },
  danca_ballet: {
    id: 'danca_ballet', nome: 'Balé', categoria: 'Dança', loop: true,
    passos: [
      passo(['girar', 'comemorar', 'parado'], 1.0, 'girar'), passo(['comemorar', 'parado'], 0.5, 'pular', 0.1),
      passo(['parado'], 0.6, 'inclinar', 8), passo(['girar', 'parado'], 1.0, 'girar'),
    ],
  },
  danca_descoordenada: {
    id: 'danca_descoordenada', nome: 'Pulos descoordenados', categoria: 'Dança', loop: true,
    passos: [
      passo(['equilibrio', 'andar', 'parado'], 0.35, 'balancar', 7), passo(['olhar-cima', 'parado'], 0.3, 'quicar', 0.06),
      passo(['agachar', 'parado-calmo', 'parado'], 0.3, 'pular', 0.1), passo(['equilibrio', 'andar', 'parado'], 0.35, 'balancar', 9, true),
      passo(['andar', 'parado'], 0.3, 'pular', 0.11), passo(['comemorar', 'parado'], 0.3, 'tremer', 1.5),
    ],
  },
  danca_hippie: {
    id: 'danca_hippie', nome: 'Dança hippie', categoria: 'Dança', loop: true,
    passos: [
      passo(['bracos-abertos', 'gesticular', 'parado'], 0.9, 'balancar', 5), passo(['bracos-abertos', 'gesticular', 'parado'], 0.9, 'balancar', 5, true),
      passo(['gesticular', 'parado-calmo', 'parado'], 0.8, 'inclinar', 6), passo(['parado-calmo', 'parado'], 0.8, 'balancar', 4, true),
    ],
  },
};

/** Pose "simples" do roteiro → um passo único (sprite + movimento). */
const PASSO_DA_POSE: Partial<Record<PoseId, PassoClipe>> = {
  parado: passo(['parado'], 1, 'respirar'),
  andar: passo(['andar', 'parado'], 1, 'andar'),
  correr: passo(['correr', 'andar', 'parado'], 1, 'correr'),
  pular: passo(['comemorar', 'susto', 'parado'], 0.9, 'pular'),
  tropecar: passo(['susto', 'parado'], 1, 'tremer', 1.5),
  cair: passo(['susto', 'parado'], 1, 'tremer', 2),
  sentar: passo(['sentado', 'parado'], 1, 'respirar'),
  apontar: passo(['apontar', 'apresentar', 'gesticular', 'parado'], 1, 'respirar'),
  escrever: passo(['apontar', 'gesticular', 'parado'], 1, 'balancar', 1.5),
  acenar: passo(['comemorar', 'gesticular', 'parado'], 0.8, 'balancar', 6),
  bracos_cruzados: passo(['bracos-cruzados', 'parado-calmo', 'parado'], 1, 'respirar'),
  maos_na_cabeca: passo(['susto', 'parado'], 1, 'tremer'),
  maos_na_cintura: passo(['parado-calmo', 'parado'], 1, 'respirar'),
  pensar: passo(['olhar-cima', 'parado-calmo', 'parado'], 1.2, 'balancar', 2),
  ideia: passo(['comemorar', 'olhar-cima', 'parado'], 0.8, 'pular', 0.07),
  entender: passo(['parado-calmo', 'parado'], 0.8, 'quicar', 0.02),
  confuso: passo(['olhar-cima', 'parado'], 1.4, 'inclinar', 8),
  surpreso: passo(['susto', 'olhar-cima', 'parado'], 0.8, 'pular', 0.05),
  bravo: passo(['gesticular', 'apontar', 'parado'], 1, 'tremer', 1.2),
  rindo: passo(['comemorar', 'parado'], 1, 'tremer', 1.2),
  chorando: passo(['agachar', 'parado-calmo', 'parado'], 1, 'tremer', 0.8),
  envergonhado: passo(['parado-calmo', 'parado'], 1, 'encolher'),
  sarcastico: passo(['bracos-cruzados', 'parado-calmo', 'parado'], 1.2, 'inclinar', 4),
  costas: passo(['costas'], 1, 'respirar'),
  agachar: passo(['agachar', 'parado'], 1, 'respirar'),
  meditar: passo(['meditar', 'sentado', 'parado'], 1, 'respirar'),
  apresentar: passo(['apresentar', 'apontar', 'parado'], 1.2, 'balancar', 2),
  gesticular: passo(['gesticular', 'apresentar', 'parado'], 1.2, 'balancar', 2),
};

const cache = new Map<PoseId, Clipe>();

/** Clipe que anima uma pose do roteiro (dança = sequência; as demais = um passo com movimento). */
export function clipeDaPose(pose: PoseId): Clipe {
  const dança = CLIPES_DANCA[pose];
  if (dança) return dança;
  let c = cache.get(pose);
  if (!c) {
    const p = PASSO_DA_POSE[pose] ?? PASSO_DA_POSE.parado!;
    c = { id: pose, nome: pose, categoria: 'Movimento', passos: [p], loop: true };
    cache.set(pose, c);
  }
  return c;
}

export function duracaoDoClipe(c: Clipe): number {
  return c.passos.reduce((s, p) => s + p.dur, 0);
}

/** Posição de animação do clipe no tempo local `t` (segundos desde que a pose começou). */
export function avaliarClipe(c: Clipe, t: number): Transformacao {
  const total = duracaoDoClipe(c);
  const tt = c.loop ? t % total : Math.min(t, total - 1e-6);
  let acc = 0;
  for (const p of c.passos) {
    if (tt < acc + p.dur || p === c.passos[c.passos.length - 1]) {
      const u = Math.min(0.9999, Math.max(0, (tt - acc) / p.dur));
      return { tags: p.tags, espelhar: !!p.espelhar, ...mover(p.mov, u, t, p.amp) };
    }
    acc += p.dur;
  }
  return { tags: ['parado'], espelhar: false, dx: 0, dy: 0, rot: 0, sx: 1, sy: 1 };
}

