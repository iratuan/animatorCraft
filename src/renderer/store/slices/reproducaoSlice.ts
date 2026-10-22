import type { StateCreator } from 'zustand';

const consulta = new URLSearchParams(typeof location === 'undefined' ? '' : location.search);

export interface ReproducaoState {
  t: number;
  tocando: boolean;
  repetir: boolean;
  zoom: number;
}

export interface ReproducaoActions {
  alternarReproducao: (duracao: number) => void;
}

export type ReproducaoSlice = ReproducaoState & ReproducaoActions;

export const createReproducaoSlice: StateCreator<any, [], [], ReproducaoSlice> = (set, get) => ({
  t: Number(consulta.get('t') ?? 0),
  tocando: false,
  repetir: false,
  zoom: 70,

  alternarReproducao: (duracao: number) => {
    const { tocando, t } = get();
    set({ t: !tocando && t >= duracao ? 0 : t, tocando: !tocando });
  },
});
