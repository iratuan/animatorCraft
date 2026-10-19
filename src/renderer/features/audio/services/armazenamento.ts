import { calcularEnvelope, chaveAudio, listarAudios, registrarAudio, removerAudio, type InfoAudio } from '@shared/domain';
import { criarLoja } from '@renderer/features/sistema';

/**
 * Biblioteca de áudios (narração, música, efeitos): os arquivos ficam no navegador/app (IndexedDB), o domínio só vê nome,
 * duração e envelope de volume. O mesmo nome usado em [áudio: nome.wav] no roteiro aponta para cá.
 */
interface Registro { nome: string; mime: string; dados: ArrayBuffer; duracao: number; envelope: number[] }
const loja = criarLoja<Registro>('stickboard-audio', 'audios', { keyPath: 'nome' });

let ctxDecodificacao: AudioContext | null = null;
export const contextoDeAudio = (): AudioContext => (ctxDecodificacao ??= new AudioContext());
const cacheBuffers = new Map<string, AudioBuffer>();

/** Lê o arquivo, descobre a duração, calcula o envelope de volume e guarda. Devolve as informações para o roteiro. */
export async function importarAudio(arquivo: File): Promise<InfoAudio> {
  const dados = await arquivo.arrayBuffer();
  const buffer = await contextoDeAudio().decodeAudioData(dados.slice(0));
  const mono = new Float32Array(buffer.length);
  for (let c = 0; c < buffer.numberOfChannels; c++) { const d = buffer.getChannelData(c); for (let i = 0; i < d.length; i++) mono[i]! += d[i]! / buffer.numberOfChannels; }
  const info: InfoAudio = { nome: arquivo.name, duracao: buffer.duration, envelope: calcularEnvelope(mono, buffer.sampleRate) };
  for (const antigo of listarAudios().filter((x) => chaveAudio(x.nome) === chaveAudio(info.nome) && x.nome !== info.nome)) await excluirAudio(antigo.nome); // mesmo nome com outra caixa: o novo substitui o antigo
  registrarAudio(info);
  await loja.guardar({ nome: info.nome, mime: arquivo.type, dados, duracao: info.duracao, envelope: info.envelope ?? [] }).catch(() => { /* sem IndexedDB: o áudio vale só nesta sessão */ });
  cacheBuffers.set(info.nome.toLowerCase(), buffer);
  return info;
}

/** Ao abrir o app: devolve ao domínio as durações e os envelopes dos áudios já importados. */
export async function carregarAudiosSalvos(): Promise<number> {
  try {
    const todos = await loja.todos();
    for (const r of todos) registrarAudio({ nome: r.nome, duracao: r.duracao, envelope: r.envelope });
    return todos.length;
  } catch { return 0; }
}

export async function excluirAudio(nome: string): Promise<void> {
  removerAudio(nome); cacheBuffers.delete(nome.toLowerCase());
  await loja.remover(nome).catch(() => { /* nada guardado */ });
}

/** AudioBuffer pronto para tocar/mixar (decodificado uma vez só). */
export async function bufferDoAudio(nome: string, ctx: BaseAudioContext = contextoDeAudio()): Promise<AudioBuffer | null> {
  const chave = nome.toLowerCase();
  const pronto = cacheBuffers.get(chave);
  if (pronto && pronto.sampleRate === ctx.sampleRate) return pronto;
  try {
    const real = listarAudios().map((a) => a.nome).find((n) => n.toLowerCase() === chave) ?? nome;
    const r = await loja.obter(real);
    if (!r) return null;
    const b = await ctx.decodeAudioData(r.dados.slice(0));
    if (ctx === ctxDecodificacao) cacheBuffers.set(chave, b);
    return b;
  } catch { return null; }
}

/** Bytes originais do arquivo importado (para guardar no projeto). */
export async function bufferBrutoDoAudio(nome: string): Promise<Uint8Array | null> {
  try { const r = await loja.obter(nome); return r ? new Uint8Array(r.dados) : null; } catch { return null; }
}
