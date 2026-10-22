import type { StateCreator } from 'zustand';
import type { ActorId } from '@shared/domain';
import type { PacoteLido } from '@renderer/features/personagens';

const consulta = new URLSearchParams(typeof location === 'undefined' ? '' : location.search);

export type AbaLateral = 'props' | 'biblioteca' | 'imagens' | 'audio' | 'aula';
export interface ImportacaoPendente { pacote: PacoteLido; substituir: boolean; nome: string }

export interface UiState {
  selecionado: ActorId | null;
  aba: AbaLateral;
  menuAberto: string | null;
  exportando: number | null;
  mensagem: string;
  importacao: ImportacaoPendente | null;
  editorPersonagem: ActorId | null;
  editorAnimacao: { ator: ActorId; aba?: 'expressoes' | 'clipes' } | null;
  editorImagem: { personagem: ActorId; tipo: 'pose' | 'rosto' | 'prop'; nome: string } | null;
  fichaPersonagem: { id?: ActorId; duplicarDe?: ActorId } | null;
  manualAberto: boolean;
  manualSecao: string | null;
  iaAberta: boolean;
  promptMestreAberto: boolean;
  editorMatematicaAberto: boolean;
  abaMatematicaInicial: 'latex' | 'grafico';
  arrastoPalco: { id: ActorId; x: number } | null;
  confirmarFecharProjetoAberto: boolean;
}

export type UiSlice = UiState;

export const createUiSlice: StateCreator<any, [], [], UiSlice> = () => ({
  selecionado: (consulta.get('ator') as ActorId | null) ?? 'cringefather',
  aba: 'props',
  menuAberto: null,
  exportando: null,
  mensagem: 'Carregando personagens…',
  importacao: null,
  editorPersonagem: null,
  editorAnimacao: null,
  editorImagem: null,
  fichaPersonagem: null,
  manualAberto: false,
  manualSecao: null,
  iaAberta: false,
  promptMestreAberto: false,
  editorMatematicaAberto: false,
  abaMatematicaInicial: 'latex',
  arrastoPalco: null,
  confirmarFecharProjetoAberto: false,
});
