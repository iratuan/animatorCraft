import { acharClipe, ATORES, avaliarClipe, clipeDaPose, definirExpressoesDeSprites, esquecerExpressoesDe, type ActorId, type AtorEstado, type PoseId, type Transformacao, type Visema } from '@shared/domain';

export interface RostoInfo {
  /** caixa da cabeça em frações do sprite: usada pelo [close no personagem] e para encaixar as cabeças de rosto_* */
  cabeca: { x: number; y: number; w: number; h: number };
}
export type TipoSprite = 'pose' | 'rosto' | 'prop';
export interface SpriteInfo {
  arquivo: string; w: number; h: number;
  /** nome do sprite (pose_andar_2 → tags: ['andar']); a primeira etiqueta é o nome */
  tags: string[];
  tipo?: TipoSprite;
  /** número do quadro quando a pose é uma animação */
  variante?: number | null;
  ancora: 'pes' | 'topo';
  rosto?: RostoInfo;
  /** só em rosto_*: onde a cabeça se encaixa no pose_parado (px do sprite) e a escala relativa */
  encaixe?: { x: number; y: number; escala: number };
}
export type ManifestoPersonagens = Record<string, { nome: string; altura: number; sprites: SpriteInfo[] }>;
export interface Rect { x: number; y: number; w: number; h: number }
export type ModoCor = 'cinza' | 'cor';

export const QUADROS_POR_SEGUNDO = 8;

let manifesto: ManifestoPersonagens = {};
let modoAtual: ModoCor = 'cinza';
let pronto = false;
const imagens = new Map<string, HTMLCanvasElement>();

// ---------------------------------------------------------------- carregamento

/** Carrega os sprites (uma vez) e os converte para o modo de cor pedido. `urlDe` devolve a URL/data URL de cada arquivo. */
export async function prepararSprites(m: ManifestoPersonagens, urlDe: (arquivo: string) => string, modo: ModoCor = 'cinza'): Promise<void> {
  manifesto = structuredClone(m); modoAtual = modo; imagens.clear(); pronto = false;
  const tarefas: Promise<void>[] = [];
  for (const p of Object.values(manifesto)) for (const s of p.sprites) tarefas.push(carregar(s, urlDe(s.arquivo)));
  await Promise.all(tarefas);
  for (const id of Object.keys(manifesto)) sincronizarExpressoes(id);
  pronto = true;
}

/** O roteiro só aceita \cara de X\ para as expressões que o personagem tem: avisa o domínio quais rosto_* existem. */
function sincronizarExpressoes(id: string): void {
  definirExpressoesDeSprites(id, (manifesto[id]?.sprites ?? []).filter((s) => s.tipo === 'rosto').map((s) => s.tags[0]!));
}

async function carregar(s: SpriteInfo, url: string): Promise<void> {
  const img = await new Promise<HTMLImageElement>((ok, erro) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => erro(new Error(`Não consegui carregar o sprite ${s.arquivo}`));
    i.src = url;
  });
  const c = document.createElement('canvas');
  c.width = s.w; c.height = s.h;
  const x = c.getContext('2d', { willReadFrequently: true })!;
  x.drawImage(img, 0, 0, s.w, s.h);
  if (modoAtual === 'cinza') {
    const d = x.getImageData(0, 0, s.w, s.h), p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      const l = 0.3 * p[i]! + 0.59 * p[i + 1]! + 0.11 * p[i + 2]!;
      p[i] = p[i + 1] = p[i + 2] = Math.max(0, Math.min(255, (l - 128) * 1.08 + 128)); // leve contraste para manter o traço firme
    }
    x.putImageData(d, 0, 0);
  }
  imagens.set(s.arquivo, c);
}

/** Acrescenta (ou substitui) sprites de um personagem em tempo de execução: é o que a importação de pacotes .zip usa. */
export async function registrarSprites(id: ActorId, entradas: { info: SpriteInfo; url: string }[], opcoes: { substituir?: boolean } = {}): Promise<void> {
  const p = (manifesto[id] ??= { nome: ATORES[id]!.nome, altura: ATORES[id]!.altura, sprites: [] });
  if (opcoes.substituir) p.sprites = [];
  await Promise.all(entradas.map((e) => carregar(e.info, e.url)));
  for (const { info } of entradas) {
    const mesmo = (s: SpriteInfo) => (s.tipo ?? 'pose') === (info.tipo ?? 'pose') && s.tags[0] === info.tags[0] && (s.variante ?? null) === (info.variante ?? null);
    p.sprites = p.sprites.filter((s) => !mesmo(s));
    p.sprites.push(info);
  }
  sincronizarExpressoes(id);
  pronto = true;
}

