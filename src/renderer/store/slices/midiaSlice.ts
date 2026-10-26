import type { StateCreator } from 'zustand';
import { TRILHA_PADRAO, sanearTrilhas, type EstadoTrilha } from '@shared/domain';
import { lerJson, lerTexto } from '@renderer/features/sistema';

export interface MidiaState {
  spritesOk: boolean;
  versaoBib: number;
  fontesOk: boolean;
  fonteLousa: string;
  fonteFala: string;
  versaoAudio: number;
  trilhas: Record<string, EstadoTrilha>;
  versaoImagens: number;
  versaoPersonagens: number;
}

export interface MidiaActions {
  definirTrilha: (id: string, parcial: Partial<EstadoTrilha>) => void;
  novaVersaoBib: () => void;
  novaVersaoPersonagens: () => void;
  novaVersaoAudio: () => void;
  novaVersaoImagens: () => void;
}

export type MidiaSlice = MidiaState & MidiaActions;

export const createMidiaSlice: StateCreator<any, [], [], MidiaSlice> = (set) => ({
  spritesOk: false,
  versaoBib: 0,
  fontesOk: false,
  fonteLousa: lerTexto('stickboard.fonte.lousa', 'comic'),
  fonteFala: lerTexto('stickboard.fonte.fala', 'comic'),
  versaoAudio: 0,
  trilhas: sanearTrilhas(lerJson('stickboard.trilhas.v1', {})),
  versaoImagens: 0,
  versaoPersonagens: 0,

  definirTrilha: (id, parcial) => set((s: any) => ({
    trilhas: { ...s.trilhas, [id]: { ...TRILHA_PADRAO, ...s.trilhas[id], ...parcial } },
  })),

  novaVersaoBib: () => set((s: any) => ({ versaoBib: s.versaoBib + 1 })),
  novaVersaoAudio: () => set((s: any) => ({ versaoAudio: s.versaoAudio + 1 })),
  novaVersaoImagens: () => set((s: any) => ({ versaoImagens: s.versaoImagens + 1, versaoBib: s.versaoBib + 1 })),
  novaVersaoPersonagens: () => set((s: any) => ({ versaoPersonagens: s.versaoPersonagens + 1, versaoBib: s.versaoBib + 1 })),
});
