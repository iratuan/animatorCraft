import { unzipSync } from 'fflate';
import { analisarPacote, ATORES, EXPRESSOES, ORDEM_ATORES, registrarAtor, type NovoAtor, POSES_CONHECIDAS, type ActorId, type RelatorioPacote } from '@shared/domain';
import { gravarFichas } from './fichas';
import { mesclarAnimacoes, type AnimacoesJson } from './animacoes';
import { salvarEntradas, type EntradaSalva } from './spritesSalvos';
import { caixaCabeca, registrarSprites, type SpriteInfo } from '@renderer/features/cena';

/** Importação de pacotes de sprites (.zip) seguindo o padrão de nomes de docs/SPRITES.md. */
export interface PacoteLido {
  /** personagens descritos no zip (<id>/ficha.json) que ainda não existem no app; são criados ao importar */
  fichas: Record<string, NovoAtor>;
  relatorio: RelatorioPacote;
  /** expressões do boneco e clipes de animação trazidos pelo zip (<id>/animacoes.json) */
  animacoes: AnimacoesJson;
  arquivos: Map<string, Uint8Array>;
  meta: Record<string, {
    cabeca?: { x: number; y: number; w: number; h: number };
    ancora?: Record<string, 'pes' | 'topo'>;
    /** onde cada rosto_* se encaixa no pose_parado (px) e o tamanho do pose_parado em que isso foi medido */
    encaixe?: Record<string, { x: number; y: number; escala: number }>;
    base?: { w: number; h: number };
  }>;
}

export function lerPacote(zip: Uint8Array, opcoes: { exigirParado?: boolean } = {}): PacoteLido {
  const arquivos = new Map<string, Uint8Array>(Object.entries(unzipSync(zip)));
  const fichas: Record<string, NovoAtor> = {};
  for (const [caminho, dados] of arquivos) {
    const m = /^([a-z0-9]+(?:-[a-z0-9]+)*)\/ficha\.json$/.exec(caminho);
    if (!m || ATORES[m[1]!]) continue;
    try { const j = JSON.parse(new TextDecoder().decode(dados)) as NovoAtor; if (j?.nome) fichas[m[1]!] = j; } catch { /* ficha ilegível: o personagem segue desconhecido */ }
  }
  const animacoes: AnimacoesJson = { clipes: [], expressoes: [] };
  for (const [caminho, dados] of arquivos) {
    const m = /^([a-z0-9]+(?:-[a-z0-9]+)*)\/animacoes\.json$/.exec(caminho);
    if (!m) continue;
    try {
      const j = JSON.parse(new TextDecoder().decode(dados)) as Partial<AnimacoesJson>;
      // o personagem é o da pasta, seja o que for que o arquivo diga
      for (const c of Array.isArray(j.clipes) ? j.clipes : []) animacoes.clipes.push({ ...c, ator: m[1]! });
      for (const e of Array.isArray(j.expressoes) ? j.expressoes : []) animacoes.expressoes.push({ ...e, ator: m[1]! });
    } catch { /* animacoes.json ilegível: o resto do pacote segue */ }
  }
  const relatorio = analisarPacote([...arquivos.keys()], { personagens: [...ORDEM_ATORES, ...Object.keys(fichas)], expressoes: [...EXPRESSOES], posesConhecidas: POSES_CONHECIDAS, exigirParado: opcoes.exigirParado });
  // um zip só com animacoes.json (personagem sem sprites) é válido
  if (animacoes.clipes.length || animacoes.expressoes.length) relatorio.erros = relatorio.erros.filter((e) => !e.startsWith('Nenhum sprite .png'));
  const meta: PacoteLido['meta'] = {};
  for (const [id, caminho] of Object.entries(relatorio.meta)) {
    try { meta[id] = JSON.parse(new TextDecoder().decode(arquivos.get(caminho))); }
    catch { relatorio.avisos.push(`${caminho}: meta.json inválido (JSON com erro) foi ignorado.`); }
  }
  return { fichas, relatorio, animacoes, arquivos, meta };
}

