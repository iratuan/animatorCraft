import type { StateCreator } from 'zustand';
import type { ActorId } from '@shared/domain';

const consulta = new URLSearchParams(typeof location === 'undefined' ? '' : location.search);

export type AbaLateral = 'props' | 'biblioteca' | 'imagens' | 'audio' | 'aula';

export interface UiState {
  selecionado: ActorId | null;
  aba: AbaLateral;
  menuAberto: string | null;
  exportando: number | null;
  mensagem: string;
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
  /** pedido de um texto ao usuário (ex.: nome ao salvar o projeto); feito por `pedirTexto`, dentro do app */
  pedidoTexto: { titulo: string; valor: string } | null;
  /** frases com erro que a exportação encontrou; a resposta do usuário vai por `confirmarExportacao` */
  pedidoExportacao: { erros: { mensagem: string; ini: number; fim: number }[] } | null;
}

export type UiSlice = UiState;

export const createUiSlice: StateCreator<any, [], [], UiSlice> = () => ({
  selecionado: (consulta.get('ator') as ActorId | null) ?? 'cringefather',
  aba: 'props',
  menuAberto: null,
  exportando: null,
  mensagem: 'Carregando personagens…',
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
  pedidoTexto: null,
  pedidoExportacao: null,
});
