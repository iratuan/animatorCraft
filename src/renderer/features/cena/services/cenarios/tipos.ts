import type { ActorId, Estado } from '@shared/domain';

export interface LayoutCena {
  w: number;
  h: number;
  vertical: boolean;
  quadro: { x: number; y: number; w: number; h: number };
  chao: number;
  escalaAtor: number;
}

export interface CenarioRenderContext {
  visiveis: ActorId[];
  estado: Estado;
  w: number;
  escalaG: number;
  vis: {
    cenario: number;
    lousa: number;
    balao: number;
    atores: Record<string, number>;
  };
}

/**
 * Strategy Pattern: cada cenário (podcast, telejornal, debate, papo livre, lousa)
 * encapsula seu fundo, móveis de primeiro plano e decorações, eliminando escadas de if/else.
 */
export interface CenarioStrategy {
  id: string;
  temLousa: boolean;
  desenharFundo(ctx: CanvasRenderingContext2D, L: LayoutCena): void;
  desenharAtras?(ctx: CanvasRenderingContext2D, L: LayoutCena, rc: CenarioRenderContext): void;
  desenharFrente?(ctx: CanvasRenderingContext2D, L: LayoutCena, rc: CenarioRenderContext): void;
}
