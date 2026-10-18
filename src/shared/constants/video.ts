/** Parâmetros do vídeo e do palco, usados pelo renderer e pelo processo principal. */
export type FormatoVideo = '16:9' | '9:16';

export const FORMATOS: Record<FormatoVideo, { w: number; h: number; nome: string; sufixo: string }> = {
  '16:9': { w: 1920, h: 1080, nome: 'YouTube 1920×1080', sufixo: 'video' },
  '9:16': { w: 1080, h: 1920, nome: 'Shorts / Reels 1080×1920', sufixo: 'short' },
};

export const FPS = 30;
export const NOME_APP = 'StickBoard';
