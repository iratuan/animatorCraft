import type { Timeline } from './timeline';

/**
 * Áudio da aula: narração, música e efeitos importados pelo usuário.
 * O domínio só conhece nome, duração e envelope de volume (para a boca acompanhar a voz); os bytes ficam no renderer.
 */
export interface InfoAudio { nome: string; duracao: number; /** volume normalizado (0..1) a cada 1/ENVELOPE_HZ s */ envelope?: number[] }
export const ENVELOPE_HZ = 30;
/** Respiro depois da última palavra, para a fala seguinte não colar na anterior. */
export const FOLGA_FALA_AUDIO = 0.25;

const registro = new Map<string, InfoAudio>();
export const chaveAudio = (nome: string) => nome.trim().toLowerCase();

export function registrarAudio(info: InfoAudio): void { registro.set(chaveAudio(info.nome), info); }
export function removerAudio(nome: string): void { registro.delete(chaveAudio(nome)); }
export const infoDoAudio = (nome: string): InfoAudio | undefined => registro.get(chaveAudio(nome));
export const listarAudios = (): InfoAudio[] => [...registro.values()].sort((a, b) => a.nome.localeCompare(b.nome));

/** Envelope de volume (0..1, 30 por segundo) a partir de amostras mono. */
export function calcularEnvelope(amostras: Float32Array, taxa: number): number[] {
  const passo = Math.max(1, Math.round(taxa / ENVELOPE_HZ));
  const bruto: number[] = [];
  for (let i = 0; i < amostras.length; i += passo) {
    let s = 0; const fim = Math.min(amostras.length, i + passo);
    for (let k = i; k < fim; k++) s += amostras[k]! * amostras[k]!;
    bruto.push(Math.sqrt(s / Math.max(1, fim - i)));
  }
  const pico = Math.max(1e-6, ...bruto.slice().sort((a, b) => b - a).slice(0, Math.max(1, Math.floor(bruto.length * 0.02))));
  return bruto.map((v) => Math.min(1, v / pico));
}

/** Qual boca usar `t` segundos depois do início do áudio: fechada em silêncio, aberta (a) nos picos, e/o no meio. */
export function visemaDoAudio(envelope: number[], t: number): 'a' | 'e' | 'o' | 'm' {
  const i = Math.floor(t * ENVELOPE_HZ);
  const v = Math.max(envelope[i] ?? 0, envelope[i + 1] ?? 0);
  if (v < 0.1) return 'm';
  if (v > 0.55) return 'a';
  return Math.floor(t * ENVELOPE_HZ / 3) % 2 === 0 ? 'e' : 'o';
}

export interface ItemAudio { arquivo: string; inicio: number; fim: number; papel: 'voz' | 'musica' | 'efeito'; volume: number }

/** Linha do tempo → o que toca e quando (voz de cada fala com áudio, músicas até o "parar"/fim e efeitos). */
export function agendaDeAudio(tl: Timeline): ItemAudio[] {
  const itens: ItemAudio[] = [];
  const musicas: ItemAudio[] = [];
  for (const e of tl.eventos) {
    const a = e.acao;
    if (a.tipo === 'fala' && a.audio) {
      const d = infoDoAudio(a.audio)?.duracao ?? e.fim - e.inicio;
      itens.push({ arquivo: a.audio, inicio: e.inicio, fim: e.inicio + d, papel: 'voz', volume: 1 });
    } else if (a.tipo === 'audio') {
      if (a.parar) { for (const m of musicas) if (m.fim > e.inicio) m.fim = e.inicio; continue; }
      const d = infoDoAudio(a.arquivo)?.duracao ?? 0;
      if (a.papel === 'musica') {
        for (const m of musicas) if (m.fim > e.inicio) m.fim = e.inicio; // uma música por vez
        const item: ItemAudio = { arquivo: a.arquivo, inicio: e.inicio, fim: tl.duracao, papel: 'musica', volume: a.volume ?? 0.25 };
        musicas.push(item); itens.push(item);
      } else itens.push({ arquivo: a.arquivo, inicio: e.inicio, fim: e.inicio + d, papel: 'efeito', volume: a.volume ?? 0.8 });
    }
  }
  return itens;
}

const tempoSrt = (s: number) => { const ms = Math.round(s * 1000); const p = (n: number, l = 2) => String(n).padStart(l, '0'); return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`; };

/** Legendas (.srt) a partir das falas: cada balão vira uma legenda do começo ao fim da fala (ou do áudio). */
export function gerarSrt(tl: Timeline, nomeDe: (id: string) => string = (id) => id): string {
  const falas = tl.eventos.filter((e) => e.acao.tipo === 'fala');
  return falas.map((e, i) => {
    const a = e.acao as Extract<typeof e.acao, { tipo: 'fala' }>;
    const fim = a.audio && infoDoAudio(a.audio) ? e.inicio + infoDoAudio(a.audio)!.duracao : e.fim - 0.1;
    return `${i + 1}\n${tempoSrt(e.inicio)} --> ${tempoSrt(Math.max(e.inicio + 0.3, fim))}\n${nomeDe(a.ator)}: ${a.texto}\n`;
  }).join('\n');
}
