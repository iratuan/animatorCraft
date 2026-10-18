import { calcularEnvelope, listarAudios, registrarAudio, removerAudio, type InfoAudio } from '@shared/domain';

/**
 * Biblioteca de áudios (narração, música, efeitos): os arquivos ficam no navegador/app (IndexedDB), o domínio só vê nome,
 * duração e envelope de volume. O mesmo nome usado em [áudio: nome.wav] no roteiro aponta para cá.
 */
const BANCO = 'stickboard-audio', LOJA = 'audios';
interface Registro { nome: string; mime: string; dados: ArrayBuffer; duracao: number; envelope: number[] }

const abrir = (): Promise<IDBDatabase> => new Promise((ok, erro) => {
  const r = indexedDB.open(BANCO, 1);
  r.onupgradeneeded = () => r.result.createObjectStore(LOJA, { keyPath: 'nome' });
  r.onsuccess = () => ok(r.result);
  r.onerror = () => erro(r.error);
});
const pedir = <T,>(r: IDBRequest<T>) => new Promise<T>((ok, erro) => { r.onsuccess = () => ok(r.result); r.onerror = () => erro(r.error); });

let ctxDecodificacao: AudioContext | null = null;
export const contextoDeAudio = (): AudioContext => (ctxDecodificacao ??= new AudioContext());

/** Lê o arquivo, descobre a duração, calcula o envelope de volume e guarda. Devolve as informações para o roteiro. */
export async function importarAudio(arquivo: File): Promise<InfoAudio> {
  const dados = await arquivo.arrayBuffer();
  const buffer = await contextoDeAudio().decodeAudioData(dados.slice(0));
  const mono = new Float32Array(buffer.length);
  for (let c = 0; c < buffer.numberOfChannels; c++) { const d = buffer.getChannelData(c); for (let i = 0; i < d.length; i++) mono[i]! += d[i]! / buffer.numberOfChannels; }
  const info: InfoAudio = { nome: arquivo.name, duracao: buffer.duration, envelope: calcularEnvelope(mono, buffer.sampleRate) };
  registrarAudio(info);
  try {
    const db = await abrir();
    await pedir(db.transaction(LOJA, 'readwrite').objectStore(LOJA).put({ nome: info.nome, mime: arquivo.type, dados, duracao: info.duracao, envelope: info.envelope ?? [] } satisfies Registro));
    db.close();
  } catch { /* sem IndexedDB: o áudio vale só nesta sessão */ }
  cacheBuffers.set(info.nome.toLowerCase(), buffer);
  return info;
}

/** Ao abrir o app: devolve ao domínio as durações e os envelopes dos áudios já importados. */
export async function carregarAudiosSalvos(): Promise<number> {
  try {
    const db = await abrir();
    const todos = (await pedir(db.transaction(LOJA, 'readonly').objectStore(LOJA).getAll())) as Registro[];
    db.close();
    for (const r of todos) registrarAudio({ nome: r.nome, duracao: r.duracao, envelope: r.envelope });
    return todos.length;
  } catch { return 0; }
}

export async function excluirAudio(nome: string): Promise<void> {
  removerAudio(nome); cacheBuffers.delete(nome.toLowerCase());
  try { const db = await abrir(); await pedir(db.transaction(LOJA, 'readwrite').objectStore(LOJA).delete(nome)); db.close(); } catch { /* nada guardado */ }
}

const cacheBuffers = new Map<string, AudioBuffer>();

/** AudioBuffer pronto para tocar/mixar (decodificado uma vez só). */
export async function bufferDoAudio(nome: string, ctx: BaseAudioContext = contextoDeAudio()): Promise<AudioBuffer | null> {
  const chave = nome.toLowerCase();
  const pronto = cacheBuffers.get(chave);
  if (pronto && pronto.sampleRate === ctx.sampleRate) return pronto;
  try {
    const db = await abrir();
    const nomes = listarAudios().map((a) => a.nome);
    const real = nomes.find((n) => n.toLowerCase() === chave) ?? nome;
    const r = (await pedir(db.transaction(LOJA, 'readonly').objectStore(LOJA).get(real))) as Registro | undefined;
    db.close();
    if (!r) return null;
    const b = await ctx.decodeAudioData(r.dados.slice(0));
    if (ctx === ctxDecodificacao) cacheBuffers.set(chave, b);
    return b;
  } catch { return null; }
}


/** Bytes originais do arquivo importado (para guardar no projeto). */
export async function bufferBrutoDoAudio(nome: string): Promise<Uint8Array | null> {
  try {
    const db = await abrir();
    const r = (await pedir(db.transaction(LOJA, 'readonly').objectStore(LOJA).get(nome))) as Registro | undefined;
    db.close();
    return r ? new Uint8Array(r.dados) : null;
  } catch { return null; }
}
