/** Poses e expressões. Ângulos em graus, medidos a partir do "para baixo", positivos na direção para onde o ator olha. */
export const POSES = [
  'parado', 'andar', 'correr', 'pular', 'tropecar', 'cair', 'sentar',
  'apontar', 'escrever', 'acenar', 'bracos_cruzados', 'maos_na_cabeca', 'maos_na_cintura',
  'pensar', 'ideia', 'entender', 'confuso', 'surpreso', 'bravo', 'rindo', 'chorando', 'envergonhado', 'sarcastico',
  'danca_funky', 'danca_atual', 'danca_ballet', 'danca_descoordenada', 'danca_hippie',
  'costas', 'agachar', 'meditar', 'apresentar', 'gesticular',
  'apontar_lousa', 'segurando_microfone', 'sentado_bancada', 'digitando_laptop', 'comemorar',
] as const;
export type PoseId = (typeof POSES)[number];

/** Poses de dança: duram um tempo (padrão 4 s) e depois o ator volta a ficar parado. */
export const POSES_DE_DANCA: PoseId[] = ['danca_funky', 'danca_atual', 'danca_ballet', 'danca_descoordenada', 'danca_hippie'];
export const DURACAO_PADRAO_DANCA = 4;
/** Estilo de dança de cada personagem, usado quando o roteiro diz apenas "dança". */
export const DANCA_PADRAO: Record<string, PoseId> = {
  cringefather: 'danca_funky', betason: 'danca_atual', erika: 'danca_hippie', dario: 'danca_descoordenada', laura: 'danca_ballet',
  elizendra: 'danca_hippie', artur: 'danca_atual', carol: 'danca_ballet',
  veia: 'danca_funky', veio: 'danca_hippie', paraiba: 'danca_descoordenada', mingau: 'danca_descoordenada',
};

export const EXPRESSOES = [
  'neutra', 'feliz', 'triste', 'brava', 'surpresa', 'confusa', 'sarcastica', 'assustada', 'empolgada', 'entediada',
  'deboche', 'desespero', 'pensativa', 'piscadela',
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
  apontar_lousa: 'aponta para a lousa',
  segurando_microfone: 'segura o microfone',
  sentado_bancada: 'senta na bancada',
  digitando_laptop: 'digita no laptop',
  comemorar: 'comemora',
};