/** Esquece os sprites de um personagem (ao excluí-lo). */
export function removerSprites(id: ActorId): void {
  for (const s of manifesto[id]?.sprites ?? []) imagens.delete(s.arquivo);
  delete manifesto[id];
  esquecerExpressoesDe(id);
}

export const spritesProntos = () => pronto;
/** O personagem tem ficha de sprites (poses), seja qual for a skin escolhida. */
export const possuiSprites = (id: ActorId) => pronto && !!manifesto[id] && manifesto[id]!.sprites.some((s) => (s.tipo ?? 'pose') === 'pose');

export type Skin = 'chibi' | 'stickman';
let skinPadrao: Skin = 'chibi';
let skins: Record<string, Skin> = {};
/** Skin de cada personagem; padrao vale para quem não tem escolha própria. */
export function definirSkins(padrao: Skin, porPersonagem: Record<string, Skin>): void { skinPadrao = padrao; skins = { ...porPersonagem }; }
export const skinDe = (id: ActorId): Skin => skins[id] ?? skinPadrao;
/** Desenha com os sprites chibi: tem ficha e a skin escolhida é chibi (senão entra o boneco de palito). */
export const temSprites = (id: ActorId) => skinDe(id) === 'chibi' && possuiSprites(id);

// ---------------------------------------------------------------- consulta

const ehPose = (s: SpriteInfo) => (s.tipo ?? 'pose') === 'pose';

/** O que o personagem tem, por categoria (biblioteca e validação do roteiro). */
export function listarSprites(id: ActorId): { poses: string[]; rostos: string[]; props: string[]; quadros: Record<string, number> } {
  const lista = manifesto[id]?.sprites ?? [];
  const nomes = (tipo: TipoSprite) => [...new Set(lista.filter((s) => (s.tipo ?? 'pose') === tipo).map((s) => s.tags[0]!))];
  const quadros: Record<string, number> = {};
  for (const s of lista) if (ehPose(s) && s.variante) quadros[s.tags[0]!] = (quadros[s.tags[0]!] ?? 0) + 1;
  return { poses: nomes('pose'), rostos: nomes('rosto'), props: nomes('prop'), quadros };
}
/** Caixa da cabeça do sprite de frente (pose_parado) do personagem, se conhecida. */
export const caixaCabeca = (id: ActorId): RostoInfo['cabeca'] | undefined => (manifesto[id]?.sprites ?? []).find((s) => ehPose(s) && s.tags[0] === 'parado')?.rosto?.cabeca;
export const temPose = (id: ActorId, tag: string) => (manifesto[id]?.sprites ?? []).some((s) => ehPose(s) && s.tags.includes(tag));

/**
 * Escolhe o sprite da primeira etiqueta que o personagem tiver. Se a pose for uma animação (vários quadros),
 * devolve o quadro do instante t (8 quadros por segundo).
 */
export function escolherSprite(id: ActorId, tags: string[], t = 0): SpriteInfo | undefined {
  const lista = (manifesto[id]?.sprites ?? []).filter(ehPose);
  const achar = (tag: string) => {
    const quadros = lista.filter((s) => s.tags.includes(tag)).sort((a, b) => (a.variante ?? 0) - (b.variante ?? 0));
    if (quadros.length <= 1) return quadros[0];
    return quadros[Math.floor(Math.max(0, t) * QUADROS_POR_SEGUNDO) % quadros.length];
  };
  for (const tag of tags) { const s = achar(tag); if (s) return s; }
  return achar('parado') ?? lista[0];
}

/** Rosto pelo nome. Se houver quadros (rosto_nome_1, _2…), escolhe o do instante t (8 por segundo). */
function rostoSprite(id: ActorId, nome: string, t = 0): { info: SpriteInfo; img: HTMLCanvasElement } | null {
  const doNome = (manifesto[id]?.sprites ?? []).filter((s) => s.tipo === 'rosto' && s.tags[0] === nome);
  const quadros = doNome.filter((s) => s.variante).sort((a, b) => a.variante! - b.variante!);
  const info = quadros.length ? quadros[Math.floor(Math.max(0, t) * QUADROS_POR_SEGUNDO) % quadros.length] : doNome[0];
  const img = info && imagens.get(info.arquivo);
  return info && img ? { info, img } : null;
}

// ---------------------------------------------------------------- geometria e desenho do ator

