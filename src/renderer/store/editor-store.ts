import { create } from 'zustand';
import { gravarJson, gravarTexto } from '@renderer/features/sistema';
import { createProjetoSlice, type ProjetoSlice, type AcaoInicial } from './slices/projetoSlice';
import { createReproducaoSlice, type ReproducaoSlice } from './slices/reproducaoSlice';
import { createUiSlice, type UiSlice, type AbaLateral, type ImportacaoPendente } from './slices/uiSlice';
import { createMidiaSlice, type MidiaSlice } from './slices/midiaSlice';

export type { AbaLateral, AcaoInicial, ImportacaoPendente };

export type EditorStore = ProjetoSlice & ReproducaoSlice & UiSlice & MidiaSlice & {
  set: (parcial: Partial<EditorStore>) => void;
};

/**
 * Loja central da aplicação arquitetada com Store Slices (Clean Architecture / Zustand).
 * Divide responsabilidades entre Projeto/Roteiro, Reprodução/Timeline, UI/Modais e Mídia/Trilhas,
 * preservando a mesma API pública consolidada `useEditor`.
 */
export const useEditor = create<EditorStore>()((set, get, api) => ({
  ...createProjetoSlice(set, get, api),
  ...createReproducaoSlice(set, get, api),
  ...createUiSlice(set, get, api),
  ...createMidiaSlice(set, get, api),

  set: (parcial) => set((s) => ({
    ...parcial,
    modificado: parcial.modificado !== undefined
      ? parcial.modificado
      : (parcial.roteiro !== undefined || parcial.skins !== undefined || parcial.trilhas !== undefined || parcial.formato !== undefined ? true : s.modificado),
  })),
}));

// persistência leve do que o usuário configura (o roteiro e as preferências de fonte)
useEditor.subscribe((s, anterior) => {
  if (s.roteiro !== anterior.roteiro) gravarTexto('stickboard.roteiro.v2', s.roteiro);
  if (s.fonteLousa !== anterior.fonteLousa) gravarTexto('stickboard.fonte.lousa', s.fonteLousa);
  if (s.trilhas !== anterior.trilhas) gravarJson('stickboard.trilhas.v1', s.trilhas);
  if (s.fonteFala !== anterior.fonteFala) gravarTexto('stickboard.fonte.fala', s.fonteFala);
});

// ---------------------------------------------------------------- desfazer / refazer do roteiro
// Toda edição do roteiro (digitar, arrastar na timeline ou no palco, inserir da biblioteca) entra no histórico.
// Digitação rápida (menos de 0,8 s entre alterações) vira um passo só.
const passado: string[] = [];
const futuro: string[] = [];
let aplicando = false;
let ultimaEdicao = 0;

useEditor.subscribe((s, anterior) => {
  if (aplicando || s.roteiro === anterior.roteiro) return;
  const agora = Date.now();
  if (agora - ultimaEdicao > 800 || passado.length === 0) { passado.push(anterior.roteiro); if (passado.length > 300) passado.shift(); }
  ultimaEdicao = agora;
  futuro.length = 0;
});

const aplicar = (texto: string) => { aplicando = true; useEditor.setState({ roteiro: texto }); aplicando = false; ultimaEdicao = 0; };
export const podeDesfazer = () => passado.length > 0;
export const podeRefazer = () => futuro.length > 0;
export function limparHistorico(): void {
  passado.length = 0;
  futuro.length = 0;
  ultimaEdicao = 0;
}

export function desfazer(): boolean {
  const antes = passado.pop();
  if (antes === undefined) return false;
  futuro.push(useEditor.getState().roteiro);
  aplicar(antes);
  return true;
}
export function refazer(): boolean {
  const depois = futuro.pop();
  if (depois === undefined) return false;
  passado.push(useEditor.getState().roteiro);
  aplicar(depois);
  return true;
}
