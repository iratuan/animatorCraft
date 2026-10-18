/**
 * Padrão de nomes dos pacotes de sprites (.zip). Este arquivo não importa nada de propósito:
 * o app, o importador de linha de comando e os testes usam exatamente as mesmas regras.
 *
 *   <personagem>/pose_<nome>.png            pose do corpo        (pose_parado é obrigatória)
 *   <personagem>/pose_<nome>_<n>.png        quadros de uma animação (pose_andar_1, pose_andar_2, ...)
 *   <personagem>/rosto_<expressao>.png      cabeça com uma expressão (rosto_feliz, rosto_brava, ...)
 *   <personagem>/rosto_boca-a|e|o|m.png     cabeça com a boca de cada fonema (sincronia labial)
 *   <personagem>/rosto_olhos-fechados.png   cabeça piscando
 *   <personagem>/prop_<nome>.png            objetos (skate, foguete, ...)
 *   <personagem>/meta.json                  opcional: { "cabeca": {x,y,w,h} } em frações do sprite pose_parado
 *
 * Também vale o formato "plano": betason_pose_parado.png, betason_rosto_feliz.png...
 * Nomes em minúsculas, sem acento, com hífen dentro do nome e underscore só como separador.
 */
export type TipoSprite = 'pose' | 'rosto' | 'prop';

export interface SpriteNomeado {
  caminho: string;
  personagem: string;
  tipo: TipoSprite;
  nome: string;
  /** número do quadro quando a pose é uma animação (pose_andar_2 → 2); null para imagem única */
  variante: number | null;
  renomeado: boolean;
}

export interface OpcoesPacote {
  /** ids dos personagens conhecidos (ex.: betason, erika) */
  personagens: string[];
  /** expressões aceitas em rosto_<expressao> */
  expressoes: string[];
  /** poses que o app já conhece (as demais são avisadas como "pose nova") */
  posesConhecidas?: string[];
  /** padrão true: exige pose_parado. O editor de sprites desliga ao trocar um único arquivo. */
  exigirParado?: boolean;
}

export interface ResumoPersonagem {
  poses: string[];
  rostos: string[];
  props: string[];
  /** quadros por animação: { andar: 4 } */
  quadros: Record<string, number>;
}

export interface RelatorioPacote {
  sprites: SpriteNomeado[];
  /** caminho do meta.json de cada personagem, se houver */
  meta: Record<string, string>;
  erros: string[];
  avisos: string[];
  resumo: Record<string, ResumoPersonagem>;
}

export const ROSTOS_ESPECIAIS = ['boca-a', 'boca-e', 'boca-o', 'boca-m', 'olhos-fechados'];
export const POSE_OBRIGATORIA = 'parado';

export const normalizarNome = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '-');

const PADRAO = /^(pose|rosto|prop)_([a-z0-9]+(?:-[a-z0-9]+)*)(?:_(\d+))?$/;