export interface CalculoAtor {
  sprite: SpriteInfo;
  /** px do palco por px do sprite */
  k: number;
  x: number;
  /** y do pé (ou da base) do sprite, antes do movimento */
  base: number;
  alturaPx: number;
  tr: Transformacao;
  espelhado: boolean;
  /** caixa da cabeça em px do palco — usada pelo [close no personagem] e pelo balão */
  cabeca: Rect;
}

/**
 * Posição, escala, sprite e movimento de um ator em sprites no instante t.
 * `rosto: true` troca por um sprite de frente (com caixa de cabeça) quando o atual não tem.
 */
export function calcularAtorSprite(a: AtorEstado, x: number, chao: number, escalaGlobal: number, t: number, opcoes: { pose?: PoseId; rosto?: boolean; falando?: boolean } = {}): CalculoAtor | null {
  if (!pronto || !manifesto[a.id]) return null;
  const parado = escolherSprite(a.id, ['parado'], t);
  if (!parado) return null;
  const k = (ATORES[a.id]!.altura * escalaGlobal) / parado.h;
  const alturaPx = parado.h * k;
  const pose = opcoes.pose ?? a.pose;
  const clipe = (a.clipe && !opcoes.pose ? acharClipe(a.id, a.clipe, 'chibi') : undefined) ?? clipeDaPose(pose, a.id, 'chibi');
  let tr = avaliarClipe(clipe, Math.max(0, t - a.poseDesde));
  if (a.etiqueta && !opcoes.pose) tr = { ...tr, tags: [a.etiqueta, ...tr.tags] }; // "faz a pose <nome>": sprite escolhido pelo nome
  if (opcoes.falando) tr = { ...tr, dy: tr.dy - 0.007 * Math.abs(Math.sin(t * 13)), sy: tr.sy * (1 + 0.008 * Math.sin(t * 13)), rot: tr.rot + 0.8 * Math.sin(t * 6.5) };
  let sprite = escolherSprite(a.id, tr.tags, t - a.poseDesde)!;
  if (opcoes.rosto && !sprite.rosto) sprite = parado;
  const base = sprite.ancora === 'topo' ? chao - (parado.h - sprite.h) * k : chao;
  const costas = sprite.tags.some((tg) => tg.startsWith('costas'));
  const espelhado = costas ? false : (a.facing === -1) !== tr.espelhar;
  const rc = sprite.rosto?.cabeca ?? { x: 0.12, y: 0, w: 0.76, h: 0.3 };
  const larg = sprite.w * k, alto = sprite.h * k;
  const fx = espelhado ? 1 - (rc.x + rc.w) : rc.x;
  const cabeca: Rect = { x: x - larg / 2 + fx * larg + tr.dx * alturaPx, y: base - alto + rc.y * alto + tr.dy * alturaPx, w: rc.w * larg, h: rc.h * alto };
  return { sprite, k, x, base, alturaPx, tr, espelhado, cabeca };
}

export interface OpcoesSprite { alpha: number; selecionado?: boolean; visema: Visema | null; piscar: boolean; t: number; rosto?: boolean; falando?: boolean }

/** Qual cabeça (rosto_*) entra por cima do corpo: fonema > piscada > expressão atual. */
function escolherRosto(a: AtorEstado, op: OpcoesSprite): { info: SpriteInfo; img: HTMLCanvasElement } | null {
  if (op.visema) { const r = rostoSprite(a.id, `boca-${op.visema}`); if (r) return r; }
  if (op.piscar) { const r = rostoSprite(a.id, 'olhos-fechados'); if (r) return r; }
  return a.expressao !== 'neutra' ? rostoSprite(a.id, a.expressao, op.t) : null;
}

function desenharImagem(ctx: CanvasRenderingContext2D, c: CalculoAtor, alpha: number, rosto: { info?: SpriteInfo; img: HTMLCanvasElement } | null) {
  const img = imagens.get(c.sprite.arquivo);
  if (!img) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(c.x + c.tr.dx * c.alturaPx, c.base + c.tr.dy * c.alturaPx);
  ctx.rotate((c.tr.rot * Math.PI) / 180);
  ctx.scale(c.tr.sx * (c.espelhado ? -1 : 1), c.tr.sy);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  const W = c.sprite.w * c.k, H = c.sprite.h * c.k;
  ctx.drawImage(img, -W / 2, -H, W, H);
  if (rosto && c.sprite.rosto) {
    // a cabeça do rosto_* entra por cima da cabeça do corpo, na caixa de cabeça do sprite
    const e = rosto.info?.encaixe;
    if (e) {
      // encaixe medido por sobreposição de silhuetas (tools/montar-biblioteca.mjs): posição e escala exatas sobre o pose_parado
      const s = (W / c.sprite.w) * e.escala;
      ctx.drawImage(rosto.img, -W / 2 + e.x * (W / c.sprite.w), -H + e.y * (H / c.sprite.h), rosto.img.width * s, rosto.img.height * s);
      ctx.restore();
      return;
    }
    const b = c.sprite.rosto.cabeca;
    const bw = b.w * W, bh = b.h * H, cx = -W / 2 + (b.x + b.w / 2) * W, cy = -H + (b.y + b.h / 2) * H;
    const f = Math.min(bw / rosto.img.width, bh / rosto.img.height) * 1.0;
    ctx.drawImage(rosto.img, cx - (rosto.img.width * f) / 2, cy - (rosto.img.height * f) / 2, rosto.img.width * f, rosto.img.height * f);
  }
  ctx.restore();
}

