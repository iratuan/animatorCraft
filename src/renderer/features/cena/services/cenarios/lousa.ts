import type { CenarioStrategy, LayoutCena } from './tipos';

export const cenarioLousa: CenarioStrategy = {
  id: 'lousa',
  temLousa: true,
  desenharFundo(_ctx: CanvasRenderingContext2D, _L: LayoutCena): void {
    // Cenário padrão da aula com lousa não tem fundo especial além do chão
  },
};

export const cenarioNeutro: CenarioStrategy = {
  id: 'neutro',
  temLousa: false,
  desenharFundo(_ctx: CanvasRenderingContext2D, _L: LayoutCena): void {
    // Cenário neutro (fundo branco / transparente limpo)
  },
};
