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
  /** Pose do boneco de palito (estilo Stickman) neste passo; sem ela, fica parado. */
  poseBoneco?: PoseId;
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
  /** pose do boneco de palito do passo atual */
  poseBoneco?: PoseId;
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
  danca_gamer: {
    id: 'danca_gamer', nome: 'Dança gamer', categoria: 'Dança', loop: true,
    passos: [
      passo(['comemorar', 'parado'], 0.35, 'quicar', 0.06), passo(['apontar', 'parado'], 0.35, 'balancar', 5, true),
      passo(['comemorar', 'susto'], 0.4, 'pular', 0.08), passo(['parado-calmo', 'parado'], 0.4, 'balancar', 4),
    ],
  },
  danca_street: {
    id: 'danca_street', nome: 'Dança street', categoria: 'Dança', loop: true,
    passos: [
      passo(['comemorar', 'parado'], 0.35, 'balancar', 7), passo(['andar', 'parado'], 0.35, 'quicar', 0.05, true),
      passo(['gesticular', 'parado'], 0.35, 'inclinar', 6), passo(['comemorar', 'parado'], 0.4, 'pular', 0.1),
    ],
  },
  danca_valsa: {
    id: 'danca_valsa', nome: 'Valsa suave', categoria: 'Dança', loop: true,
    passos: [
      passo(['apresentar', 'parado-calmo', 'parado'], 0.8, 'balancar', 4), passo(['apresentar', 'parado-calmo', 'parado'], 0.8, 'balancar', 4, true),
      passo(['parado-calmo', 'parado'], 0.7, 'inclinar', 5),
    ],
  },
  danca_forro: {
    id: 'danca_forro', nome: 'Forró animado', categoria: 'Dança', loop: true,
    passos: [
      passo(['gesticular', 'parado'], 0.3, 'quicar', 0.05), passo(['gesticular', 'parado'], 0.3, 'quicar', 0.05, true),
      passo(['comemorar', 'parado'], 0.35, 'balancar', 6), passo(['comemorar', 'parado'], 0.35, 'balancar', 6, true),
    ],
  },
  danca_serenata: {
    id: 'danca_serenata', nome: 'Serenata poética', categoria: 'Dança', loop: true,
    passos: [
      passo(['gesticular', 'parado'], 0.9, 'inclinar', 5), passo(['apresentar', 'parado'], 0.9, 'balancar', 4, true),
      passo(['parado-calmo', 'parado'], 0.8, 'respirar'),
    ],
  },
  danca_canina: {
    id: 'danca_canina', nome: 'Dança canina', categoria: 'Dança', loop: true,
    passos: [
      passo(['comemorar', 'parado'], 0.3, 'pular', 0.12), passo(['andar', 'parado'], 0.25, 'quicar', 0.08),
      passo(['comemorar', 'parado'], 0.3, 'balancar', 8, true), passo(['parado'], 0.3, 'quicar', 0.05),
    ],
  },
  danca_felina: {
    id: 'danca_felina', nome: 'Dança felina', categoria: 'Dança', loop: true,
    passos: [
      passo(['andar', 'parado'], 0.4, 'andar'), passo(['parado-calmo', 'parado'], 0.35, 'inclinar', 6),
      passo(['comemorar', 'parado'], 0.3, 'pular', 0.08), passo(['parado'], 0.45, 'respirar'),
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

/** Clipe que anima uma pose do roteiro (dança = sequência; as demais = um passo com movimento). Com `ator`, um clipe do personagem que substitui a pose tem prioridade. */
export function clipeDaPose(pose: PoseId, ator?: string, _estilo?: unknown): Clipe {
  const proprio = ator ? personalizados.find((c) => c.ator === ator && c.substitui === pose) : undefined;
  if (proprio) return proprio;
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
  t = Number.isNaN(t) ? 0 : Math.max(0, Math.min(1e9, t)); // instante inválido não pode virar NaN no desenho
  const total = duracaoDoClipe(c);
  const tt = c.loop ? t % total : Math.min(t, total - 1e-6);
  let acc = 0;
  for (const p of c.passos) {
    if (tt < acc + p.dur || p === c.passos[c.passos.length - 1]) {
      const u = Math.min(0.9999, Math.max(0, (tt - acc) / p.dur));
      return { tags: p.tags, espelhar: !!p.espelhar, ...(p.poseBoneco ? { poseBoneco: p.poseBoneco } : {}), ...mover(p.mov, u, t, p.amp) };
    }
    acc += p.dur;
  }
  return { tags: ['parado'], espelhar: false, dx: 0, dy: 0, rot: 0, sx: 1, sy: 1 };
}

// ---------------------------------------------------------------- clipes criados pelo usuário

export type EstiloClipe = 'stickman' | 'ambos';
export const MOVIMENTOS: Movimento[] = ['respirar', 'quicar', 'balancar', 'tremer', 'girar', 'pular', 'inclinar', 'andar', 'correr', 'encolher'];
export const MAX_PASSOS_CLIPE = 24;
/** Valor padrão da intensidade ("amp") de cada movimento que a aceita; a unidade muda de um para outro (graus, fração da altura…). */
export const AMP_PADRAO: Partial<Record<Movimento, number>> = { quicar: 0.05, pular: 0.12, balancar: 4, inclinar: 6, tremer: 1, encolher: 3 };

/** Clipe de um personagem: sequência de passos (pose do boneco stickman, movimento e duração). */
export interface ClipePersonalizado extends Clipe {
  ator: string;
  estilo?: EstiloClipe;
  /** pose padrão do roteiro que este clipe substitui para o personagem (ex.: danca_atual) */
  substitui?: PoseId;
}

const semAcentoClipe = (s: string) => (typeof s === 'string' ? s : '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
/** "Tchau Longo!" -> "tchau-longo" */
export const nomeDeClipe = (s: string): string => semAcentoClipe(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

let personalizados: ClipePersonalizado[] = [];
const num = (v: unknown, padrao: number, min: number, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : padrao);

/** Substitui todos os clipes criados pelo usuário. Entradas inválidas (ou com valores absurdos) são corrigidas ou descartadas. */
export function definirClipesPersonalizados(lista: ClipePersonalizado[], poseValida: (p: string) => boolean = () => true): void {
  const vistos = new Set<string>();
  personalizados = (Array.isArray(lista) ? lista : []).flatMap((c): ClipePersonalizado[] => {
    const nome = nomeDeClipe(c?.nome ?? '');
    const estilo: EstiloClipe = 'stickman';
    const chave = `${c?.ator}|${nome}`;
    const passos = (Array.isArray(c?.passos) ? c.passos : []).slice(0, MAX_PASSOS_CLIPE).flatMap((p): PassoClipe[] => {
      const tags = (Array.isArray(p?.tags) ? p.tags : []).filter((x): x is string => typeof x === 'string' && x.length > 0).slice(0, 4);
      const mov = MOVIMENTOS.includes(p?.mov) ? p.mov : 'respirar';
      const poseBoneco = typeof p?.poseBoneco === 'string' && poseValida(p.poseBoneco) ? (p.poseBoneco as PoseId) : undefined;
      return [{ tags: tags.length ? tags : ['parado'], dur: num(p?.dur, 0.5, 0.1, 10), mov, ...(p?.amp !== undefined && AMP_PADRAO[mov] !== undefined ? { amp: num(p.amp, AMP_PADRAO[mov]!, 0, AMP_PADRAO[mov]! * 5) } : {}), ...(p?.espelhar ? { espelhar: true } : {}), ...(poseBoneco ? { poseBoneco } : {}) }];
    });
    if (!c?.ator || !nome || !passos.length || vistos.has(chave)) return [];
    vistos.add(chave);
    const substitui = typeof c.substitui === 'string' && poseValida(c.substitui) ? (c.substitui as PoseId) : undefined;
    return [{ id: nome, nome: typeof c.nome === 'string' ? c.nome.slice(0, 60) : nome, categoria: 'Movimento', loop: c.loop !== false, passos, ator: c.ator, estilo, ...(substitui ? { substitui } : {}) }];
  });
}

export const CLIPES_PADRAO_PERSONAGEM: ClipePersonalizado[] = [
  // Artur
  { id: 'jogar-videogame', nome: 'Jogar videogame', ator: 'artur', categoria: 'Movimento', loop: true, passos: [passo(['sentado', 'parado'], 0.5, 'balancar', 3), passo(['sentado', 'parado'], 0.4, 'quicar', 0.02)] },
  { id: 'vitoria-gamer', nome: 'Vitória gamer', ator: 'artur', categoria: 'Reação', loop: false, passos: [passo(['comemorar', 'parado'], 0.5, 'pular', 0.1), passo(['comemorar', 'parado'], 0.6, 'balancar', 5)] },
  // Carol
  { id: 'pose-atitude', nome: 'Pose de atitude', ator: 'carol', categoria: 'Movimento', loop: false, passos: [passo(['bracos-cruzados', 'parado'], 0.7, 'inclinar', 4), passo(['bracos-cruzados', 'parado'], 0.8, 'respirar')] },
  { id: 'tchau-descolado', nome: 'Tchau descolado', ator: 'carol', categoria: 'Movimento', loop: false, passos: [passo(['comemorar', 'parado'], 0.5, 'balancar', 6), passo(['parado-calmo', 'parado'], 0.5, 'respirar')] },
  // Elizendra
  { id: 'oferecer-bolo', nome: 'Oferecer bolo', ator: 'elizendra', categoria: 'Movimento', loop: false, passos: [passo(['apresentar', 'parado'], 0.7, 'inclinar', 4), passo(['apresentar', 'parado'], 0.8, 'respirar')] },
  { id: 'ajeitar-oculos', nome: 'Ajeitar os óculos', ator: 'elizendra', categoria: 'Movimento', loop: false, passos: [passo(['olhar-cima', 'parado'], 0.6, 'quicar', 0.02), passo(['parado-calmo', 'parado'], 0.7, 'respirar')] },
  // Véia
  { id: 'dar-bronca', nome: 'Dar bronca', ator: 'veia', categoria: 'Reação', loop: true, passos: [passo(['apontar', 'parado'], 0.4, 'tremer', 1.4), passo(['gesticular', 'parado'], 0.4, 'balancar', 5)] },
  { id: 'reclamar', nome: 'Reclamar', ator: 'veia', categoria: 'Reação', loop: true, passos: [passo(['gesticular', 'parado'], 0.5, 'balancar', 6), passo(['apontar', 'parado'], 0.4, 'inclinar', 5)] },
  // Véio
  { id: 'declamar-poema', nome: 'Declamar poema', ator: 'veio', categoria: 'Movimento', loop: true, passos: [passo(['apresentar', 'parado'], 0.8, 'balancar', 4), passo(['bracos-abertos', 'parado'], 0.8, 'inclinar', 5)] },
  { id: 'reverencia', nome: 'Reverência clássica', ator: 'veio', categoria: 'Movimento', loop: false, passos: [passo(['apresentar', 'parado'], 0.7, 'inclinar', 8), passo(['parado-calmo', 'parado'], 0.8, 'respirar')] },
  // Paraíba
  { id: 'abanar-rabo', nome: 'Abanar o rabo', ator: 'paraiba', categoria: 'Movimento', loop: true, passos: [passo(['parado'], 0.25, 'balancar', 7), passo(['parado'], 0.25, 'balancar', 7, true)] },
  { id: 'dar-patinha', nome: 'Dar a patinha', ator: 'paraiba', categoria: 'Movimento', loop: false, passos: [passo(['parado'], 0.6, 'quicar', 0.04), passo(['parado'], 0.7, 'respirar')] },
  { id: 'girar-rabo', nome: 'Girar atrás do rabo', ator: 'paraiba', categoria: 'Movimento', loop: true, passos: [passo(['andar', 'parado'], 0.3, 'girar'), passo(['andar', 'parado'], 0.3, 'quicar', 0.06)] },
  // Mingau
  { id: 'espreguicar', nome: 'Espreguiçar', ator: 'mingau', categoria: 'Movimento', loop: false, passos: [passo(['parado'], 0.7, 'encolher', 4), passo(['parado'], 0.8, 'respirar')] },
  { id: 'lavar-rosto', nome: 'Lavar o rosto', ator: 'mingau', categoria: 'Movimento', loop: true, passos: [passo(['parado'], 0.4, 'balancar', 3), passo(['parado'], 0.4, 'quicar', 0.02)] },
  { id: 'bote-felino', nome: 'Bote felino', ator: 'mingau', categoria: 'Movimento', loop: false, passos: [passo(['parado'], 0.5, 'tremer', 0.8), passo(['comemorar', 'parado'], 0.3, 'pular', 0.12)] },
];

export const clipesPersonalizados = (ator?: string): ClipePersonalizado[] => (ator ? personalizados.filter((c) => c.ator === ator) : [...personalizados]);

/** Retorna todos os clipes disponíveis para o personagem (inclui personalizados e os nativos da biblioteca). */
export const clipesDoPersonagem = (ator?: string): ClipePersonalizado[] => {
  const padrao = ator ? CLIPES_PADRAO_PERSONAGEM.filter((c) => c.ator === ator) : [...CLIPES_PADRAO_PERSONAGEM];
  const custom = clipesPersonalizados(ator);
  const chavesCustom = new Set(custom.map((c) => `${c.ator}|${c.id}`));
  return [...custom, ...padrao.filter((p) => !chavesCustom.has(`${p.ator}|${p.id}`))];
};

export function esquecerClipesDe(ator: string): void { personalizados = personalizados.filter((c) => c.ator !== ator); }

/** Clipe do personagem pelo nome (do roteiro). */
export function acharClipe(ator: string, nome: string, _estilo?: unknown): ClipePersonalizado | undefined {
  const n = nomeDeClipe(nome);
  return personalizados.find((c) => c.ator === ator && c.id === n) ?? CLIPES_PADRAO_PERSONAGEM.find((c) => c.ator === ator && c.id === n);
}