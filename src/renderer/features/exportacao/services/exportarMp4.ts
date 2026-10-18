import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import { estadoEm, type Timeline } from '@shared/domain';
import { renderizarCena } from '@renderer/features/palco/render';

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

export interface OpcoesExport { w: number; h: number; fps: number; onProgresso?: (p: number) => void; sinal?: { cancelado: boolean } }

/** Renderiza cada frame com a mesma função do preview e codifica em H.264/MP4 (WebCodecs). */
export async function exportarMp4(tl: Timeline, op: OpcoesExport): Promise<Blob> {
  const { w, h, fps } = op;
  const { config, codecMuxer } = await escolherCodec(w, h, fps);

  const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: codecMuxer, width: w, height: h }, fastStart: 'in-memory' });
  let erro: Error | null = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => { erro = e as Error; },
  });
  encoder.configure(config);

  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const total = Math.max(1, Math.ceil((tl.duracao + 0.5) * fps));

  for (let i = 0; i < total; i++) {
    if (op.sinal?.cancelado) { encoder.close(); throw new Error('Exportação cancelada.'); }
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
  muxer.finalize();
  op.onProgresso?.(1);
  return new Blob([muxer.target.buffer], { type: 'video/mp4' });
}