export const NOME_EXPRESSAO: Record<ExpressaoId, string> = {
  neutra: 'Neutra', feliz: 'Feliz', triste: 'Triste', brava: 'Brava', surpresa: 'Surpresa',
  confusa: 'Confusa', sarcastica: 'Sarcástica', assustada: 'Assustada', empolgada: 'Empolgada', entediada: 'Entediada',
  deboche: 'Deboche', desespero: 'Desespero', pensativa: 'Pensativa', piscadela: 'Piscadela',
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
  apontar_lousa: 'Apontar para a lousa', segurando_microfone: 'Segurando microfone',
  sentado_bancada: 'Sentado na bancada', digitando_laptop: 'Digitando no laptop', comemorar: 'Comemorar',
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
  // Parado com respiração e micropostura orgânica (ciclo suave de respiração de 3.5s)
  parado: (_f, t) => P({
    torso: 1.6 * sin(t * 1.8),
    cabeca: 1.2 * sin(t * 1.8 - 0.4),
    bracoF: [8 + 2.4 * sin(t * 1.8), 6 + 1.2 * cos(t * 1.8)],
    bracoT: [-8 - 2.4 * sin(t * 1.8), 6 + 1.2 * cos(t * 1.8)],
    pernaF: [4, 0],
    pernaT: [-4, 0],
  }),

  // Ciclo de caminhada natural com transferência de peso, rolagem de tornozelo e oscilação de braço em oposição
  andar: (f) => P({
    torso: 4 + 1.8 * sin(f),
    cabeca: -1.5 * cos(f),
    pernaF: [sin(f) * 34, -(10 + 44 * max(0, cos(f)))],
    pernaT: [-sin(f) * 34, -(10 + 44 * max(0, -cos(f)))],
    bracoF: [-sin(f) * 32, 20 + 8 * max(0, -sin(f))],
    bracoT: [sin(f) * 32, 20 + 8 * max(0, sin(f))],
    salto: 7 * abs(cos(f)),
  }),

  // Corrida atlética: inclinação dinâmica para frente, alta elevação dos joelhos e propulsão de braços flexionados
  correr: (f) => P({
    torso: 18 + 4 * sin(f),
    cabeca: -6,
    pernaF: [sin(f) * 62, -(30 + 82 * max(0, cos(f)))],
    pernaT: [-sin(f) * 62, -(30 + 82 * max(0, -cos(f)))],
    bracoF: [-sin(f) * 64, 88 + 18 * sin(f)],
    bracoT: [sin(f) * 64, 88 - 18 * sin(f)],
    salto: 26 * abs(sin(f)),
  }),

  // Pulo com antecipação, extensão completa de membros no ápice e quique no pouso
  pular: (_f, t) => P({
    torso: -4 + 2 * sin(t * 8),
    cabeca: 3 * sin(t * 8),
    bracoF: [155, 14],
    bracoT: [-155, 14],
    // no ar: coxa da frente para cima e para a frente, canela recolhida para trás; a de trás fica esticada
    pernaF: [58, -92],
    pernaT: [-22, -38],
    salto: 34 + 14 * sin(t * 7.5),
  }),

  // Tropeço cômico estilo pastelão com perda de centro de gravidade e braços em moinho
  tropecar: (_f, t) => P({
    torso: 32 + 4 * sin(t * 14),
    cabeca: 12 + 4 * cos(t * 14),
    bracoF: [128 + 24 * sin(t * 15), 32 + 10 * cos(t * 15)],
    bracoT: [-118 - 24 * sin(t * 15), 32 - 10 * cos(t * 15)],
    pernaF: [42, -12],
    pernaT: [-46, -34],
    salto: 2 + 2 * sin(t * 14),
  }),

  // Queda dramática no chão com pernas e braços abertos
  cair: () => P({
    rot: 88,
    torso: 4,
    cabeca: 12,
    bracoF: [142, 25],
    bracoT: [-142, 25],
    pernaF: [24, -18],
    pernaT: [-24, -18],
  }),

  // Sentado confortavelmente com mãos nos joelhos
  sentar: () => P({
    torso: 4,
    cabeca: -2,
    pernaF: [90, -90],
    pernaT: [82, -82],
    bracoF: [32, 58],
    bracoT: [-12, 64],
  }),

  // Apontar com postura firme e autoridade (peso deslocado para frente)
  apontar: () => P({
    torso: 6,
    cabeca: 2,
    bracoF: [110, 0],
    bracoT: [-16, 14],
    pernaF: [8, 0],
    pernaT: [-8, 0],
  }),

  // Escrever ativamente no quadro branco com oscilação rítmica do punho
  escrever: (_f, t) => P({
    torso: 6,
    cabeca: 2 + sin(t * 6),
    bracoF: [116 + 4 * sin(t * 8), -24 + 6 * cos(t * 12)],
    bracoT: [-12, 12],
  }),

  // Acenar calorosamente com balanço do antebraço e corpo comunicativo
  acenar: (_f, t) => P({
    torso: 2 * sin(t * 3),
    cabeca: 4 + 2 * sin(t * 3),
    bracoF: [152, 35 + 32 * sin(t * 11)],
    bracoT: [-12, 10],
  }),

  // Braços cruzados com postura confiante e ombros alinhados
  bracos_cruzados: () => P({
    torso: -2,
    cabeca: -4,
    bracoF: [22, 112],
    bracoT: [-8, 106],
    pernaF: [6, 0],
    pernaT: [-6, 0],
  }),

  // Mãos na cabeça (desespero / choque / espanto cômico)
  maos_na_cabeca: (_f, t) => P({
    torso: 8 + 2 * sin(t * 6),
    cabeca: -4 + 2 * sin(t * 12),
    bracoF: [128, -138],
    bracoT: [-128, -138],
  }),

  // Mãos na cintura (pose heroica / confiante / atitude)
  maos_na_cintura: () => P({
    torso: -4,
    cabeca: 3,
    bracoF: [44, -82],
    bracoT: [-44, -82],
    pernaF: [8, 0],
    pernaT: [-8, 0],
  }),

  // Pensar: mão no queixo e cabeça inclinada
  pensar: (_f, t) => P({
    torso: -2,
    cabeca: 10 + 3 * sin(t * 2.2),
    bracoF: [65, -212],
    bracoT: [-24, 75],
  }),

  // Ideia: dedo apontando para cima com salto súbito de alerta
  ideia: (_f, t) => P({
    torso: -3,
    cabeca: -6,
    bracoF: [175, 0],
    bracoT: [-12, 12],
    salto: 4 + 3 * abs(sin(t * 8)),
  }),

  // Entender: assentimento afirmativo e mãos abertas de clareza
  entender: (_f, t) => P({
    torso: 4 * sin(t * 4),
    cabeca: 8 * sin(t * 4),
    bracoF: [50, 30],
    bracoT: [-50, 30],
  }),

  // Confuso: coçando a cabeça e dando de ombros
  confuso: (_f, t) => P({
    torso: 3,
    cabeca: 16 + 4 * sin(t * 3),
    bracoF: [138, -232],
    bracoT: [-35, 45],
  }),

  // Surpreso: recuo rápido para trás com braços abertos em susto
  surpreso: (_f, t) => P({
    torso: -12,
    cabeca: -4,
    bracoF: [132, 28],
    bracoT: [-132, 28],
    pernaF: [12, 0],
    pernaT: [-14, 0],
    salto: 6 + 2 * sin(t * 4),
  }),

  // Bravo: peito estufado para a frente, punhos cerrados e pisadas firmes
  bravo: (_f, t) => P({
    torso: 12,
    cabeca: -4 + 2 * sin(t * 14),
    bracoF: [28, 82],
    bracoT: [-28, 82],
    salto: 3 * abs(sin(t * 14)),
  }),

  // Rindo: gargalhada expansiva com a cabeça para trás e tórax sacudindo
  rindo: (_f, t) => P({
    torso: -8 + 7 * sin(t * 20),
    cabeca: -10 + 5 * sin(t * 20),
    bracoF: [35, 75],
    bracoT: [-35, 75],
  }),

  // Chorando: mãos no rosto e ombros caídos tremendo em soluços
  chorando: (_f, t) => P({
    torso: 8 + 3 * sin(t * 18),
    cabeca: 20,
    bracoF: [62, -212],
    bracoT: [-62, -212],
  }),

  // Envergonhado: pés voltados para dentro e postura tímida
  envergonhado: () => P({
    torso: -6,
    cabeca: 24,
    bracoF: [-15, 8],
    bracoT: [-28, 12],
    pernaF: [-8, 0],
    pernaT: [-18, 0],
  }),

  // Sarcástico: encostado de lado com desdém e olhar zombeteiro
  sarcastico: () => P({
    torso: -5,
    cabeca: -12,
    bracoF: [42, -78],
    bracoT: [-118, 65],
  }),

  // Dança Funky (Disco anos 70): braço aponta em diagonal ao teto enquanto outro fixa no quadril, com requebrado contínuo
  danca_funky: (_f, t) => {
    const k = 0.5 + 0.5 * sin(t * 5.2);
    return P({
      torso: 10 * sin(t * 5.2),
      cabeca: -6 * sin(t * 5.2),
      bracoF: mix2([44, -82], [168, 4], k),
      bracoT: mix2([-168, 4], [-44, -82], k),
      pernaF: [18 + 10 * sin(t * 10.4), -10],
      pernaT: [-18 - 10 * sin(t * 10.4 + 1), -10],
      salto: 4 * abs(sin(t * 10.4)),
    });
  },

  // Dança Atual (Floss e Shuffle): balanço rápido de braços paralelos em oposição aos quadris
  danca_atual: (_f, t) => {
    const a = 75 * sin(t * 8.4);
    return P({
      torso: -a * 0.14,
      cabeca: a * 0.08,
      bracoF: [a, 18],
      bracoT: [a * 0.92, 18],
      pernaF: [10 + 7 * sin(t * 8.4), -8],
      pernaT: [-10 + 7 * sin(t * 8.4), -8],
      salto: 5 * abs(sin(t * 8.4)),
    });
  },

  // Dança Balé (Pirouette & Arabesque): giros e poses clássicas em ponta de pés
  danca_ballet: (_f, t) => {
    const w = smooth(Math.max(0, sin(t * 2.4)));
    return P({
      torso: 24 * w,
      cabeca: -8 * w,
      bracoF: mix2([144, 32], [104, 6], w),
      bracoT: mix2([-144, 32], [-116, 6], w),
      pernaF: [4, 0],
      pernaT: mix2([-4, 0], [-92, -6], w),
      salto: 8 * (1 - w) + 4,
    });
  },

  // Dança Descoordenada (Pulos eufóricos hilários): saltos livres e descompassados de pura euforia
  danca_descoordenada: (_f, t) => P({
    torso: 12 * sin(t * 4.2),
    cabeca: 14 * sin(t * 6.2),
    bracoF: [95 + 85 * sin(t * 8.4), 28 * sin(t * 5.4)],
    bracoT: [-95 + 85 * sin(t * 6.8 + 1.2), 28 * sin(t * 4.4)],
    pernaF: [28 * sin(t * 7.1), -34 * max(0, sin(t * 7.1))],
    pernaT: [-28 * sin(t * 5.8), -34 * max(0, sin(t * 5.8))],
    salto: 24 * abs(sin(t * 7.1)) + 9 * abs(sin(t * 9.8)),
  }),

  // Dança Hippie: fluidez corporal hipnótica com braços celebrando no ar
  danca_hippie: (_f, t) => P({
    torso: 10 * sin(t * 2.2),
    cabeca: 12 * sin(t * 2.2 + 0.6),
    bracoF: [154 + 22 * sin(t * 2.6), 22 + 16 * sin(t * 5.2)],
    bracoT: [-154 + 22 * sin(t * 2.6 + 1.8), 22 + 16 * sin(t * 5.2 + 1.2)],
    pernaF: [20 * sin(t * 2.2), -12],
    pernaT: [-20 * sin(t * 2.2), -12],
    salto: 3 * abs(sin(t * 2.2)),
  }),

  costas: () => P({ torso: 0, cabeca: 0, bracoF: [-8, 6], bracoT: [8, 6] }),
  agachar: () => P({ pernaF: [75, -125], pernaT: [-60, -115], torso: 28, bracoF: [65, 35], bracoT: [-32, 25] }),
  meditar: (_f, t) => P({ pernaF: [88, -88], pernaT: [80, -80], bracoF: [70, 30], bracoT: [-70, 30], salto: 3 * sin(t * 1.5) }),
  apresentar: () => P({ bracoF: [98, 8], bracoT: [-14, 12], torso: 5 }),
  gesticular: (_f, t) => P({
    torso: 3 * sin(t * 3),
    bracoF: [96 + 24 * sin(t * 4.6), 26 + 16 * cos(t * 4.6)],
    bracoT: [-86 + 22 * sin(t * 3.9 + 1.1), 32 + 14 * cos(t * 3.9)],
  }),
  apontar_lousa: () => P({ torso: -6, cabeca: 4, bracoF: [125, 4], bracoT: [-15, 12], pernaF: [4, 0], pernaT: [-4, 0] }),
  segurando_microfone: () => P({ torso: 2, cabeca: -2, bracoF: [68, 88], bracoT: [-14, 14], pernaF: [4, 0], pernaT: [-4, 0] }),
  sentado_bancada: () => P({ torso: 4, cabeca: 0, pernaF: [88, -88], pernaT: [80, -80], bracoF: [35, 60], bracoT: [-8, 62] }),
  digitando_laptop: (_f, t) => P({ torso: 8, cabeca: 10, pernaF: [88, -88], pernaT: [80, -80], bracoF: [48 + 4 * sin(t * 12), 72], bracoT: [-2 - 4 * sin(t * 12), 70] }),
  comemorar: (_f, t) => P({ torso: -4, cabeca: -6, bracoF: [148, 16], bracoT: [-148, 16], pernaF: [8, -12], pernaT: [-8, -12], salto: 12 + 6 * sin(t * 6) }),
};

function smooth(x: number): number { return x * x * (3 - 2 * x); }

export function poseDef(id: PoseId, fase = 0, t = 0): PoseDef {
  const fn = DEFINICOES[id] ?? DEFINICOES.parado;
  return fn(fase, t);
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

