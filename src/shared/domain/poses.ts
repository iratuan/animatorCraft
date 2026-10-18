/** Poses e expressões. Ângulos em graus, medidos a partir do "para baixo", positivos na direção para onde o ator olha. */
export const POSES = [
  'parado', 'andar', 'correr', 'pular', 'tropecar', 'cair', 'sentar',
  'apontar', 'escrever', 'acenar', 'bracos_cruzados', 'maos_na_cabeca', 'maos_na_cintura',
  'pensar', 'ideia', 'entender', 'confuso', 'surpreso', 'bravo', 'rindo', 'chorando', 'envergonhado', 'sarcastico',
  'danca_funky', 'danca_atual', 'danca_ballet', 'danca_descoordenada', 'danca_hippie',
  'costas', 'agachar', 'meditar', 'apresentar', 'gesticular',
] as const;
export type PoseId = (typeof POSES)[number];

/** Poses de dança: duram um tempo (padrão 4 s) e depois o ator volta a ficar parado. */
export const POSES_DE_DANCA: PoseId[] = ['danca_funky', 'danca_atual', 'danca_ballet', 'danca_descoordenada', 'danca_hippie'];
export const DURACAO_PADRAO_DANCA = 4;
/** Estilo de dança de cada personagem, usado quando o roteiro diz apenas "dança". */
export const DANCA_PADRAO: Record<string, PoseId> = {
  cringefather: 'danca_funky', betason: 'danca_atual', erika: 'danca_hippie', dario: 'danca_descoordenada', laura: 'danca_ballet',
  elizendra: 'danca_hippie', artur: 'danca_atual', carol: 'danca_ballet',
};

export const EXPRESSOES = [
  'neutra', 'feliz', 'triste', 'brava', 'surpresa', 'confusa', 'sarcastica', 'assustada', 'empolgada', 'entediada',
] as const;
export type ExpressaoId = (typeof EXPRESSOES)[number];

/** Frase do roteiro que produz cada pose (usada pelo parser e pelos botões da interface). */
export const FRASE_POSE: Partial<Record<PoseId, string>> = {
  parado: 'fica parado',
  pular: 'pula',
  tropecar: 'tropeça',
  cair: 'cai',
  sentar: 'senta',
  acenar: 'acena',
  bracos_cruzados: 'cruza os braços',
  maos_na_cabeca: 'põe as mãos na cabeça',
  maos_na_cintura: 'põe as mãos na cintura',
  pensar: 'pensa',
  ideia: 'tem uma ideia',
  entender: 'entende',
  confuso: 'fica confuso',
  surpreso: 'fica surpreso',
  bravo: 'fica bravo',
  rindo: 'ri',
  chorando: 'chora',
  envergonhado: 'fica envergonhado',
  sarcastico: 'fica sarcástico',
  danca_funky: 'dança funky',
  danca_atual: 'dança no estilo atual',
  danca_ballet: 'dança balé',
  danca_descoordenada: 'dança descoordenada',
  danca_hippie: 'dança hippie',
  costas: 'vira de costas',
  agachar: 'agacha',
  meditar: 'medita',
  apresentar: 'apresenta',
  gesticular: 'gesticula',
};

export const NOME_EXPRESSAO: Record<ExpressaoId, string> = {
  neutra: 'Neutra', feliz: 'Feliz', triste: 'Triste', brava: 'Brava', surpresa: 'Surpresa',
  confusa: 'Confusa', sarcastica: 'Sarcástica', assustada: 'Assustada', empolgada: 'Empolgada', entediada: 'Entediada',
};

export const NOME_POSE: Record<PoseId, string> = {
  parado: 'Parado', andar: 'Andar', correr: 'Correr', pular: 'Pular', tropecar: 'Tropeçar', cair: 'Cair', sentar: 'Sentar',
  apontar: 'Apontar', escrever: 'Escrever', acenar: 'Acenar', bracos_cruzados: 'Braços cruzados',
  maos_na_cabeca: 'Mãos na cabeça', maos_na_cintura: 'Mãos na cintura', pensar: 'Pensar', ideia: 'Ideia',
  entender: 'Entender', confuso: 'Confuso', surpreso: 'Surpreso', bravo: 'Bravo', rindo: 'Rindo',
  chorando: 'Chorando', envergonhado: 'Envergonhado', sarcastico: 'Sarcástico',
  danca_funky: 'Dança funky (anos 70)', danca_atual: 'Dança atual', danca_ballet: 'Balé',
  danca_descoordenada: 'Pulos descoordenados', danca_hippie: 'Dança hippie',
  costas: 'De costas', agachar: 'Agachar', meditar: 'Meditar', apresentar: 'Apresentar', gesticular: 'Gesticular',
};

/** Esqueleto: [ângulo do segmento superior, ângulo do inferior relativo ao superior]. F = braço/perna da frente, T = de trás. */
export interface PoseDef {
  torso: number;
  cabeca: number;
  bracoF: [number, number];
  bracoT: [number, number];
  pernaF: [number, number];
  pernaT: [number, number];
  /** Elevação do corpo, em unidades de escala (pulo, quique da corrida). */
  salto: number;
  /** Rotação do corpo todo em torno dos pés (queda). */
  rot: number;
}