export function analisarPacote(caminhos: string[], op: OpcoesPacote): RelatorioPacote {
  const rel: RelatorioPacote = { sprites: [], meta: {}, erros: [], avisos: [], resumo: {} };
  const conhecidos = new Set(op.personagens.map(normalizarNome));
  const vistos = new Set<string>();

  for (const bruto of caminhos) {
    const caminho = bruto.replace(/\\/g, '/');
    const segs = caminho.split('/').filter(Boolean);
    const arquivo = segs.pop();
    if (!arquivo || caminho.endsWith('/') || arquivo.startsWith('.') || segs[0] === '__MACOSX') continue;

    // personagem: pasta (a mais interna que seja um personagem conhecido) ou prefixo do nome do arquivo
    const pastas = segs.map(normalizarNome);
    let personagem = [...pastas].reverse().find((p) => conhecidos.has(p));
    const base0 = normalizarNome(arquivo);

    if (base0 === 'meta.json') {
      if (personagem) rel.meta[personagem] = caminho;
      else rel.avisos.push(`meta.json fora da pasta de um personagem foi ignorado (${caminho}).`);
      continue;
    }
    if (!/\.png$/.test(base0)) { rel.avisos.push(`Arquivo ignorado (só .png): ${caminho}`); continue; }

    let base = base0.replace(/\.png$/, '');
    if (!personagem) {
      const prefixo = [...conhecidos].find((id) => base.startsWith(`${id}_`));
      if (prefixo) { personagem = prefixo; base = base.slice(prefixo.length + 1); }
    } else if (base.startsWith(`${personagem}_`)) {
      base = base.slice(personagem.length + 1);
    }
    if (!personagem) {
      rel.erros.push(`${caminho}: não sei de qual personagem é. Coloque na pasta do personagem (ex.: betason/pose_parado.png) ou use o prefixo (betason_pose_parado.png). Personagens: ${op.personagens.join(', ')}.`);
      continue;
    }

    const m = PADRAO.exec(base);
    if (!m) {
      rel.erros.push(`${caminho}: nome inválido. Use pose_<nome>, pose_<nome>_<n>, rosto_<expressao> ou prop_<nome> (minúsculas, sem acento, hífen dentro do nome).`);
      continue;
    }
    const tipo = m[1] as TipoSprite, nome = m[2]!, variante = m[3] ? Number(m[3]) : null;
    if (tipo === 'rosto') {
      if (![...op.expressoes, ...ROSTOS_ESPECIAIS].includes(nome)) {
        rel.erros.push(`${caminho}: rosto "${nome}" desconhecido. Opções: ${[...op.expressoes, ...ROSTOS_ESPECIAIS].join(', ')}.`);
        continue;
      }
      if (variante !== null) { rel.erros.push(`${caminho}: rostos não têm número de quadro (use rosto_${nome}.png).`); continue; }
    }
    const chave = `${personagem}|${tipo}|${nome}|${variante ?? ''}`;
    if (vistos.has(chave)) { rel.erros.push(`${caminho}: duplicado (${tipo}_${nome}${variante ? `_${variante}` : ''} já existe para ${personagem}).`); continue; }
    vistos.add(chave);
    rel.sprites.push({ caminho, personagem, tipo, nome, variante, renomeado: arquivo.toLowerCase() !== arquivo || /\s/.test(arquivo) });
  }

  // resumo e checagens por personagem
  const porPersonagem = new Map<string, SpriteNomeado[]>();
  for (const s of rel.sprites) porPersonagem.set(s.personagem, [...(porPersonagem.get(s.personagem) ?? []), s]);
  for (const [id, lista] of porPersonagem) {
    const poses = lista.filter((s) => s.tipo === 'pose');
    const nomesPose = [...new Set(poses.map((s) => s.nome))];
    const quadros: Record<string, number> = {};
    for (const n of nomesPose) {
      const itens = poses.filter((s) => s.nome === n);
      const comNumero = itens.filter((s) => s.variante !== null), semNumero = itens.filter((s) => s.variante === null);
      if (comNumero.length && semNumero.length) rel.erros.push(`${id}: pose "${n}" tem versão sem número e com número. Use só pose_${n}.png ou só pose_${n}_1.png, pose_${n}_2.png...`);
      if (comNumero.length) {
        quadros[n] = comNumero.length;
        const nums = comNumero.map((s) => s.variante!).sort((a, b) => a - b);
        if (nums.some((v, i) => v !== i + 1)) rel.avisos.push(`${id}: os quadros de "${n}" deveriam ser 1..${nums.length} sem buracos (recebi ${nums.join(', ')}).`);
      }
    }
    if (op.exigirParado !== false && !nomesPose.includes(POSE_OBRIGATORIA)) rel.erros.push(`${id}: falta a pose obrigatória pose_${POSE_OBRIGATORIA}.png.`);
    const conhecidas = new Set(op.posesConhecidas ?? []);
    for (const n of nomesPose) if (op.posesConhecidas && !conhecidas.has(n)) rel.avisos.push(`${id}: pose nova "${n}". No roteiro: "${id} faz a pose ${n}."`);
    rel.resumo[id] = {
      poses: nomesPose,
      rostos: [...new Set(lista.filter((s) => s.tipo === 'rosto').map((s) => s.nome))],
      props: [...new Set(lista.filter((s) => s.tipo === 'prop').map((s) => s.nome))],
      quadros,
    };
  }
  if (rel.sprites.length === 0 && rel.erros.length === 0) rel.erros.push('Nenhum sprite .png encontrado no pacote.');
  return rel;
}

/** Poses que o app já conhece (clipes e biblioteca). As demais viram "pose nova" e são usadas com "<Ator> faz a pose <nome>." */
export const POSES_CONHECIDAS = [
  'parado', 'parado-calmo', 'andar', 'correr', 'comemorar', 'apontar', 'bracos-cruzados', 'bracos-abertos', 'sentado', 'sentado-alt',
  'gesticular', 'meia-costas', 'susto', 'costas', 'skate', 'apresentar', 'meditar', 'equilibrio', 'segurar', 'agachar', 'olhar-cima',
  'pular-corda', 'balanco', 'deitada', 'girar', 'brincar',
];