/** Desenha o ator em sprites: sombra, cruzamento suave entre poses, movimento do clipe e a cabeça certa (fala, piscada, expressão). */
export function desenharAtorSprite(ctx: CanvasRenderingContext2D, a: AtorEstado, x: number, chao: number, escalaGlobal: number, op: OpcoesSprite): CalculoAtor | null {
  const c = calcularAtorSprite(a, x, chao, escalaGlobal, op.t, { rosto: op.rosto, falando: op.falando });
  if (!c) return null;
  // sombra suave no chão (cinza), sem acompanhar o pulo
  ctx.save();
  ctx.globalAlpha *= op.alpha * 0.22; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(c.x, chao + 4, c.alturaPx * 0.2, c.alturaPx * 0.025, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  const rosto = escolherRosto(a, op);
  const faseTroca = (op.t - a.poseDesde) / 0.16;
  if (faseTroca < 1 && a.poseDe !== a.pose) {
    const ant = calcularAtorSprite(a, x, chao, escalaGlobal, op.t, { pose: a.poseDe, rosto: op.rosto });
    if (ant && ant.sprite.arquivo !== c.sprite.arquivo) {
      desenharImagem(ctx, ant, op.alpha * (1 - Math.max(0, faseTroca)), null);
      desenharImagem(ctx, c, op.alpha * Math.max(0, faseTroca), rosto);
      return c;
    }
  }
  desenharImagem(ctx, c, op.alpha, rosto);
  if (op.selecionado) {
    ctx.save();
    ctx.globalAlpha *= op.alpha;
    ctx.strokeStyle = '#2d9cff'; ctx.lineWidth = 3; ctx.setLineDash([10, 8]);
    const w = c.sprite.w * c.k, h = c.sprite.h * c.k;
    ctx.strokeRect(c.x - w / 2, c.base - h, w, h + 8);
    ctx.restore();
  }
  return c;
}

/** Miniatura quadrada de um sprite (biblioteca). `rosto` recorta a cabeça. */
export function desenharSpriteNaCaixa(ctx: CanvasRenderingContext2D, id: ActorId, tags: string[], tam: number, recorteRosto = false): boolean {
  if (!pronto) return false;
  const s = escolherSprite(id, tags);
  const img = s && imagens.get(s.arquivo);
  if (!s || !img) return false;
  ctx.clearRect(0, 0, tam, tam);
  ctx.imageSmoothingQuality = 'high';
  if (recorteRosto) {
    const r = s.rosto?.cabeca ?? { x: 0.1, y: 0, w: 0.8, h: 0.3 };
    const sx = r.x * s.w, sy = r.y * s.h, sw = r.w * s.w, sh = r.h * s.h;
    const k = (tam * 0.92) / Math.max(sw, sh);
    ctx.drawImage(img, sx, sy, sw, sh, (tam - sw * k) / 2, (tam - sh * k) / 2, sw * k, sh * k);
  } else {
    const k = Math.min((tam * 0.94) / s.w, (tam * 0.94) / s.h);
    ctx.drawImage(img, (tam - s.w * k) / 2, tam - s.h * k - tam * 0.02, s.w * k, s.h * k);
  }
  return true;
}

/** Miniatura de um rosto_* (cabeça) ou, se não houver, do sprite pedido. */
export function desenharRostoNaCaixa(ctx: CanvasRenderingContext2D, id: ActorId, nome: string, tam: number): boolean {
  const r = rostoSprite(id, nome);
  if (!r) return false;
  ctx.clearRect(0, 0, tam, tam);
  ctx.imageSmoothingQuality = 'high';
  const k = (tam * 0.92) / Math.max(r.img.width, r.img.height);
  ctx.drawImage(r.img, (tam - r.img.width * k) / 2, (tam - r.img.height * k) / 2, r.img.width * k, r.img.height * k);
  return true;
}