const BASE: PoseDef = {
  torso: 0, cabeca: 0, bracoF: [8, 6], bracoT: [-8, 6], pernaF: [5, 0], pernaT: [-5, 0], salto: 0, rot: 0,
};
const P = (o: Partial<PoseDef>): PoseDef => ({ ...BASE, ...o });
const { sin, cos, abs, max } = Math;

type Gerador = (fase: number, t: number) => PoseDef;

const DEFINICOES: Record<PoseId, Gerador> = {
  parado: (_f, t) => P({ torso: 1.2 * sin(t * 2), bracoF: [8 + 2 * sin(t * 2), 6], bracoT: [-8 - 2 * sin(t * 2), 6] }),
  andar: (f) =>
    P({
      torso: 3,
      pernaF: [sin(f) * 30, -(8 + 40 * max(0, cos(f)))],
      pernaT: [-sin(f) * 30, -(8 + 40 * max(0, -cos(f)))],
      bracoF: [-sin(f) * 28, 16],
      bracoT: [sin(f) * 28, 16],
      salto: 6 * abs(cos(f)),
    }),
  correr: (f) =>
    P({
      torso: 16,
      pernaF: [sin(f) * 55, -(25 + 75 * max(0, cos(f)))],
      pernaT: [-sin(f) * 55, -(25 + 75 * max(0, -cos(f)))],
      bracoF: [-sin(f) * 55, 90],
      bracoT: [sin(f) * 55, 90],
      salto: 22 * abs(sin(f)),
    }),
  pular: (_f, t) => P({ bracoF: [150, 10], bracoT: [-150, 10], pernaF: [14, -50], pernaT: [-14, -50], salto: 30 + 10 * sin(t * 8) }),
  tropecar: (_f, t) =>
    P({ torso: 28, cabeca: 10, bracoF: [120 + 15 * sin(t * 14), 20], bracoT: [-110 - 15 * sin(t * 14), 20], pernaF: [38, -10], pernaT: [-40, -30] }),
  cair: () => P({ rot: 86, bracoF: [140, 20], bracoT: [-140, 20], pernaF: [20, -15], pernaT: [-20, -15] }),
  sentar: () => P({ pernaF: [88, -88], pernaT: [80, -80], bracoF: [28, 55], bracoT: [-10, 60] }),
  apontar: () => P({ bracoF: [108, 0], bracoT: [-8, 8], torso: 4 }),
  escrever: (_f, t) => P({ bracoF: [112 + 3 * sin(t * 6), -22], bracoT: [-8, 8], torso: 5 }),
  acenar: (_f, t) => P({ bracoF: [150, 30 + 28 * sin(t * 10)], bracoT: [-8, 8] }),
  bracos_cruzados: () => P({ bracoF: [18, 108], bracoT: [-4, 100], cabeca: -3 }),
  maos_na_cabeca: () => P({ bracoF: [125, -135], bracoT: [-125, -135], cabeca: -3 }),
  maos_na_cintura: () => P({ bracoF: [42, -78], bracoT: [-42, -78] }),
  pensar: (_f, t) => P({ bracoF: [60, -209], bracoT: [-10, 10], cabeca: 8 + 2 * sin(t * 3) }),
  ideia: (_f, t) => P({ bracoF: [172, 0], bracoT: [-8, 8], salto: 2 + 2 * sin(t * 9) }),
  entender: () => P({ bracoF: [45, 25], bracoT: [-45, 25], cabeca: -4, torso: -2 }),
  confuso: (_f, t) => P({ bracoF: [135, -228], bracoT: [-8, 8], cabeca: 14 + 3 * sin(t * 4) }),
  surpreso: (_f, t) => P({ torso: -9, bracoF: [128, 25], bracoT: [-128, 25], pernaF: [10, 0], pernaT: [-12, 0], salto: 10 * max(0, sin(t * 3)) * 0 + 6 }),
  bravo: (_f, t) => P({ torso: 8, bracoF: [26, 78], bracoT: [-26, 78], salto: 3 * abs(sin(t * 12)) }),
  rindo: (_f, t) => P({ torso: -6 + 5 * sin(t * 22), bracoF: [30, 70], bracoT: [-30, 70], cabeca: -6 + 3 * sin(t * 22) }),
  chorando: (_f, t) => P({ cabeca: 18, torso: 5 + 2 * sin(t * 16), bracoF: [60, -209], bracoT: [-60, -209] }),
  envergonhado: (_f, t) => P({ cabeca: 22, torso: -4, bracoF: [-12, 6], bracoT: [-24, 10], pernaF: [-6, 0], pernaT: [-16, 0], salto: 0 * t }),
  sarcastico: () => P({ cabeca: -10, bracoF: [42, -78], bracoT: [-120, 70], torso: -3 }),
  // Disco anos 70: um braço aponta para o alto, o outro na cintura, alternando; quadril balançando.
  danca_funky: (_f, t) => {
    const k = 0.5 + 0.5 * sin(t * 5);
    return P({
      torso: 8 * sin(t * 5), cabeca: -5 * sin(t * 5),
      bracoF: mix2([42, -78], [165, 0], k), bracoT: mix2([-165, 0], [-42, -78], k),
      pernaF: [16 + 8 * sin(t * 10), -8], pernaT: [-16 - 8 * sin(t * 10 + 1), -8], salto: 3 * abs(sin(t * 10)),
    });
  },
  // Dança atual: braços balançando juntos de um lado ao outro (floss) com quadril contrário e quique.
  danca_atual: (_f, t) => {
    const a = 70 * sin(t * 8);
    return P({
      torso: -a * 0.12, cabeca: a * 0.06, bracoF: [a, 15], bracoT: [a * 0.9, 15],
      pernaF: [8 + 6 * sin(t * 8), -6], pernaT: [-8 + 6 * sin(t * 8), -6], salto: 4 * abs(sin(t * 8)),
    });
  },
  // Balé: alterna braços em arco no alto na ponta dos pés com arabesque (perna de trás levantada).
  danca_ballet: (_f, t) => {
    const w = smooth(Math.max(0, sin(t * 2.2)));
    return P({
      torso: 22 * w, cabeca: -6 * w,
      bracoF: mix2([140, 30], [100, 5], w), bracoT: mix2([-140, 30], [-112, 5], w),
      pernaF: [3, 0], pernaT: mix2([-3, 0], [-88, -4], w), salto: 7 * (1 - w) + 3,
    });
  },
  // Pulos descoordenados e felizes: várias senoides fora de fase para braços e pernas.
  danca_descoordenada: (_f, t) =>
    P({
      torso: 10 * sin(t * 3.7), cabeca: 12 * sin(t * 5.5),
      bracoF: [90 + 80 * sin(t * 7.7), 25 * sin(t * 5)], bracoT: [-90 + 80 * sin(t * 6.1 + 1), 25 * sin(t * 4)],
      pernaF: [25 * sin(t * 6.3), -30 * max(0, sin(t * 6.3))], pernaT: [-25 * sin(t * 5.2), -30 * max(0, sin(t * 5.2))],
      salto: 22 * abs(sin(t * 6.3)) + 8 * abs(sin(t * 9.1)),
    }),
  // Hippie: balança de um lado ao outro com os braços no alto, como quem curte muito a música.
  costas: () => P({}),
  agachar: () => P({ pernaF: [70, -120], pernaT: [-55, -110], torso: 25, bracoF: [60, 30], bracoT: [-30, 20] }),
  meditar: () => P({ pernaF: [88, -88], pernaT: [80, -80], bracoF: [70, 30], bracoT: [-70, 30] }),
  apresentar: () => P({ bracoF: [95, 5], bracoT: [-8, 8], torso: 4 }),
  gesticular: (_f, t) => P({ bracoF: [100 + 20 * sin(t * 5), 20], bracoT: [-90 + 15 * sin(t * 4), 25] }),
  danca_hippie: (_f, t) =>
    P({
      torso: 8 * sin(t * 2), cabeca: 10 * sin(t * 2 + 0.5),
      bracoF: [150 + 20 * sin(t * 2.4), 20 + 15 * sin(t * 4.8)], bracoT: [-150 + 20 * sin(t * 2.4 + 1.6), 20 + 15 * sin(t * 4.8 + 1)],
      pernaF: [18 * sin(t * 2), -10], pernaT: [-18 * sin(t * 2), -10], salto: 2 * abs(sin(t * 2)),
    }),
};

function smooth(x: number): number { return x * x * (3 - 2 * x); }

export function poseDef(id: PoseId, fase = 0, t = 0): PoseDef {
  return DEFINICOES[id](fase, t);
}

const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const mix2 = (a: [number, number], b: [number, number], k: number): [number, number] => [mix(a[0], b[0], k), mix(a[1], b[1], k)];

export function misturar(a: PoseDef, b: PoseDef, k: number): PoseDef {
  return {
    torso: mix(a.torso, b.torso, k), cabeca: mix(a.cabeca, b.cabeca, k),
    bracoF: mix2(a.bracoF, b.bracoF, k), bracoT: mix2(a.bracoT, b.bracoT, k),
    pernaF: mix2(a.pernaF, b.pernaF, k), pernaT: mix2(a.pernaT, b.pernaT, k),
    salto: mix(a.salto, b.salto, k), rot: mix(a.rot, b.rot, k),
  };
}

/** Efeito gráfico que aparece sobre a cabeça enquanto a pose está ativa. */
export const EFEITO_POSE: Partial<Record<PoseId, 'ideia' | 'duvida' | 'exclamacao' | 'raiva'>> = {
  ideia: 'ideia', confuso: 'duvida', surpreso: 'exclamacao', bravo: 'raiva',
};