/** PNG → canvas pronto: remove o fundo branco se a imagem não tiver transparência e apara as bordas vazias. */
async function prepararImagem(bytes: Uint8Array, bruto = false): Promise<{ url: string; w: number; h: number }> {
  const bmp = await createImageBitmap(new Blob([bytes as BlobPart], { type: 'image/png' }));
  const lim = 1600, k = Math.min(1, lim / Math.max(bmp.width, bmp.height));
  const W = Math.max(1, Math.round(bmp.width * k)), H = Math.max(1, Math.round(bmp.height * k));
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d', { willReadFrequently: true })!;
  x.drawImage(bmp, 0, 0, W, H);
  // vindo do editor de imagem (bruto): a tela é exatamente a que o usuário desenhou, sem remover fundo nem aparar
  if (bruto) return { url: c.toDataURL('image/png'), w: W, h: H };
  const d = x.getImageData(0, 0, W, H), p = d.data;
  const temAlfa = [0, W - 1, (H - 1) * W, H * W - 1].some((i) => p[i * 4 + 3]! < 250);
  if (!temAlfa) { // sem transparência: o fundo branco ligado às bordas vira transparente
    const vis = new Uint8Array(W * H), fila: number[] = [];
    const branco = (i: number) => p[i * 4]! > 238 && p[i * 4 + 1]! > 238 && p[i * 4 + 2]! > 238;
    for (let i = 0; i < W; i++) fila.push(i, (H - 1) * W + i);
    for (let j = 0; j < H; j++) fila.push(j * W, j * W + W - 1);
    while (fila.length) {
      const q = fila.pop()!; if (vis[q] || !branco(q)) continue; vis[q] = 1;
      const qx = q % W, qy = (q / W) | 0;
      if (qx > 0) fila.push(q - 1); if (qx < W - 1) fila.push(q + 1); if (qy > 0) fila.push(q - W); if (qy < H - 1) fila.push(q + W);
    }
    for (let i = 0; i < W * H; i++) if (vis[i]) p[i * 4 + 3] = 0;
    x.putImageData(d, 0, 0);
  }
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) if (p[(yy * W + xx) * 4 + 3]! > 8) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
  if (x1 < 0) throw new Error('imagem totalmente transparente');
  const pad = 2, cw = x1 - x0 + 1 + pad * 2, ch = y1 - y0 + 1 + pad * 2;
  const o = document.createElement('canvas'); o.width = cw; o.height = ch;
  o.getContext('2d')!.drawImage(c, x0 - pad, y0 - pad, cw, ch, 0, 0, cw, ch);
  return { url: o.toDataURL('image/png'), w: cw, h: ch };
}



/** Aplica o pacote à biblioteca (e guarda no navegador para a próxima abertura). `substituir`: apaga os sprites antigos dos personagens do pacote. */
export async function aplicarPacote(p: PacoteLido, substituir: boolean, opcoes: { bruto?: boolean; encaixe?: SpriteInfo['encaixe'] } = {}): Promise<{ importados: number; falhas: string[] }> {
  const porPersonagem = new Map<string, EntradaSalva[]>();
  const falhas: string[] = [];
  for (const [id, ficha] of Object.entries(p.fichas)) {
    const r = registrarAtor(ficha);
    if ('erro' in r) falhas.push(`${id}: ${r.erro}`);
  }
  if (Object.keys(p.fichas).length) gravarFichas();
  if (p.animacoes.clipes.length || p.animacoes.expressoes.length) mesclarAnimacoes(p.animacoes);
  const tamanhoParado = new Map<string, { w: number; h: number }>();
  for (const s of p.relatorio.sprites) {
    try {
      const img = await prepararImagem(p.arquivos.get(s.caminho)!, opcoes.bruto);
      const meta = p.meta[s.personagem];
      if (s.tipo === 'pose' && s.nome === 'parado') tamanhoParado.set(s.personagem, { w: img.w, h: img.h });
      const ehParado = s.tipo === 'pose' && s.nome === 'parado' && (s.variante === null || s.variante === 1);
      const info: SpriteInfo = {
        arquivo: `pacote/${s.personagem}/${s.tipo}_${s.nome}${s.variante ? `_${s.variante}` : ''}.png`,
        w: img.w, h: img.h, tags: [s.nome], tipo: s.tipo, variante: s.variante,
        ancora: meta?.ancora?.[s.nome] ?? 'pes',
        ...(ehParado ? { rosto: { cabeca: meta?.cabeca ?? caixaCabeca(s.personagem as ActorId) ?? { x: 0.1, y: 0, w: 0.8, h: 0.3 } } } : {}),
      };
      porPersonagem.set(s.personagem, [...(porPersonagem.get(s.personagem) ?? []), { info, url: img.url, personagem: s.personagem }]);
    } catch (e) { falhas.push(`${s.caminho}: ${(e as Error).message}`); }
  }
  // o encaixe das cabeças só vale se o pose_parado continua do mesmo tamanho em que foi medido; senão cai no encaixe pela caixa da cabeça
  for (const [id, entradas] of porPersonagem) {
    const meta = p.meta[id], par = tamanhoParado.get(id);
    const valido = !!meta?.encaixe && !!meta.base && !!par && Math.abs(meta.base.w - par.w) <= 2 && Math.abs(meta.base.h - par.h) <= 2;
    for (const e of entradas) if (e.info.tipo === 'rosto' && valido) { const enc = meta!.encaixe![e.info.tags[0]!]; if (enc) e.info.encaixe = enc; }
  }
  // sprite editado no editor de imagem: a tela é a mesma de antes, então o encaixe da cabeça medido para ela continua valendo
  if (opcoes.encaixe) for (const entradas of porPersonagem.values()) for (const e of entradas) if (e.info.tipo === 'rosto') e.info.encaixe = opcoes.encaixe;
  let importados = 0;
  for (const [id, entradas] of porPersonagem) {
    await registrarSprites(id as ActorId, entradas, { substituir });
    await salvarEntradas(id, entradas, substituir);
    importados += entradas.length;
  }
  return { importados, falhas };
}



