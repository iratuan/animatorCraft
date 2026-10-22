import { type Skin } from '@renderer/features/cena';

/** No StickBoard unificado, o estilo é sempre Stickman. Mantido por retrocompatibilidade de tipos. */
export function useSkins() {
  return {
    padrao: 'stickman' as Skin,
    de: (_id: string): Skin => 'stickman',
    definirPadrao: (_s: Skin) => {},
    definir: (_id: string, _s: Skin) => {},
  };
}

/** Seletor de estilo descontinuado: o sistema agora é exclusivamente Stickman. */
export function SeletorSkin(_props?: unknown) {
  return null;
}
