import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import { agendaDeAudio, estadoEm, type Timeline } from '@shared/domain';
import { mixarParaExportacao } from '@renderer/features/audio';
import { renderizarCena } from '@renderer/features/cena';

/**
 * Codificadores em ordem de preferência: H.264 High → Main → Baseline (compatível com YouTube/Instagram), depois VP9.
 * Cada aparelho suporta um subconjunto (o emulador Android, por exemplo, só aceita Main), então testamos um a um.
 */
const CANDIDATOS: { codec: string; codecMuxer: 'avc' | 'vp9' }[] = [
  { codec: 'avc1.640032', codecMuxer: 'avc' }, { codec: 'avc1.64002a', codecMuxer: 'avc' }, { codec: 'avc1.640028', codecMuxer: 'avc' },
  { codec: 'avc1.4d0032', codecMuxer: 'avc' }, { codec: 'avc1.4d002a', codecMuxer: 'avc' }, { codec: 'avc1.4d0028', codecMuxer: 'avc' },
  { codec: 'avc1.42002a', codecMuxer: 'avc' }, { codec: 'avc1.420028', codecMuxer: 'avc' },
  { codec: 'vp09.00.10.08', codecMuxer: 'vp9' },
];

export async function escolherCodec(w: number, h: number, fps: number): Promise<{ config: VideoEncoderConfig; codecMuxer: 'avc' | 'vp9' }> {
  for (const c of CANDIDATOS) {
    const config: VideoEncoderConfig = { codec: c.codec, width: w, height: h, bitrate: 8_000_000, framerate: fps, ...(c.codecMuxer === 'avc' ? { avc: { format: 'avc' as const } } : {}) };
    try {
      if ((await VideoEncoder.isConfigSupported(config)).supported) return { config, codecMuxer: c.codecMuxer };
    } catch { /* tenta o próximo */ }
  }
  throw new Error(`Este aparelho não consegue codificar vídeo em ${w}×${h}.`);
}

/** AAC (aceito por YouTube/Instagram) e, onde faltar, Opus. */
async function escolherCodecAudio(): Promise<{ config: AudioEncoderConfig; codecMuxer: 'aac' | 'opus' } | null> {
  if (typeof AudioEncoder === 'undefined') return null;
  for (const c of [{ codec: 'mp4a.40.2', m: 'aac' as const }, { codec: 'opus', m: 'opus' as const }]) {
    const config: AudioEncoderConfig = { codec: c.codec, sampleRate: 48000, numberOfChannels: 2, bitrate: 160_000 };
    try { if ((await AudioEncoder.isConfigSupported(config)).supported) return { config, codecMuxer: c.m }; } catch { /* tenta o próximo */ }
  }
  return null;
}

/** Limite de duração: o MP4 é montado na memória (8 Mbps ≈ 60 MB por minuto), então vídeos muito longos precisam ser divididos em partes. */
export const LIMITE_SEGUNDOS_EXPORTACAO = 15 * 60;

export interface OpcoesExport { w: number; h: number; fps: number; onProgresso?: (p: number) => void; sinal?: { cancelado: boolean }; avisos?: (m: string) => void }

/** Renderiza cada frame com a mesma função do preview e codifica em H.264/MP4 (WebCodecs). */
export async function exportarMp4(tl: Timeline, op: OpcoesExport): Promise<Blob> {
  const { w, h, fps } = op;
  if (!(tl.duracao > 0)) throw new Error('O roteiro está vazio: não há nada para exportar.');
  if (tl.duracao > LIMITE_SEGUNDOS_EXPORTACAO) throw new Error(`O vídeo tem ${Math.round(tl.duracao / 60)} minutos e o limite é ${LIMITE_SEGUNDOS_EXPORTACAO / 60}. Divida o roteiro em partes (uma por aula ou cena).`);
  const { config, codecMuxer } = await escolherCodec(w, h, fps);

  // áudio: mistura a trilha inteira antes (voz, música e efeitos) e, se o aparelho codifica áudio, vai junto no MP4
  const agenda = agendaDeAudio(tl);
  const mix = agenda.length ? await mixarParaExportacao(agenda, tl.duracao + 0.5) : null;
  const ca = mix ? await escolherCodecAudio() : null;
  op.avisos?.(agenda.length && !ca ? 'Este aparelho não codifica áudio: o vídeo sai sem som.' : '');

  const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: codecMuxer, width: w, height: h }, ...(ca ? { audio: { codec: ca.codecMuxer, numberOfChannels: 2, sampleRate: 48000 } } : {}), fastStart: 'in-memory' });
  let erro: Error | null = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => { erro = e as Error; },
  });
  encoder.configure(config);
  const fechar = () => { try { if (encoder.state !== 'closed') encoder.close(); } catch { /* já fechado */ } };

  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const total = Math.max(1, Math.ceil((tl.duracao + 0.5) * fps));

  try {
  for (let i = 0; i < total; i++) {
    if (op.sinal?.cancelado) throw new Error('Exportação cancelada.');
    if (erro) throw erro;
    renderizarCena(ctx, estadoEm(tl, i / fps), w, h);
    const frame = new VideoFrame(canvas, { timestamp: Math.round((i * 1e6) / fps), duration: Math.round(1e6 / fps) });
    encoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
    frame.close();
    while (encoder.encodeQueueSize > 6) await new Promise((r) => setTimeout(r, 2));
    if (i % 10 === 0) { op.onProgresso?.(i / total); await new Promise((r) => setTimeout(r, 0)); }
  }
  await encoder.flush();
  if (erro) throw erro;
  } catch (e) { fechar(); throw e; } // um erro no meio (cena, memória, codificador) não pode deixar o codificador aberto
  fechar();
  if (mix && ca) await codificarAudio(mix, ca.config, (chunk, meta) => muxer.addAudioChunk(chunk, meta));
  muxer.finalize();
  op.onProgresso?.(1);
  return new Blob([muxer.target.buffer], { type: 'video/mp4' });
}

async function codificarAudio(mix: AudioBuffer, config: AudioEncoderConfig, saida: (c: EncodedAudioChunk, m?: EncodedAudioChunkMetadata) => void): Promise<void> {
  let erro: Error | null = null;
  const enc = new AudioEncoder({ output: saida, error: (e) => { erro = e as Error; } });
  enc.configure(config);
  const L = mix.getChannelData(0), R = mix.numberOfChannels > 1 ? mix.getChannelData(1) : L;
  const bloco = 4800; // 0,1 s
  for (let i = 0; i < mix.length; i += bloco) {
    const n = Math.min(bloco, mix.length - i);
    const dados = new Float32Array(n * 2); // planar: canal esquerdo, depois direito
    dados.set(L.subarray(i, i + n), 0); dados.set(R.subarray(i, i + n), n);
    const ad = new AudioData({ format: 'f32-planar', sampleRate: mix.sampleRate, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round((i / mix.sampleRate) * 1e6), data: dados });
    enc.encode(ad); ad.close();
    while (enc.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 2));
  }
  await enc.flush();
  if (erro) throw erro;
}
