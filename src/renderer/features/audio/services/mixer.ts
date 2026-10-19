import { ganhoDaTrilha, type ItemAudio } from '@shared/domain';
import { useEditor } from '@renderer/store/editor-store';
import { bufferDoAudio, contextoDeAudio } from './armazenamento';

let tocando: AudioBufferSourceNode[] = [];
/** um volume mestre por trilha: mudo, solo e volume mudam ao vivo, com a animação tocando */
let mestres = new Map<string, GainNode>();
const ganhoAtual = (trilha: string) => ganhoDaTrilha(useEditor.getState().trilhas, trilha);

export function pararAudio(): void {
  for (const s of tocando) { try { s.stop(); } catch { /* já parou */ } }
  tocando = []; mestres = new Map();
}

/** Aplica agora o mudo/solo/volume de cada trilha às que estão tocando. */
export function atualizarMixagemAoVivo(): void {
  for (const [trilha, g] of mestres) g.gain.value = ganhoAtual(trilha);
}

/** Agenda os itens que ainda têm o que tocar a partir do instante `t` da animação. A música de fundo repete até o fim e some em 1,5 s. */
export async function tocarAgenda(itens: ItemAudio[], t: number): Promise<{ inicioRelogio: number }> {
  pararAudio();
  const ctx = contextoDeAudio();
  if (ctx.state === 'suspended') await ctx.resume();
  const base = ctx.currentTime + 0.05;
  for (const it of itens) {
    if (it.fim <= t) continue;
    const buf = await bufferDoAudio(it.arquivo);
    if (!buf) continue;
    let mestre = mestres.get(it.trilha);
    if (!mestre) { mestre = ctx.createGain(); mestre.gain.value = ganhoAtual(it.trilha); mestre.connect(ctx.destination); mestres.set(it.trilha, mestre); }
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = it.papel === 'musica';
    const g = ctx.createGain();
    g.gain.value = it.volume;
    if (it.papel === 'musica') { g.gain.setValueAtTime(it.volume, base + Math.max(0, it.fim - 1.5 - t)); g.gain.linearRampToValueAtTime(0, base + Math.max(0, it.fim - t)); }
    src.connect(g).connect(mestre);
    const quando = base + Math.max(0, it.inicio - t), desloc = Math.max(0, t - it.inicio);
    src.start(quando, it.papel === 'musica' ? desloc % buf.duration : Math.min(desloc, Math.max(0, buf.duration - 0.01)));
    if (it.papel === 'musica') src.stop(base + Math.max(0, it.fim - t));
    tocando.push(src);
  }
  return { inicioRelogio: base };
}

/** Mistura todas as trilhas (com o volume, mudo e solo de cada uma) numa só faixa estéreo, do segundo 0 até `duracao`, para entrar no MP4. */
export async function mixarParaExportacao(itens: ItemAudio[], duracao: number, taxa = 48000): Promise<AudioBuffer | null> {
  const audiveis = itens.filter((it) => ganhoAtual(it.trilha) > 0);
  if (!audiveis.length) return null;
  const off = new OfflineAudioContext(2, Math.max(1, Math.ceil(duracao * taxa)), taxa);
  const mestresOff = new Map<string, GainNode>();
  let algum = false;
  for (const it of audiveis) {
    const buf = await bufferDoAudio(it.arquivo, off);
    if (!buf) continue;
    algum = true;
    let mestre = mestresOff.get(it.trilha);
    if (!mestre) { mestre = off.createGain(); mestre.gain.value = ganhoAtual(it.trilha); mestre.connect(off.destination); mestresOff.set(it.trilha, mestre); }
    const src = off.createBufferSource();
    src.buffer = buf; src.loop = it.papel === 'musica';
    const g = off.createGain();
    g.gain.value = it.volume;
    if (it.papel === 'musica') { g.gain.setValueAtTime(it.volume, Math.max(0, it.fim - 1.5)); g.gain.linearRampToValueAtTime(0, it.fim); }
    src.connect(g).connect(mestre);
    src.start(it.inicio);
    if (it.papel === 'musica') src.stop(it.fim);
  }
  return algum ? off.startRendering() : null;
}