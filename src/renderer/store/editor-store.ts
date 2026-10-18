import { create } from 'zustand';
import { ATORES, type ActorId } from '@shared/domain';
import type { FormatoVideo } from '@shared/constants/video';
import type { EstiloEscrita, Skin } from '@renderer/features/palco/render';
import type { PacoteLido } from '@renderer/features/pacotes-sprites/services/pacotes';
import { ROTEIRO_EXEMPLO } from '@renderer/features/roteiro/services/exemplo';

const lerSalvo = (k: string, padrao: string) => { try { return localStorage.getItem(k) ?? padrao; } catch { return padrao; } };
const gravar = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* sem armazenamento */ } };
const consulta = new URLSearchParams(typeof location === 'undefined' ? '' : location.search);

export type AbaLateral = 'props' | 'biblioteca' | 'aula';
export interface ImportacaoPendente { pacote: PacoteLido; substituir: boolean; nome: string }

interface Estado {
  roteiro: string;
  formato: FormatoVideo;
  /** instante atual da animação, em segundos */
  t: number;
  tocando: boolean;
  repetir: boolean;
  selecionado: ActorId | null;
  aba: AbaLateral;
  zoom: number;
  menuAberto: string | null;
  /** progresso da exportação (0..1) ou null quando não está exportando */
  exportando: number | null;
  mensagem: string;
  spritesOk: boolean;
  /** muda a cada importação de pacote, para as miniaturas e o palco se redesenharem */
  versaoBib: number;
  fontesOk: boolean;
  fonteLousa: string;
  fonteFala: string;
  escrita: EstiloEscrita;
  importacao: ImportacaoPendente | null;
  /** personagem aberto no editor de sprites (modal) */
  editorPersonagem: ActorId | null;
  /** ficha de personagem aberta (novo, ou editar id, ou duplicar duplicarDe) */
  fichaPersonagem: { id?: ActorId; duplicarDe?: ActorId } | null;
  manualAberto: boolean;
  /** personagem sendo arrastado no palco e a posição provisória (0..1 da largura) */
  arrastoPalco: { id: ActorId; x: number } | null;
  /** muda quando a lista de personagens muda (o roteiro precisa ser interpretado de novo) */
  versaoPersonagens: number;
  skinPadrao: Skin;
  skins: Record<string, Skin>;
}

interface Acoes {
  set: (parcial: Partial<Estado>) => void;
  setRoteiro: (r: string) => void;
  /** acrescenta um trecho ao fim do roteiro (usado pelas ferramentas e pela biblioteca) */
  inserir: (trecho: string) => void;
  definirPapeis: (professor: ActorId, aluno: ActorId) => void;
  alternarReproducao: (duracao: number) => void;
  novaVersaoBib: () => void;
  novaVersaoPersonagens: () => void;
}

export const useEditor = create<Estado & Acoes>()((set, get) => ({
  roteiro: lerSalvo('stickboard.roteiro.v2', ROTEIRO_EXEMPLO),
  formato: '16:9',
  t: Number(consulta.get('t') ?? 0),
  tocando: false,
  repetir: false,
  selecionado: (consulta.get('ator') as ActorId | null) ?? 'cringefather',
  aba: 'props',
  zoom: 70,
  menuAberto: null,
  exportando: null,
  mensagem: 'Carregando personagens…',
  spritesOk: false,
  versaoBib: 0,
  fontesOk: false,
  fonteLousa: lerSalvo('stickboard.fonte.lousa', 'comic'),
  fonteFala: lerSalvo('stickboard.fonte.fala', 'comic'),
  escrita: lerSalvo('stickboard.escrita', 'revelar') as EstiloEscrita,
  importacao: null,
  editorPersonagem: null,
  fichaPersonagem: null,
  manualAberto: false,
  arrastoPalco: null,
  versaoPersonagens: 0,
  skinPadrao: 'chibi',
  skins: {},

  set: (parcial) => set(parcial),
  setRoteiro: (roteiro) => set({ roteiro }),
  inserir: (trecho) => set(({ roteiro }) => {
    const base = roteiro.trimEnd();
    const ultima = base.split('\n').pop() ?? '';
    const sep = base === '' ? '' : /^#/.test(ultima) ? '\n\n' : ' ';
    return { roteiro: `${base}${sep}${trecho}\n` };
  }),
  definirPapeis: (professor, aluno) => set(({ roteiro }) => {
    const linha = `[papéis: professor=${ATORES[professor]!.nome}, aluno=${ATORES[aluno]!.nome}]`;
    const sem = roteiro.replace(/^[ \t]*\[\s*pap[eé]is\s*:[^\]]*\][ \t]*\r?\n?/gim, '').replace(/^\s+/, '');
    return { roteiro: `${linha}\n\n${sem}`, t: 0 };
  }),
  alternarReproducao: (duracao) => {
    const { tocando, t } = get();
    set({ t: !tocando && t >= duracao ? 0 : t, tocando: !tocando });
  },
  novaVersaoBib: () => set((s) => ({ versaoBib: s.versaoBib + 1 })),
  novaVersaoPersonagens: () => set((s) => ({ versaoPersonagens: s.versaoPersonagens + 1, versaoBib: s.versaoBib + 1 })),
}));

// persistência leve do que o usuário configura (o roteiro e as preferências de fonte/escrita)
useEditor.subscribe((s, anterior) => {
  if (s.roteiro !== anterior.roteiro) gravar('stickboard.roteiro.v2', s.roteiro);
  if (s.fonteLousa !== anterior.fonteLousa) gravar('stickboard.fonte.lousa', s.fonteLousa);
  if (s.fonteFala !== anterior.fonteFala) gravar('stickboard.fonte.fala', s.fonteFala);
  if (s.escrita !== anterior.escrita) gravar('stickboard.escrita', s.escrita);
});




